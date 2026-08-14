# Continuum Game Theory

**Enclosure-aware strategic modelling** from Nested Causal Modelling (NCM).

This folder implements Construction One of the ternary enclosure experiment: NCM expressed as a game in which players do not only choose strategies inside a fixed payoff matrix, but move across nested scales, alter the effective game, and seek escape from zero-sum enclosures.

## Primary paper

**Nested Causal Modelling and Game Theory: A Ternary Enclosure Experiment in Strategic Prediction**  
Sid J.A. Hubbard · July 2026

| Resource | Link |
|----------|------|
| Zenodo (v2) | https://zenodo.org/records/21306704 |
| DOI | https://doi.org/10.5281/zenodo.21306704 |
| Markdown | [`NCM_Game_Theory_Ternary_Enclosure_Paper.md`](./NCM_Game_Theory_Ternary_Enclosure_Paper.md) |
| PDF | [`NCM_Game_Theory_Ternary_Enclosure_Paper.pdf`](./NCM_Game_Theory_Ternary_Enclosure_Paper.pdf) |

## The Enclosure Game (simulation)

Three iconic games of game theory are stacked as nested enclosures:

| Depth | Game | Structure |
|------:|------|-----------|
| **G₀** | Prisoner's Dilemma | `T > R > P > S` — defect-dominant trap |
| **G₁** | Chicken (Hawk–Dove) | `T > R > S > P` — mutual crash worst |
| **G₂** | Stag Hunt | `R > T > P > S` — mutual coop best, risky |

**Moves:** Cooperate · Defect · Escalate · De-escalate · Compactify  

**Target:** Enclosed Zero Infinity Nash — residual conflict below the cost of reopening the zero-sum frame, while a shared project continues.

### Run

```bash
python3 enclosure_game.py --rounds 30 --seed 42
python3 enclosure_game.py --rounds 30 --seed 42 --json-out enclosure_game_results.json
```

Requires Python 3.10+ (stdlib only; no external packages).

### Reference simulation results (30 rounds, seed 42)

| Regime | Joint score |
|--------|------------:|
| PD mutual defect (classic Nash trap) | 60 |
| PD mutual TFT coop (local optimum) | 180 |
| Enclosure climb + compactify (NCM × NCM) | **292** |
| Surplus over PD TFT | **+112** |

Canonical path for two enclosure-aware players:

```text
R01–02  Prisoner's Dilemma  C/C    build trust
R03     Chicken             ESC    leave PD boundary
R04     Stag Hunt           ESC    enter shared project
R05     Stag Hunt           CMP    compactify + surplus
R06–30  HOLD at Stag        C/C    Zero Infinity Nash sealed
```

Full machine-readable results: [`enclosure_game_results.json`](./enclosure_game_results.json)

## Ternary constructions (from the paper)

```text
1. [Game Theory | translation | NCM]     → Enclosure Game
2. [Simulation Field | comparison | GT || NCM]
3. [NCM | Game-Formation Enclosure | Game Theory]
```

Game theory and NCM are not rivals. Game theory is strongest where players, strategies, payoffs, information, and equilibrium are well formed. NCM is strongest where the boundary of the game is unclear, the problem recurs across scale, or an outer enclosure changes the meaning of strategic action.

The hybrid is **enclosure-aware game theory**: not only *what should the player do?*, but *what game is the player trapped inside, what larger enclosure makes that game solvable, what lower enclosure carries excluded costs, and what boundary makes the equilibrium unstable?*

## Prisoner's Dilemma as an NCM Game

Dedicated construction of the classic PD inside Nested Causal Modelling:

| File | Role |
|------|------|
| [`NCM_Prisoners_Dilemma.md`](./NCM_Prisoners_Dilemma.md) | Formal NCM construction of the PD |
| [`ncm_prisoners_dilemma.py`](./ncm_prisoners_dilemma.py) | Runnable NCM-PD simulator |
| [`ncm_prisoners_dilemma_results.json`](./ncm_prisoners_dilemma_results.json) | Reference results |

```bash
python3 ncm_prisoners_dilemma.py --rounds 20 --seed 42
```

Core claim: the dominant-strategy Nash (D,D) is an equilibrium *inside* enclosure E₀ — not the Final Frontier of the conflict. Escape is changing the enclosure, not winning the interrogation.

## Files

