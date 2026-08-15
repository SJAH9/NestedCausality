# Nested Causality Atlas

## The Continuum Map

The Nested Causality Atlas is the operational map produced by the first ten
volumes of *Causality and Attraction*. It provides a compass rose for locating
an inquiry inside nested causal enclosures, tracing exchange across boundaries,
moving through Isotropic Vector Matrix passages between addressed scale tiers,
and returning from an encounter with infinity to an observable and testable
target.

The atlas is modeled after the RTLDI Atlas architecture:

- one canonical machine-readable map;
- several views of the same map;
- explicit mapping modules;
- worked and blank records;
- an interactive web atlas;
- a printable field instrument;
- reproducible validation.

Its conceptual origin is Volume VIII, *The Clock Is the Countably Infinite
Scale to the Smooth Infinity of Time*. A calendar is a map of time and a clock
is its scale. Volume VIII supplies the missing temporal address that lets an
enclosure map retain beginning, count, phase, measured rate, and end. Volume X
records the human-machine construction of the instrument; it does not replace
Volume VIII as the discovery from which the Atlas arises.

It is a map, not the territory. It does not make every claim true. It records
where a claim begins, what encloses it, what it encloses, what crosses its
boundaries, which scale gives its terms meaning, and where present knowledge
ends.

The Three Laws represented here are observations, not software rules or
patterns selected from favorable cases: stable entities are enclosed and
stabilized by larger equilibria while enclosing participating states; matter,
energy, state, and information cross parallel and nested boundaries without
destruction; and enclosure remains available inward and outward to the same
Final Frontier of the present physical and epistemic universe. The ten modules
preserve these observations in a usable record. They do not reduce their
universality to a checklist.

## Compass Rose

- **Center -- Zero Infinity:** the countably infinite reference architecture
  from which a local state can be described as a departure.
- **North -- Enclosing:** scale escalation toward the equilibrium projecting
  stabilizing conditions inward.
- **South -- Enclosed:** scale de-escalation toward the states contributing to
  the maintained interior.
- **East and West -- Parallel:** adjacent enclosures with shared boundaries,
  competitive dynamics, cooperation, or exchange.
- **Inward bearing -- Causal projection:** outer-to-inner causality.
- **Outward bearing -- Emergence and contribution:** inner activity reaching
  an enclosing state without being renamed causal projection.
- **Boundary route -- Nested exchange:** matter, energy, state, or information
  crossing without an unexplained loss.
- **Passage geometry -- Isotropic Vector Matrix:** the repeated local geometry
  within which contracted, balanced, and expanded states approach a periphery
  boundary and may transform through a Jitterbug transition into an adjacent
  enclosure.
- **Horizons -- Final Frontiers:** the same deterministic infinity placed
  beyond the smallest and largest presently addressed scales and at the end of
  the bounded passage. Each moves when the map expands and remains the same
  boundary condition.

## Mapping Modules

1. `reference` declares the local zero and scale address.
2. `time_address` bounds the passage and retains clock, count, phase, and rate.
3. `departure` records what differs from that reference.
4. `enclosure` identifies active, enclosing, enclosed, and parallel states.
5. `ivm_passage` maps the local Vector Equilibrium, periphery saturation, and
   Jitterbug transition geometry.
6. `projection` records testable outer-to-inner stabilizing conditions.
7. `exchange` balances what crosses each boundary.
8. `scale_route` tests local authority and maps escalation or de-escalation.
9. `frontier` places inward, outward, and temporal halt conditions.
10. `targeting` turns the completed map into a prediction or intervention.

## Layout

```text
.
|-- index.html                         interactive star atlas
|-- Continuum_Map.md                  canonical field doctrine
|-- Continuum_Map_Field_Worksheet.md  printable blank instrument
|-- data/
|   |-- atlas.schema.json             data contract
|   `-- candle_flame.json             worked map
|-- docs/
|   |-- MAPPING_MODULES.md             module definitions
|   |-- IVM_PASSAGE_SOURCE.md          Volume V escalation provenance
|   `-- RELEASE_0.1.md                 locked release contract
|-- src/
|   |-- atlas.py                      validation and composition
|   |-- modules.py                    mapping operations
|   `-- generate_star_map.py          reproducible SVG generator
|-- outputs/
|   `-- continuum_star_map.svg         generated visual map
|-- tests/
|   `-- test_atlas.py                 structural tests
`-- research_archive/                pre-atlas repository materials
```

## Build

```bash
python3 -m src.generate_star_map
python3 -m unittest discover -s tests
```

Open `index.html` directly in a modern browser. No server or external assets
are required.

## Status

Working research instrument. Not published. Not a claim of completed physical
theory.

The repository materials that preceded the Atlas remain available under
`research_archive/` for provenance. They are not part of the 0.1 interface or
release contract.
