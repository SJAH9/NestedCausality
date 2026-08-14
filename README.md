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

It is a map, not the territory. It does not make every claim true. It records
where a claim begins, what encloses it, what it encloses, what crosses its
boundaries, which scale gives its terms meaning, and where present knowledge
ends.

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
- **Horizon -- Final Frontier:** the deterministic infinity at the end of
  presently available knowledge and physical reach. It moves when the map
  expands and remains the same boundary condition.

## Mapping Modules

1. `reference` declares the local zero and scale address.
2. `departure` records what differs from that reference.
3. `enclosure` identifies active, enclosing, enclosed, and parallel states.
4. `ivm_passage` maps the local Vector Equilibrium, periphery saturation, and
   Jitterbug transition geometry.
5. `projection` records testable outer-to-inner stabilizing conditions.
6. `exchange` balances what crosses each boundary.
7. `scale_route` tests local authority and maps escalation or de-escalation.
8. `frontier` marks the end of observation, derivation, and model authority.
9. `targeting` turns the completed map into a prediction or intervention.

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
