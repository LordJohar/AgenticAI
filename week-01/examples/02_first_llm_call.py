#!/usr/bin/env python3
"""Make a minimal LLM API call with explicit configuration checks."""

from __future__ import annotations

import os
import sys
from typing import Any

from dotenv import load_dotenv
from openai import OpenAI


def require_env(name: str) -> str:
    """Read a required environment variable without ever printing its value."""
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"required environment variable {name} is not set")
    return value


def usage_value(usage: Any, field: str) -> int | None:
    """Read a usage field defensively across compatible SDK responses."""
    if usage is None:
        return None
    value = getattr(usage, field, None)
    return int(value) if value is not None else None


def main() -> int:
    load_dotenv()

    try:
        api_key = require_env("OPENAI_API_KEY")
    except RuntimeError as exc:
        print(f"configuration error: {exc}", file=sys.stderr)
        print("Copy .env.example to .env and set a real key, or export the variable.", file=sys.stderr)
        return 2

    model = os.getenv("OPENAI_MODEL", "gpt-5.6")
    timeout = float(os.getenv("LLM_TIMEOUT_SECONDS", "30"))
    max_retries = int(os.getenv("LLM_MAX_RETRIES", "2"))
    base_url = os.getenv("LLM_BASE_URL")

    client_options: dict[str, object] = {
        "api_key": api_key,
        "timeout": timeout,
        "max_retries": max_retries,
    }
    if base_url:
        client_options["base_url"] = base_url

    client = OpenAI(**client_options)  # type: ignore[arg-type]

    response = client.responses.create(
        model=model,
        instructions=(
            "You are an SRE assistant. Summarize only the supplied evidence. "
            "Do not invent hosts, commands, causes, or remediation results."
        ),
        input="The pod restarted 4 times after a failed liveness probe.",
    )

    print(response.output_text)

    request_id = getattr(response, "_request_id", None)
    usage = getattr(response, "usage", None)
    print("\n--- request metadata ---", file=sys.stderr)
    print(f"model={model}", file=sys.stderr)
    print(f"request_id={request_id or 'not-returned'}", file=sys.stderr)
    print(f"input_tokens={usage_value(usage, 'input_tokens')}", file=sys.stderr)
    print(f"output_tokens={usage_value(usage, 'output_tokens')}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
