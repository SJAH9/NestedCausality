#!/usr/bin/env python3
"""Render the deterministic Zero Infinity game as a standalone SVG."""

from __future__ import annotations

import argparse
import importlib.util
import sys
from html import escape
from pathlib import Path
from types import ModuleType


HERE = Path(__file__).resolve().parent
MODEL_PATH = HERE / "zero_infinity_endless_game.py"


def load_model() -> ModuleType:
    spec = importlib.util.spec_from_file_location("zero_infinity_endless_game", MODEL_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"could not load {MODEL_PATH}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def points(values: list[tuple[float, float]]) -> str:
    return " ".join(f"{x:.1f},{y:.1f}" for x, y in values)


def render_svg(evasions: int) -> str:
    model = load_model()
    events = model.observe(evasions)
    boundary = [event for event in events if event.phase == "BOUNDARY"]

    coordinates = [(0, 0)] + [
        (event.frontier_depth, event.frontier_scale) for event in boundary
    ]
    radius = max(max(abs(depth), abs(scale)) for depth, scale in coordinates)
    radius = max(radius, 1)

    width, height = 1440, 1000
    field_x, field_y, field_size = 70, 130, 720
    side_x = 850
    cell = field_size / (2 * radius + 1)

    def xy(depth: int, scale: int) -> tuple[float, float]:
        return (
            field_x + field_size / 2 + depth * cell,
            field_y + field_size / 2 - scale * cell,
        )

    frontier_points = [xy(depth, scale) for depth, scale in coordinates]
    a_points = [(events[0].a_depth, events[0].a_scale)]
    b_points = [(events[0].b_depth, events[0].b_scale)]
    for event in events:
        a_coordinate = (event.a_depth, event.a_scale)
        b_coordinate = (event.b_depth, event.b_scale)
        if a_coordinate != a_points[-1]:
            a_points.append(a_coordinate)
        if b_coordinate != b_points[-1]:
            b_points.append(b_coordinate)

    shell_elements = []
    for shell in range(1, radius + 1):
        left, top = xy(-shell, shell)
        shell_size = shell * 2 * cell
        shell_elements.append(
            f'<rect x="{left:.1f}" y="{top:.1f}" width="{shell_size:.1f}" '
            f'height="{shell_size:.1f}" class="shell shell-{shell}"/>'
        )
        shell_elements.append(
            f'<text x="{left + 9:.1f}" y="{top + 18:.1f}" class="shell-label">E{shell}</text>'
        )

    grid_elements = []
    for value in range(-radius, radius + 1):
        x, _ = xy(value, 0)
        _, y = xy(0, value)
        grid_elements.append(
            f'<line x1="{x:.1f}" y1="{field_y:.1f}" x2="{x:.1f}" '
            f'y2="{field_y + field_size:.1f}" class="grid"/>'
        )
        grid_elements.append(
            f'<line x1="{field_x:.1f}" y1="{y:.1f}" '
            f'x2="{field_x + field_size:.1f}" y2="{y:.1f}" class="grid"/>'
        )

    boundary_nodes = []
    for index, event in enumerate(boundary, start=1):
        x, y = xy(event.frontier_depth, event.frontier_scale)
        boundary_nodes.append(
            f'<circle cx="{x:.1f}" cy="{y:.1f}" r="5" class="frontier-node"/>'
        )
        if index in (1, evasions) or index % max(1, evasions // 6) == 0:
            boundary_nodes.append(
                f'<text x="{x + 8:.1f}" y="{y - 8:.1f}" class="event-label">{index}</text>'
            )

    match_nodes = []
    for event in events:
        if event.phase == "COMMIT":
            x, y = xy(event.a_depth, event.a_scale)
            match_nodes.append(
                f'<circle cx="{x:.1f}" cy="{y:.1f}" r="8" class="match-node"/>'
            )

    zero_x, zero_y = xy(0, 0)
    final = boundary[-1]
    final_x, final_y = xy(final.frontier_depth, final.frontier_scale)
    ff_left, ff_top = xy(-radius, radius)
    ff_size = radius * 2 * cell

    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" role="img" aria-labelledby="title description">
  <title id="title">Zero Infinity Nonterminal Enclosure Game</title>
  <description id="description">A finite observation of an endless deterministic pursuit. Players repeatedly match depth and scale, then evade at the last possible moment by moving the enclosure frontier.</description>
  <defs>
    <marker id="arrow-a" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#45d6c0"/></marker>
    <marker id="arrow-b" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#ff786d"/></marker>
    <marker id="arrow-frontier" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#f2c66d"/></marker>
    <filter id="glow"><feGaussianBlur stdDeviation="5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <style>
    text {{ font-family: Inter, ui-sans-serif, system-ui, sans-serif; letter-spacing: 0; }}
    .title {{ fill: #f5f7f8; font-size: 34px; font-weight: 700; }}
    .subtitle {{ fill: #9eacb5; font-size: 16px; }}
    .axis-title {{ fill: #c9d2d7; font-size: 13px; font-weight: 700; text-transform: uppercase; }}
    .grid {{ stroke: #26333c; stroke-width: 1; }}
    .axis {{ stroke: #71838e; stroke-width: 1.5; }}
    .shell {{ fill: none; stroke: #465660; stroke-width: 1.2; }}
    .shell-label, .event-label {{ fill: #81929d; font-size: 11px; font-weight: 700; }}
    .final-frontier {{ fill: none; stroke: #f2c66d; stroke-width: 3; stroke-dasharray: 10 8; }}
    .frontier-path {{ fill: none; stroke: #f2c66d; stroke-width: 3; opacity: .95; marker-end: url(#arrow-frontier); }}
    .frontier-node {{ fill: #090d11; stroke: #f2c66d; stroke-width: 2; }}
    .path-a {{ fill: none; stroke: #45d6c0; stroke-width: 2.5; opacity: .58; marker-end: url(#arrow-a); }}
    .path-b {{ fill: none; stroke: #ff786d; stroke-width: 2.5; opacity: .58; marker-end: url(#arrow-b); }}
    .match-node {{ fill: none; stroke: #f5f7f8; stroke-width: 1.5; opacity: .58; }}
    .zero {{ fill: #090d11; stroke: #f5f7f8; stroke-width: 3; }}
    .zero-label {{ fill: #f5f7f8; font-size: 17px; font-weight: 800; }}
    .ff-label {{ fill: #f2c66d; font-size: 13px; font-weight: 800; }}
    .panel {{ fill: #111820; stroke: #30404b; stroke-width: 1; }}
    .panel-title {{ fill: #f5f7f8; font-size: 20px; font-weight: 750; }}
    .panel-copy {{ fill: #b7c2c8; font-size: 14px; }}
    .step-number {{ fill: #090d11; font-size: 12px; font-weight: 800; text-anchor: middle; dominant-baseline: central; }}
    .step-label {{ fill: #f5f7f8; font-size: 14px; font-weight: 750; }}
    .step-copy {{ fill: #9eacb5; font-size: 12px; }}
    .metric {{ fill: #f5f7f8; font-size: 25px; font-weight: 800; }}
    .metric-label {{ fill: #9eacb5; font-size: 11px; font-weight: 700; }}
    .legend {{ fill: #b7c2c8; font-size: 13px; }}
    .footer {{ fill: #81929d; font-size: 12px; }}
  </style>
  <rect width="100%" height="100%" fill="#090d11"/>
  <text x="70" y="54" class="title">Zero Infinity Nonterminal Enclosure Game</text>
  <text x="70" y="83" class="subtitle">Finite view of {evasions} encounters · no score · no terminal state · no randomizer</text>

  <rect x="{field_x}" y="{field_y}" width="{field_size}" height="{field_size}" fill="#0d1318" stroke="#30404b"/>
  {''.join(grid_elements)}
  <line x1="{field_x}" y1="{zero_y:.1f}" x2="{field_x + field_size}" y2="{zero_y:.1f}" class="axis"/>
  <line x1="{zero_x:.1f}" y1="{field_y}" x2="{zero_x:.1f}" y2="{field_y + field_size}" class="axis"/>
  {''.join(shell_elements)}
  <rect x="{ff_left:.1f}" y="{ff_top:.1f}" width="{ff_size:.1f}" height="{ff_size:.1f}" class="final-frontier"/>
  <text x="{ff_left + 12:.1f}" y="{ff_top + ff_size - 12:.1f}" class="ff-label">FINAL FRONTIER · OBSERVED PREFIX</text>

  <polyline points="{points([xy(d, s) for d, s in a_points])}" class="path-a"/>
  <polyline points="{points([xy(d, s) for d, s in b_points])}" class="path-b"/>
  <polyline points="{points(frontier_points)}" class="frontier-path"/>
  {''.join(match_nodes)}
  {''.join(boundary_nodes)}

  <circle cx="{zero_x:.1f}" cy="{zero_y:.1f}" r="15" class="zero" filter="url(#glow)"/>
  <text x="{zero_x:.1f}" y="{zero_y + 6:.1f}" text-anchor="middle" class="zero-label">0∞</text>
  <circle cx="{final_x:.1f}" cy="{final_y:.1f}" r="8" fill="#f2c66d"/>
  <text x="{field_x + field_size / 2:.1f}" y="{field_y + field_size + 38:.1f}" text-anchor="middle" class="axis-title">DEPTH  ← DE-ESCALATE · ESCALATE →</text>
  <text x="{field_x - 44:.1f}" y="{field_y + field_size / 2:.1f}" text-anchor="middle" transform="rotate(-90 {field_x - 44:.1f} {field_y + field_size / 2:.1f})" class="axis-title">SCALE  ← IN · OUT →</text>

  <rect x="{side_x}" y="120" width="480" height="300" rx="6" class="panel"/>
  <text x="{side_x + 28}" y="158" class="panel-title">One encounter</text>
  <circle cx="{side_x + 48}" cy="205" r="15" fill="#45d6c0"/><text x="{side_x + 48}" y="205" class="step-number">1</text>
  <text x="{side_x + 78}" y="202" class="step-label">SEEK</text>
  <text x="{side_x + 78}" y="222" class="step-copy">Active player targets the other's level.</text>
  <line x1="{side_x + 48}" y1="226" x2="{side_x + 48}" y2="253" stroke="#465660" stroke-width="2"/>
  <circle cx="{side_x + 48}" cy="274" r="15" fill="#f5f7f8"/><text x="{side_x + 48}" y="274" class="step-number">2</text>
  <text x="{side_x + 78}" y="271" class="step-label">MATCH</text>
  <text x="{side_x + 78}" y="291" class="step-copy">Both occupy one enclosure; victory is one event away.</text>
  <line x1="{side_x + 48}" y1="295" x2="{side_x + 48}" y2="322" stroke="#465660" stroke-width="2"/>
  <circle cx="{side_x + 48}" cy="343" r="15" fill="#f2c66d"/><text x="{side_x + 48}" y="343" class="step-number">3</text>
  <text x="{side_x + 78}" y="340" class="step-label">EVADE</text>
  <text x="{side_x + 78}" y="360" class="step-copy">Defender changes depth or scale at countdown zero.</text>
  <text x="{side_x + 28}" y="400" class="panel-copy">Roles reverse. Pursuit resumes from the new enclosure.</text>

  <rect x="{side_x}" y="448" width="480" height="202" rx="6" class="panel"/>
  <text x="{side_x + 28}" y="486" class="panel-title">Observed invariants</text>
  <text x="{side_x + 28}" y="530" class="metric">{evasions}</text><text x="{side_x + 28}" y="550" class="metric-label">LEVEL MATCHES</text>
  <text x="{side_x + 158}" y="530" class="metric">{evasions}</text><text x="{side_x + 158}" y="550" class="metric-label">LAST-MOMENT EVASIONS</text>
  <text x="{side_x + 344}" y="530" class="metric">0 / 0</text><text x="{side_x + 344}" y="550" class="metric-label">PLAYER UTILITY</text>
  <text x="{side_x + 28}" y="592" class="panel-copy">Winner: none</text>
  <text x="{side_x + 158}" y="592" class="panel-copy">Loser: none</text>
  <text x="{side_x + 288}" y="592" class="panel-copy">Next event: exists</text>
  <text x="{side_x + 28}" y="625" class="panel-copy">Current frontier: ({final.frontier_depth:+d}, {final.frontier_scale:+d}) · boundary radius E{radius}</text>

  <rect x="{side_x}" y="678" width="480" height="202" rx="6" class="panel"/>
  <text x="{side_x + 28}" y="716" class="panel-title">How to read the field</text>
  <line x1="{side_x + 30}" y1="750" x2="{side_x + 72}" y2="750" stroke="#45d6c0" stroke-width="3"/><text x="{side_x + 88}" y="755" class="legend">Player A pursuit path</text>
  <line x1="{side_x + 260}" y1="750" x2="{side_x + 302}" y2="750" stroke="#ff786d" stroke-width="3"/><text x="{side_x + 318}" y="755" class="legend">Player B pursuit path</text>
  <line x1="{side_x + 30}" y1="788" x2="{side_x + 72}" y2="788" stroke="#f2c66d" stroke-width="3"/><text x="{side_x + 88}" y="793" class="legend">Moving enclosure frontier</text>
  <circle cx="{side_x + 281}" cy="788" r="8" fill="none" stroke="#f5f7f8"/><text x="{side_x + 318}" y="793" class="legend">Matched level</text>
  <text x="{side_x + 28}" y="835" class="panel-copy">0∞ is the scalable reference. It is not a winning cell.</text>
  <text x="{side_x + 28}" y="858" class="panel-copy">The Final Frontier bounds this rendering, not the game.</text>

  <text x="70" y="975" class="footer">Generated deterministically from zero_infinity_endless_game.py · every finite plot is a prefix of an unbounded rule.</text>
</svg>
'''
    return svg


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Plot the Zero Infinity nonterminal game")
    parser.add_argument("--evasions", type=int, default=48)
    parser.add_argument(
        "--output",
        type=Path,
        default=HERE / "zero_infinity_endless_game_plot.svg",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.evasions < 4:
        raise SystemExit("--evasions must be at least 4")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(render_svg(args.evasions), encoding="utf-8")
    print(f"Wrote {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
