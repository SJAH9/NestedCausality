#!/usr/bin/env python3
"""
Enclosure Game with Nash Equilibrium of Infinite Depth and Scale
================================================================
Nested Causal Modelling × Game Theory (Hubbard 2026)

Ordinary Nash is defined inside one fixed game Γ.
Here the game is an unbounded nested stack:

    G = [ G_{n+1} | σ_n | G_{n-1} ]     for all n ∈ ℤ

Descriptive depth and scale are infinite.
Computation halts at a stated Final Frontier truncation; the equilibrium
concept itself is defined as the continuum limit of finite truncations.

Definitions
-----------
Depth n ∈ ℤ
    n → +∞ : larger enclosures (scale-out / Final Frontier direction)
    n → −∞ : finer enclosures (scale-in / Zero Infinity direction)

Scale L ≥ 0
    coarser tier of the same nested structure (jitterbug / tier jump)

Local game at depth n
    Γ_n = (A, u_n) with action set A = {C, D}
    payoffs morph with depth so zero-sum-feeling traps can dissolve outward

Strategy (infinite object)
    s_i : ℤ → A
    plus optional enclosure-motion policy μ_i (stay / up / down)

Truncated Nash (computable)
    On window W_N = {-N, …, N}, with boundary conditions at ±N,
    a profile s is ε-Nash if no unilateral deviation raises total value by > ε.

Infinite-depth Nash
    s* is an infinite-depth Nash if for every N, the restriction s*|W_N
    is an ε_N-Nash of the truncated game with ε_N → 0 as N → ∞
    (uniform integrability of continuation values).

Infinite-scale Nash
    Stability also under scale jumps L → L±1: no player gains by
    reopening a sealed residual at another scale tier.

Enclosed Zero Infinity Nash (E_{0∞}^*)
    Special infinite-depth/scale Nash where:
      (1) active zero-sum enclosure has been escaped
      (2) opposing departures compact across a reference
      (3) return to zero-sum is not profitable
      (4) residual < reopen cost
      (5) escalation/de-escalation bounded by model Final Frontier

Compact notation (from NCM):
    E_{0∞}^* = [ [ff | -1 | ff]  |  VE  |  [ff | +1 | ff] ]
"""

from __future__ import annotations

import argparse
import json
import math
from dataclasses import dataclass, asdict, field
from enum import Enum
from typing import Callable, Dict, List, Optional, Tuple

Action = str  # "C" or "D"
Profile = Dict[int, Tuple[Action, Action]]  # depth -> (a_action, b_action)


# ---------------------------------------------------------------------------
# Local payoff morphisms across infinite depth
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class PayoffParams:
    """
    Base PD-like cell at depth 0; morphs continuously with depth.

    As n → +∞ (outer): mutual C surplus grows; temptation relative edge falls.
    As n → −∞ (inner): trap tightens (closer to pure zero-sum feel).
    """

    T0: float = 5.0
    R0: float = 3.0
    P0: float = 1.0
    S0: float = 0.0
    # outer morph rates
    outer_coop_gain: float = 0.35
    outer_tempt_decay: float = 0.12
    # inner morph rates
    inner_trap: float = 0.08


def payoffs_at(n: int, p: PayoffParams = PayoffParams()) -> Dict[str, Dict[str, Tuple[float, float]]]:
    """Return 2x2 payoffs (uA, uB) at enclosure depth n ∈ ℤ."""
    if n >= 0:
        # Outer: shared project value rises; defect temptation softens
        R = p.R0 + p.outer_coop_gain * n
        T = p.T0 + 0.05 * n - p.outer_tempt_decay * n
        P = p.P0 - 0.05 * n
        S = p.S0 + 0.02 * n
        # keep order soft; at large n, R can exceed T → Stag-like
        T = max(T, P + 0.01)
    else:
        m = -n
        # Inner: tighter trap, more zero-sum feeling
        R = p.R0 - 0.05 * m
        T = p.T0 + p.inner_trap * m
        P = p.P0
        S = p.S0 - 0.02 * m
        R = max(R, P + 0.01)

    return {
        "C": {"C": (R, R), "D": (S, T)},
        "D": {"C": (T, S), "D": (P, P)},
    }


