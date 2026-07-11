# NestedCausality

The authoritative source for Nested Causal Modelling, the Departure Calculus, and the Continuum of Steady States. Open-source tools and instruments for exploring nested causality.

## Contents

| Path | Description |
|------|-------------|
| [`instruments/`](./instruments/) | Interactive instruments (e.g. quantized compactification) |
| [`Continuum Game Theory/`](./Continuum%20Game%20Theory/) | Enclosure-aware game theory: ternary paper, Enclosure Game simulator, and results |

### Continuum Game Theory

Implements the enclosure game from [Nested Causal Modelling and Game Theory](https://doi.org/10.5281/zenodo.21306704) (Zenodo). Nested **Prisoner's Dilemma**, **Chicken**, and **Stag Hunt** with escalate / de-escalate / compactify moves toward an Enclosed Zero Infinity Nash.

```bash
cd "Continuum Game Theory"
python3 enclosure_game.py --rounds 30 --seed 42
```

## Author

Sid J.A. Hubbard
