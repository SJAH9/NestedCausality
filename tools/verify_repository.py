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
INSTRUMENT_DIR = ROOT / "instruments"


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


def verify_plot(output_dir: Path) -> bool:
    result = "zero_infinity_endless_game_plot.svg"
    generated = output_dir / result
    command = (
        sys.executable,
        str(GAME_DIR / "plot_zero_infinity_endless_game.py"),
        "--evasions",
        "48",
        "--output",
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
        print(f"FAIL {result}: renderer exited {completed.returncode}")
        if completed.stderr:
            print(completed.stderr.rstrip())
        return False

    if generated.read_bytes() != (GAME_DIR / result).read_bytes():
        print(f"FAIL {result}: differs from committed reference")
        return False

    print(f"PASS {result}")
    return True


def verify_network_instrument() -> bool:
    files = (
        "zero-infinity-network.html",
        "zero-infinity-network.css",
        "zero-infinity-network-engine.js",
        "zero-infinity-network.js",
    )
    missing = [name for name in files if not (INSTRUMENT_DIR / name).is_file()]
    if missing:
        print(f"FAIL network instrument: missing {', '.join(missing)}")
        return False

    html = (INSTRUMENT_DIR / files[0]).read_text(encoding="utf-8")
    engine = (INSTRUMENT_DIR / files[2]).read_text(encoding="utf-8")
    renderer = (INSTRUMENT_DIR / files[3]).read_text(encoding="utf-8")
    engine_tag = '<script src="zero-infinity-network-engine.js"></script>'
    renderer_tag = '<script src="zero-infinity-network.js"></script>'
    forbidden = ("Math.random", "crypto.getRandomValues", "setInterval")

    checks = {
        "engine loads before renderer": (
            engine_tag in html
            and renderer_tag in html
            and html.index(engine_tag) < html.index(renderer_tag)
        ),
        "game state uses arbitrary-precision integers": (
            "event: 0n" in engine
            and "depth: 0n" in engine
            and "utilityA: 0n" in engine
        ),
        "game engine contains no random source": not any(
            token in engine for token in forbidden
        ),
        "pixel projection remains outside game engine": (
            "const projected = value => Number(" in renderer
        ),
        "runtime invariants are enforced": "validateEvent(state, event)" in engine,
    }
    failed = [name for name, passed in checks.items() if not passed]
    if failed:
        print(f"FAIL network instrument: {', '.join(failed)}")
        return False

    print("PASS zero-infinity-network instrument")
    return True


def main() -> int:
    with tempfile.TemporaryDirectory(prefix="nested-causality-") as temp_dir:
        output_dir = Path(temp_dir)
        passed = [run_experiment(item, output_dir) for item in EXPERIMENTS]
        passed.append(verify_plot(output_dir))
        passed.append(verify_network_instrument())

    if all(passed):
        print(
            f"Verified {len(EXPERIMENTS)} experiments, 1 generated plot, "
            "and 1 browser instrument."
        )
        return 0

    print(f"Verification failed: {passed.count(False)} experiment(s).")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