def local_best_responses(
    n: int, opp: Action, p: PayoffParams = PayoffParams()
) -> List[Action]:
    mat = payoffs_at(n, p)
    u_c = mat["C"][opp][0]
    u_d = mat["D"][opp][0]
    if abs(u_c - u_d) < 1e-12:
        return ["C", "D"]
    return ["C"] if u_c > u_d else ["D"]


def pure_nash_at_depth(n: int, p: PayoffParams = PayoffParams()) -> List[Tuple[Action, Action]]:
    eqs = []
    for a in ("C", "D"):
        for b in ("C", "D"):
            if a in local_best_responses(n, b, p) and b in local_best_responses(n, a, p):
                eqs.append((a, b))
    return eqs


def depth_where_coop_is_nash(p: PayoffParams = PayoffParams(), max_n: int = 200) -> Optional[int]:
    """Smallest n ≥ 0 at which (C,C) is a pure Nash of Γ_n."""
    for n in range(0, max_n + 1):
        if ("C", "C") in pure_nash_at_depth(n, p):
            return n
    return None


# ---------------------------------------------------------------------------
# Truncated enclosure game on W_N = {-N,...,N}
# ---------------------------------------------------------------------------

@dataclass
class Truncation:
    """Finite computational window approximating infinite depth."""

    N: int  # half-width; depths in [-N, N]
    scale_L: int = 0  # scale tier
    discount: float = 0.85  # weight decay away from active depth 0 (integrable tail)
    reopen_cost: float = 4.0
    residual_capacity: float = 1.0
    final_frontier: int = 50  # absolute computational halt |n| or L

    def window(self) -> List[int]:
        return list(range(-self.N, self.N + 1))

    def weight(self, n: int) -> float:
        """Integrable depth weight so infinite sum converges."""
        return self.discount ** abs(n)

    def scale_factor(self) -> float:
        # mild scale boost; sealed equilibria stable across nearby L
        return 1.0 + 0.05 * self.scale_L


def value_of_profile(
    profile: Profile,
    player: int,
    trunc: Truncation,
    p: PayoffParams = PayoffParams(),
) -> float:
    """
    Total value for player across all depths in the truncation.
    player: 0 for A, 1 for B.
    """
    total = 0.0
    sf = trunc.scale_factor()
    for n in trunc.window():
        a, b = profile[n]
        ua, ub = payoffs_at(n, p)[a][b]
        pay = ua if player == 0 else ub
        total += trunc.weight(n) * sf * pay
    return total


def unilateral_deviation_gain(
    profile: Profile,
    player: int,
    trunc: Truncation,
    p: PayoffParams = PayoffParams(),
) -> Tuple[float, Optional[int], Optional[Action]]:
    """
    Max gain from changing action at a single depth (one-shot deviation at depth).
    Returns (max_gain, best_depth, best_action).
    """
    base = value_of_profile(profile, player, trunc, p)
    best_gain = 0.0
    best_n: Optional[int] = None
    best_act: Optional[Action] = None
    for n in trunc.window():
        a, b = profile[n]
        cur = a if player == 0 else b
        for alt in ("C", "D"):
            if alt == cur:
                continue
            dev = dict(profile)
            if player == 0:
                dev[n] = (alt, b)
            else:
                dev[n] = (a, alt)
            gain = value_of_profile(dev, player, trunc, p) - base
            if gain > best_gain + 1e-12:
                best_gain = gain
                best_n = n
                best_act = alt
    return best_gain, best_n, best_act


def is_epsilon_nash(
    profile: Profile,
    trunc: Truncation,
    eps: float = 1e-9,
    p: PayoffParams = PayoffParams(),
) -> Tuple[bool, float, float]:
    """Check ε-Nash: max unilateral single-depth deviation gain ≤ eps for both."""
    g0, _, _ = unilateral_deviation_gain(profile, 0, trunc, p)
    g1, _, _ = unilateral_deviation_gain(profile, 1, trunc, p)
    return (g0 <= eps and g1 <= eps), g0, g1


