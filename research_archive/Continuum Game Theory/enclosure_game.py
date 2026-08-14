#!/usr/bin/env python3
"""
The Enclosure Game
==================
Combines the three most iconic games of game theory inside Nested Causal
Modelling's enclosure architecture (Hubbard 2026, NCM Game Theory paper).

Classic games as nested enclosures
----------------------------------
  G_0  Prisoner's Dilemma   — local zero-sum-feeling trap
                              T > R > P > S  (defect dominates)
  G_1  Chicken (Hawk-Dove)  — escalation / brinkmanship
                              T > R > S > P  (mutual crash worst)
  G_2  Stag Hunt            — larger shared project / coordination
                              R > T > P > S  (mutual coop best, risky)

Players may:
  - play inside the current enclosure (Cooperate / Defect)
  - escalate  E_n -> E_{n+1}   (widen the game)
  - de-escalate E_n -> E_{n-1} (localize the game)
  - compactify when at outer depth and both cooperate (Zero Infinity residual)

Reference condition (Zero Infinity): no player, game, or payoff yet defined.
Departure: defining players + a game at some enclosure depth.
Target: Enclosed Zero Infinity Nash — residual conflict below reopening cost.
"""

from __future__ import annotations

import argparse
import json
import random
from dataclasses import dataclass, field, asdict
from enum import Enum, IntEnum
from typing import Dict, List, Optional, Tuple


# ---------------------------------------------------------------------------
# Game identities (enclosure depths)
# ---------------------------------------------------------------------------

class Enclosure(IntEnum):
    PRISONERS_DILEMMA = 0
    CHICKEN = 1
    STAG_HUNT = 2


ENCLOSURE_NAMES = {
    Enclosure.PRISONERS_DILEMMA: "Prisoner's Dilemma",
    Enclosure.CHICKEN: "Chicken",
    Enclosure.STAG_HUNT: "Stag Hunt",
}


class Action(str, Enum):
    COOPERATE = "C"
    DEFECT = "D"
    ESCALATE = "ESC"
    DEESCALATE = "DE"
    COMPACTIFY = "CMP"  # attempt asymmetric nesting / compactification


# Canonical 2x2 payoffs: (row_payoff, col_payoff) for (row_action, col_action)
# Order: both C, row C col D, row D col C, both D
# Stored as nested dicts action -> action -> (u_row, u_col)

PAYOFFS: Dict[Enclosure, Dict[str, Dict[str, Tuple[float, float]]]] = {
    # Prisoner's Dilemma: temptation 5, reward 3, punishment 1, sucker 0
    Enclosure.PRISONERS_DILEMMA: {
        "C": {"C": (3.0, 3.0), "D": (0.0, 5.0)},
        "D": {"C": (5.0, 0.0), "D": (1.0, 1.0)},
    },
    # Chicken: swerve=C, straight=D. Mutual crash is worst.
    Enclosure.CHICKEN: {
        "C": {"C": (3.0, 3.0), "D": (1.0, 4.0)},
        "D": {"C": (4.0, 1.0), "D": (-2.0, -2.0)},
    },
    # Stag Hunt: stag=C, hare=D. Mutual stag best; alone hunting stag fails.
    Enclosure.STAG_HUNT: {
        "C": {"C": (5.0, 5.0), "D": (0.0, 3.0)},
        "D": {"C": (3.0, 0.0), "D": (2.0, 2.0)},
    },
}

# Shared-loss avoided when both players reach Stag Hunt and mutually cooperate
# (paper: G_n zero-sum feeling -> G_{n+1} non-zero-sum shared gain)
SHARED_SURPLUS_ON_COMPACT = 2.0

# Cost of reopening conflict after compactification
REOPEN_COST = 4.0


def pure_payoff(depth: Enclosure, a: str, b: str) -> Tuple[float, float]:
    return PAYOFFS[depth][a][b]


def game_type_label(depth: int) -> str:
    d = max(0, min(int(depth), 2))
    return ENCLOSURE_NAMES[Enclosure(d)]


# ---------------------------------------------------------------------------
# Strategies
# ---------------------------------------------------------------------------

