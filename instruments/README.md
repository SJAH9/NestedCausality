# Interactive Instruments

This directory contains self-contained browser interfaces for exploring Nested
Causal Modelling concepts. No installation, account, analytics, or server is
required.

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
