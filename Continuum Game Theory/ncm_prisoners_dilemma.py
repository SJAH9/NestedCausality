#!/usr/bin/env python3
"""
Prisoner's Dilemma as an NCM Game
=================================
Formal construction + simulation of the classic Prisoner's Dilemma
inside Nested Causal Modelling (Hubbard 2026).

Classic game theory asks: given fixed payoffs T > R > P > S, what is
rational inside the matrix?

NCM asks, in addition:
  What enclosure made this matrix appear?
  What outer enclosure could change the payoffs?
  What lower enclosure absorbs excluded costs?
  What residual remains after opposing departures compact?

Ternary form of the active system:

  Ψ_n = [ Ψ_{n+1}  |  σ_n  |  Ψ_{n-1} ]

For the PD:

  Ψ_0 = [
    legal_system / interrogator frame   (outer)
    |
    σ_choice ∈ {C, D}                   (departure)
    |
    individual sentence / fate          (inner)
  ]

Game-formation enclosure (Construction Three):

  [ NCM | players, strategies, payoffs, silence rule, boundary | Game Theory ]

Zero Infinity reference: no prisoners, no charges, no matrix yet defined.
Departure into PD: two players bound into the same active enclosure with
defection-dominant payoffs and no communication.

NCM moves beyond C/D:
  AWARE   — inspect the enclosing system (does not yet escape)
  ESC     — escalate to a larger enclosure (relationship, institution, shared project)
  DE      — de-escalate to a smaller repair enclosure
  CMP     — compactify opposing departures across a larger reference
"""

from __future__ import annotations

import argparse
import json
import random
from dataclasses import dataclass, asdict, field
from enum import Enum, IntEnum
from typing import Dict, List, Optional, Tuple


# ---------------------------------------------------------------------------
# 1. Game-formation layer (what makes the PD a well-formed game)
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class GameFormation:
    """Interstitial enclosure between NCM and classical game theory."""

    players: Tuple[str, str] = ("Prisoner A", "Prisoner B")
    strategies: Tuple[str, str] = ("C: remain silent / cooperate", "D: confess / defect")
    # Canonical PD: Temptation > Reward > Punishment > Sucker
    T: float = 5.0
    R: float = 3.0
    P: float = 1.0
    S: float = 0.0
    information: str = "No communication; simultaneous choice; common knowledge of payoffs"
    time_horizon: str = "One-shot at E_0; open-ended if enclosure moves allowed"
    excluded_costs: str = (
        "Reputation, third-party harm, future alliance value, "
        "institutional trust, and the interrogator's outer incentives"
    )
    boundary: str = "Interrogation / local temptation enclosure (E_0)"
    outer_candidate: str = "Legal system, repeated society, shared project (E_1+)"
    inner_candidate: str = "Individual sentence, family cost, self-model"

    def validate_pd_ordering(self) -> bool:
        return self.T > self.R > self.P > self.S and (2 * self.R) > (self.T + self.S)

    def matrix(self) -> Dict[str, Dict[str, Tuple[float, float]]]:
        return {
            "C": {"C": (self.R, self.R), "D": (self.S, self.T)},
            "D": {"C": (self.T, self.S), "D": (self.P, self.P)},
        }


# ---------------------------------------------------------------------------
# 2. Nested enclosures around the PD departure
# ---------------------------------------------------------------------------

class EnclosureDepth(IntEnum):
    """Nested causal stack around the PD conflict departure σ_pd."""

    E0_LOCAL_PD = 0          # classic interrogation / one-shot PD
    E1_REPEATED_SOCIETY = 1  # shadow of the future, reputation, institutions
    E2_SHARED_PROJECT = 2    # larger non-zero-sum reframing (compactification zone)


ENCLOSURE_LABEL = {
    EnclosureDepth.E0_LOCAL_PD: "E0 Local PD (interrogation / temptation)",
    EnclosureDepth.E1_REPEATED_SOCIETY: "E1 Repeated society (reputation / shadow of future)",
    EnclosureDepth.E2_SHARED_PROJECT: "E2 Shared project (compactification zone)",
}