# ---------------------------------------------------------------------------
# Candidate infinite objects (strategy patterns across ℤ)
# ---------------------------------------------------------------------------

class StrategyPattern(str, Enum):
    ALWAYS_DEFECT = "always_defect"       # s(n)=D for all n  — classic trap extended
    ALWAYS_COOP = "always_coop"           # s(n)=C for all n  — may not be Nash near 0
    THRESHOLD_COOP = "threshold_coop"     # D for n < n*, C for n ≥ n*
    INNER_DEFECT_OUTER_COOP = "inner_d_outer_c"
    ZERO_INFINITY_SEAL = "zero_infinity_seal"  # sealed E_{0∞}^* pattern


def materialize_pattern(
    pattern: StrategyPattern,
    trunc: Truncation,
    p: PayoffParams = PayoffParams(),
    n_star: Optional[int] = None,
) -> Profile:
    """
    Instantiate an infinite strategy pattern on the truncation window.
    Both players use the same pattern (symmetric candidates for E_{0∞}^*).
    """
    if n_star is None:
        n_star = depth_where_coop_is_nash(p) or 3

    profile: Profile = {}
    for n in trunc.window():
        if pattern == StrategyPattern.ALWAYS_DEFECT:
            act: Action = "D"
        elif pattern == StrategyPattern.ALWAYS_COOP:
            act = "C"
        elif pattern == StrategyPattern.THRESHOLD_COOP:
            act = "C" if n >= n_star else "D"
        elif pattern == StrategyPattern.INNER_DEFECT_OUTER_COOP:
            act = "C" if n >= 0 else "D"
        elif pattern == StrategyPattern.ZERO_INFINITY_SEAL:
            # Sealed: cooperate everywhere that (C,C) is self-enforcing or outer;
            # defect only in deep inner trap where D remains dominant — but pair
            # residual as compact: at n>=n_star play C; for n < n_star play C
            # if |n| small after seal... Full seal: C on all n ≥ n_star - k
            # Canonical seal: C for all n ≥ n_seal, D deep inner only if forced
            n_seal = max(0, n_star)
            act = "C" if n >= n_seal else "D"
        else:
            act = "D"
        profile[n] = (act, act)
    return profile


def build_asymmetric(
    pattern_a: StrategyPattern,
    pattern_b: StrategyPattern,
    trunc: Truncation,
    p: PayoffParams = PayoffParams(),
) -> Profile:
    pa = materialize_pattern(pattern_a, trunc, p)
    pb = materialize_pattern(pattern_b, trunc, p)
    return {n: (pa[n][0], pb[n][1]) for n in trunc.window()}


# ---------------------------------------------------------------------------
# Continuum / infinite-depth diagnostic
# ---------------------------------------------------------------------------

@dataclass
class InfiniteNashReport:
    pattern: str
    N: int
    scale_L: int
    is_eps_nash: bool
    eps_used: float
    gain_A: float
    gain_B: float
    value_A: float
    value_B: float
    joint: float
    n_star_coop_nash: Optional[int]
    residual_proxy: float
    reopen_profitable: bool
    sealed_zero_infinity: bool
    local_nash_by_depth: Dict[str, List[str]]
    note: str


def residual_proxy(
    profile: Profile,
    trunc: Truncation,
    p: PayoffParams = PayoffParams(),
) -> float:
    """
    Managed conflict residual: weighted mass of play that is *not* a pure
    Nash cell of Γ_n. Structural (D,D) on inner depths where DD is Nash
    is not residual conflict — it is the lawful local trap description.
    Residual is the part that is still unstable / off-equilibrium.
    """
    r = 0.0
    for n in trunc.window():
        a, b = profile[n]
        eqs = pure_nash_at_depth(n, p)
        if (a, b) not in eqs:
            pen = 1.0 if a != b else 0.75
            r += trunc.weight(n) * pen
    return r


