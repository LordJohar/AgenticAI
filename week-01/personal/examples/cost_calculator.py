#!/usr/bin/env python3
"""Calculate request and monthly token cost from user-supplied prices.

No current provider prices are embedded in this file on purpose.
"""

from __future__ import annotations

import argparse
from decimal import Decimal, InvalidOperation

MILLION = Decimal("1000000")


def decimal_arg(value: str) -> Decimal:
    try:
        number = Decimal(value)
    except InvalidOperation as exc:
        raise argparse.ArgumentTypeError(f"invalid decimal value: {value}") from exc
    if number < 0:
        raise argparse.ArgumentTypeError("value must be non-negative")
    return number


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Estimate token-based LLM cost.")
    parser.add_argument("--input-tokens", type=decimal_arg, required=True)
    parser.add_argument("--output-tokens", type=decimal_arg, required=True)
    parser.add_argument("--input-price", type=decimal_arg, required=True, help="currency per 1M input tokens")
    parser.add_argument("--output-price", type=decimal_arg, required=True, help="currency per 1M output tokens")
    parser.add_argument("--requests-per-month", type=decimal_arg, default=Decimal("1"))
    parser.add_argument("--currency", default="USD")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    input_cost = args.input_tokens / MILLION * args.input_price
    output_cost = args.output_tokens / MILLION * args.output_price
    request_cost = input_cost + output_cost
    monthly_cost = request_cost * args.requests_per_month

    print(f"input_cost={input_cost:.8f} {args.currency}")
    print(f"output_cost={output_cost:.8f} {args.currency}")
    print(f"request_cost={request_cost:.8f} {args.currency}")
    print(f"monthly_cost={monthly_cost:.4f} {args.currency}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