class Strategy(str, Enum):
    ALWAYS_DEFECT = "always_defect"
    ALWAYS_COOPERATE = "always_cooperate"
    TIT_FOR_TAT = "tit_for_tat"
    HAWK = "hawk"              # prefer defect; escalate if losing
    DOVE = "dove"              # prefer cooperate; de-escalate under pressure
    ENCLOSURE_AWARE = "enclosure_aware"  # NCM player: move enclosures deliberately
    RANDOM = "random"


@dataclass
class Player:
    name: str
    strategy: Strategy
    score: float = 0.0
    depth: int = int(Enclosure.PRISONERS_DILEMMA)
    last_base: str = "C"  # last C/D observed from self
    span_min: int = 0
    span_max: int = 0
    compact_count: int = 0
    escalate_count: int = 0
    deescalate_count: int = 0
    consecutive_coop: int = 0  # streak of opponent coop
    sucker_streak: int = 0     # consecutive times we coop, they defect

    def note_depth(self) -> None:
        self.span_min = min(self.span_min, self.depth)
        self.span_max = max(self.span_max, self.depth)


def choose_action(
    player: Player,
    opponent_last: Optional[str],
    shared_depth: int,
    round_i: int,
    rng: random.Random,
    residual: float,
) -> Action:
    """Map strategy + state to an Enclosure-Game action."""
    s = player.strategy

    if s == Strategy.ALWAYS_DEFECT:
        return Action.DEFECT
    if s == Strategy.ALWAYS_COOPERATE:
        return Action.COOPERATE
    if s == Strategy.RANDOM:
        return rng.choice([Action.COOPERATE, Action.DEFECT, Action.ESCALATE, Action.DEESCALATE])

    if s == Strategy.TIT_FOR_TAT:
        if opponent_last is None:
            return Action.COOPERATE
        return Action.COOPERATE if opponent_last == "C" else Action.DEFECT

    if s == Strategy.HAWK:
        # Prefer defect; if stuck in mutual defection, escalate for leverage
        if opponent_last == "D" and round_i > 2 and shared_depth < 2:
            return Action.ESCALATE
        return Action.DEFECT

    if s == Strategy.DOVE:
        if opponent_last == "D" and shared_depth > 0:
            return Action.DEESCALATE
        return Action.COOPERATE

    if s == Strategy.ENCLOSURE_AWARE:
        # NCM rule stack (paper §5 + NCM Game appendix Rules 1–6):
        # 1. Enclosure awareness: the present matrix is not final.
        # 2. Escape PD defect traps by escalating.
        # 3. Greatest span: even mutual PD coop is inferior to Stag coop
        #    (joint 6 vs joint 10) — climb when trust exists.
        # 4. Chicken: never accept mutual crash; escalate to shared project.
        # 5. Stag Hunt: coordinate, then compactify residual.
        # 6. Boundary audit: stop being sucker after repeated exploitation.
        depth = Enclosure(shared_depth)

        if player.sucker_streak >= 3 and depth == Enclosure.STAG_HUNT:
            return Action.DEFECT

        if depth == Enclosure.PRISONERS_DILEMMA:
            if opponent_last == "D" and round_i >= 2:
                return Action.ESCALATE  # escape trap
            # Greatest span: after brief trust, leave PD for higher joint surplus
            if player.consecutive_coop >= 2 and shared_depth < 2:
                return Action.ESCALATE
            return Action.COOPERATE

        if depth == Enclosure.CHICKEN:
            if opponent_last == "D":
                return Action.ESCALATE if shared_depth < 2 else Action.COOPERATE
            if player.consecutive_coop >= 1 or opponent_last in (None, "C"):
                return Action.ESCALATE if shared_depth < 2 else Action.COOPERATE
            return Action.COOPERATE

        if depth == Enclosure.STAG_HUNT:
            if opponent_last == "D":
                return Action.COOPERATE if player.sucker_streak < 3 else Action.DEFECT
            if player.consecutive_coop >= 2 or round_i >= 6:
                return Action.COMPACTIFY
            return Action.COOPERATE

    return Action.COOPERATE


# ---------------------------------------------------------------------------
# Core step
# ---------------------------------------------------------------------------

@dataclass
class RoundLog:
    round: int
    shared_depth: int
    game: str
    a_action: str
    b_action: str
    a_base: str
    b_base: str
    a_pay: float
    b_pay: float
    residual: float
    note: str


