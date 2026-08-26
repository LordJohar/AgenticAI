"""Run the HW01 notebook workflow from the command line with the same evidence files."""

from __future__ import annotations

import csv
import json
import platform
import random
import subprocess
import sys
from contextlib import nullcontext
from pathlib import Path

import numpy as np
import psutil
import torch

ROOT = Path(__file__).resolve().parents[2] / "homework-01"
sys.path.insert(0, str(ROOT))

from src.analysis import measure_error_propagation
from src.config import MiniGPTConfig, count_parameters, set_seed
from src.data import create_lm_example, load_corpus_tokens, sample_batch, split_tokens
from src.generation import greedy_generate
from src.masking import build_causal_mask
from src.model import MiniGPT
from src.plotting import plot_causal_mask, plot_error_propagation, plot_training_loss
from src.tokenizer import decode_tokens, encode_text, token_display
from src.training import train_fixed_steps, training_step
from src.validation import validate_artifacts


ASSETS_DIR = ROOT / "assets"
FIGURES_DIR = ROOT / "figures"
RESULTS_DIR = ROOT / "results"
SEED = 1403
DEVICE = torch.device("cpu")


def write_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def write_csv(path: Path, rows: list[dict[str, object]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if not rows:
        raise ValueError("CSV evidence must contain at least one row")
    with path.open("w", encoding="utf-8", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    FIGURES_DIR.mkdir(exist_ok=True)
    RESULTS_DIR.mkdir(exist_ok=True)
    random.seed(SEED)
    np.random.seed(SEED)
    set_seed(SEED)
    torch.set_num_threads(min(6, torch.get_num_threads()))

    environment_model = MiniGPT(MiniGPTConfig()).to(DEVICE)
    write_json(
        RESULTS_DIR / "environment.json",
        {
            "python": sys.version.split()[0],
            "pytorch": torch.__version__,
            "cpu": platform.processor() or platform.machine(),
            "logical_cpu_count": psutil.cpu_count(),
            "cuda_available_report_only": torch.cuda.is_available(),
            "forced_device": DEVICE.type,
            "parameter_count": count_parameters(environment_model),
            "seed": SEED,
        },
    )

    tokenizer_examples = []
    for text in ["Hello!", "café MiniGPT", ""]:
        token_ids = encode_text(text, add_bos=True, add_eos=True)
        decoded = decode_tokens(token_ids[1:-1])
        assert decoded == text
        tokenizer_examples.append(
            {"text": text, "token_ids": token_ids, "decoded_without_specials": decoded}
        )
    write_json(RESULTS_DIR / "tokenizer_examples.json", tokenizer_examples)

    shifted_ids = torch.tensor(encode_text("The cat sat", add_bos=True, add_eos=True), dtype=torch.long)
    shifted_input, shifted_labels = create_lm_example(shifted_ids)
    shift_rows = [
        {
            "position": position,
            "input_token_id": int(input_id),
            "input_token_display": token_display(int(input_id)),
            "target_token_id": int(target_id),
            "target_token_display": token_display(int(target_id)),
        }
        for position, (input_id, target_id) in enumerate(zip(shifted_input, shifted_labels, strict=True))
    ]
    write_csv(RESULTS_DIR / "token_shift_table.csv", shift_rows)

    causal_mask = build_causal_mask(16, device=DEVICE)
    plot_causal_mask(causal_mask, FIGURES_DIR / "causal_mask.png")
    set_seed(SEED)
    leakage_model = MiniGPT(
        MiniGPTConfig(context_length=8, n_layers=1, d_model=32, n_heads=4, d_ff=64, dropout=0.0)
    ).to(DEVICE).eval()
    original = torch.tensor([[10, 11, 12, 13]], device=DEVICE)
    changed_future = torch.tensor([[10, 11, 99, 98]], device=DEVICE)
    with torch.inference_mode():
        masked_difference = float(
            (leakage_model(original).logits[:, :2] - leakage_model(changed_future).logits[:, :2])
            .abs()
            .max()
        )
        unmasked_difference = float(
            (
                leakage_model(original, attention_mask=False).logits[:, :2]
                - leakage_model(changed_future, attention_mask=False).logits[:, :2]
            )
            .abs()
            .max()
        )
    write_json(
        RESULTS_DIR / "leakage_evidence.json",
        {
            "mask_shape": list(causal_mask.shape),
            "blocked_entries": int(causal_mask.sum()),
            "masked_early_logit_max_difference": masked_difference,
            "unmasked_early_logit_max_difference": unmasked_difference,
        },
    )

    corpus_tokens = load_corpus_tokens(ASSETS_DIR / "corpus.txt").to(DEVICE)
    set_seed(SEED)
    step_model = MiniGPT(MiniGPTConfig()).to(DEVICE)
    optimizer = torch.optim.AdamW(step_model.parameters(), lr=1e-3)
    step_inputs, step_labels = sample_batch(
        corpus_tokens, 2, 32, torch.Generator(device="cpu").manual_seed(SEED)
    )
    before = step_model.token_embedding.weight.detach().clone()
    observed: dict[str, object] = {"forward_passes": 0}

    def capture_forward(_module: torch.nn.Module, _inputs: object, output: object) -> None:
        observed["forward_passes"] = int(observed["forward_passes"]) + 1
        observed["logit_shape"] = list(output.logits.shape)

    hook = step_model.register_forward_hook(capture_forward)
    step_metrics = training_step(step_model, step_inputs, step_labels, optimizer)
    hook.remove()
    step_metrics.update(
        {
            "batch_shape": list(step_inputs.shape),
            "logit_shape": observed["logit_shape"],
            "label_shape": list(step_labels.shape),
            "forward_passes": float(observed["forward_passes"]),
            "parameters_changed": not torch.equal(before, step_model.token_embedding.weight),
            "model_training_mode": step_model.training,
        }
    )
    write_json(RESULTS_DIR / "training_step_metrics.json", step_metrics)

    set_seed(SEED)
    short_model = MiniGPT(MiniGPTConfig()).to(DEVICE)
    train_tokens, validation_tokens = split_tokens(corpus_tokens)
    losses, training_metrics = train_fixed_steps(
        short_model,
        train_tokens,
        validation_tokens,
        steps=20,
        batch_size=4,
        sequence_length=64,
        learning_rate=8e-4,
        seed=SEED,
        validation_batches=4,
    )
    training_metrics["loss_history"] = losses
    write_json(RESULTS_DIR / "training_metrics.json", training_metrics)
    plot_training_loss(losses, FIGURES_DIR / "training_loss.png")

    checkpoint = torch.load(ASSETS_DIR / "minigpt_pretrained.pt", map_location=DEVICE, weights_only=True)
    reference_model = MiniGPT(MiniGPTConfig(**checkpoint["model_config"])).to(DEVICE)
    reference_model.load_state_dict(checkpoint["model_state_dict"])
    reference_model.eval()
    prompt = 'Holmes looked at the letter and said, "'
    prompt_ids = torch.tensor(encode_text(prompt, add_bos=True), dtype=torch.long, device=DEVICE)
    generated_ids, generation_trace = greedy_generate(
        reference_model, prompt_ids, 80, 2, reference_model.config.context_length
    )
    write_csv(RESULTS_DIR / "generation_trace.csv", generation_trace)
    write_json(
        RESULTS_DIR / "generation_summary.json",
        {
            "generated_text": decode_tokens([token_id for token_id in generated_ids.tolist() if token_id >= 4]),
            "new_tokens": len(generation_trace),
            "forward_passes": generation_trace[-1]["forward_pass_count"],
        },
    )

    reference_ids = torch.tensor(
        encode_text("The detective opened the door and looked into the quiet room."),
        dtype=torch.long,
        device=DEVICE,
    )[:48]
    error_rows = measure_error_propagation(reference_model, reference_ids, injection_position=12)
    write_csv(RESULTS_DIR / "error_propagation.csv", error_rows)
    plot_error_propagation(error_rows, FIGURES_DIR / "error_propagation.png")

    comparison_rows = [
        {"dimension": "architecture", "training": "same decoder-only MiniGPT", "inference": "same decoder-only MiniGPT"},
        {"dimension": "model mode", "training": "train()", "inference": "eval()"},
        {"dimension": "ground-truth previous tokens", "training": "yes", "inference": "prompt only"},
        {"dimension": "self-generated previous tokens", "training": "no", "inference": "yes"},
        {"dimension": "forward passes", "training": "1 for the measured batch", "inference": str(len(generation_trace))},
        {"dimension": "logits used", "training": "all valid positions", "inference": "final position per step"},
        {"dimension": "gradient tracking", "training": "enabled", "inference": "disabled"},
        {"dimension": "optimizer", "training": "used", "inference": "not used"},
        {"dimension": "dropout", "training": "active", "inference": "disabled by eval()"},
        {"dimension": "known-position parallelism", "training": "B x T positions", "inference": "within each current prefix"},
        {"dimension": "decoding dependency", "training": "labels already known", "inference": "next input waits for selected token"},
        {"dimension": "memory", "training": "activations, gradients, optimizer", "inference": "no autograd graph or optimizer"},
    ]
    write_csv(RESULTS_DIR / "training_vs_inference.csv", comparison_rows)

    set_seed(SEED)
    mode_model = MiniGPT(
        MiniGPTConfig(context_length=8, n_layers=1, d_model=32, n_heads=4, d_ff=64, dropout=0.5)
    ).to(DEVICE)
    mode_input = torch.tensor([[4, 5, 6, 7]], dtype=torch.long, device=DEVICE)
    mode_rows = []
    for configuration, training_mode, inference in [
        ("train + grad", True, False),
        ("eval + grad", False, False),
        ("train + inference_mode", True, True),
        ("eval + inference_mode", False, True),
    ]:
        mode_model.train(training_mode)
        torch.manual_seed(2025)
        context = torch.inference_mode() if inference else nullcontext()
        with context:
            grad_enabled = torch.is_grad_enabled()
            first_output = mode_model(mode_input).logits
            second_output = mode_model(mode_input).logits
        mode_rows.append(
            {
                "configuration": configuration,
                "model.training": mode_model.training,
                "torch.is_grad_enabled": grad_enabled,
                "output.requires_grad": first_output.requires_grad,
                "dropout_active_or_repeat_outputs_equal": bool(torch.equal(first_output, second_output)),
            }
        )
    write_csv(RESULTS_DIR / "eval_vs_inference_mode.csv", mode_rows)

    artifact_summary = validate_artifacts(ROOT)
    test_result = subprocess.run([sys.executable, "-m", "pytest", "tests", "-q"], cwd=ROOT, check=True)
    print(f"Public-test exit code: {test_result.returncode}")
    print(json.dumps({"artifacts": artifact_summary, "step": step_metrics, "training": training_metrics}, indent=2))


if __name__ == "__main__":
    main()
