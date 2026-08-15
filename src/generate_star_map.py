"""Generate the print star chart and browser data from the canonical record."""

from __future__ import annotations

import html
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
OUTPUTS = ROOT / "outputs"

COLORS = {
    "reference": "#f4c95d",
    "active": "#f8fafc",
    "enclosing": "#79c7c5",
    "enclosed": "#e98b73",
    "parallel": "#9ab6ff",
    "target": "#ffcf70",
    "passage": "#d7a6ff",
    "projection": "#e98b73",
    "contribution": "#9ab6ff",
    "exchange": "#79c7c5",
    "targeting": "#f4c95d",
    "ivm": "#d7a6ff",
}


def load_json(name: str) -> dict:
    return json.loads((DATA / name).read_text(encoding="utf-8"))


def line(edge: dict, nodes: dict[str, dict]) -> str:
    source = nodes[edge["source"]]
    target = nodes[edge["target"]]
    color = COLORS[edge["kind"]]
    dash = " stroke-dasharray=\"10 8\"" if edge["kind"] in {"contribution", "targeting"} else ""
    midpoint_x = edge.get("label_x", (source["x"] + target["x"]) / 2)
    midpoint_y = edge.get("label_y", (source["y"] + target["y"]) / 2 - 10)
    label = html.escape(edge["label"])
    return (
        f'<g class="edge {edge["kind"]}">'
        f'<line x1="{source["x"]}" y1="{source["y"]}" x2="{target["x"]}" y2="{target["y"]}" '
        f'stroke="{color}" stroke-width="3" marker-end="url(#arrow-{edge["kind"]})"{dash}/>'
        f'<text x="{midpoint_x}" y="{midpoint_y}" text-anchor="middle" class="edge-label">{label}</text>'
        "</g>"
    )


def star(node: dict) -> str:
    color = COLORS[node["kind"]]
    label = html.escape(node["label"])
    ring = ""
    if node["kind"] == "target":
        ring = f'<circle cx="{node["x"]}" cy="{node["y"]}" r="31" class="target-ring"/>'
    return (
        f'<g class="node {node["kind"]}" id="node-{html.escape(node["id"])}">'
        f'{ring}<circle cx="{node["x"]}" cy="{node["y"]}" r="{node["size"] + 8}" fill="{color}" opacity=".11"/>'
        f'<circle cx="{node["x"]}" cy="{node["y"]}" r="{node["size"]}" fill="{color}"/>'
        f'<circle cx="{node["x"] - node["size"] * .28}" cy="{node["y"] - node["size"] * .3}" r="{max(2, node["size"] * .18)}" fill="#fff" opacity=".8"/>'
        f'<text x="{node["x"]}" y="{node["y"] + node["size"] + 27}" text-anchor="middle" class="node-label">{label}</text>'
        "</g>"
    )


def ivm_cell(cell: dict) -> str:
    cx = cell["cx"]
    cy = cell["cy"]
    radius = cell["radius"]
    points = []
    for dx, dy in ((0, -1), (.866, -.5), (.866, .5), (0, 1), (-.866, .5), (-.866, -.5)):
        points.append((cx + radius * dx, cy + radius * dy))
    point_text = " ".join(f"{x:.1f},{y:.1f}" for x, y in points)
    spokes = "".join(
        f'<line x1="{cx}" y1="{cy}" x2="{x:.1f}" y2="{y:.1f}"/>'
        for x, y in points
    )
    vertices = "".join(
        f'<circle cx="{x:.1f}" cy="{y:.1f}" r="3.2"/>'
        for x, y in points
    )
    return (
        f'<g class="ivm-cell {cell["role"]}">' 
        f'<polygon points="{point_text}"/>{spokes}{vertices}'
        f'<circle cx="{cx}" cy="{cy}" r="4.5" class="ve-node"/>'
        f'<text x="{cx}" y="{cy + radius + 22}" text-anchor="middle" class="ivm-label">{html.escape(cell["address"])}</text>'
        '</g>'
    )


