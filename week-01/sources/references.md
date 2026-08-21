# References

Access date: 2026-08-22

## Course syllabus

- Quera, Agentic AI bootcamp headlines: https://quera.org/bootcamp/agentic-ai#headlines

## API and application engineering

- OpenAI API Quickstart: https://platform.openai.com/docs/quickstart
- OpenAI latency optimization: https://platform.openai.com/docs/guides/latency-optimization
- OpenAI error guidance: https://platform.openai.com/docs/guides/error-codes
- OpenAI Python SDK: https://github.com/openai/openai-python
- Python virtual environments: https://docs.python.org/3/library/venv.html
- Python environment variables: https://docs.python.org/3/library/os.html#os.environ
- Python errors and exceptions: https://docs.python.org/3/tutorial/errors.html
- Python JSON module: https://docs.python.org/3/library/json.html

## Models and serving

- Hugging Face Transformers: https://huggingface.co/docs/transformers/index
- Hugging Face Model Hub documentation: https://huggingface.co/docs/hub/index
- vLLM OpenAI-compatible server: https://docs.vllm.ai/en/latest/serving/openai_compatible_server/
- Anthropic model overview: https://docs.anthropic.com/en/docs/about-claude/models/overview
- Google Gemini models: https://ai.google.dev/gemini-api/docs/models

## Foundational papers and explanations

- Vaswani et al., Attention Is All You Need: https://arxiv.org/abs/1706.03762
- Brown et al., Language Models are Few-Shot Learners: https://arxiv.org/abs/2005.14165
- Ouyang et al., Training language models to follow instructions with human feedback: https://arxiv.org/abs/2203.02155

## Maintenance note

Provider model names, prices, context limits, rate limits, and SDK details change. The package deliberately avoids embedding a current price table and instead teaches the calculation method. Confirm current values in official documentation before production use.

## Version snapshot used by the examples

- `openai` Python SDK: compatible range `>=3.3.1,<4.0.0`
- `python-dotenv`: compatible range `>=1.2.3,<2.0.0`
- Python: 3.10 or newer

The code uses the Responses API, `response.output_text`, request IDs, explicit timeouts, and explicit retry configuration documented by the official SDK.