# Payoff modifiers by enclosure: NCM changes the *effective* game without
# erasing the PD formation. Outer enclosures raise the value of mutual
# cooperation and the cost of mutual defection / betrayal residuals.
def effective_payoffs(depth: EnclosureDepth, formation: GameFormation) -> Dict[str, Dict[str, Tuple[float, float]]]:
    T, R, P, S = formation.T, formation.R, formation.P, formation.S
    if depth == EnclosureDepth.E0_LOCAL_PD:
        return formation.matrix()
    if depth == EnclosureDepth.E1_REPEATED_SOCIETY:
        # Future value δ folded into stage payoffs (effective repeated PD)
        delta = 0.6
        return {
            "C": {"C": (R + delta * R, R + delta * R), "D": (S, T + 0.2)},
            "D": {"C": (T + 0.2, S), "D": (P - 0.5, P - 0.5)},
        }
    # E2: shared project — mutual C dominates; mutual D still bad; temptation reduced
    return {
        "C": {"C": (R + 3.0, R + 3.0), "D": (S + 0.5, T - 1.0)},
        "D": {"C": (T - 1.0, S + 0.5), "D": (P - 1.0, P - 1.0)},
    }


def nash_pure_labels(matrix: Dict[str, Dict[str, Tuple[float, float]]]) -> List[str]:
    """Find pure Nash equilibria of a 2x2 C/D game."""
    eqs = []
    for a in ("C", "D"):
        for b in ("C", "D"):
            ua, ub = matrix[a][b]
            # A best response?
            other_a = "D" if a == "C" else "C"
            ua_dev, _ = matrix[other_a][b]
            # B best response?
            other_b = "D" if b == "C" else "C"
            _, ub_dev = matrix[a][other_b]
            if ua >= ua_dev and ub >= ub_dev:
                eqs.append(f"({a},{b})")
    return eqs


# ---------------------------------------------------------------------------
# 3. Moves of the NCM-PD game
# ---------------------------------------------------------------------------

class Move(str, Enum):
    C = "C"          # cooperate / remain silent
    D = "D"          # defect / confess
    AWARE = "AWARE"  # enclosure awareness (inspect outer map)
    ESC = "ESC"      # escalate enclosure
    DE = "DE"        # de-escalate enclosure
    CMP = "CMP"      # compactify residual at outer depth


class Strategy(str, Enum):
    CLASSIC_DEFECT = "classic_defect"       # pure GT: always D at E0
    CLASSIC_COOP = "classic_coop"           # always C (sucker if alone)
    TIT_FOR_TAT = "tit_for_tat"             # classical repeated-game heuristic
    NCM_AWARE = "ncm_aware"                 # full NCM rule stack
    HAWK = "hawk"                           # defect; escalate for leverage


@dataclass
class Agent:
    name: str
    strategy: Strategy
    score: float = 0.0
    awareness: int = 0          # times AWARE was used
    depth_span_min: int = 0
    depth_span_max: int = 0
    consecutive_mutual_d: int = 0
    consecutive_mutual_c: int = 0
    sucker_streak: int = 0  # we played C, opponent played D
    last_base: str = "C"

    def note_depth(self, d: int) -> None:
        self.depth_span_min = min(self.depth_span_min, d)
        self.depth_span_max = max(self.depth_span_max, d)


@dataclass
class RoundRecord:
    round: int
    depth: int
    enclosure: str
    a_move: str
    b_move: str
    a_base: str
    b_base: str
    a_pay: float
    b_pay: float
    residual: float
    oversight: float
    note: str
    ternary: str


@dataclass
class MatchResult:
    label: str
    formation: dict
    rounds: int
    strategy_a: str
    strategy_b: str
    score_a: float
    score_b: float
    joint: float
    final_depth: int
    final_enclosure: str
    residual: float
    compactified: bool
    mutual_c_rate: float
    mutual_d_rate: float
    classic_nash_cell_rate: float  # fraction of rounds scored as (D,D) at E0 matrix intent
    depth_path: List[int]
    log: List[RoundRecord] = field(default_factory=list)

    def summary(self) -> dict:
        d = asdict(self)
        d.pop("log", None)
        return d


# ---------------------------------------------------------------------------
# 4. NCM residual and oversight (paper diagnostic)
# ---------------------------------------------------------------------------

