#!/usr/bin/env python3
"""Small standard-library-only Python refresher for week one.

The script demonstrates:
- lists and dictionaries;
- typed functions;
- validation and exceptions;
- JSON serialization;
- a conventional main() entry point.
"""

from __future__ import annotations

import json
from typing import Any


EVENTS: list[dict[str, Any]] = [
    {"type": "Warning", "reason": "Unhealthy", "object": "pod/api-7d9f", "count": 4},
    {"type": "Normal", "reason": "Pulled", "object": "pod/api-7d9f", "count": 1},
    {"type": "Warning", "reason": "BackOff", "object": "pod/worker-22bc", "count": 7},
]


def summarize_events(events: list[dict[str, Any]]) -> dict[str, Any]:
    """Return a deterministic summary of Kubernetes-like events.

    Raises:
        ValueError: if an event has a negative count.
    """
    warning_count = 0
    total_occurrences = 0
    affected_objects: set[str] = set()

    for event in events:
        count = int(event.get("count", 0))
        if count < 0:
            raise ValueError("event count cannot be negative")

        total_occurrences += count
        if event.get("type") == "Warning":
            warning_count += count
            affected_objects.add(str(event.get("object", "unknown")))

    return {
        "event_records": len(events),
        "total_occurrences": total_occurrences,
        "warning_occurrences": warning_count,
        "affected_objects": sorted(affected_objects),
    }


def main() -> int:
    summary = summarize_events(EVENTS)
    print("Python refresher completed. Deterministic result:")
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
