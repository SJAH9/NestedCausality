#!/usr/bin/env python3
"""Validate canonical simulations against committed reference results."""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
from dataclasses import dataclass
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
GAME_DIR = ROOT / "Continuum Game Theory"


@dataclass(frozen=True)
class Experiment:
    script: str
    result: str
    arguments: tuple[str, ...]


EXPERIMENTS = (
    Experiment(
        "enclosure_game.py",
        "enclosure_game_results.json",
        ("--rounds", "30", "--seed", "42"),
    ),
    Experiment(
        "ncm_prisoners_dilemma.py",
        "ncm_prisoners_dilemma_results.json",
        ("--rounds", "20", "--seed", "42"),
    ),
    Experiment(
        "enclosure_nash_infinite.py",
        "enclosure_nash_infinite_results.json",
        ("--N", "15", "--rounds", "25"),
    ),
    Experiment(
        "zero_infinity_endless_game.py",
        "zero_infinity_endless_game_results.json",
        ("--evasions", "12"),
    ),
)


def run_experiment(experiment: Experiment, output_dir: Path) -> bool:
    generated = output_dir / experiment.result
    command = (
        sys.executable,
        str(GAME_DIR / experiment.script),
        *experiment.arguments,
        "--json-out",
        str(generated),
    )
    completed = subprocess.run(
        command,
        cwd=ROOT,
        check=False,
        capture_output=True,
        text=True,
    )
    if completed.returncode != 0:
        print(f"FAIL {experiment.script}: process exited {completed.returncode}")
        if completed.stderr:
            print(completed.stderr.rstrip())
        return False

    try:
        with generated.open(encoding="utf-8") as handle:
            json.load(handle)
    except (OSError, json.JSONDecodeError) as error:
        print(f"FAIL {experiment.result}: invalid JSON ({error})")
        return False

    expected = GAME_DIR / experiment.result
    if generated.read_bytes() != expected.read_bytes():
        print(f"FAIL {experiment.result}: differs from committed reference")
        return False

    print(f"PASS {experiment.result}")
    return True


def main() -> int:
    with tempfile.TemporaryDirectory(prefix="nested-causality-") as temp_dir:
        output_dir = Path(temp_dir)
        passed = [run_experiment(item, output_dir) for item in EXPERIMENTS]

    if all(passed):
        print(f"Verified {len(passed)} canonical experiments.")
        return 0

    print(f"Verification failed: {passed.count(False)} experiment(s).")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