# Risk increases when depth(σ) > depth(oversight) — adapted from NCM formalization
REOPEN_COST = 4.0
COMPACT_BONUS = 2.0


def choose(
    agent: Agent,
    opp_last: Optional[str],
    depth: int,
    round_i: int,
    residual: float,
    rng: random.Random,
) -> Move:
    s = agent.strategy

    if s == Strategy.CLASSIC_DEFECT:
        return Move.D
    if s == Strategy.CLASSIC_COOP:
        return Move.C
    if s == Strategy.TIT_FOR_TAT:
        if opp_last is None:
            return Move.C
        return Move.C if opp_last == "C" else Move.D
    if s == Strategy.HAWK:
        if agent.consecutive_mutual_d >= 2 and depth < 2:
            return Move.ESC
        return Move.D

    # --- NCM-aware rule stack (NCM Game appendix Rules 1–6 applied to PD) ---
    # Rule 1: first inspect the enclosure if still blind at E0 under pressure
    if depth == 0 and agent.awareness == 0 and (
        opp_last == "D" or agent.consecutive_mutual_d >= 1
    ):
        return Move.AWARE

    # After awareness (or under repeated pressure): leave E0 rather than remain sucker
    if depth == 0 and opp_last == "D":
        if agent.awareness >= 1 or agent.consecutive_mutual_d >= 1:
            return Move.ESC  # asymmetric nesting — do not stay in exploitation cell
        return Move.AWARE

    # Escape mutual defection trap at E0
    if depth == 0 and agent.consecutive_mutual_d >= 1:
        return Move.ESC

    # Greatest span: after trust at E0, climb (PD coop is local; outer is better)
    if depth == 0 and agent.consecutive_mutual_c >= 2:
        return Move.ESC

    if depth == 1:
        if opp_last == "D":
            return Move.ESC  # climb again rather than accept E1 sucker
        if agent.consecutive_mutual_c >= 1:
            return Move.ESC
        return Move.C

    if depth == 2:
        if opp_last == "D":
            # re-signal once, then protect
            return Move.D if agent.sucker_streak >= 1 else Move.C
        if residual < REOPEN_COST and agent.consecutive_mutual_c >= 1:
            return Move.CMP
        return Move.C if agent.consecutive_mutual_c < 2 else Move.CMP

    # Default open: cooperate at E0 (test for mutual trust)
    return Move.C


def resolve_moves(
    ma: Move, mb: Move, depth: int, awareness_a: int, awareness_b: int
) -> Tuple[str, str, int, int, int, str]:
    """Return base_a, base_b, new_depth, aw_a, aw_b, note."""
    notes: List[str] = []
    new_depth = depth
    aw_a, aw_b = awareness_a, awareness_b

    if ma == Move.AWARE:
        aw_a += 1
        notes.append("A inspects enclosure (Rule 1)")
    if mb == Move.AWARE:
        aw_b += 1
        notes.append("B inspects enclosure (Rule 1)")

    a_esc = ma == Move.ESC
    b_esc = mb == Move.ESC
    a_de = ma == Move.DE
    b_de = mb == Move.DE

    if a_esc or b_esc:
        new_depth = min(2, depth + 1)
        if a_esc and b_esc:
            notes.append("both escalate")
        elif a_esc:
            notes.append("A escalates (asymmetric nesting)")
        else:
            notes.append("B escalates (asymmetric nesting)")
    elif a_de or b_de:
        new_depth = max(0, depth - 1)
        notes.append("de-escalate")

    def base(m: Move) -> str:
        if m == Move.D:
            return "D"
        # AWARE / ESC / DE / CMP / C all score as cooperative toward transformation
        # except pure D; AWARE is inspection (treated as C for stage payoff)
        return "C"

    ba, bb = base(ma), base(mb)
    if ma == Move.CMP and mb == Move.CMP and new_depth == 2:
        notes.append("mutual compactification")
    elif ma == Move.CMP or mb == Move.CMP:
        notes.append("partial compact attempt")

    if not notes:
        notes.append("play inside current PD enclosure")
    return ba, bb, new_depth, aw_a, aw_b, "; ".join(notes)


