#!/usr/bin/env python3
"""Deterministic nonterminal game on Zero Infinity depth and scale.

The game has no score and no terminal states. Players alternate attempts to
close the active enclosure around a victory condition. A victory claim takes
three phases to mature. The defending player does not evade early: at the last
lawful moment, the defender changes depth or scale and invalidates the claim.

Enclosure changes follow an expanding square spiral on Z x Z. This supplies a
deterministic, unbounded sequence containing escalation and de-escalation in
both depth and scale. ``play_forever`` is an infinite generator; the command
line prints or exports a finite observed prefix unless ``--stream`` is used.
"""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import asdict, dataclass
from enum import Enum
from itertools import count
from pathlib import Path
from typing import Iterator, Optional, TextIO


class Player(str, Enum):
    A = "A"
    B = "B"

    @property
    def other(self) -> "Player":
        return Player.B if self is Player.A else Player.A


class EnclosureMove(str, Enum):
    ESCALATE_DEPTH = "ESCALATE_DEPTH"
    ESCALATE_SCALE = "ESCALATE_SCALE"
    DEESCALATE_DEPTH = "DEESCALATE_DEPTH"
    DEESCALATE_SCALE = "DEESCALATE_SCALE"


@dataclass(frozen=True)
class Vector:
    depth: int
    scale: int
    move: EnclosureMove


@dataclass
class GameState:
    frontier_depth: int = 0
    frontier_scale: int = 0
    a_depth: int = 0
    a_scale: int = 0
    b_depth: int = 0
    b_scale: int = 0
    encounter: int = 0
    active: bool = True
    winner: None = None
    loser: None = None
    utility_a: int = 0
    utility_b: int = 0

    def level(self, player: Player) -> tuple[int, int]:
        if player is Player.A:
            return self.a_depth, self.a_scale
        return self.b_depth, self.b_scale

    def move_player(self, player: Player, depth: int, scale: int) -> None:
        if player is Player.A:
            self.a_depth, self.a_scale = depth, scale
        else:
            self.b_depth, self.b_scale = depth, scale


@dataclass(frozen=True)
class Event:
    event: int
    encounter: int
    phase: str
    countdown: int
    attacker: str
    defender: str
    action: str
    enclosure_move: Optional[str]
    frontier_depth: int
    frontier_scale: int
    a_depth: int
    a_scale: int
    b_depth: int
    b_scale: int
    levels_equal: bool
    winner: None
    loser: None
    utility_a: int
    utility_b: int
    active: bool
    note: str


def square_spiral_moves() -> Iterator[Vector]:
    """Yield an unbounded deterministic walk over signed depth and scale.

    Segment lengths are 1, 1, 2, 2, 3, 3, ... . Consequently the walk
    reaches arbitrarily large positive and negative values on both axes.
    """

    directions = (
        Vector(1, 0, EnclosureMove.ESCALATE_DEPTH),
        Vector(0, 1, EnclosureMove.ESCALATE_SCALE),
        Vector(-1, 0, EnclosureMove.DEESCALATE_DEPTH),
        Vector(0, -1, EnclosureMove.DEESCALATE_SCALE),
    )
    segment_length = 1
    direction_index = 0
    while True:
        for _ in range(2):
            vector = directions[direction_index % len(directions)]
            for _ in range(segment_length):
                yield vector
            direction_index += 1
        segment_length += 1


def make_event(
    number: int,
    state: GameState,
    attacker: Player,
    phase: str,
    countdown: int,
    action: str,
    note: str,
    move: Optional[EnclosureMove] = None,
) -> Event:
    return Event(
        event=number,
        encounter=state.encounter,
        phase=phase,
        countdown=countdown,
        attacker=attacker.value,
        defender=attacker.other.value,
        action=action,
        enclosure_move=move.value if move else None,
        frontier_depth=state.frontier_depth,
        frontier_scale=state.frontier_scale,
        a_depth=state.a_depth,
        a_scale=state.a_scale,
        b_depth=state.b_depth,
        b_scale=state.b_scale,
        levels_equal=state.level(Player.A) == state.level(Player.B),
        winner=state.winner,
        loser=state.loser,
        utility_a=state.utility_a,
        utility_b=state.utility_b,
        active=state.active,
        note=note,
    )