@dataclass
class SimulationResult:
    label: str
    rounds: int
    player_a: str
    player_b: str
    strategy_a: str
    strategy_b: str
    final_score_a: float
    final_score_b: float
    joint_score: float
    final_depth: int
    final_game: str
    residual: float
    compactified: bool
    mutual_coop_rate: float
    mutual_defect_rate: float
    depth_history: List[int]
    logs: List[RoundLog] = field(default_factory=list)

    def summary_dict(self) -> dict:
        d = asdict(self)
        d.pop("logs", None)
        return d


def resolve_base_actions(
    act_a: Action, act_b: Action, depth: int
) -> Tuple[str, str, int, str]:
    """
    Convert enclosure moves + base moves into (base_a, base_b, new_depth, note).

    Enclosure moves change depth first; base C/D then scored in the resulting game.
    If one player escalates and the other does not, depth still rises (asymmetric nesting).
    Compactify requires both to attempt it at Stag Hunt, else treated as Cooperate.
    """
    note_parts: List[str] = []
    new_depth = depth

    # Depth shifts
    a_esc = act_a == Action.ESCALATE
    b_esc = act_b == Action.ESCALATE
    a_de = act_a == Action.DEESCALATE
    b_de = act_b == Action.DEESCALATE
    a_cmp = act_a == Action.COMPACTIFY
    b_cmp = act_b == Action.COMPACTIFY

    if a_esc or b_esc:
        shift = int(a_esc) + int(b_esc)
        # one-sided escalate still moves depth by 1 (asymmetric nesting)
        new_depth = min(2, depth + (1 if shift >= 1 else 0))
        if a_esc and b_esc:
            note_parts.append("both escalate")
        elif a_esc:
            note_parts.append("A escalates (asymmetric nest)")
        else:
            note_parts.append("B escalates (asymmetric nest)")

    if a_de or b_de:
        # de-escalate only if neither escalated this round
        if not (a_esc or b_esc):
            shift = int(a_de) + int(b_de)
            new_depth = max(0, depth - (1 if shift >= 1 else 0))
            if a_de and b_de:
                note_parts.append("both de-escalate")
            elif a_de:
                note_parts.append("A de-escalates")
            else:
                note_parts.append("B de-escalates")

    # Map to base C/D for scoring
    def to_base(act: Action) -> str:
        if act in (Action.COOPERATE, Action.COMPACTIFY, Action.DEESCALATE):
            return "C"
        if act in (Action.DEFECT, Action.ESCALATE):
            # escalate is assertive / hawk-ish in the current frame
            return "D" if act == Action.DEFECT else "C"
        return "C"

    # Escalation scores as Cooperate in the *new* frame (seeking larger map),
    # not as defect in the old frame — matches "escape not win" purpose.
    def to_base_refined(act: Action) -> str:
        if act == Action.DEFECT:
            return "D"
        if act == Action.ESCALATE:
            return "C"  # opening a larger map is cooperative toward transformation
        if act == Action.DEESCALATE:
            return "C"
        if act == Action.COMPACTIFY:
            return "C"
        return "C"

    base_a = to_base_refined(act_a)
    base_b = to_base_refined(act_b)

    if a_cmp and b_cmp and new_depth == int(Enclosure.STAG_HUNT):
        note_parts.append("mutual compactification")
    elif a_cmp or b_cmp:
        note_parts.append("partial compact attempt")

    note = "; ".join(note_parts) if note_parts else "play inside enclosure"
    return base_a, base_b, new_depth, note


