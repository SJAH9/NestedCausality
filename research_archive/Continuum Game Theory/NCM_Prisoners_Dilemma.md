# Prisoner's Dilemma as an NCM Game

Sid J.A. Hubbard  
Companion construction to *Nested Causal Modelling and Game Theory*  
DOI: [10.5281/zenodo.21306704](https://doi.org/10.5281/zenodo.21306704)

---

## 1. Purpose

This note constructs the **Prisoner's Dilemma (PD)** not only as a 2×2 payoff matrix, but as a **nested causal enclosure** — an NCM game.

Classical game theory solves:

```text
Given T > R > P > S, what is rational inside the matrix?
```

Nested Causal Modelling also asks:

```text
What enclosure made this matrix appear?
What outer enclosure could change the payoffs?
What lower enclosure absorbs excluded costs?
What residual remains after opposing departures compact?
```

---

## 2. Zero Infinity (reference condition)

Before the PD exists:

```text
No prisoners have been defined.
No charges have been filed.
No silence rule has been imposed.
No payoff matrix has been assigned.
No departure has been named.
```

Both game theory and NCM depart from this reference. Game theory departs by defining players, strategies, and payoffs. NCM departs by defining the enclosure that makes those definitions lawful.

---

## 3. Game-formation enclosure

Per Construction Three of the ternary paper:

```text
[ NCM  |  Game-Formation Enclosure  |  Game Theory ]
```

For the PD, the formation layer answers:

| Formation question | PD answer |
|--------------------|-----------|
| Who is a player? | Two prisoners (A, B) |
| What is a strategy? | C = remain silent / cooperate; D = confess / defect |
| What is a payoff? | T (temptation), R (reward), P (punishment), S (sucker) with **T > R > P > S** and **2R > T+S** |
| What information? | No communication; simultaneous choice; common knowledge of the matrix |
| What time horizon? | One-shot at E₀; open if enclosure moves are allowed |
| What is excluded? | Reputation, third-party harm, future alliance value, institutional trust, interrogator incentives |
| What boundary? | Interrogation / local temptation enclosure |

Only after this layer is fixed does classical PD game theory receive a well-formed game.

---

## 4. Ternary system

The active NCM system is:

```text
Ψ_n = [ Ψ_{n+1}  |  σ_n  |  Ψ_{n-1} ]
```

For the PD departure `σ_pd`:

```text
Ψ_n = [
  outer enclosure (legal system / society / shared project)
  |
  σ_pd ∈ {C, D} × {C, D}
  |
  inner enclosure (individual sentence / private cost)
]
```

At depth 0:

```text
[ legal / interrogator frame  |  σ_pd  |  individual fate ]
```

---

## 5. Enclosure stack around σ_pd

| Depth | Name | Role |
|------:|------|------|
| **E₀** | Local PD | Classic interrogation matrix; defect dominates |
| **E₁** | Repeated society | Shadow of the future; reputation; institutions |
| **E₂** | Shared project | Compactification zone; mutual C becomes strongly attractive |

NCM does not erase the PD at E₀. It **nests** it. Effective payoffs can change with depth because excluded costs re-enter the boundary audit.

---

## 6. Canonical E₀ matrix

| | B: C | B: D |
|--|-----:|-----:|
| **A: C** | R, R | S, T |
| **A: D** | T, S | P, P |

Default numeric: `T=5, R=3, P=1, S=0`.

Pure Nash at E₀: **(D, D)** — the classic trap.

Pareto improvement: **(C, C)** — unstable under unilateral deviation inside E₀.

---

## 7. Moves of the NCM-PD game

| Move | Name | NCM meaning |
|------|------|-------------|
| **C** | Cooperate | Remain silent; open to mutual reward |
| **D** | Defect | Confess / exploit |
| **AWARE** | Enclosure awareness | Inspect what larger system contains this PD (Rule 1) |
| **ESC** | Escalate | Move conflict to Eₙ₊₁ |
| **DE** | De-escalate | Localize to Eₙ₋₁ |
| **CMP** | Compactify | Pair opposing departures across a larger reference (E₂) |

Classical PD uses only **C** and **D**.  
The NCM game adds enclosure moves so the purpose is not to win the interrogation, but to **escape the enclosure lawfully**.

---

## 8. Rules (from the NCM Game appendix, specialized to PD)

1. **Enclosure awareness** — Ask what larger system contains this PD.  
2. **Escalation** — Widen the game; may recreate PD at larger scale if both climb without reframing.  
3. **De-escalation** — Localize; may recreate PD at smaller scale.  
4. **Greatest span** — The player who sees E₀…E₂ sees more moves than win/lose inside the cell.  
5. **Asymmetric nesting** — One player changes depth without the other; breaks shared-boundary zero-sum feeling.  
6. **Compactification** — Opposing departures cancel across a larger reference; residual remains to govern.

---

## 9. Enclosed Zero Infinity Nash

Ordinary Nash: no unilateral deviation improves payoff **inside the fixed matrix**.

Enclosed Zero Infinity Nash (NCM-PD):

1. Players have left the active mutual-defection trap of E₀.  
2. Opposing departures have been paired at a larger reference (E₂).  
3. Neither benefits by reopening the pure E₀ zero-sum frame.  
4. Residual conflict is below reopen cost.  
5. Shared project payoffs continue under the sealed enclosure.

```text
gain(return to E₀ zero-sum) < cost(reopening conflict)
residual < managed_boundary_capacity
```

---

## 10. Diagnostic

Adapted from NCM formalization:

```text
risk increases when depth(σ_pd) > depth(oversight)
```

- `depth(σ_pd)` — how deep the conflict departure has nested  
- `depth(oversight)` — awareness + outer institutional / relational stability  

Mutual defection at E₀ with zero awareness is maximum local risk.  
Mutual compactification at E₂ with residual below reopen cost is sealed.

---

## 11. Runnable instrument

```bash
python3 ncm_prisoners_dilemma.py --rounds 20 --seed 42
python3 ncm_prisoners_dilemma.py --json-out ncm_prisoners_dilemma_results.json
```

The simulator compares:

- **Part A:** classic PD (enclosure moves off)  
- **Part B:** NCM-PD (AWARE / ESC / CMP on)  
- **Part C:** full walkthrough of two NCM-aware prisoners  

---

## 12. Core claim

> The Prisoner's Dilemma's dominant-strategy Nash is an equilibrium **inside** enclosure E₀.  
> It is not the Final Frontier of the conflict.  
> Escape is not winning the interrogation.  
> Escape is changing the enclosure in which `σ_pd` is scored.

We begin.
