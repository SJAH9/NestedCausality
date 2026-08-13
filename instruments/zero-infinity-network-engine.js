((scope) => {
  "use strict";

  const PHASES = Object.freeze(["SEEK", "MATCH", "EVADE"]);
  const DIRECTIONS = Object.freeze([
    Object.freeze({ depth: 1n, scale: 0n, move: "ESCALATE_DEPTH" }),
    Object.freeze({ depth: 0n, scale: 1n, move: "ESCALATE_SCALE" }),
    Object.freeze({ depth: -1n, scale: 0n, move: "DEESCALATE_DEPTH" }),
    Object.freeze({ depth: 0n, scale: -1n, move: "DEESCALATE_SCALE" }),
  ]);

  function coordinateKey(depth, scale) {
    return `${depth},${scale}`;
  }

  function createState() {
    return {
      event: 0n,
      encounter: 1n,
      phaseIndex: 0,
      attacker: "A",
      defender: "B",
      frontier: { depth: 0n, scale: 0n },
      players: {
        A: { depth: 0n, scale: 0n },
        B: { depth: 0n, scale: 0n },
      },
      directionIndex: 0n,
      segmentLength: 1n,
      segmentProgress: 0n,
      segmentsAtLength: 0n,
      claim: null,
      claimsRemoved: 0n,
      enclosures: new Map([
        [coordinateKey(0n, 0n), { depth: 0n, scale: 0n, visits: 1n }],
      ]),
      edges: [],
    };
  }

  function nextDirection(state) {
    const direction = DIRECTIONS[Number(state.directionIndex % BigInt(DIRECTIONS.length))];
    state.segmentProgress += 1n;
    if (state.segmentProgress === state.segmentLength) {
      state.segmentProgress = 0n;
      state.directionIndex += 1n;
      state.segmentsAtLength += 1n;
      if (state.segmentsAtLength === 2n) {
        state.segmentsAtLength = 0n;
        state.segmentLength += 1n;
      }
    }
    return direction;
  }

  function exactEvent(state, phase, action, detail, topology = {}) {
    return Object.freeze({
      event: state.event,
      encounter: state.encounter,
      phase,
      countdown: { SEEK: 2, MATCH: 1, EVADE: 0 }[phase],
      attacker: state.attacker,
      defender: state.defender,
      action,
      detail,
      depthA: state.players.A.depth,
      scaleA: state.players.A.scale,
      depthB: state.players.B.depth,
      scaleB: state.players.B.scale,
      levelsEqual: state.players.A.depth === state.players.B.depth
        && state.players.A.scale === state.players.B.scale,
      utilityA: 0n,
      utilityB: 0n,
      winner: null,
      loser: null,
      terminal: false,
      enclosureMove: topology.enclosureMove || null,
      topology: Object.freeze({
        nodeCreated: topology.nodeCreated || null,
        nodeReactivated: topology.nodeReactivated || null,
        nodeRemoved: topology.nodeRemoved || null,
        edgeCreated: topology.edgeCreated || null,
      }),
    });
  }

  function validateEvent(state, event) {
    const commonInvariant = event.utilityA === 0n
      && event.utilityB === 0n
      && event.winner === null
      && event.loser === null
      && event.terminal === false;
    const phaseInvariant = {
      SEEK: event.action === "SEEK_OPPONENT_LEVEL"
        && state.claim !== null
        && event.topology.nodeCreated === state.claim.id,
      MATCH: event.action === "MATCH_OPPONENT_LEVEL"
        && event.levelsEqual
        && state.claim !== null
        && state.claim.matched,
      EVADE: event.action === "EVADE_AT_LAST_MOMENT"
        && !event.levelsEqual
        && state.claim === null
        && event.enclosureMove !== null
        && event.topology.nodeRemoved !== null
        && event.topology.edgeCreated !== null,
    }[event.phase];

    if (!commonInvariant || !phaseInvariant) {
      throw new Error(`Zero Infinity invariant failed at exact event ${event.event}`);
    }
    return event;
  }

  function seek(state) {
    const target = state.players[state.defender];
    state.claim = {
      id: `claim-${state.encounter}`,
      depth: target.depth,
      scale: target.scale,
      owner: state.attacker,
      matched: false,
    };
    return exactEvent(
      state,
      "SEEK",
      "SEEK_OPPONENT_LEVEL",
      `${state.attacker} targets ${state.defender} at (${target.depth}, ${target.scale})`,
      { nodeCreated: state.claim.id },
    );
  }

  function match(state) {
    const target = state.players[state.defender];
    state.players[state.attacker] = { depth: target.depth, scale: target.scale };
    state.claim.matched = true;
    return exactEvent(
      state,
      "MATCH",
      "MATCH_OPPONENT_LEVEL",
      `${state.attacker} reaches ${state.defender}'s exact level`,
    );
  }

  function evade(state) {
    const previous = { ...state.frontier };
    const direction = nextDirection(state);
    state.frontier.depth += direction.depth;
    state.frontier.scale += direction.scale;
    state.players[state.defender] = { ...state.frontier };

    const key = coordinateKey(state.frontier.depth, state.frontier.scale);
    const enclosure = state.enclosures.get(key);
    const nodeCreated = enclosure ? null : key;
    const nodeReactivated = enclosure ? key : null;
    if (enclosure) {
      enclosure.visits += 1n;
    } else {
      state.enclosures.set(key, {
        depth: state.frontier.depth,
        scale: state.frontier.scale,
        visits: 1n,
      });
    }

    const edge = {
      from: previous,
      to: { ...state.frontier },
      move: direction.move,
      encounter: state.encounter,
    };
    state.edges.push(edge);
    const removedClaim = state.claim.id;
    state.claim = null;
    state.claimsRemoved += 1n;

    return exactEvent(
      state,
      "EVADE",
      "EVADE_AT_LAST_MOMENT",
      `${state.defender} uses ${direction.move} at countdown zero`,
      {
        enclosureMove: direction.move,
        nodeCreated,
        nodeReactivated,
        nodeRemoved: removedClaim,
        edgeCreated: `${coordinateKey(previous.depth, previous.scale)}>${key}`,
      },
    );
  }

  function advance(state) {
    state.event += 1n;
    const phase = PHASES[state.phaseIndex];
    let event;
    if (phase === "SEEK") event = seek(state);
    if (phase === "MATCH") event = match(state);
    if (phase === "EVADE") event = evade(state);

    state.phaseIndex += 1;
    if (state.phaseIndex === PHASES.length) {
      state.phaseIndex = 0;
      state.encounter += 1n;
      [state.attacker, state.defender] = [state.defender, state.attacker];
    }
    return validateEvent(state, event);
  }

  function exactSnapshot(state) {
    return Object.freeze({
      event: state.event,
      encounter: state.encounter,
      nextPhase: PHASES[state.phaseIndex],
      attacker: state.attacker,
      defender: state.defender,
      frontier: Object.freeze({ ...state.frontier }),
      playerA: Object.freeze({ ...state.players.A }),
      playerB: Object.freeze({ ...state.players.B }),
      enclosureCount: state.enclosures.size,
      claimsRemoved: state.claimsRemoved,
      utilityA: 0n,
      utilityB: 0n,
      winner: null,
      loser: null,
      terminal: false,
    });
  }

  scope.ZeroInfinityNetworkEngine = Object.freeze({
    PHASES,
    DIRECTIONS,
    coordinateKey,
    createState,
    advance,
    exactSnapshot,
  });
})(globalThis);