def play_match(
    strategy_a: Strategy,
    strategy_b: Strategy,
    rounds: int = 30,
    seed: int = 0,
    label: str = "",
    name_a: str = "A",
    name_b: str = "B",
    verbose: bool = False,
) -> SimulationResult:
    rng = random.Random(seed)
    a = Player(name=name_a, strategy=strategy_a)
    b = Player(name=name_b, strategy=strategy_b)
    shared_depth = int(Enclosure.PRISONERS_DILEMMA)
    residual = 0.0
    compactified = False
    logs: List[RoundLog] = []
    depth_history: List[int] = []
    mutual_coop = 0
    mutual_defect = 0
    last_base_a: Optional[str] = None
    last_base_b: Optional[str] = None

    for r in range(1, rounds + 1):
        if compactified and residual < REOPEN_COST:
            # Enclosed Zero Infinity Nash — conflict sealed; shared project continues
            # at Stag Hunt mutual-coop payoffs (neither gains by reopening zero-sum).
            hold_a, hold_b = pure_payoff(Enclosure.STAG_HUNT, "C", "C")
            a.score += hold_a
            b.score += hold_b
            mutual_coop += 1
            logs.append(
                RoundLog(
                    round=r,
                    shared_depth=shared_depth,
                    game=game_type_label(shared_depth),
                    a_action="HOLD",
                    b_action="HOLD",
                    a_base="C",
                    b_base="C",
                    a_pay=hold_a,
                    b_pay=hold_b,
                    residual=residual,
                    note="Zero Infinity Nash (sealed; shared project continues)",
                )
            )
            depth_history.append(shared_depth)
            continue

        act_a = choose_action(a, last_base_b, shared_depth, r, rng, residual)
        act_b = choose_action(b, last_base_a, shared_depth, r, rng, residual)

        if act_a == Action.ESCALATE:
            a.escalate_count += 1
        if act_b == Action.ESCALATE:
            b.escalate_count += 1
        if act_a == Action.DEESCALATE:
            a.deescalate_count += 1
        if act_b == Action.DEESCALATE:
            b.deescalate_count += 1

        base_a, base_b, shared_depth, note = resolve_base_actions(
            act_a, act_b, shared_depth
        )
        a.depth = shared_depth
        b.depth = shared_depth
        a.note_depth()
        b.note_depth()

        pay_a, pay_b = pure_payoff(Enclosure(shared_depth), base_a, base_b)

        # Mutual compactification bonus at Stag Hunt
        if (
            act_a == Action.COMPACTIFY
            and act_b == Action.COMPACTIFY
            and shared_depth == int(Enclosure.STAG_HUNT)
        ):
            pay_a += SHARED_SURPLUS_ON_COMPACT
            pay_b += SHARED_SURPLUS_ON_COMPACT
            residual = max(0.0, residual - 1.0)
            compactified = True
            a.compact_count += 1
            b.compact_count += 1
            note += "; residual reduced; enclosure sealed"

        # Track residual conflict pressure (opposing departures)
        if base_a != base_b:
            residual += 0.5
        elif base_a == "D" and base_b == "D":
            residual += 1.0
        else:
            residual = max(0.0, residual - 0.25)

        a.score += pay_a
        b.score += pay_b
        last_base_a, last_base_b = base_a, base_b
        a.last_base, b.last_base = base_a, base_b

        # Update trust / sucker trackers for enclosure-aware logic
        for me, opp_base, other in ((a, base_b, base_a), (b, base_a, base_b)):
            if opp_base == "C":
                me.consecutive_coop += 1
            else:
                me.consecutive_coop = 0
            if other == "C" and opp_base == "D":
                me.sucker_streak += 1
            else:
                me.sucker_streak = 0

        if base_a == "C" and base_b == "C":
            mutual_coop += 1
        if base_a == "D" and base_b == "D":
            mutual_defect += 1

        depth_history.append(shared_depth)
        log = RoundLog(
            round=r,
            shared_depth=shared_depth,
            game=game_type_label(shared_depth),
            a_action=act_a.value,
            b_action=act_b.value,
            a_base=base_a,
            b_base=base_b,
            a_pay=pay_a,
            b_pay=pay_b,
            residual=round(residual, 3),
            note=note,
        )
        logs.append(log)
        if verbose:
            print(
                f"R{r:02d} [{log.game:18s}] "
                f"{name_a}:{act_a.value:3s}/{base_a}  {name_b}:{act_b.value:3s}/{base_b}  "
                f"pay ({pay_a:+.1f},{pay_b:+.1f})  residual={residual:.2f}  | {note}"
            )

    played = max(1, rounds)
    return SimulationResult(
        label=label or f"{strategy_a.value}_vs_{strategy_b.value}",
        rounds=rounds,
        player_a=name_a,
        player_b=name_b,
        strategy_a=strategy_a.value,
        strategy_b=strategy_b.value,
        final_score_a=round(a.score, 3),
        final_score_b=round(b.score, 3),
        joint_score=round(a.score + b.score, 3),
        final_depth=shared_depth,
        final_game=game_type_label(shared_depth),
        residual=round(residual, 3),
        compactified=compactified,
        mutual_coop_rate=round(mutual_coop / played, 3),
        mutual_defect_rate=round(mutual_defect / played, 3),
        depth_history=depth_history,
        logs=logs,
    )


