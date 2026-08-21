#!/usr/bin/env python3
"""Build a portable single-file HTML copy of the week-one course.

Run from any directory:
    python week-01/build_standalone.py
"""

from __future__ import annotations

from pathlib import Path
import re

BASE = Path(__file__).resolve().parent
CHAPTERS = BASE / "chapters"
OUTPUT = BASE / "standalone.html"


def extract_section(document: str) -> str:
    match = re.search(r'(<section class="chapter".*?</section>)', document, re.DOTALL)
    if not match:
        raise ValueError("chapter page does not contain a chapter section")
    return match.group(1)


def section_id(section: str) -> str:
    match = re.search(r'id="([^"]+)"', section)
    if not match:
        raise ValueError("chapter section has no id")
    return match.group(1)


def section_title(section: str) -> str:
    match = re.search(r'<h2>(.*?)</h2>', section, re.DOTALL)
    if not match:
        raise ValueError("chapter section has no h2")
    return match.group(1)


def main() -> int:
    chapter_files = sorted(CHAPTERS.glob("*.html"))
    if len(chapter_files) != 19:
        raise RuntimeError(f"expected 19 chapter pages, found {len(chapter_files)}")

    css = (BASE / "assets/css/course.css").read_text(encoding="utf-8")
    js = (BASE / "assets/js/course.js").read_text(encoding="utf-8")
    sections = [
        extract_section(path.read_text(encoding="utf-8"))
        .replace('href="../', 'href="')
        .replace('src="../', 'src="')
        for path in chapter_files
    ]

    toc = "\n".join(
        f'<li><a href="#{section_id(section)}">{section_title(section)}</a></li>'
        for section in sections
    )

    output = f"""<!doctype html>
<html lang="fa" dir="rtl" data-theme="light">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>هفتهٔ اول Agentic AI — نسخهٔ تک‌فایلی</title>
  <style>{css}</style>
</head>
<body>
<main class="content" id="main-content">
  <header class="hero">
    <div class="eyebrow">Portable Offline Edition</div>
    <h2>هفتهٔ اول Agentic AI</h2>
    <p>نسخهٔ تک‌فایلی تولیدشده از فصل‌های Repository.</p>
    <div class="hero-meta">
      <button class="icon-button" type="button" data-action="theme">تغییر پوسته</button>
      <button class="icon-button" type="button" data-action="print">چاپ / PDF</button>
    </div>
  </header>
  <section class="chapter"><h2>فهرست</h2><ol>{toc}</ol></section>
  {''.join(sections)}
</main>
<script>{js}</script>
</body>
</html>
"""
    OUTPUT.write_text(output, encoding="utf-8")
    print(f"created: {OUTPUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