def play_forever() -> Iterator[Event]:
    """Generate the game without a terminal condition or random input."""

    state = GameState()
    moves = square_spiral_moves()
    event_numbers = count(1)

    for encounter in count(1):
        state.encounter = encounter
        attacker = Player.A if encounter % 2 else Player.B
        defender = attacker.other

        yield make_event(
            next(event_numbers),
            state,
            attacker,
            "POSITION",
            2,
            "SEEK_OPPONENT_LEVEL",
            (
                f"Player {attacker.value} targets Player {defender.value}'s "
                "current depth and scale."
            ),
        )

        target_depth, target_scale = state.level(defender)
        state.move_player(attacker, target_depth, target_scale)
        yield make_event(
            next(event_numbers),
            state,
            attacker,
            "COMMIT",
            1,
            "MATCH_OPPONENT_LEVEL",
            "Both players now occupy the same level; victory would mature after one more event.",
        )

        vector = next(moves)
        state.frontier_depth += vector.depth
        state.frontier_scale += vector.scale
        state.move_player(
            defender,
            state.frontier_depth,
            state.frontier_scale,
        )
        yield make_event(
            next(event_numbers),
            state,
            attacker,
            "BOUNDARY",
            0,
            "EVADE_AT_LAST_MOMENT",
            (
                f"Player {defender.value} changes the enclosure; the pending victory "
                "is no longer defined at the new depth and scale."
            ),
            vector.move,
        )


def observe(evasions: int) -> list[Event]:
    """Return a finite observable prefix containing ``evasions`` encounters."""

    if evasions < 1:
        raise ValueError("evasions must be at least 1")
    events = play_forever()
    return [next(events) for _ in range(evasions * 3)]