# ---------------------------------------------------------------------------
# Fixed-game baselines (no enclosure moves) for comparison
# ---------------------------------------------------------------------------

def play_fixed_game(
    enclosure: Enclosure,
    strategy_a: Strategy,
    strategy_b: Strategy,
    rounds: int = 30,
    seed: int = 0,
) -> SimulationResult:
    """Classic single-matrix repeated game — no escalate/de-escalate."""
    rng = random.Random(seed)
    score_a = score_b = 0.0
    last_a: Optional[str] = None
    last_b: Optional[str] = None
    mutual_coop = mutual_defect = 0
    # temporary players for strategy logic, forced depth
    pa = Player("A", strategy_a, depth=int(enclosure))
    pb = Player("B", strategy_b, depth=int(enclosure))

    for r in range(1, rounds + 1):
        # Force base-only: map enclosure strategies down to C/D only
        def base_only(p: Player, opp: Optional[str]) -> str:
            act = choose_action(p, opp, int(enclosure), r, rng, 0.0)
            if act == Action.DEFECT:
                return "D"
            if act == Action.ESCALATE:
                return "D"  # in fixed game, escalate intent becomes aggressive
            return "C"

        ba = base_only(pa, last_b)
        bb = base_only(pb, last_a)
        ua, ub = pure_payoff(enclosure, ba, bb)
        score_a += ua
        score_b += ub
        if ba == "C" and bb == "C":
            mutual_coop += 1
        if ba == "D" and bb == "D":
            mutual_defect += 1
        last_a, last_b = ba, bb

    return SimulationResult(
        label=f"fixed_{ENCLOSURE_NAMES[enclosure]}_{strategy_a.value}_vs_{strategy_b.value}",
        rounds=rounds,
        player_a="A",
        player_b="B",
        strategy_a=strategy_a.value,
        strategy_b=strategy_b.value,
        final_score_a=round(score_a, 3),
        final_score_b=round(score_b, 3),
        joint_score=round(score_a + score_b, 3),
        final_depth=int(enclosure),
        final_game=ENCLOSURE_NAMES[enclosure],
        residual=0.0,
        compactified=False,
        mutual_coop_rate=round(mutual_coop / rounds, 3),
        mutual_defect_rate=round(mutual_defect / rounds, 3),
        depth_history=[int(enclosure)] * rounds,
        logs=[],
    )


# ---------------------------------------------------------------------------
# Reporting
# ---------------------------------------------------------------------------

def print_header() -> None:
    print("=" * 72)
    print("  THE ENCLOSURE GAME")
    print("  Nested Causal Modelling × Game Theory")
    print("  Combining Prisoner's Dilemma · Chicken · Stag Hunt")
    print("=" * 72)
    print()
    print("Ternary structure (from the paper):")
    print("  [Game Theory | game-formation / enclosure depth | NCM]")
    print()
    print("Enclosure stack:")
    print("  G_0  Prisoner's Dilemma   T>R>P>S   defect-dominant trap")
    print("  G_1  Chicken              T>R>S>P   mutual crash worst")
    print("  G_2  Stag Hunt            R>T>P>S   mutual coop best (risky)")
    print()
    print("Moves: Cooperate, Defect, Escalate, De-escalate, Compactify")
    print("Target: Enclosed Zero Infinity Nash (residual < reopen cost)")
    print()


def print_payoff_tables() -> None:
    print("-" * 72)
    print("Payoff matrices (row, col) for C/D inside each enclosure")
    print("-" * 72)
    for enc in Enclosure:
        m = PAYOFFS[enc]
        print(f"\n  {ENCLOSURE_NAMES[enc]} (depth {int(enc)})")
        print(f"           C              D")
        print(f"    C   {m['C']['C']}   {m['C']['D']}")
        print(f"    D   {m['D']['C']}   {m['D']['D']}")
    print()


