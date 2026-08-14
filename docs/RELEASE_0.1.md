# Release 0.1 -- The Compass

## Release Purpose

Release 0.1 establishes the Nested Causality Atlas as a stable navigational
instrument. Its purpose is not to complete the map. Its purpose is to make the
compass, map grammar, data contract, and publication forms firm enough that new
destinations can be added without changing what the bearings mean.

## Locked Feature Set

The following features define 0.1. New ideas discovered during implementation
belong in `ROADMAP.md` unless they are required to make one of these features
work correctly.

### 1. Canonical Nested Causality Compass Rose

- Zero Infinity at the center as departure reference.
- Enclosing / scale escalation at north.
- Enclosed / scale de-escalation at south.
- Parallel enclosures at east and west.
- Causal projection directed inward only.
- Emergence, contribution, and feedback directed outward under their own names.
- Nested Exchange along shared boundaries.
- Final Frontier as the horizon of the presently available map.

### 2. Star-Map Representation

- observations and departures rendered as stars;
- causal enclosures rendered as constellations or bounded fields;
- scale tiers rendered as depth fields;
- projection, contribution, exchange, and targeting rendered as distinct routes;
- every visible object connected to a machine-readable record.

### 3. Eight Mapping Modules

Reference, Departure, Enclosure, Projection, Exchange, Scale Route, Frontier,
and Targeting.

### 4. One Canonical Data Source

The web atlas, print atlas, examples, and validation tools must consume the same
versioned atlas records. No display may silently maintain a second account.

### 5. Web Atlas

- self-contained and directly openable;
- day and night compatible;
- module-layer controls;
- clickable stars and routes;
- readable details and evidence boundaries;
- responsive desktop and mobile layout;
- print stylesheet.

### 6. Print Atlas

- printable compass and star chart;
- map legend and module guide;
- worked enclosure map;
- blank field worksheet;
- destination gazetteer;
- visible version and status.

### 7. Volumes I--X Destination Registry

The release includes a registry capable of locating discoveries, models,
interventions, unresolved targets, and superseded routes from all ten volumes.
An entry may be marked `unmapped`, `source-located`, `provisional`, `mapped`, or
`tested`. The registry must not fill absent coordinates by analogy.

### 8. Reproducibility and Boundaries

- schema validation;
- structural tests for direction and required records;
- deterministic visual generation;
- explicit separation of observation, inference, hypothesis, and model output;
- no claim that 0.1 completes the physical theory.

### 9. Deliberate Visual Refinement

Beauty is part of the instrument's function. The atlas must make an unfamiliar
architecture inviting enough to explore and ordered enough to remember. It
must complete three design cycles that are evaluated independently of the
correctness or quantity of content:

1. **Celestial language:** establish the star field, 60-degree lattice, compass
   rose, route grammar, type, color, depth, and day/night identity.
2. **Composition and motion:** refine proportion, density, responsive framing,
   transitions, module switching, focus, and the visual route through the page.
3. **Publication finish:** inspect web and print at desktop and mobile sizes,
   remove collisions and weak states, tune typography and contrast, and make
   the final chart worthy of display as an object in its own right.

No design cycle may alter the meaning of a bearing merely to improve its
appearance. No release is accepted solely because it functions.

## Excluded From 0.1

- derived universal scale-transition dynamics;
- a completed physical inventory of every scale tier;
- automatic truth adjudication;
- automated extraction of every destination from the books;
- social or collaborative editing;
- hosted accounts or server infrastructure;
- three-dimensional rendering;
- claims of experimental confirmation.

## Acceptance Test

Release 0.1 is complete when a new user can:

1. open the web atlas without installing software;
2. identify every compass bearing without reading the books;
3. inspect the worked flame map and trace each visible route to its record;
4. complete a blank mapping record;
5. validate that record locally;
6. locate each volume in the destination registry;
7. print a coherent field instrument from the same source data;
8. distinguish the edge of the present map from the end of the territory.
9. remain coherent and visually compelling in day, night, screen, and print
   forms after all three design cycles.
