(() => {
  "use strict";

  const Engine = globalThis.ZeroInfinityNetworkEngine;
  if (!Engine) throw new Error("Zero Infinity network engine did not load");

  const SVG_NS = "http://www.w3.org/2000/svg";
  const elements = Object.fromEntries([
    "network", "grid-layer", "edge-layer", "claim-layer", "node-layer", "player-layer",
    "run-status", "play-pause", "step", "reset", "speed", "phase", "countdown",
    "event-copy", "encounter", "event", "active-nodes", "retired-nodes", "a-level",
    "b-level", "a-role", "b-role", "event-log",
  ].map(id => [id, document.getElementById(id)]));

  let state = Engine.createState();
  let lastEvent = null;
  let eventLog = [];
  let running = true;
  let timer = null;

  function advance() {
    lastEvent = Engine.advance(state);
    eventLog.unshift(lastEvent);
    eventLog = eventLog.slice(0, 18);
    render();
  }

  function svgElement(name, attributes = {}) {
    const element = document.createElementNS(SVG_NS, name);
    for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
    return element;
  }

  function projection() {
    const coordinates = [
      ...state.enclosures.values(),
      state.players.A,
      state.players.B,
      state.frontier,
    ];
    const absolute = value => value < 0n ? -value : value;
    const exactRadius = coordinates.reduce((largest, item) => {
      const coordinateRadius = absolute(item.depth) > absolute(item.scale)
        ? absolute(item.depth)
        : absolute(item.scale);
      return coordinateRadius > largest ? coordinateRadius : largest;
    }, 2n);
    const visibleRings = Number(exactRadius > 8n ? 8n : exactRadius);
    const denominator = exactRadius > 2n ? exactRadius : 2n;
    const projected = value => Number((value * 340000n) / denominator) / 1000;
    return {
      exactRadius,
      visibleRings,
      ringSpacing: 340 / visibleRings,
      point: ({ depth, scale }) => ({ x: projected(depth), y: -projected(scale) }),
    };
  }

  function drawGrid(view) {
    elements["grid-layer"].replaceChildren();
    for (let ring = 1; ring <= view.visibleRings; ring += 1) {
      const size = ring * 2 * view.ringSpacing;
      elements["grid-layer"].append(svgElement("rect", {
        x: -ring * view.ringSpacing,
        y: -ring * view.ringSpacing,
        width: size,
        height: size,
        class: "grid-ring",
      }));
    }
    elements["grid-layer"].append(
      svgElement("line", { x1: -520, y1: 0, x2: 520, y2: 0, class: "grid-axis" }),
      svgElement("line", { x1: 0, y1: -370, x2: 0, y2: 370, class: "grid-axis" }),
    );
    const depthLabel = svgElement("text", {
      x: 505, y: -10, class: "grid-label", "text-anchor": "end",
    });
    depthLabel.textContent = "+ DEPTH";
    const scaleLabel = svgElement("text", { x: 10, y: -350, class: "grid-label" });
    scaleLabel.textContent = "+ SCALE";
    elements["grid-layer"].append(depthLabel, scaleLabel);
  }

  function drawEdges(view) {
    elements["edge-layer"].replaceChildren();
    state.edges.forEach((edge, index) => {
      const from = view.point(edge.from);
      const to = view.point(edge.to);
      elements["edge-layer"].append(svgElement("line", {
        x1: from.x,
        y1: from.y,
        x2: to.x,
        y2: to.y,
        class: index === state.edges.length - 1 ? "frontier-edge" : "retired-edge",
      }));
    });

    if (state.claim) {
      const attacker = view.point(state.players[state.attacker]);
      const target = view.point(state.claim);
      if (attacker.x !== target.x || attacker.y !== target.y) {
        elements["edge-layer"].append(svgElement("path", {
          d: `M ${attacker.x} ${attacker.y} L ${target.x} ${target.y}`,
          class: `pursuit-edge ${state.attacker.toLowerCase()}`,
        }));
      }
    }
  }

  function drawNodes(view) {
    elements["node-layer"].replaceChildren();
    const frontierKey = Engine.coordinateKey(state.frontier.depth, state.frontier.scale);
    for (const [key, enclosure] of state.enclosures) {
      const point = view.point(enclosure);
      const classes = ["enclosure-node"];
      if (key === frontierKey) classes.push("frontier");
      if (key === "0,0") classes.push("reference");
      const group = svgElement("g", {
        class: classes.join(" "),
        transform: `translate(${point.x} ${point.y})`,
      });
      const circle = svgElement("circle", { r: key === "0,0" ? 24 : 16 });
      const label = svgElement("text", { y: 1 });
      label.textContent = key === "0,0" ? "0∞" : `E${enclosure.depth},${enclosure.scale}`;
      group.append(circle, label);
      elements["node-layer"].append(group);
    }
  }

  function drawClaim(view) {
    elements["claim-layer"].replaceChildren();
    if (!state.claim) return;
    const point = view.point(state.claim);
    const group = svgElement("g", {
      class: `claim-node${state.claim.matched ? " matched" : ""}`,
      transform: `translate(${point.x} ${point.y})`,
    });
    const circle = svgElement("circle", { r: state.claim.matched ? 34 : 27 });
    const label = svgElement("text", { y: -42 });
    label.textContent = state.claim.matched ? "MATCH / t−1" : "CLAIM / t−2";
    group.append(circle, label);
    elements["claim-layer"].append(group);
  }

  function drawPlayers(view) {
    elements["player-layer"].replaceChildren();
    const sameLevel = state.players.A.depth === state.players.B.depth
      && state.players.A.scale === state.players.B.scale;
    for (const player of ["A", "B"]) {
      const point = view.point(state.players[player]);
      const offset = sameLevel ? (player === "A" ? -12 : 12) : 0;
      const group = svgElement("g", {
        class: `player-marker ${player.toLowerCase()}`,
        transform: `translate(${point.x + offset} ${point.y})`,
      });
      const circle = svgElement("circle", { r: 11 });
      const label = svgElement("text", { y: 1 });
      label.textContent = player;
      group.append(circle, label);
      elements["player-layer"].append(group);
    }
  }

  function updateDataPanel() {
    const event = lastEvent || {
      event: 0n,
      encounter: 1n,
      phase: "SEEK",
      countdown: 2,
      attacker: "A",
      defender: "B",
      detail: "A seeks B's exact depth and scale.",
    };
    elements.phase.textContent = event.phase;
    elements.countdown.textContent = event.countdown;
    elements.encounter.textContent = event.encounter;
    elements.event.textContent = event.event;
    elements["active-nodes"].textContent = state.enclosures.size + (state.claim ? 1 : 0);
    elements["retired-nodes"].textContent = state.claimsRemoved;
    elements["a-level"].textContent = `(${state.players.A.depth}, ${state.players.A.scale})`;
    elements["b-level"].textContent = `(${state.players.B.depth}, ${state.players.B.scale})`;
    elements["a-role"].textContent = state.attacker === "A" ? "Pursuer" : "Defender";
    elements["b-role"].textContent = state.attacker === "B" ? "Pursuer" : "Defender";
    elements["event-copy"].textContent = event.phase === "EVADE"
      ? `${event.detail}. The claim node is removed; roles reverse.`
      : event.detail;

    elements["event-log"].replaceChildren(...eventLog.map(item => {
      const row = document.createElement("li");
      const heading = document.createElement("strong");
      heading.textContent = `${item.event.toString().padStart(4, "0")} ${item.phase} `;
      row.append(heading, document.createTextNode(item.detail));
      return row;
    }));
  }

  function render() {
    const view = projection();
    drawGrid(view);
    drawEdges(view);
    drawClaim(view);
    drawNodes(view);
    drawPlayers(view);
    updateDataPanel();
  }

  function interval() {
    return 1900 - Number(elements.speed.value);
  }

  function schedule() {
    window.clearTimeout(timer);
    if (!running) return;
    timer = window.setTimeout(() => {
      advance();
      schedule();
    }, interval());
  }

  function setRunning(nextRunning) {
    running = nextRunning;
    document.body.classList.toggle("paused", !running);
    elements["run-status"].textContent = running ? "Running" : "Paused";
    elements["play-pause"].textContent = running ? "Ⅱ" : "▶";
    elements["play-pause"].setAttribute("aria-label", running ? "Pause" : "Play");
    elements["play-pause"].title = running ? "Pause" : "Play";
    schedule();
  }

  elements["play-pause"].addEventListener("click", () => setRunning(!running));
  elements.step.addEventListener("click", () => {
    setRunning(false);
    advance();
  });
  elements.reset.addEventListener("click", () => {
    state = Engine.createState();
    lastEvent = null;
    eventLog = [];
    render();
    schedule();
  });
  elements.speed.addEventListener("input", schedule);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) window.clearTimeout(timer);
    else schedule();
  });

  const requestedEvent = Number.parseInt(new URLSearchParams(location.search).get("events"), 10);
  const initialEvents = Number.isFinite(requestedEvent)
    ? Math.max(0, Math.min(requestedEvent, 3000))
    : 0;
  for (let index = 0; index < initialEvents; index += 1) {
    lastEvent = Engine.advance(state);
    eventLog.unshift(lastEvent);
  }
  eventLog = eventLog.slice(0, 18);
  render();
  schedule();
})();