def print_result(res: SimulationResult, show_log: bool = False) -> None:
    print(f"  [{res.label}]")
    print(
        f"    scores: {res.player_a}={res.final_score_a:.1f}  "
        f"{res.player_b}={res.final_score_b:.1f}  joint={res.joint_score:.1f}"
    )
    print(
        f"    end game: {res.final_game} (depth {res.final_depth})  "
        f"compactified={res.compactified}  residual={res.residual}"
    )
    print(
        f"    mutual coop rate={res.mutual_coop_rate:.2f}  "
        f"mutual defect rate={res.mutual_defect_rate:.2f}"
    )
    if res.depth_history:
        path = " → ".join(
            game_type_label(d)[:2] for d in _compress_path(res.depth_history)
        )
        print(f"    depth path: {path}")
    if show_log and res.logs:
        print("    round log:")
        for log in res.logs[:12]:
            print(
                f"      R{log.round:02d} {log.game[:16]:16s} "
                f"{log.a_action:3s}/{log.a_base} vs {log.b_action:3s}/{log.b_base} "
                f"({log.a_pay:+.1f},{log.b_pay:+.1f}) {log.note}"
            )
        if len(res.logs) > 12:
            print(f"      ... ({len(res.logs) - 12} more rounds)")
    print()


def _compress_path(depths: List[int]) -> List[int]:
    if not depths:
        return []
    out = [depths[0]]
    for d in depths[1:]:
        if d != out[-1]:
            out.append(d)
    return out