def reopen_gain_if_force_depth0_defect(
    profile: Profile, trunc: Truncation, p: PayoffParams
) -> float:
    """Gain to A from forcing (D,D) at depth 0 (reopen local zero-sum)."""
    base = value_of_profile(profile, 0, trunc, p)
    dev = dict(profile)
    dev[0] = ("D", profile[0][1])
    return value_of_profile(dev, 0, trunc, p) - base


def evaluate_pattern(
    pattern: StrategyPattern,
    N: int,
    scale_L: int = 0,
    eps: float = 1e-9,
    p: PayoffParams = PayoffParams(),
    reopen_cost: float = 4.0,
) -> InfiniteNashReport:
    trunc = Truncation(N=N, scale_L=scale_L, reopen_cost=reopen_cost)
    n_star = depth_where_coop_is_nash(p)
    profile = materialize_pattern(pattern, trunc, p, n_star=n_star)
    ok, g0, g1 = is_epsilon_nash(profile, trunc, eps=eps, p=p)
    va = value_of_profile(profile, 0, trunc, p)
    vb = value_of_profile(profile, 1, trunc, p)
    res = residual_proxy(profile, trunc, p)
    reopen = reopen_gain_if_force_depth0_defect(profile, trunc, p)
    reopen_profitable = reopen >= reopen_cost
    # Outer seal: (C,C) on all n ≥ n* (coop region of infinite stack)
    outer_cc = all(
        profile[n] == ("C", "C")
        for n in trunc.window()
        if n >= (n_star or 0)
    )
    # Inner lawful trap: on n < n*, play is a pure Nash of Γ_n (usually DD)
    inner_lawful = all(
        profile[n] in pure_nash_at_depth(n, p)
        for n in trunc.window()
        if n < (n_star or 0)
    )
    # E_{0∞}^* on truncation: ε-Nash + zero off-eq residual + outer CC +
    # unprofitable reopen + inner play locally Nash
    sealed = (
        ok
        and res < trunc.residual_capacity + 1e-9
        and reopen < reopen_cost
        and outer_cc
        and inner_lawful
        and pattern
        in (
            StrategyPattern.ZERO_INFINITY_SEAL,
            StrategyPattern.THRESHOLD_COOP,
        )
    )

    local = {}
    for n in trunc.window():
        if abs(n) <= min(5, N):  # sample near core for report
            local[str(n)] = [f"{a}{b}" for a, b in pure_nash_at_depth(n, p)]

    note = []
    if ok:
        note.append("ε-Nash on truncation")
    else:
        note.append(f"not ε-Nash (gain A={g0:.4f}, B={g1:.4f})")
    if sealed:
        note.append("Enclosed Zero Infinity Nash candidate on this window")
    if reopen >= reopen_cost:
        note.append("reopen of depth-0 zero-sum still tempting")

    return InfiniteNashReport(
        pattern=pattern.value,
        N=N,
        scale_L=scale_L,
        is_eps_nash=ok,
        eps_used=eps,
        gain_A=round(g0, 6),
        gain_B=round(g1, 6),
        value_A=round(va, 6),
        value_B=round(vb, 6),
        joint=round(va + vb, 6),
        n_star_coop_nash=n_star,
        residual_proxy=round(res, 6),
        reopen_profitable=reopen >= reopen_cost,
        sealed_zero_infinity=sealed,
        local_nash_by_depth=local,
        note="; ".join(note),
    )


def continuum_limit_scan(
    pattern: StrategyPattern,
    N_values: List[int],
    p: PayoffParams = PayoffParams(),
    eps: float = 1e-9,
) -> List[InfiniteNashReport]:
    """Evaluate pattern on increasing truncations → continuum diagnostic."""
    return [evaluate_pattern(pattern, N=N, p=p, eps=eps) for N in N_values]


def scale_stability_scan(
    pattern: StrategyPattern,
    N: int,
    L_values: List[int],
    p: PayoffParams = PayoffParams(),
) -> List[InfiniteNashReport]:
    return [evaluate_pattern(pattern, N=N, scale_L=L, p=p) for L in L_values]


def find_infinite_depth_nash_candidates(
    N: int = 20,
    p: PayoffParams = PayoffParams(),
) -> List[InfiniteNashReport]:
    reports = []
    for pat in StrategyPattern:
        reports.append(evaluate_pattern(pat, N=N, p=p))
    return reports


