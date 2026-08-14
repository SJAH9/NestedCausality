# Interactive Instruments

This directory contains local browser interfaces for exploring Nested Causal
Modelling concepts. No installation, account, analytics, or server is required.

## Zero Infinity Network Game

Open [`zero-infinity-network.html`](zero-infinity-network.html) in a modern
browser. The instrument renders the nonterminal game as a live network of
enclosures organized around the `0∞` reference.

Each encounter has three exact transitions:

1. `SEEK` generates a temporary victory-claim node at the defender's level.
2. `MATCH` moves the pursuer to that exact depth and scale.
3. `EVADE` removes the claim at countdown zero, advances the enclosure
   frontier, creates or reactivates its node, and reverses the players' roles.

Use play/pause to control realtime execution, step to advance one transition,
reset to return to event zero, and the slider to change display speed. Add an
event query such as `?events=36` to inspect a deterministic finite prefix.

### Precision and interpretation

The engine represents event numbers, encounter numbers, depth, scale, spiral
counters, and utilities with arbitrary-precision integers. It contains no
randomizer, score, win condition, loss condition, or terminal transition.
Screen coordinates are a bounded projection of the exact state; rounded pixel
positions never feed back into the game.

This is an exact execution of the repository's stated game rules, not an
empirical measurement or proof that the conceptual model describes an external
system. All processing remains in the browser and no data leaves the page.

## Quantized Compactification Explorer

Open [`quantized-compactification.html`](quantized-compactification.html) in a
modern browser.

The explorer lets a user:

- add positive and negative departures through pointer movement or device motion;
- observe the active enclosure list;
- compactify opposing departures;
- track cancellations and scale escalations;
- export the current session data.

### Interpretation

The explorer is a conceptual demonstration. Its `+1` and `-1` departures are
interface-generated values, not measured physical quantities. Compactification
shows the behavior of the rules encoded in the page; it does not establish an
empirical law.

### Privacy and operation

The file runs locally. It has no external dependencies and does not transmit or
store user activity outside the browser's downloaded export.

## Adding an instrument

Prefer a self-contained HTML file when practical. Add a section to this README
that states:

1. what the controls do;
2. what the displayed values mean;
3. whether any values are empirical;
4. browser or device requirements;
5. whether data leaves the browser.