def build_svg(layout: dict) -> str:
    nodes = {node["id"]: node for node in layout["nodes"]}
    markers = "".join(
        f'<marker id="arrow-{kind}" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">'
        f'<path d="M0,0 L0,6 L9,3 z" fill="{COLORS[kind]}"/></marker>'
        for kind in ("projection", "contribution", "exchange", "targeting", "ivm")
    )
    ivm_cells = "".join(ivm_cell(cell) for cell in layout.get("ivm_cells", []))
    edges = "".join(line(edge, nodes) for edge in layout["edges"])
    stars = "".join(star(node) for node in layout["nodes"])
    frontiers = layout["frontiers"]
    outward = frontiers["outward"]
    inward = frontiers["inward"]
    temporal = frontiers["temporal"]
    lattice = []
    for y in range(70, 940, 75):
        lattice.append(f'<path d="M100 {y} L1500 {y}"/>')
    for offset in range(-700, 1500, 150):
        lattice.append(f'<path d="M{offset} 940 L{offset + 500} 70"/>')
        lattice.append(f'<path d="M{offset} 70 L{offset + 500} 940"/>')
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" role="img" aria-labelledby="title desc">
<title id="title">Nested Causality Atlas Continuum Star Map</title>
<desc id="desc">A star chart mapping a candle flame across enclosing, enclosed, and parallel causal enclosures.</desc>
<defs>{markers}</defs>
<style>
  .edge-label,.node-label,.small,.axis,.title{{font-family:Inter,Arial,sans-serif;fill:#e7edf7;letter-spacing:0}}
  .edge-label{{font-size:16px;paint-order:stroke;stroke:#07111f;stroke-width:5px;stroke-linejoin:round}}
  .node-label{{font-size:19px;font-weight:650}}
  .small{{font-size:15px;fill:#9eabc0}}
  .axis{{font-size:17px;font-weight:700;fill:#cbd5e1}}
  .title{{font-family:Georgia,serif;font-size:36px;font-weight:700}}
  .lattice path{{stroke:#9ab6ff;stroke-opacity:.055;stroke-width:1}}
  .tier{{fill:none;stroke:#8fa2bd;stroke-opacity:.28;stroke-width:1.5}}
  .frontier{{fill:none;stroke:#f4c95d;stroke-opacity:.68;stroke-width:2;stroke-dasharray:8 10}}
  .inward-frontier{{fill:#07111f;fill-opacity:.52;stroke:#f4c95d;stroke-opacity:.82;stroke-width:1.6;stroke-dasharray:4 6}}
  .frontier-leader{{fill:none;stroke:#f4c95d;stroke-opacity:.46;stroke-width:1}}
  .temporal-route{{fill:none;stroke:#7dd3c7;stroke-opacity:.86;stroke-width:2.4;stroke-dasharray:3 7}}
  .temporal-boundary{{fill:#07111f;stroke:#7dd3c7;stroke-width:2}}
  .target-ring{{fill:none;stroke:#f4c95d;stroke-width:2;stroke-dasharray:5 5}}
  .ivm-cell polygon,.ivm-cell line{{fill:none;stroke:#9ab6ff;stroke-opacity:.22;stroke-width:1.2}}
  .ivm-cell circle{{fill:#9ab6ff;fill-opacity:.44}}
  .ivm-cell.active polygon,.ivm-cell.active line{{stroke:#f4c95d;stroke-opacity:.48;stroke-width:1.5}}
  .ivm-cell.active circle{{fill:#f4c95d;fill-opacity:.72}}
  .ivm-cell.adjacent polygon,.ivm-cell.adjacent line{{stroke:#d7a6ff;stroke-opacity:.42}}
  .ivm-cell.adjacent circle{{fill:#d7a6ff}}
  .ivm-label{{font-family:Inter,Arial,sans-serif;fill:#8190a7;font-size:11px;letter-spacing:0}}
</style>
<rect width="1600" height="1000" fill="#07111f"/>
<g class="lattice">{''.join(lattice)}</g>
<ellipse cx="{outward['cx']}" cy="{outward['cy']}" rx="{outward['rx']}" ry="{outward['ry']}" class="frontier"/>
<circle cx="{inward['cx']}" cy="{inward['cy']}" r="{inward['radius']}" class="inward-frontier"/>
<path d="M{inward['label_x'] + 10} {inward['label_y'] + 7} L{inward['cx'] - inward['radius']} {inward['cy']}" class="frontier-leader"/>
<text x="{inward['label_x']}" y="{inward['label_y']}" text-anchor="middle" class="small">{html.escape(inward['label'])}</text>
<path d="{temporal['path']}" class="temporal-route" marker-end="url(#arrow-exchange)"/>
<circle cx="{temporal['begin_x']}" cy="{temporal['begin_y']}" r="7" class="temporal-boundary"/>
<circle cx="{temporal['end_x']}" cy="{temporal['end_y']}" r="7" class="temporal-boundary"/>
<text x="{temporal['begin_x']}" y="{temporal['begin_y'] - 18}" text-anchor="middle" class="small">BEGIN</text>
<text x="{temporal['end_x']}" y="{temporal['end_y'] - 18}" text-anchor="middle" class="small">END</text>
<text x="{temporal['label_x']}" y="{temporal['label_y']}" text-anchor="middle" class="axis">{html.escape(temporal['label'])}</text>
<rect x="70" y="28" width="505" height="90" fill="#07111f"/>
<text x="90" y="72" class="title">THE CONTINUUM MAP</text>
<text x="92" y="103" class="small">Nested Causality Atlas · worked enclosure chart</text>
<text x="{outward['label_x']}" y="{outward['label_y']}" text-anchor="middle" class="axis">{html.escape(outward['label'])}</text>
{ivm_cells}
<text x="800" y="130" text-anchor="middle" class="axis">ENCLOSING · SCALE ESCALATION</text>
<text x="800" y="910" text-anchor="middle" class="axis">ENCLOSED · SCALE DE-ESCALATION</text>
<text x="125" y="500" class="axis">PARALLEL</text>
<text x="1390" y="500" class="axis">PARALLEL</text>
{edges}
{stars}
<g transform="translate(135,780)">
  <circle cx="80" cy="80" r="64" fill="#0c1b2f" stroke="#8fa2bd"/>
  <path d="M80 8 L92 68 L80 58 L68 68 Z" fill="#79c7c5"/>
  <path d="M80 152 L92 92 L80 102 L68 92 Z" fill="#e98b73"/>
  <path d="M8 80 L68 68 L58 80 L68 92 Z M152 80 L92 68 L102 80 L92 92 Z" fill="#9ab6ff"/>
  <circle cx="80" cy="80" r="14" fill="#f4c95d"/>
  <text x="80" y="86" text-anchor="middle" font-size="14" font-weight="700" fill="#07111f">0∞</text>
  <text x="80" y="-7" text-anchor="middle" class="small">ENCLOSING</text>
  <text x="80" y="181" text-anchor="middle" class="small">ENCLOSED</text>
  <text x="-9" y="85" text-anchor="end" class="small">PARALLEL</text>
  <text x="169" y="85" class="small">PARALLEL</text>
</g>
<g transform="translate(1190,720)">
  <text x="0" y="0" class="axis">ROUTE LEGEND</text>
  <line x1="0" y1="28" x2="70" y2="28" stroke="#e98b73" stroke-width="3"/><text x="82" y="34" class="small">causal projection</text>
  <line x1="0" y1="58" x2="70" y2="58" stroke="#9ab6ff" stroke-width="3" stroke-dasharray="10 8"/><text x="82" y="64" class="small">emergence / contribution</text>
  <line x1="0" y1="88" x2="70" y2="88" stroke="#79c7c5" stroke-width="3"/><text x="82" y="94" class="small">nested exchange</text>
  <line x1="0" y1="118" x2="70" y2="118" stroke="#d7a6ff" stroke-width="3" stroke-dasharray="6 6"/><text x="82" y="124" class="small">IVM / Jitterbug passage</text>
  <line x1="0" y1="148" x2="70" y2="148" stroke="#f4c95d" stroke-width="3" stroke-dasharray="10 8"/><text x="82" y="154" class="small">targeting route</text>
  <line x1="0" y1="178" x2="70" y2="178" stroke="#7dd3c7" stroke-width="3" stroke-dasharray="3 7"/><text x="82" y="184" class="small">temporal passage</text>
  <line x1="0" y1="208" x2="70" y2="208" stroke="#f4c95d" stroke-width="2" stroke-dasharray="8 10"/><text x="82" y="214" class="small">Final Frontiers</text>
</g>
</svg>'''


def main() -> None:
    OUTPUTS.mkdir(parents=True, exist_ok=True)
    record = load_json("candle_flame.json")
    layout = load_json("star_layout.json")
    volumes = load_json("volume_destinations.json")
    (OUTPUTS / "continuum_star_map.svg").write_text(build_svg(layout), encoding="utf-8")
    payload = {"record": record, "layout": layout, "volumes": volumes}
    (OUTPUTS / "atlas_data.js").write_text(
        "window.CONTINUUM_ATLAS = " + json.dumps(payload, ensure_ascii=False, indent=2) + ";\n",
        encoding="utf-8",
    )
    print("Generated outputs/continuum_star_map.svg")
    print("Generated outputs/atlas_data.js")


if __name__ == "__main__":
    main()
