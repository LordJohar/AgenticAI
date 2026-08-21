# QA Report — Week 01 Package

Date: 2026-08-22

## Repository layout

- The original long-form lesson was split into 19 independent HTML chapter pages under `chapters/`.
- `index.html` is now a lightweight offline table of contents.
- `build_standalone.py` rebuilds a portable single-file `standalone.html` from the canonical chapter pages.
- Generated `standalone.html`, Python bytecode, local virtual environments, real `.env` files, and uploaded video archives are excluded from Git.

## Passed checks

- All 19 chapter files contain exactly one uniquely identified `section.chapter`.
- 22 committed HTML files were parsed and every local `href`/`src` target resolved successfully.
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
- Video notes remain placeholders because no class video or transcript was available in this conversation.