def ternary_snapshot(depth: int, base_a: str, base_b: str) -> str:
    outer = ENCLOSURE_LABEL[EnclosureDepth(min(2, depth + 1))] if depth < 2 else "Final Frontier (model halt)"
    inner = "individual sentence / private cost"
    sigma = f"σ_pd = (A:{base_a}, B:{base_b})"
    return f"[ {outer} | {sigma} | {inner} ] @ {ENCLOSURE_LABEL[EnclosureDepth(depth)]}"


def play_ncm_pd(
    strategy_a: Strategy,
    strategy_b: Strategy,
    rounds: int = 20,
    seed: int = 42,
    label: str = "",
    formation: Optional[GameFormation] = None,
    verbose: bool = False,
    allow_enclosure_moves: bool = True,
) -> MatchResult:
    formation = formation or GameFormation()
    assert formation.validate_pd_ordering(), "Payoffs must satisfy T>R>P>S and 2R>T+S"

    rng = random.Random(seed)
    a = Agent("A", strategy_a)
    b = Agent("B", strategy_b)
    depth = int(EnclosureDepth.E0_LOCAL_PD)
    residual = 0.0
    oversight = 0.0  # rises with AWARE and outer enclosure stability
    compactified = False
    log: List[RoundRecord] = []
    path: List[int] = []
    mutual_c = mutual_d = classic_dd = 0
    last_a: Optional[str] = None
    last_b: Optional[str] = None

    for r in range(1, rounds + 1):
        if compactified and residual < REOPEN_COST:
            mat = effective_payoffs(EnclosureDepth(depth), formation)
            pa, pb = mat["C"]["C"]
            a.score += pa
            b.score += pb
            mutual_c += 1
            rec = RoundRecord(
                round=r,
                depth=depth,
                enclosure=ENCLOSURE_LABEL[EnclosureDepth(depth)],
                a_move="HOLD",
                b_move="HOLD",
                a_base="C",
                b_base="C",
                a_pay=pa,
                b_pay=pb,
                residual=residual,
                oversight=oversight,
                note="Enclosed Zero Infinity Nash (PD residual sealed; project continues)",
                ternary=ternary_snapshot(depth, "C", "C"),
            )
            log.append(rec)
            path.append(depth)
            if verbose:
                _print_rec(rec)
            continue

        if allow_enclosure_moves:
            ma = choose(a, last_b, depth, r, residual, rng)
            mb = choose(b, last_a, depth, r, residual, rng)
        else:
            # Forced classic one-shot/repeated PD: only C/D from strategy
            ma = Move.D if strategy_a == Strategy.CLASSIC_DEFECT else (
                Move.C if strategy_a == Strategy.CLASSIC_COOP else choose(a, last_b, 0, r, residual, rng)
            )
            mb = Move.D if strategy_b == Strategy.CLASSIC_DEFECT else (
                Move.C if strategy_b == Strategy.CLASSIC_COOP else choose(b, last_a, 0, r, residual, rng)
            )
            if strategy_a == Strategy.TIT_FOR_TAT:
                ma = Move.C if last_b in (None, "C") else Move.D
            if strategy_b == Strategy.TIT_FOR_TAT:
                mb = Move.C if last_a in (None, "C") else Move.D
            if strategy_a == Strategy.NCM_AWARE:
                ma = Move.C if last_b in (None, "C") else Move.D  # degraded without enclosure freedom
            if strategy_b == Strategy.NCM_AWARE:
                mb = Move.C if last_a in (None, "C") else Move.D
            # strip enclosure moves in classic mode
            if ma in (Move.AWARE, Move.ESC, Move.DE, Move.CMP):
                ma = Move.C
            if mb in (Move.AWARE, Move.ESC, Move.DE, Move.CMP):
                mb = Move.C

        ba, bb, depth, a.awareness, b.awareness, note = resolve_moves(
            ma, mb, depth, a.awareness, b.awareness
        )
        if not allow_enclosure_moves:
            depth = 0

        a.note_depth(depth)
        b.note_depth(depth)

        mat = effective_payoffs(EnclosureDepth(depth), formation)
        pa, pb = mat[ba][bb]

        if ma == Move.CMP and mb == Move.CMP and depth == 2:
            pa += COMPACT_BONUS
            pb += COMPACT_BONUS
            residual = max(0.0, residual - 1.5)
            compactified = True
            note += "; residual compacted across larger reference"
            oversight += 1.0

        # Residual conflict pressure (opposing departures)
        if ba == "D" and bb == "D":
            residual += 1.0
            a.consecutive_mutual_d += 1
            b.consecutive_mutual_d += 1
            a.consecutive_mutual_c = 0
            b.consecutive_mutual_c = 0
            a.sucker_streak = 0
            b.sucker_streak = 0
            mutual_d += 1
            if depth == 0:
                classic_dd += 1
        elif ba == "C" and bb == "C":
            residual = max(0.0, residual - 0.35)
            a.consecutive_mutual_c += 1
            b.consecutive_mutual_c += 1
            a.consecutive_mutual_d = 0
            b.consecutive_mutual_d = 0
            a.sucker_streak = 0
            b.sucker_streak = 0
            mutual_c += 1
        else:
            residual += 0.5
            a.consecutive_mutual_c = 0
            b.consecutive_mutual_c = 0
            a.consecutive_mutual_d = 0
            b.consecutive_mutual_d = 0
            if ba == "C" and bb == "D":
                a.sucker_streak += 1
                b.sucker_streak = 0
            elif bb == "C" and ba == "D":
                b.sucker_streak += 1
                a.sucker_streak = 0
            else:
                a.sucker_streak = 0
                b.sucker_streak = 0

        # Oversight grows with awareness and outer depth (NCM diagnostic)
        oversight = max(oversight, float(a.awareness + b.awareness) * 0.5 + depth * 0.75)

        a.score += pa
        b.score += pb
        last_a, last_b = ba, bb
        a.last_base, b.last_base = ba, bb

        rec = RoundRecord(
            round=r,
            depth=depth,
            enclosure=ENCLOSURE_LABEL[EnclosureDepth(depth)],
            a_move=ma.value,
            b_move=mb.value,
            a_base=ba,
            b_base=bb,
            a_pay=pa,
            b_pay=pb,
            residual=round(residual, 3),
            oversight=round(oversight, 3),
            note=note,
            ternary=ternary_snapshot(depth, ba, bb),
        )
        log.append(rec)
        path.append(depth)
        if verbose:
            _print_rec(rec)

    played = max(1, rounds)
    return MatchResult(
        label=label or f"{strategy_a.value}_vs_{strategy_b.value}",
        formation={
            "players": list(formation.players),
            "T": formation.T,
            "R": formation.R,
            "P": formation.P,
            "S": formation.S,
            "ordering_ok": formation.validate_pd_ordering(),
            "information": formation.information,
            "excluded_costs": formation.excluded_costs,
            "boundary": formation.boundary,
        },
        rounds=rounds,
        strategy_a=strategy_a.value,
        strategy_b=strategy_b.value,
        score_a=round(a.score, 3),
        score_b=round(b.score, 3),
        joint=round(a.score + b.score, 3),
        final_depth=depth,
        final_enclosure=ENCLOSURE_LABEL[EnclosureDepth(depth)],
        residual=round(residual, 3),
        compactified=compactified,
        mutual_c_rate=round(mutual_c / played, 3),
        mutual_d_rate=round(mutual_d / played, 3),
        classic_nash_cell_rate=round(classic_dd / played, 3),
        depth_path=_compress(path),
        log=log,
    )