# ---------------------------------------------------------------------------
# Dynamic play: climb depth until sealed infinite Nash region
# ---------------------------------------------------------------------------

@dataclass
class DynamicState:
    depth: int = 0
    scale_L: int = 0
    residual: float = 0.0
    sealed: bool = False
    history: List[dict] = field(default_factory=list)


def dynamic_enclosure_run(
    rounds: int = 30,
    p: PayoffParams = PayoffParams(),
    reopen_cost: float = 4.0,
    final_frontier: int = 20,
    policy: str = "ncm_seal",
) -> dict:
    """
    Active play starting at depth 0.
    NCM seal policy: cooperate; escalate while (C,C) not Nash; compact when outer Nash.
    Defect policy: always D at current depth (trap).
    """
    n_star = depth_where_coop_is_nash(p) or 3
    st = DynamicState()
    score_a = score_b = 0.0

    for r in range(1, rounds + 1):
        if st.sealed and st.residual < reopen_cost:
            mat = payoffs_at(st.depth, p)
            ua, ub = mat["C"]["C"]
            score_a += ua
            score_b += ub
            st.history.append(
                {
                    "round": r,
                    "depth": st.depth,
                    "scale": st.scale_L,
                    "action": ("HOLD", "HOLD"),
                    "pay": (ua, ub),
                    "residual": st.residual,
                    "note": "E_{0∞}^* hold — infinite-depth Nash region active",
                }
            )
            continue

        if policy == "always_defect":
            aa = bb = "D"
            note = "mutual defect inside current enclosure"
        elif policy == "ncm_seal":
            eqs = pure_nash_at_depth(st.depth, p)
            if ("C", "C") in eqs and st.depth >= n_star:
                aa = bb = "C"
                note = "outer coop Nash — compactify residual"
                st.residual = max(0.0, st.residual - 1.0)
                if st.residual < reopen_cost:
                    st.sealed = True
                    note += "; seal E_{0∞}^*"
            elif st.depth < final_frontier and ("C", "C") not in eqs:
                # escalate depth (infinite stack direction +)
                st.depth += 1
                aa = bb = "C"
                note = f"escalate toward infinite outer stack → n={st.depth}"
            else:
                aa = bb = "C"
                note = "cooperate at current depth"
        else:
            aa = bb = "C"
            note = "default coop"

        mat = payoffs_at(st.depth, p)
        ua, ub = mat[aa][bb]
        score_a += ua
        score_b += ub
        if (aa, bb) == ("D", "D"):
            st.residual += 1.0
        elif (aa, bb) == ("C", "C"):
            st.residual = max(0.0, st.residual - 0.25)
        else:
            st.residual += 0.5

        st.history.append(
            {
                "round": r,
                "depth": st.depth,
                "scale": st.scale_L,
                "action": (aa, bb),
                "pay": (ua, ub),
                "residual": round(st.residual, 3),
                "note": note,
                "local_nash": [f"{x}{y}" for x, y in pure_nash_at_depth(st.depth, p)],
            }
        )

    return {
        "policy": policy,
        "n_star": n_star,
        "final_depth": st.depth,
        "scale_L": st.scale_L,
        "sealed": st.sealed,
        "residual": st.residual,
        "score_a": round(score_a, 4),
        "score_b": round(score_b, 4),
        "joint": round(score_a + score_b, 4),
        "history": st.history,
    }


# ---------------------------------------------------------------------------
# Reporting
# ---------------------------------------------------------------------------

