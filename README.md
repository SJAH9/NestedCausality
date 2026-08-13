# Nested Causality

Research, models, simulations, and interactive instruments for Nested Causal
Modelling, the Departure Calculus, and the Continuum of Steady States.

This repository separates three kinds of material:

1. **Research texts** define or discuss the proposed framework.
2. **Computational models** make selected constructions explicit and reproducible.
3. **Interactive instruments** provide exploratory interfaces for working with the concepts.

The simulations are demonstrations of stated model assumptions. They are not
empirical validation of the broader theoretical claims.

## Start here

| Goal | Resource |
|---|---|
| Understand the repository | [`docs/repository-map.md`](docs/repository-map.md) |
| Learn the working vocabulary | [`docs/glossary.md`](docs/glossary.md) |
| Distinguish claims, models, and demonstrations | [`docs/model-boundaries.md`](docs/model-boundaries.md) |
| Reproduce committed results | [`docs/reproducibility.md`](docs/reproducibility.md) |
| Run the game-theory models | [`Continuum Game Theory/`](Continuum%20Game%20Theory/) |
| Use the browser instruments | [`instruments/`](instruments/) |

## Quick verification

Python 3.10 or newer is recommended. The current simulations use only the
Python standard library.

```bash
python3 tools/verify_repository.py
```

The verifier runs each canonical experiment in a temporary directory,
validates the resulting JSON, and compares it with the committed reference
results.

## Repository structure

```text
NestedCausality/
├── Continuum Game Theory/  Papers, simulations, and reference outputs
├── docs/                   Orientation and research-use resources
├── instruments/            Self-contained browser instruments
└── tools/                  Repository validation utilities
```

## Citation

Repository citation metadata is provided in [`CITATION.cff`](CITATION.cff).
Individual papers should be cited using the DOI or citation statement attached
to that work. The current game-theory paper is available at
[doi:10.5281/zenodo.21306704](https://doi.org/10.5281/zenodo.21306704).

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) before changing equations, terminology,
reference outputs, or generated research artifacts.

## Rights and reuse

See [`RIGHTS.md`](RIGHTS.md). Availability of source code in this repository
does not by itself define a reuse license.

## Author

Sid J.A. Hubbard