def run_full_experiment(rounds: int = 30, seed: int = 42, verbose: bool = False) -> dict:
    print_header()
    print_payoff_tables()

    print("=" * 72)
    print("PART 1 — Fixed single-game baselines (no enclosure switching)")
    print("=" * 72)
    print()

    baselines: List[SimulationResult] = []
    for enc in Enclosure:
        for sa, sb in [
            (Strategy.ALWAYS_DEFECT, Strategy.ALWAYS_DEFECT),
            (Strategy.TIT_FOR_TAT, Strategy.TIT_FOR_TAT),
            (Strategy.ALWAYS_DEFECT, Strategy.ALWAYS_COOPERATE),
            (Strategy.TIT_FOR_TAT, Strategy.ALWAYS_DEFECT),
        ]:
            res = play_fixed_game(enc, sa, sb, rounds=rounds, seed=seed)
            baselines.append(res)
            print_result(res)

    print("=" * 72)
    print("PART 2 — Full Enclosure Game (nested PD → Chicken → Stag Hunt)")
    print("=" * 72)
    print()

    enclosure_matches = [
        (Strategy.ALWAYS_DEFECT, Strategy.ALWAYS_DEFECT, "two defectors (trapped)"),
        (Strategy.TIT_FOR_TAT, Strategy.TIT_FOR_TAT, "two tit-for-tat (local)"),
        (Strategy.HAWK, Strategy.HAWK, "two hawks (brinkmanship)"),
        (Strategy.DOVE, Strategy.DOVE, "two doves"),
        (Strategy.HAWK, Strategy.DOVE, "hawk vs dove"),
        (Strategy.ENCLOSURE_AWARE, Strategy.ALWAYS_DEFECT, "NCM-aware vs defector"),
        (Strategy.ENCLOSURE_AWARE, Strategy.HAWK, "NCM-aware vs hawk"),
        (Strategy.ENCLOSURE_AWARE, Strategy.TIT_FOR_TAT, "NCM-aware vs TFT"),
        (Strategy.ENCLOSURE_AWARE, Strategy.ENCLOSURE_AWARE, "two NCM-aware players"),
        (Strategy.ENCLOSURE_AWARE, Strategy.DOVE, "NCM-aware vs dove"),
    ]

    enclosure_results: List[SimulationResult] = []
    for sa, sb, label in enclosure_matches:
        res = play_match(
            sa,
            sb,
            rounds=rounds,
            seed=seed,
            label=label,
            name_a="A",
            name_b="B",
            verbose=verbose and "two NCM" in label,
        )
        enclosure_results.append(res)
        print_result(res, show_log=("two NCM" in label or "NCM-aware vs hawk" in label))

    print("=" * 72)
    print("PART 3 — Detailed walkthrough: two enclosure-aware players")
    print("=" * 72)
    print()
    walk = play_match(
        Strategy.ENCLOSURE_AWARE,
        Strategy.ENCLOSURE_AWARE,
        rounds=rounds,
        seed=seed,
        label="walkthrough_NCM_vs_NCM",
        verbose=True,
    )
    print()
    print_result(walk, show_log=False)

    print("=" * 72)
    print("PART 4 — Comparative findings")
    print("=" * 72)
    print()

    # Best joint scores
    best_fixed = max(baselines, key=lambda x: x.joint_score)
    worst_fixed = min(baselines, key=lambda x: x.joint_score)
    best_enc = max(enclosure_results, key=lambda x: x.joint_score)
    worst_enc = min(enclosure_results, key=lambda x: x.joint_score)
    ncm_pair = next(r for r in enclosure_results if r.strategy_a == "enclosure_aware"
                    and r.strategy_b == "enclosure_aware")
    defect_pair = next(r for r in enclosure_results if "two defectors" in r.label)

    print(f"  Best fixed-game joint score:  {best_fixed.joint_score:.1f}  ({best_fixed.label})")
    print(f"  Worst fixed-game joint score: {worst_fixed.joint_score:.1f}  ({worst_fixed.label})")
    print(f"  Best enclosure joint score:   {best_enc.joint_score:.1f}  ({best_enc.label})")
    print(f"  Worst enclosure joint score:  {worst_enc.joint_score:.1f}  ({worst_enc.label})")
    print()
    print(f"  Two pure defectors (enclosure game): joint={defect_pair.joint_score:.1f}, "
          f"end={defect_pair.final_game}, compact={defect_pair.compactified}")
    print(f"  Two NCM-aware players:               joint={ncm_pair.joint_score:.1f}, "
          f"end={ncm_pair.final_game}, compact={ncm_pair.compactified}, residual={ncm_pair.residual}")
    print()
    # Head-to-head: PD mutual defect vs PD TFT coop vs NCM climb+seal
    pd_defect = next(
        b for b in baselines
        if "Prisoner's Dilemma" in b.label and "always_defect_vs_always_defect" in b.label
    )
    pd_tft = next(
        b for b in baselines
        if "Prisoner's Dilemma" in b.label and "tit_for_tat_vs_tit_for_tat" in b.label
    )
    print("  Head-to-head joint surplus (same 30 rounds):")
    print(f"    PD mutual defect (classic Nash trap):     {pd_defect.joint_score:.1f}")
    print(f"    PD mutual TFT coop (local optimum):       {pd_tft.joint_score:.1f}")
    print(f"    Enclosure climb + compactify (NCM×NCM):   {ncm_pair.joint_score:.1f}")
    print(f"    Surplus of enclosure path over PD TFT:    "
          f"{ncm_pair.joint_score - pd_tft.joint_score:+.1f}")
    print()
    print("  Interpretation (paper Construction One):")
    print("    Fixed PD traps defectors in low joint Nash (punishment cell).")
    print("    TFT can sustain PD coop, but the boundary of the game is still PD.")
    print("    Enclosure moves leave G_0 (PD), pass G_1 (Chicken), enter G_2 (Stag Hunt).")
    print("    Mutual compactification seals residual below reopen cost — an Enclosed")
    print("    Zero Infinity Nash — while the shared project continues at Stag payoffs.")
    print()
    print("  Construction Two (parallel): game theory scores incentives; NCM tracks")
    print("    depth path and residual — both appear in the logs above.")
    print()
    print("  Construction Three: the game-formation layer chose which matrix applies")
    print("    at each depth (who plays, which payoffs, which boundary is valid).")
    print()
    print("Done.")

    return {
        "baselines": [b.summary_dict() for b in baselines],
        "enclosure_results": [e.summary_dict() for e in enclosure_results],
        "walkthrough": walk.summary_dict(),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the Enclosure Game simulation")
    parser.add_argument("--rounds", type=int, default=30)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--verbose", action="store_true")
    parser.add_argument("--json-out", type=str, default="")
    args = parser.parse_args()

    data = run_full_experiment(rounds=args.rounds, seed=args.seed, verbose=args.verbose)
    if args.json_out:
        with open(args.json_out, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        print(f"Wrote {args.json_out}")


if __name__ == "__main__":
    main()