def print_theory() -> None:
    print("=" * 72)
    print("  ENCLOSURE GAME — NASH OF INFINITE DEPTH AND SCALE")
    print("  Nested Causal Modelling × Game Theory")
    print("=" * 72)
    print()
    print("Game object (unbounded nesting):")
    print("  G = [ G_{n+1} | σ_n | G_{n-1} ]   for all n ∈ ℤ")
    print("  n → +∞  outer enclosures (Final Frontier direction)")
    print("  n → −∞  inner enclosures (Zero Infinity direction)")
    print("  L ≥ 0   scale tier")
    print()
    print("Ordinary Nash:     best response inside one fixed Γ")
    print("Infinite-depth Nash: restriction to every window W_N is ε_N-Nash")
    print("                     with ε_N → 0 as N → ∞")
    print("Infinite-scale Nash: also stable under L → L±1")
    print("E_{0∞}^* :          sealed Zero Infinity Nash (compact residual)")
    print()
    print("Computation: truncate to W_N = {-N..N}; halt at Final Frontier.")
    print("Ontology: descriptive depth remains unbounded.")
    print()


def print_depth_morph(p: PayoffParams, depths: List[int]) -> None:
    print("-" * 72)
    print("Local games Γ_n and pure Nash (sample of infinite stack)")
    print("-" * 72)
    for n in depths:
        mat = payoffs_at(n, p)
        eqs = pure_nash_at_depth(n, p)
        print(
            f"  n={n:+3d}  CC={mat['C']['C']}  CD={mat['C']['D']}  "
            f"DC={mat['D']['C']}  DD={mat['D']['D']}  "
            f"Nash={{{', '.join(a+b for a,b in eqs)}}}"
        )
    n_star = depth_where_coop_is_nash(p)
    print(f"\n  n* = min {{ n ≥ 0 : (C,C) ∈ Nash(Γ_n) }} = {n_star}")
    print()