def _compress(path: List[int]) -> List[int]:
    if not path:
        return []
    out = [path[0]]
    for d in path[1:]:
        if d != out[-1]:
            out.append(d)
    return out


def _print_rec(rec: RoundRecord) -> None:
    print(
        f"R{rec.round:02d} d={rec.depth}  "
        f"A:{rec.a_move:5s}/{rec.a_base}  B:{rec.b_move:5s}/{rec.b_base}  "
        f"pay({rec.a_pay:+.1f},{rec.b_pay:+.1f})  "
        f"ρ={rec.residual:.2f}  O={rec.oversight:.2f}"
    )
    print(f"     {rec.note}")
    print(f"     {rec.ternary}")


# ---------------------------------------------------------------------------
# 5. Report: construct the NCM-PD and run experiments
# ---------------------------------------------------------------------------

def print_construction(formation: GameFormation) -> None:
    print("=" * 72)
    print("  PRISONER'S DILEMMA AS AN NCM GAME")
    print("  Nested Causal Modelling × Classic PD")
    print("=" * 72)
    print()
    print("Zero Infinity (reference):")
    print("  No prisoners. No charges. No matrix. No departure.")
    print()
    print("Game-formation enclosure [NCM | formation | Game Theory]:")
    print(f"  Players:     {formation.players[0]} , {formation.players[1]}")
    print(f"  Strategies:  {formation.strategies[0]}")
    print(f"               {formation.strategies[1]}")
    print(f"  Payoffs:     T={formation.T}  R={formation.R}  P={formation.P}  S={formation.S}")
    print(f"  Ordering:    T>R>P>S and 2R>T+S → {formation.validate_pd_ordering()}")
    print(f"  Information: {formation.information}")
    print(f"  Boundary:    {formation.boundary}")
    print(f"  Excluded:    {formation.excluded_costs}")
    print()
    print("Active ternary system:")
    print("  Ψ_n = [ Ψ_{n+1} | σ_pd | Ψ_{n-1} ]")
    print("  σ_pd ∈ {C, D} × {C, D}   inside enclosure depth n")
    print()
    print("Enclosure stack:")
    for d in EnclosureDepth:
        mat = effective_payoffs(d, formation)
        eqs = nash_pure_labels(mat)
        print(f"  {ENCLOSURE_LABEL[d]}")
        print(f"    C/C={mat['C']['C']}  C/D={mat['C']['D']}")
        print(f"    D/C={mat['D']['C']}  D/D={mat['D']['D']}")
        print(f"    pure Nash: {', '.join(eqs) if eqs else '(none)'}")
    print()
    print("NCM moves: C, D, AWARE, ESC, DE, CMP")
    print("Target: Enclosed Zero Infinity Nash (residual < reopen cost)")
    print("Diagnostic: risk ↑ when depth(σ_pd) > depth(oversight)")
    print()


