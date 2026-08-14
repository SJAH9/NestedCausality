"""Composable mapping modules for the Nested Causality Atlas.

The modules do not infer truth. They preserve direction, boundary, address,
exchange, and halt conditions so an inquiry can be tested without flattening
its structure.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Iterable, Mapping


class MapError(ValueError):
    """Raised when an atlas record violates a structural mapping condition."""


def _require_text(value: Any, field: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise MapError(f"{field} must contain text")
    return value.strip()


@dataclass(frozen=True)
class ReferenceModule:
    local_zero: str
    scale_address: str
    duration: str
    justification: str

    @classmethod
    def map(cls, record: Mapping[str, Any]) -> "ReferenceModule":
        return cls(
            _require_text(record.get("local_zero"), "reference.local_zero"),
            _require_text(record.get("scale_address"), "reference.scale_address"),
            _require_text(record.get("duration"), "reference.duration"),
            _require_text(record.get("justification"), "reference.justification"),
        )


@dataclass(frozen=True)
class DepartureModule:
    description: str
    sign: int | str
    magnitude: float | str
    unit: str
    duration: str
    state: str

    @classmethod
    def map(cls, record: Mapping[str, Any]) -> "DepartureModule":
        sign = record.get("sign")
        if sign not in (-1, 0, 1, "unassigned"):
            raise MapError("departure.sign must be -1, 0, +1, or unassigned")
        return cls(
            _require_text(record.get("description"), "departure.description"),
            sign,
            record.get("magnitude", "unmeasured"),
            str(record.get("unit", "")),
            _require_text(record.get("duration"), "departure.duration"),
            _require_text(record.get("state"), "departure.state"),
        )


@dataclass(frozen=True)
class EnclosureModule:
    active: Mapping[str, Any]
    enclosing: tuple[Mapping[str, Any], ...]
    enclosed: tuple[Mapping[str, Any], ...]
    parallel: tuple[Mapping[str, Any], ...]

    @classmethod
    def map(
        cls,
        active: Mapping[str, Any],
        enclosing: Iterable[Mapping[str, Any]],
        enclosed: Iterable[Mapping[str, Any]],
        parallel: Iterable[Mapping[str, Any]],
    ) -> "EnclosureModule":
        for field in ("id", "name", "boundary", "maintained_identity"):
            _require_text(active.get(field), f"active_enclosure.{field}")
        outer = tuple(enclosing)
        inner = tuple(enclosed)
        peers = tuple(parallel)
        if not outer:
            raise MapError("an active enclosure requires a mapped enclosing relation")
        if not inner:
            raise MapError("an active enclosure requires a mapped enclosed relation")
        return cls(active, outer, inner, peers)

    def projection_tests(self) -> tuple[str, ...]:
        tests = []
        for enclosure in self.enclosing:
            tests.append(_require_text(enclosure.get("variation_test"), "variation_test"))
        return tuple(tests)


@dataclass(frozen=True)
class ExchangeModule:
    exchanges: tuple[Mapping[str, Any], ...]

    @classmethod
    def map(cls, records: Iterable[Mapping[str, Any]]) -> "ExchangeModule":
        entries = tuple(records)
        for index, entry in enumerate(entries):
            _require_text(entry.get("boundary"), f"exchanges[{index}].boundary")
            _require_text(entry.get("quantity"), f"exchanges[{index}].quantity")
            if "residual" not in entry:
                raise MapError(f"exchanges[{index}] must retain a residual")
            _require_text(entry.get("uncertainty"), f"exchanges[{index}].uncertainty")
        return cls(entries)

    @property
    def unresolved(self) -> tuple[Mapping[str, Any], ...]:
        return tuple(item for item in self.exchanges if item.get("status") == "unresolved")


@dataclass(frozen=True)
class ScaleRouteModule:
    current_tier: str
    local_authority: tuple[str, ...]
    escalation: Mapping[str, Any]
    deescalation: Mapping[str, Any]

    @classmethod
    def map(cls, record: Mapping[str, Any]) -> "ScaleRouteModule":
        authority = tuple(str(item) for item in record.get("local_authority", []))
        if not authority:
            raise MapError("scale_route.local_authority cannot be empty")
        return cls(
            _require_text(record.get("current_tier"), "scale_route.current_tier"),
            authority,
            record.get("escalation", {}),
            record.get("deescalation", {}),
        )


@dataclass(frozen=True)
class FrontierModule:
    observed_end: str
    derived_end: str
    unavailable: str
    halt_reason: str

    @classmethod
    def map(cls, record: Mapping[str, Any]) -> "FrontierModule":
        return cls(*(
            _require_text(record.get(field), f"final_frontier.{field}")
            for field in ("observed_end", "derived_end", "unavailable", "halt_reason")
        ))


@dataclass(frozen=True)
class TargetingModule:
    boundary_condition: str
    prediction: str
    alternative: str
    falsification: str
    return_path: tuple[str, ...]

    @classmethod
    def map(cls, record: Mapping[str, Any]) -> "TargetingModule":
        path = tuple(str(item) for item in record.get("return_path", []))
        if not path:
            raise MapError("target.return_path cannot be empty")
        return cls(
            _require_text(record.get("boundary_condition"), "target.boundary_condition"),
            _require_text(record.get("prediction"), "target.prediction"),
            _require_text(record.get("alternative"), "target.alternative"),
            _require_text(record.get("falsification"), "target.falsification"),
            path,
        )
