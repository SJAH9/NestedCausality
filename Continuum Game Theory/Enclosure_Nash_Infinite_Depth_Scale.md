# Enclosure Game with Nash Equilibrium of Infinite Depth and Scale

Sid J.A. Hubbard  
Companion to *Nested Causal Modelling and Game Theory*  
DOI: [10.5281/zenodo.21306704](https://doi.org/10.5281/zenodo.21306704)

---

## 1. The problem with one-game Nash

Ordinary Nash equilibrium is defined **inside one fixed game** Γ:

```text
s* is Nash  ⇔  ∀i,  u_i(s_i*, s_{-i}*) ≥ u_i(s_i, s_{-i}*)  for all s_i
```

Nested Causal Modelling denies that the active strategic system is one fixed Γ. The lawful object is a nested stack of unbounded descriptive depth:

```text
G = [ G_{n+1} | σ_n | G_{n-1} ]    for all n ∈ ℤ
```

- `n → +∞` — outer enclosures (Final Frontier direction)  
- `n → −∞` — inner enclosures (Zero Infinity direction)  
- `L ≥ 0` — scale tier  

The equilibrium concept must therefore be a **Nash of infinite depth and scale**, not a single-matrix Nash.

---

## 2. Local games along the infinite stack

At each depth `n` there is a local game `Γ_n = (A, u_n)` with `A = {C, D}`.

Payoffs **morph with depth**:

- Toward the inner stack, the trap tightens (zero-sum feeling).  
- Toward the outer stack, mutual cooperation surplus rises and temptation softens.  

There exists a critical outer depth:

```text
n* = min { n ≥ 0 : (C,C) ∈ Nash(Γ_n) }
```

In the reference parameterization of the instrument, **n\* = 5**: below that only `(D,D)` is pure Nash; from `n*` upward both `(C,C)` and `(D,D)` can be pure Nash (coordination / stag-like outer region).

---

## 3. Strategies as infinite objects

A pure strategy for player `i` is a map on the whole integer stack:

```text
s_i : ℤ → A
```

A profile is `s = (s_A, s_B)`.

This is an **infinite object**. Computation never materializes all of ℤ. It materializes **truncations**.

---

## 4. Truncation and continuum limit

### Truncated window

```text
W_N = { -N, -N+1, …, N }
```

Depth weights are integrable so the tail vanishes:

```text
w(n) = δ^{|n|} ,   0 < δ < 1
```

Total value for player `i` on the truncation:

```text
V_i^N(s) = Σ_{n ∈ W_N}  w(n) · λ(L) · u_n,i( s_A(n), s_B(n) )
```

where `λ(L)` is a mild scale factor.

### ε-Nash on W_N

`s` is an **ε-Nash of the truncated enclosure game** if no unilateral change of action at a single depth raises `V_i^N` by more than `ε`.

### Infinite-depth Nash

```text
s* is an infinite-depth Nash
  ⇔  ∀N,  s*|W_N is an ε_N-Nash of the truncated game
     and ε_N → 0 as N → ∞
```

(With integrable weights, single-depth deviations have vanishing far-tail value.)

### Infinite-scale Nash

`s*` is an **infinite-scale Nash** if the infinite-depth property holds for each scale `L` in a neighborhood, and the gain from reopening a sealed local zero-sum across scale is less than reopen cost.

---

## 5. Enclosed Zero Infinity Nash — E_{0∞}^*

From the NCM Game appendix, specialized to the infinite stack:

`s*` is an **Enclosed Zero Infinity Nash** when, on every large truncation:

1. Off-equilibrium residual is below managed capacity  
   (play at each `n` is a pure Nash cell of `Γ_n`).  
2. On all outer depths `n ≥ n*`, play is `(C,C)`.  
3. On inner depths `n < n*`, play is the lawful local trap (typically `(D,D)`).  
4. Unilateral return to depth-0 zero-sum is not profitable relative to reopen cost.  
5. Escalation and de-escalation remain inside the model Final Frontier.

Compact notation:

```text
E_{0∞}^* =
[
  [ff | -1 | ff]
  |
  VE
  |
  [ff | +1 | ff]
]
```

Stability:

```text
gain(return_to_zero_sum) < cost(reopening_conflict)
residual_off_equilibrium < managed_boundary_capacity
```

---

## 6. Canonical infinite strategy: threshold seal

```text
s*(n) = D   if n < n*
s*(n) = C   if n ≥ n*
```

(both players)

| Region | Play | Why Nash-local |
|--------|------|----------------|
| `n < n*` | `(D,D)` | unique pure Nash of tight trap |
| `n ≥ n*` | `(C,C)` | pure Nash of outer coop region |

This profile is the operational **Nash of infinite depth**: it is ε-Nash on every tested window `W_N` with ε = 0 in the instrument, and remains so as `N → ∞`.

Always-defect is **not** infinite-depth Nash: for large outer `n`, best response to `D` eventually leaves `(D,D)`.

Always-cooperate is **not** infinite-depth Nash: at depth 0, temptation makes `D` a profitable deviation.

---

## 7. Instrument results (reference run)

```bash
python3 enclosure_nash_infinite.py --N 15 --rounds 25
```

| Pattern | ε-Nash on W_15 | Continuum (N↑) | Notes |
|---------|----------------|----------------|-------|
| always_defect | no (large N) | fails as N grows | outer stack abandons DD |
| always_coop | no | never | depth-0 temptation |
| threshold_coop | **yes** | **yes all N** | infinite-depth Nash |
| zero_infinity_seal | **yes** | **yes all N** | same threshold form |

**Dynamic climb (ncm_seal policy):**

```text
depth 0 → 1 → 2 → 3 → 4 → 5 (= n*)
seal E_{0∞}^* at n*
HOLD in infinite-depth Nash region
joint surplus ≫ mutual defect at depth 0
```

**Scale scan:** threshold/seal remains ε-Nash across `L ∈ {0,1,2,5,10}`.

---

## 8. What “infinite” means (and does not)

| Says | Does not say |
|------|----------------|
| Descriptive nesting is unbounded | Every simulation runs forever |
| Equilibrium is defined as continuum limit of truncations | Closed form for all payoff morphisms |
| Final Frontier is a computational halt | Ontological end of nesting |
| E_{0∞}^* seals residual conflict | All human conflict vanishes |

From the ternary paper §6: the model may represent unbounded descriptive depth while **halting computation at a stated boundary**.

---

## 9. Core claim

> A player does not escape a zero-sum enclosure by winning its local Nash.  
> A player escapes by reaching the region of the infinite stack where that zero-sum was only a local description — and sealing residual so reopening is not rational.  
> That sealed profile is a **Nash equilibrium of infinite depth and scale**.

We begin.