def print_match(res: MatchResult, show_log: bool = False) -> None:
    print(f"  [{res.label}]")
    print(
        f"    scores A={res.score_a:.1f}  B={res.score_b:.1f}  joint={res.joint:.1f}"
    )
    print(
        f"    end: {res.final_enclosure}  compactified={res.compactified}  "
        f"residual={res.residual}"
    )
    print(
        f"    mutual C={res.mutual_c_rate:.2f}  mutual D={res.mutual_d_rate:.2f}  "
        f"E0 (D,D) rate={res.classic_nash_cell_rate:.2f}"
    )
    print(f"    depth path: {' → '.join(str(d) for d in res.depth_path)}")
    if show_log:
        for rec in res.log[:15]:
            print(
                f"      R{rec.round:02d} d={rec.depth} "
                f"{rec.a_move}/{rec.a_base} vs {rec.b_move}/{rec.b_base} "
                f"({rec.a_pay:+.1f},{rec.b_pay:+.1f}) | {rec.note}"
            )
        if len(res.log) > 15:
            print(f"      ... ({len(res.log) - 15} more rounds)")
    print()


def run_experiment(rounds: int = 20, seed: int = 42, verbose: bool = False) -> dict:
    formation = GameFormation()
    print_construction(formation)

    print("=" * 72)
    print("PART A — Classic PD (enclosure moves disabled; fixed E0 matrix)")
    print("=" * 72)
    print()
    classic_pairs = [
        (Strategy.CLASSIC_DEFECT, Strategy.CLASSIC_DEFECT, "both defect (dominant Nash)"),
        (Strategy.CLASSIC_COOP, Strategy.CLASSIC_COOP, "both cooperate (pareto, unstable)"),
        (Strategy.CLASSIC_DEFECT, Strategy.CLASSIC_COOP, "defect vs cooperate (temptation)"),
        (Strategy.TIT_FOR_TAT, Strategy.TIT_FOR_TAT, "TFT vs TFT (repeated heuristic)"),
        (Strategy.TIT_FOR_TAT, Strategy.CLASSIC_DEFECT, "TFT vs always-defect"),
    ]
    classic_results = []
    for sa, sb, lab in classic_pairs:
        res = play_ncm_pd(
            sa, sb, rounds=rounds, seed=seed, label=lab,
            formation=formation, allow_enclosure_moves=False,
        )
        classic_results.append(res)
        print_match(res)

    print("=" * 72)
    print("PART B — NCM-PD (enclosure awareness, escalate, compactify allowed)")
    print("=" * 72)
    print()
    ncm_pairs = [
        (Strategy.CLASSIC_DEFECT, Strategy.CLASSIC_DEFECT, "classic defectors inside NCM field"),
        (Strategy.NCM_AWARE, Strategy.CLASSIC_DEFECT, "NCM-aware vs pure defector"),
        (Strategy.NCM_AWARE, Strategy.HAWK, "NCM-aware vs hawk"),
        (Strategy.NCM_AWARE, Strategy.TIT_FOR_TAT, "NCM-aware vs TFT"),
        (Strategy.NCM_AWARE, Strategy.NCM_AWARE, "two NCM-aware prisoners"),
        (Strategy.HAWK, Strategy.HAWK, "two hawks"),
    ]
    ncm_results = []
    for sa, sb, lab in ncm_pairs:
        res = play_ncm_pd(
            sa, sb, rounds=rounds, seed=seed, label=lab,
            formation=formation, allow_enclosure_moves=True,
            verbose=verbose and "two NCM" in lab,
        )
        ncm_results.append(res)
        print_match(res, show_log=("two NCM" in lab or "NCM-aware vs pure" in lab))

    print("=" * 72)
    print("PART C — Walkthrough: two NCM-aware prisoners")
    print("=" * 72)
    print()
    walk = play_ncm_pd(
        Strategy.NCM_AWARE,
        Strategy.NCM_AWARE,
        rounds=rounds,
        seed=seed,
        label="walkthrough_ncm_vs_ncm",
        formation=formation,
        verbose=True,
    )
    print()
    print_match(walk)

    print("=" * 72)
    print("PART D — Comparative finding")
    print("=" * 72)
    print()
    dd = next(r for r in classic_results if "both defect" in r.label)
    tft = next(r for r in classic_results if "TFT vs TFT" in r.label)
    ncm = next(r for r in ncm_results if "two NCM" in r.label)
    print(f"  Classic mutual defect joint:     {dd.joint:.1f}   (Nash trap at E0)")
    print(f"  Classic TFT–TFT joint:           {tft.joint:.1f}   (local coop, still E0 PD)")
    print(f"  NCM-aware × NCM-aware joint:     {ncm.joint:.1f}   "
          f"path={ncm.depth_path} compact={ncm.compactified}")
    print(f"  Surplus of NCM path over TFT:    {ncm.joint - tft.joint:+.1f}")
    print()
    print("  NCM reading of the Prisoner's Dilemma:")
    print("    The dominant-strategy Nash (D,D) is an equilibrium *inside* E0.")
    print("    It is not the Final Frontier of the conflict.")
    print("    AWARE reveals the outer enclosure; ESC moves the departure;")
    print("    CMP seals residual when both reframe σ_pd inside a shared project.")
    print("    Escape is not winning the interrogation. Escape is changing the enclosure.")
    print()
    print("Done.")

    return {
        "formation": {
            "T": formation.T, "R": formation.R, "P": formation.P, "S": formation.S,
            "players": list(formation.players),
        },
        "classic": [r.summary() for r in classic_results],
        "ncm": [r.summary() for r in ncm_results],
        "walkthrough": walk.summary(),
    }


def main() -> None:
    p = argparse.ArgumentParser(description="Prisoner's Dilemma as an NCM Game")
    p.add_argument("--rounds", type=int, default=20)
    p.add_argument("--seed", type=int, default=42)
    p.add_argument("--verbose", action="store_true")
    p.add_argument("--json-out", type=str, default="")
    args = p.parse_args()
    data = run_experiment(rounds=args.rounds, seed=args.seed, verbose=args.verbose)
    if args.json_out:
        with open(args.json_out, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        print(f"Wrote {args.json_out}")


if __name__ == "__main__":
    main()
