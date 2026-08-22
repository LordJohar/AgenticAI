# QA Report — Week 01 Personal Learning Path

Date: 2026-08-22

## Repository layout

- The personalized lesson is split into 19 independent HTML chapter pages under `personal/chapters/`.
- `personal/index.html` is the offline table of contents for the personalized path.
- `personal/build_standalone.py` rebuilds `personal/standalone.html` from the canonical chapter pages.
- Shared class notes live separately under `class-notes/`.
- Python bytecode, local virtual environments, real `.env` files, recordings, raw transcripts, models, and local media tools are excluded from Git.

## Passed checks

- All 19 chapter files contain exactly one uniquely identified `section.chapter`.
- The repository HTML files were parsed and every local `href`/`src` target resolved successfully.
- The standalone builder completed and produced a document containing all 19 chapters with CSS and JavaScript embedded.
- All Python files passed `python -m py_compile`.
- `01_python_api_refresher.py` executed successfully and produced its deterministic summary.
- `cost_calculator.py` produced the expected result for the documented sample values.
- `incident_brief_cli.py --dry-run` executed without an API dependency.
- The dry-run output contained `[REDACTED]` and did not contain either synthetic secret value from `sample_incident.log`.
- The committed package contains no real API key or user credential.

## Deliberate non-tests / limitations

- No live LLM API request was sent because no user credential was provided.
- Dependency installation from a package index was not run in the artifact environment; API-dependent modules were syntax-checked, while standard-library paths were executed.
- Regex redaction is educational and is not a substitute for DLP, data classification, or an organizational secret-scanning system.
- Automatic transcripts can contain technical-term errors and are used only as evidence for the rewritten notes.
- No live hardware-specific benchmark is part of the public package.