def run_experiment(
    N: int = 15,
    rounds: int = 25,
    seed: int = 42,
) -> dict:
    p = PayoffParams()
    print_theory()
    sample_depths = list(range(-5, 12))
    print_depth_morph(p, sample_depths)

    print("=" * 72)
    print(f"PART 1 — Pattern evaluation on truncation W_{N}={{{-N}..{N}}}")
    print("=" * 72)
    print()
    candidates = find_infinite_depth_nash_candidates(N=N, p=p)
    for rep in candidates:
        print(f"  [{rep.pattern}]")
        print(
            f"    ε-Nash={rep.is_eps_nash}  gains (A,B)=({rep.gain_A},{rep.gain_B})"
        )
        print(
            f"    values (A,B)=({rep.value_A},{rep.value_B})  joint={rep.joint}"
        )
        print(
            f"    residual={rep.residual_proxy}  reopen_profitable={rep.reopen_profitable}  "
            f"sealed_E0∞={rep.sealed_zero_infinity}"
        )
        print(f"    {rep.note}")
        print()

    print("=" * 72)
    print("PART 2 — Continuum limit scan (N ↑) for key patterns")
    print("=" * 72)
    print()
    continuum = {}
    for pat in (
        StrategyPattern.ALWAYS_DEFECT,
        StrategyPattern.ALWAYS_COOP,
        StrategyPattern.THRESHOLD_COOP,
        StrategyPattern.ZERO_INFINITY_SEAL,
    ):
        rows = continuum_limit_scan(pat, N_values=[3, 6, 10, 15, 25], p=p)
        continuum[pat.value] = [asdict(r) for r in rows]
        flags = " ".join(
            f"N={r.N}:{'Y' if r.is_eps_nash else 'n'}" + ("*" if r.sealed_zero_infinity else "")
            for r in rows
        )
        print(f"  {pat.value:24s}  ε-Nash by N →  {flags}")
        print(f"    (Y=ε-Nash, *=E_{{0∞}}^* seal candidate)")
    print()

    print("=" * 72)
    print("PART 3 — Scale stability (L scan) for ZERO_INFINITY_SEAL")
    print("=" * 72)
    print()
    scale_rows = scale_stability_scan(
        StrategyPattern.ZERO_INFINITY_SEAL, N=N, L_values=[0, 1, 2, 5, 10], p=p
    )
    for r in scale_rows:
        print(
            f"  L={r.scale_L:2d}  ε-Nash={r.is_eps_nash}  joint={r.joint:.3f}  "
            f"residual={r.residual_proxy:.3f}  sealed={r.sealed_zero_infinity}"
        )
    print()

    print("=" * 72)
    print("PART 4 — Dynamic climb to infinite-depth Nash region")
    print("=" * 72)
    print()
    dyn_def = dynamic_enclosure_run(rounds=rounds, p=p, policy="always_defect")
    dyn_ncm = dynamic_enclosure_run(rounds=rounds, p=p, policy="ncm_seal")
    print(f"  always_defect: joint={dyn_def['joint']}  depth={dyn_def['final_depth']}  "
          f"sealed={dyn_def['sealed']}  residual={dyn_def['residual']}")
    print(f"  ncm_seal:      joint={dyn_ncm['joint']}  depth={dyn_ncm['final_depth']}  "
          f"sealed={dyn_ncm['sealed']}  residual={dyn_ncm['residual']}  n*={dyn_ncm['n_star']}")
    print()
    print("  ncm_seal path:")
    for h in dyn_ncm["history"][:12]:
        print(
            f"    R{h['round']:02d} n={h['depth']:+3d}  {h['action']}  "
            f"pay={h['pay']}  ρ={h['residual']}  Nash={h.get('local_nash')}  | {h['note']}"
        )
    if len(dyn_ncm["history"]) > 12:
        print(f"    ... ({len(dyn_ncm['history']) - 12} more rounds)")
    print()

    print("=" * 72)
    print("PART 5 — Theorem-form statement (operational)")
    print("=" * 72)
    print()
    n_star = depth_where_coop_is_nash(p)
    seal = evaluate_pattern(StrategyPattern.ZERO_INFINITY_SEAL, N=N, p=p)
    thr = evaluate_pattern(StrategyPattern.THRESHOLD_COOP, N=N, p=p)
    ad = evaluate_pattern(StrategyPattern.ALWAYS_DEFECT, N=N, p=p)
    print(f"  n* (first outer depth with (C,C) Nash) = {n_star}")
    print(f"  always_defect on W_N:     ε-Nash={ad.is_eps_nash}  joint={ad.joint}")
    print(f"  threshold_coop on W_N:    ε-Nash={thr.is_eps_nash}  joint={thr.joint}  sealed={thr.sealed_zero_infinity}")
    print(f"  zero_infinity_seal on W_N: ε-Nash={seal.is_eps_nash}  joint={seal.joint}  sealed={seal.sealed_zero_infinity}")
    print()
    print("  Claim (infinite depth):")
    print("    A strategy profile s: ℤ → A×A is an infinite-depth Nash if")
    print("    ∀N, s|W_N is ε_N-Nash of the truncated enclosure game and ε_N→0.")
    print()
    print("  Claim (infinite scale):")
    print("    s is infinite-scale Nash if the above holds for each scale L in a")
    print("    neighborhood and reopen gain across L is < reopen cost.")
    print()
    print("  Claim (E_{0∞}^*):")
    print("    The sealed pattern with (C,C) on all n ≥ n*, residual below capacity,")
    print("    and unprofitable return to depth-0 zero-sum is an Enclosed Zero")
    print("    Infinity Nash — a Nash of infinite depth and scale relative to the")
    print("    nested stack, computed on finite truncations with convergent tails.")
    print()
    print("Done.")

    return {
        "n_star": n_star,
        "candidates": [asdict(r) for r in candidates],
        "continuum": continuum,
        "scale_stability": [asdict(r) for r in scale_rows],
        "dynamic_defect": {k: v for k, v in dyn_def.items() if k != "history"},
        "dynamic_ncm": {k: v for k, v in dyn_ncm.items() if k != "history"},
        "dynamic_ncm_history": dyn_ncm["history"],
        "payoff_params": asdict(p),
    }


def main() -> None:
    ap = argparse.ArgumentParser(
        description="Enclosure Game with Nash of infinite depth and scale"
    )
    ap.add_argument("--N", type=int, default=15, help="truncation half-width")
    ap.add_argument("--rounds", type=int, default=25)
    ap.add_argument("--json-out", type=str, default="")
    args = ap.parse_args()
    data = run_experiment(N=args.N, rounds=args.rounds)
    if args.json_out:
        with open(args.json_out, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        print(f"Wrote {args.json_out}")


if __name__ == "__main__":
    main()
