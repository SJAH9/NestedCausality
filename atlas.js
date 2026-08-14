(() => {
  "use strict";

  const atlas = window.CONTINUUM_ATLAS;
  if (!atlas) {
    document.body.insertAdjacentHTML("afterbegin", '<p class="load-error">Atlas data is unavailable. Run <code>python3 -m src.generate_star_map</code>.</p>');
    return;
  }

  const NS = "http://www.w3.org/2000/svg";
  const svg = document.getElementById("starMap");
  const inspector = document.getElementById("mapInspector");
  const colors = {
    reference: "#f4c95d", active: "#f8fafc", enclosing: "#79c7c5",
    enclosed: "#e98b73", parallel: "#9ab6ff", target: "#ffcf70", passage: "#d7a6ff",
    projection: "#e98b73", contribution: "#9ab6ff", exchange: "#79c7c5", ivm: "#d7a6ff", targeting: "#f4c95d"
  };

  const modules = [
    ["Reference", "Declare the local zero and scale address without turning either into the origin of everything."],
    ["Departure", "Record what differs from the reference, including sign, magnitude, duration, and state."],
    ["Enclosure", "Locate the active, enclosing, enclosed, and parallel states that maintain the identity."],
    ["IVM Passage", "Map the local Vector Equilibrium, active cell, periphery saturation, and Jitterbug route into an adjacent enclosure."],
    ["Projection", "Test the conditions projected from an outer equilibrium into the maintained interior."],
    ["Exchange", "Follow matter, energy, state, or information across a boundary and retain every residual."],
    ["Scale Route", "Test local authority and move through an addressed escalation or de-escalation junction."],
    ["Frontier", "Mark the observed end, derived end, unavailable exterior, and reason the map halts."],
    ["Targeting", "Choose a boundary condition, predict its effect, state an alternative, and define failure."]
  ];

  function el(name, attrs = {}, text = "") {
    const node = document.createElementNS(NS, name);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
    if (text) node.textContent = text;
    return node;
  }

  function renderDefs() {
    const defs = el("defs");
    ["projection", "contribution", "exchange", "ivm", "targeting"].forEach(kind => {
      const marker = el("marker", { id: `web-arrow-${kind}`, markerWidth: 10, markerHeight: 10, refX: 8, refY: 3, orient: "auto", markerUnits: "strokeWidth" });
      marker.append(el("path", { d: "M0,0 L0,6 L9,3 z", fill: colors[kind] }));
      defs.append(marker);
    });
    const glow = el("filter", { id: "starGlow", x: "-100%", y: "-100%", width: "300%", height: "300%" });
    glow.append(el("feGaussianBlur", { stdDeviation: 6, result: "blur" }));
    const merge = el("feMerge");
    merge.append(el("feMergeNode", { in: "blur" }), el("feMergeNode", { in: "SourceGraphic" }));
    glow.append(merge);
    defs.append(glow);
    svg.append(defs);
  }

  function renderField() {
    svg.append(el("rect", { width: 1600, height: 1000, fill: "#07111f" }));
    const lattice = el("g", { opacity: .08, stroke: "#9ab6ff", "stroke-width": 1 });
    for (let y = 65; y < 960; y += 74) lattice.append(el("line", { x1: 70, y1: y, x2: 1530, y2: y }));
    for (let x = -650; x < 1550; x += 148) {
      lattice.append(el("line", { x1: x, y1: 940, x2: x + 510, y2: 60 }));
      lattice.append(el("line", { x1: x, y1: 60, x2: x + 510, y2: 940 }));
    }
    svg.append(lattice);
    (atlas.layout.ivm_cells || []).forEach(cell => {
      const group = el("g", { class: `ivm-cell ivm-${cell.role}`, "data-ivm-cell": cell.id });
      const points = [[0,-1],[.866,-.5],[.866,.5],[0,1],[-.866,.5],[-.866,-.5]].map(([dx,dy]) => [cell.cx + cell.radius * dx, cell.cy + cell.radius * dy]);
      const stroke = cell.role === "active" ? "#f4c95d" : cell.role === "adjacent" ? "#d7a6ff" : "#9ab6ff";
      const opacity = cell.role === "active" ? .52 : .22;
      group.append(el("polygon", { points: points.map(point => point.join(",")).join(" "), fill: "none", stroke, "stroke-opacity": opacity, "stroke-width": cell.role === "active" ? 1.8 : 1.2 }));
      points.forEach(([x,y]) => {
        group.append(el("line", { x1: cell.cx, y1: cell.cy, x2: x, y2: y, stroke, "stroke-opacity": opacity, "stroke-width": 1.1 }));
        group.append(el("circle", { cx: x, cy: y, r: 3, fill: stroke, opacity: Math.min(1, opacity + .22) }));
      });
      group.append(el("circle", { cx: cell.cx, cy: cell.cy, r: 4.5, fill: stroke, opacity: .82 }));
      group.append(el("text", { x: cell.cx, y: cell.cy + cell.radius + 20, "text-anchor": "middle", fill: "#7f8ea5", "font-size": 10 }, cell.address));
      svg.append(group);
    });
    svg.append(el("ellipse", { cx: 800, cy: 500, rx: 745, ry: 480, fill: "none", stroke: "#f4c95d", "stroke-opacity": .62, "stroke-width": 2, "stroke-dasharray": "8 11" }));
    svg.append(el("text", { x: 800, y: 71, "text-anchor": "middle", fill: "#f4c95d", "font-size": 14, "font-weight": 750 }, "FINAL FRONTIER · PRESENT MAP HORIZON"));
    svg.append(el("text", { x: 800, y: 124, "text-anchor": "middle", fill: "#79c7c5", "font-size": 14, "font-weight": 750 }, "ENCLOSING · SCALE ESCALATION"));
    svg.append(el("text", { x: 800, y: 925, "text-anchor": "middle", fill: "#e98b73", "font-size": 14, "font-weight": 750 }, "ENCLOSED · SCALE DE-ESCALATION"));
    svg.append(el("text", { x: 125, y: 505, fill: "#9ab6ff", "font-size": 14, "font-weight": 750 }, "PARALLEL"));
    svg.append(el("text", { x: 1400, y: 505, fill: "#9ab6ff", "font-size": 14, "font-weight": 750 }, "PARALLEL"));
  }

  function renderEdges() {
    const byId = Object.fromEntries(atlas.layout.nodes.map(node => [node.id, node]));
    atlas.layout.edges.forEach((edge, index) => {
      const source = byId[edge.source];
      const target = byId[edge.target];
      const group = el("g", { class: `map-edge layer-${edge.kind}`, tabindex: 0, role: "button", "aria-label": `${edge.kind}: ${edge.label}` });
      const path = el("path", {
        d: `M${source.x} ${source.y} Q${(source.x + target.x) / 2 + (index % 2 ? 35 : -35)} ${(source.y + target.y) / 2} ${target.x} ${target.y}`,
        fill: "none", stroke: colors[edge.kind], "stroke-width": 3,
        "stroke-dasharray": ["contribution", "targeting"].includes(edge.kind) ? "10 8" : "none",
        "marker-end": `url(#web-arrow-${edge.kind})`
      });
      const label = el("text", {
        x: edge.label_x ?? (source.x + target.x) / 2, y: edge.label_y ?? (source.y + target.y) / 2 - 13,
        "text-anchor": "middle", fill: "#dce5f2", "font-size": 15,
        style: "paint-order:stroke;stroke:#07111f;stroke-width:5px;stroke-linejoin:round"
      }, edge.label);
      group.append(path, label);
      group.addEventListener("click", () => inspectRoute(edge));
      group.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") inspectRoute(edge); });
      svg.append(group);
    });
  }

  function renderNodes() {
    atlas.layout.nodes.forEach((node, index) => {
      const group = el("g", { class: `map-node node-${node.kind}`, tabindex: 0, role: "button", "aria-label": node.label, "data-node": node.id });
      if (node.kind === "target") group.append(el("circle", { cx: node.x, cy: node.y, r: node.size + 19, fill: "none", stroke: colors.target, "stroke-width": 2, "stroke-dasharray": "5 6" }));
      group.append(el("circle", { cx: node.x, cy: node.y, r: node.size + 11, fill: colors[node.kind], opacity: .12 }));
      const star = el("circle", { cx: node.x, cy: node.y, r: node.size, fill: colors[node.kind], filter: "url(#starGlow)" });
      star.style.animation = `breathe ${4.7 + index * .43}s ease-in-out ${index * -.7}s infinite`;
      group.append(star);
      group.append(el("circle", { cx: node.x - node.size * .28, cy: node.y - node.size * .28, r: Math.max(2, node.size * .18), fill: "#fff", opacity: .86 }));
      group.append(el("text", { x: node.x, y: node.y + node.size + 28, "text-anchor": "middle", fill: "#eef3fb", "font-size": 18, "font-weight": 700 }, node.label));
      group.addEventListener("click", () => inspectNode(node));
      group.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") inspectNode(node); });
      svg.append(group);
    });
  }

  function findEntity(id) {
    const record = atlas.record;
    if (record.active_enclosure.id === id) return { ...record.active_enclosure, relation: "Active enclosure" };
    for (const [key, relation] of [["enclosing_enclosures", "Enclosing equilibrium"], ["enclosed_enclosures", "Enclosed state"], ["parallel_enclosures", "Parallel enclosure"]]) {
      const found = (record[key] || []).find(item => item.id === id);
      if (found) return { ...found, relation };
    }
    if (id === "zero-infinity") return { name: "Zero Infinity", relation: "Reference architecture", kind: "countably infinite reference", boundary: record.reference.local_zero, maintained_identity: record.reference.justification };
    if (id === "target-oxygen") return { name: "Oxygen boundary target", relation: "Target", kind: "controlled enclosing condition", boundary: record.target.boundary_condition, maintained_identity: record.target.prediction };
    if (id === "adjacent-ivm") return { name: "Adjacent IVM address", relation: "Scale passage", kind: record.ivm_passage.jitterbug_state, boundary: record.ivm_passage.periphery_boundary, maintained_identity: record.ivm_passage.capacity_condition };
    return null;
  }

  function inspectNode(node) {
    const entity = findEntity(node.id);
    if (!entity) return;
    inspector.innerHTML = `<p class="eyebrow">Selected coordinate</p><h3>${escapeHtml(entity.name)}</h3><p class="inspector-kind">${escapeHtml(entity.relation)} · ${escapeHtml(entity.kind || "mapped state")}</p><p>${escapeHtml(entity.maintained_identity || "")}</p><dl><div><dt>Boundary</dt><dd>${escapeHtml(entity.boundary || atlas.record.reference.local_zero)}</dd></div><div><dt>Scale</dt><dd>${escapeHtml(atlas.record.scale_route.current_tier)}</dd></div><div><dt>Map status</dt><dd>${escapeHtml(atlas.record.inquiry.status)}</dd></div></dl>`;
  }

  function inspectRoute(edge) {
    const descriptions = {
      projection: "Outer-to-inner causal projection. Vary the enclosing condition and observe whether the interior remains stable.",
      contribution: "An enclosed state contributes outward without being renamed causal projection.",
      exchange: "Matter, energy, state, or information crosses a shared boundary and remains in the ledger.",
      ivm: "The current IVM geometry reaches its periphery and records a possible Jitterbug passage into an adjacent scale enclosure.",
      targeting: "A proposed route from controlled boundary change to a preregistered observable result."
    };
    inspector.innerHTML = `<p class="eyebrow">Selected route</p><h3>${escapeHtml(edge.label)}</h3><p class="inspector-kind">${escapeHtml(edge.kind)}</p><p>${descriptions[edge.kind]}</p><dl><div><dt>Departure</dt><dd>${escapeHtml(edge.source)}</dd></div><div><dt>Arrival</dt><dd>${escapeHtml(edge.target)}</dd></div><div><dt>Direction retained</dt><dd>Yes</dd></div></dl>`;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]);
  }

  function renderModules() {
    document.getElementById("moduleGrid").innerHTML = modules.map(([name, body], index) => `<article class="module-card"><span class="module-number">${String(index + 1).padStart(2, "0")}</span><h3>${name}</h3><p>${body}</p></article>`).join("");
  }

  function roman(number) {
    return ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"][number] || number;
  }

  function renderVolumes() {
    document.getElementById("volumeGrid").innerHTML = atlas.volumes.volumes.map(volume => `<article class="volume-card"><span class="roman">${roman(volume.volume)}</span><span class="status ${volume.status}">${volume.status}</span><h3>${escapeHtml(volume.title || `Volume ${roman(volume.volume)} · awaiting canonical source`)}</h3><p><strong>${escapeHtml(volume.primary_region)}</strong></p><p>${escapeHtml(volume.mapping_note)}</p></article>`).join("");
  }

  function bindControls() {
    document.querySelectorAll(".layer-control").forEach(button => button.addEventListener("click", () => {
      document.querySelectorAll(".layer-control").forEach(item => item.classList.remove("active"));
      button.classList.add("active");
      const layer = button.dataset.layer;
      document.querySelectorAll(".map-edge").forEach(edge => {
        edge.style.opacity = layer === "all" || edge.classList.contains(`layer-${layer}`) ? "1" : ".08";
        edge.style.pointerEvents = layer === "all" || edge.classList.contains(`layer-${layer}`) ? "auto" : "none";
      });
    }));
    document.getElementById("themeToggle").addEventListener("click", () => {
      const theme = document.documentElement.dataset.theme === "night" ? "day" : "night";
      document.documentElement.dataset.theme = theme;
      localStorage.setItem("continuum-theme", theme);
    });
    document.getElementById("printMap").addEventListener("click", () => window.print());
    const stage = document.getElementById("mapStage");
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      stage.addEventListener("pointermove", event => {
        const rect = stage.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - .5;
        const y = (event.clientY - rect.top) / rect.height - .5;
        svg.style.transform = `translate(${x * -5}px, ${y * -5}px) scale(1.008)`;
      });
      stage.addEventListener("pointerleave", () => { svg.style.transform = "none"; });
    }
  }

  renderDefs();
  renderField();
  renderEdges();
  renderNodes();
  renderModules();
  renderVolumes();
  bindControls();
})();