def validate_prefix(events: list[Event]) -> dict[str, bool]:
    """Check invariants that must hold on every finite prefix."""

    boundary = [event for event in events if event.phase == "BOUNDARY"]
    encounters: dict[int, list[Event]] = {}
    for event in events:
        encounters.setdefault(event.encounter, []).append(event)

    return {
        "deterministic_rule_only": True,
        "no_terminal_state": all(event.active for event in events),
        "no_winner": all(event.winner is None for event in events),
        "no_loser": all(event.loser is None for event in events),
        "zero_utility_for_all_players": all(
            event.utility_a == 0 and event.utility_b == 0 for event in events
        ),
        "every_threat_evaded_at_countdown_zero": all(
            len(group) == 3
            and [event.countdown for event in group] == [2, 1, 0]
            and group[1].action == "MATCH_OPPONENT_LEVEL"
            and group[1].levels_equal
            and group[-1].action == "EVADE_AT_LAST_MOMENT"
            and not group[-1].levels_equal
            for group in encounters.values()
        ),
        "players_continuously_seek_each_others_level": all(
            len(group) == 3
            and group[0].action == "SEEK_OPPONENT_LEVEL"
            and group[1].levels_equal
            for group in encounters.values()
        ),
        "attacker_alternates": all(
            events[index * 3].attacker == ("A" if index % 2 == 0 else "B")
            for index in range(len(events) // 3)
        ),
        "each_completed_encounter_changes_enclosure": all(
            event.enclosure_move is not None for event in boundary
        ),
    }


def build_report(evasions: int) -> dict:
    events = observe(evasions)
    checks = validate_prefix(events)
    if not all(checks.values()):
        failed = [name for name, passed in checks.items() if not passed]
        raise RuntimeError(f"game invariant failed: {', '.join(failed)}")

    boundary = [event for event in events if event.phase == "BOUNDARY"]
    move_counts = {
        move.value: sum(event.enclosure_move == move.value for event in boundary)
        for move in EnclosureMove
    }
    final = events[-1]
    return {
        "model": "Zero Infinity Nonterminal Enclosure Game",
        "rules": {
            "players": ["A", "B"],
            "payoffs": {"A": 0, "B": 0},
            "terminal_states": [],
            "victory_window": [2, 1, 0],
            "pursuit": "active player matches the other player's depth and scale",
            "evasion_timing": "countdown zero: last lawful moment",
            "enclosure_path": "expanding square spiral on signed depth x scale",
            "randomness": None,
        },
        "infinite_construction": {
            "generator": "play_forever",
            "depth_domain": "integers, unbounded by rule",
            "scale_domain": "integers, unbounded by rule",
            "proof_sketch": (
                "Square-spiral segment lengths increase without bound while directions "
                "cycle through positive and negative depth and scale. No transition sets "
                "active false or assigns winner, loser, or nonzero utility."
            ),
        },
        "observed_prefix": {
            "evasions": evasions,
            "events": len(events),
            "final_frontier_depth": final.frontier_depth,
            "final_frontier_scale": final.frontier_scale,
            "final_player_levels": {
                "A": [final.a_depth, final.a_scale],
                "B": [final.b_depth, final.b_scale],
            },
            "move_counts": move_counts,
        },
        "invariants": checks,
        "events": [asdict(event) for event in events],
    }


def print_event(event: Event, stream: TextIO) -> None:
    levels = (
        f"A=({event.a_depth:+d},{event.a_scale:+d}) "
        f"B=({event.b_depth:+d},{event.b_scale:+d})"
    )
    move = f" via {event.enclosure_move}" if event.enclosure_move else ""
    print(
        f"E{event.encounter:03d}.{event.countdown} "
        f"{event.attacker}->{event.defender} {event.action}{move} {levels}",
        file=stream,
    )


def print_report(report: dict, stream: TextIO) -> None:
    print("ZERO INFINITY NONTERMINAL ENCLOSURE GAME", file=stream)
    print("No score. No terminal state. No randomizer.", file=stream)
    print("Each player seeks the other's level.", file=stream)
    print("Each matched victory condition is evaded at countdown zero.\n", file=stream)
    for event_data in report["events"]:
        print_event(Event(**event_data), stream)
    observed = report["observed_prefix"]
    print("\nObserved prefix", file=stream)
    print(f"  encounters evaded: {observed['evasions']}", file=stream)
    print(
        "  final frontier:    "
        f"({observed['final_frontier_depth']:+d}, "
        f"{observed['final_frontier_scale']:+d})",
        file=stream,
    )
    print(f"  player levels:      {observed['final_player_levels']}", file=stream)
    print("  winner:             none", file=stream)
    print("  loser:              none", file=stream)
    print("  game active:        true", file=stream)
    print("  next event exists:  true", file=stream)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run the deterministic Zero Infinity nonterminal game"
    )
    parser.add_argument(
        "--evasions",
        type=int,
        default=12,
        help="number of completed encounters to observe (default: 12)",
    )
    parser.add_argument("--json-out", type=Path, help="write the observed prefix as JSON")
    parser.add_argument(
        "--stream",
        action="store_true",
        help="run the infinite generator until interrupted",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.stream:
        print("Streaming an endless deterministic game. Interrupt to stop observing.")
        try:
            for event in play_forever():
                print_event(event, sys.stdout)
        except KeyboardInterrupt:
            print("\nObservation stopped; the model contains no terminal transition.")
        return 0

    report = build_report(args.evasions)
    print_report(report, sys.stdout)
    if args.json_out:
        args.json_out.parent.mkdir(parents=True, exist_ok=True)
        args.json_out.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
        print(f"\nWrote {args.json_out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
