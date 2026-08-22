#!/usr/bin/env python3
"""A small resilient client wrapper for educational use.

Production systems need workload-specific timeout, retry, idempotency,
rate-limit, privacy, observability, and circuit-breaker decisions.
"""

from __future__ import annotations

import random
import time
from dataclasses import dataclass
from typing import Any

from openai import (
    APIConnectionError,
    APIStatusError,
    APITimeoutError,
    AuthenticationError,
    BadRequestError,
    OpenAI,
    RateLimitError,
)


@dataclass(frozen=True)
class LLMCallResult:
    text: str
    request_id: str | None
    input_tokens: int | None
    output_tokens: int | None
    duration_seconds: float
    retries: int


def _usage_value(usage: Any, field: str) -> int | None:
    value = getattr(usage, field, None) if usage is not None else None
    return int(value) if value is not None else None


def _looks_like_quota_or_billing_error(exc: RateLimitError) -> bool:
    """Best-effort guard: quota/billing 429 errors should not be retried.

    Error bodies vary by provider. Treat this only as an additional guard;
    alerts and provider-specific parsing are still required in production.
    """
    haystack = f"{getattr(exc, 'body', '')} {exc}".lower()
    markers = (
        "insufficient_quota",
        "billing",
        "credit balance",
        "spend limit",
        "quota exceeded",
    )
    return any(marker in haystack for marker in markers)


def _retry_after_seconds(exc: Exception) -> float | None:
    response = getattr(exc, "response", None)
    headers = getattr(response, "headers", None)
    if not headers:
        return None
    raw = headers.get("retry-after") or headers.get("Retry-After")
    if not raw:
        return None
    try:
        return max(0.0, float(raw))
    except (TypeError, ValueError):
        return None


def _backoff_delay(attempt_index: int, base_delay: float, max_delay: float) -> float:
    jitter = random.uniform(0.0, min(0.25, base_delay))
    return min(max_delay, base_delay * (2**attempt_index) + jitter)


def create_response_with_retry(
    *,
    client: OpenAI,
    model: str,
    instructions: str,
    user_input: str,
    max_attempts: int = 3,
    base_delay: float = 0.5,
    max_delay: float = 8.0,
) -> LLMCallResult:
    """Create a response and retry only selected transient failures.

    The OpenAI client passed here should normally use max_retries=0 so that
    the application-level retry budget remains explicit and observable.
    """
    if max_attempts < 1:
        raise ValueError("max_attempts must be at least 1")
    if not user_input.strip():
        raise ValueError("user_input must not be empty")

    started = time.monotonic()

    for attempt_index in range(max_attempts):
        try:
            response = client.responses.create(
                model=model,
                instructions=instructions,
                input=user_input,
            )
            elapsed = time.monotonic() - started
            usage = getattr(response, "usage", None)
            return LLMCallResult(
                text=response.output_text,
                request_id=getattr(response, "_request_id", None),
                input_tokens=_usage_value(usage, "input_tokens"),
                output_tokens=_usage_value(usage, "output_tokens"),
                duration_seconds=elapsed,
                retries=attempt_index,
            )

        except (AuthenticationError, BadRequestError):
            # Configuration or request-shape errors need a fix, not a retry.
            raise

        except RateLimitError as exc:
            if _looks_like_quota_or_billing_error(exc):
                raise
            retryable_exc: Exception = exc

        except (APIConnectionError, APITimeoutError) as exc:
            retryable_exc = exc

        except APIStatusError as exc:
            status = int(getattr(exc, "status_code", 0) or 0)
            if status not in {408, 409, 429} and status < 500:
                raise
            retryable_exc = exc

        if attempt_index >= max_attempts - 1:
            raise retryable_exc

        server_delay = _retry_after_seconds(retryable_exc)
        calculated_delay = _backoff_delay(attempt_index, base_delay, max_delay)
        time.sleep(max(server_delay or 0.0, calculated_delay))

    raise RuntimeError("unreachable retry state")