| File | Role |
|------|------|
| `README.md` | This index |
| `NCM_Game_Theory_Ternary_Enclosure_Paper.md` | Paper (markdown) |
| `NCM_Game_Theory_Ternary_Enclosure_Paper.pdf` | Paper (PDF, Zenodo deposit) |
| `enclosure_game.py` | Runnable Enclosure Game simulator |
| `enclosure_game_results.json` | Default experiment output |
| `NCM_Prisoners_Dilemma.md` | Formal NCM construction of the Prisoner's Dilemma |
| `ncm_prisoners_dilemma.py` | Runnable NCM-PD simulation |
| `ncm_prisoners_dilemma_results.json` | Canonical NCM-PD output |
| `Enclosure_Nash_Infinite_Depth_Scale.md` | Infinite-depth and scale equilibrium definition |
| `enclosure_nash_infinite.py` | Finite-truncation and scale-stability simulation |
| `enclosure_nash_infinite_results.json` | Canonical infinite-depth simulation output |
| `zero_infinity_endless_game.py` | Deterministic nonterminal pursuit across depth and scale |
| `zero_infinity_endless_game_results.json` | Canonical finite observation of the endless game |
| `plot_zero_infinity_endless_game.py` | Dependency-free SVG renderer for the game trace |
| `zero_infinity_endless_game_plot.svg` | Enclosure plot of a 48-encounter prefix |

## Rights / attribution

Paper and instruments by Sid J.A. Hubbard. See the repository
[`RIGHTS.md`](../RIGHTS.md) and the relevant Zenodo record for controlling terms.

## Nash of Infinite Depth and Scale

Enclosure game whose equilibrium is defined on the unbounded nested stack
`G = [G_{n+1} | σ_n | G_{n-1}]` for all `n ∈ ℤ`, with continuum limit of finite truncations.

| File | Role |
|------|------|
| [`Enclosure_Nash_Infinite_Depth_Scale.md`](./Enclosure_Nash_Infinite_Depth_Scale.md) | Formal definition of infinite-depth/scale Nash and E_{0∞}^* |
| [`enclosure_nash_infinite.py`](./enclosure_nash_infinite.py) | Simulator: truncations, continuum scan, scale stability, dynamic seal |
| [`enclosure_nash_infinite_results.json`](./enclosure_nash_infinite_results.json) | Reference results |

```bash
python3 enclosure_nash_infinite.py --N 15 --rounds 25
```

Threshold seal: `s*(n)=D` for `n < n*`, `s*(n)=C` for `n ≥ n*` — ε-Nash on every window as `N → ∞`.

## Zero Infinity Nonterminal Game

This deterministic extension has no score, randomizer, winner, loser, or
terminal state. Players alternate seeking one another's exact depth and scale.
When their levels match and a victory condition is one event from maturity, the
defender escalates or de-escalates the enclosure. An expanding square-spiral
rule makes the depth-and-scale path unbounded in every direction.

```bash
python3 zero_infinity_endless_game.py --evasions 12
python3 zero_infinity_endless_game.py --stream
```

The first command produces a finite, invariant-checked observation. `--stream`
runs the infinite generator until the observer interrupts it.

To watch the same deterministic rules operate as a realtime enclosure network,
open the [Zero Infinity Network Game](../instruments/zero-infinity-network.html).
`SEEK` generates a temporary claim node, `MATCH` binds the pursuer to the
defender's level, and `EVADE` removes the claim while advancing the frontier.

Canonical 12-encounter observation:

| Property | Result |
|---|---:|
| Level matches | 12 |
| Last-moment evasions | 12 |
| Winner / loser | none / none |
| Player utility | 0 / 0 |
| Depth escalation / de-escalation | 4 / 2 |
| Scale escalation / de-escalation | 4 / 2 |
| Terminal transition | absent |

Full machine-readable observation:
[`zero_infinity_endless_game_results.json`](./zero_infinity_endless_game_results.json).

### Plot the enclosures

```bash
python3 plot_zero_infinity_endless_game.py --evasions 48
```

[Open the canonical enclosure plot.](./zero_infinity_endless_game_plot.svg)

The plot uses signed depth on the horizontal axis and signed scale on the
vertical axis. Nested square shells are enclosures around the `0∞` reference.
The gold spiral is the deterministic moving frontier. Teal and coral paths show
the players seeking one another's current level; white rings mark matches; the
dashed outer shell is the Final Frontier of the observed prefix. Increasing
`--evasions` expands that boundary. It never becomes a boundary of the game
itself.
