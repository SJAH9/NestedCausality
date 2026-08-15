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
class IVMPassageModule:
    current_address: str
    vector_equilibrium: str
    departure_geometry: str
    active_cell: Mapping[str, Any]
    periphery_boundary: str
    saturation_quantity: str
    capacity_condition: str
    jitterbug_state: str
    adjacent_address: str
    passage_direction: str
    preserved: tuple[str, ...]
    evidence_status: str

    @classmethod
    def map(cls, record: Mapping[str, Any]) -> "IVMPassageModule":
        cell = record.get("active_cell", {})
        geometry = _require_text(cell.get("geometry"), "ivm_passage.active_cell.geometry")
        if geometry not in {
            "tetrahedral",
            "octahedral",
            "tetrahedral_octahedral_junction",
            "unresolved",
        }:
            raise MapError("ivm_passage.active_cell.geometry is not recognized")
        preserved = tuple(str(item) for item in record.get("preserved_across_passage", []))
        if not preserved:
            raise MapError("ivm_passage must name what is preserved across passage")
        return cls(
            _require_text(record.get("current_ivm_address"), "ivm_passage.current_ivm_address"),
            _require_text(record.get("vector_equilibrium"), "ivm_passage.vector_equilibrium"),
            _require_text(record.get("departure_geometry"), "ivm_passage.departure_geometry"),
            cell,
            _require_text(record.get("periphery_boundary"), "ivm_passage.periphery_boundary"),
            _require_text(record.get("saturation_quantity"), "ivm_passage.saturation_quantity"),
            _require_text(record.get("capacity_condition"), "ivm_passage.capacity_condition"),
            _require_text(record.get("jitterbug_state"), "ivm_passage.jitterbug_state"),
            _require_text(record.get("adjacent_ivm_address"), "ivm_passage.adjacent_ivm_address"),
            _require_text(record.get("passage_direction"), "ivm_passage.passage_direction"),
            preserved,
            _require_text(record.get("evidence_status"), "ivm_passage.evidence_status"),
        )


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
class TemporalAddressModule:
    beginning_boundary: str
    ending_boundary: str
    enclosing_clock: str
    counted_transition: str
    completed_passages: int | str
    phase: int | str
    passage_direction: str
    measured_rate: str
    scale_address: str
    final_frontier: str

    @classmethod
    def map(cls, record: Mapping[str, Any]) -> "TemporalAddressModule":
        for field in (
            "beginning_boundary",
            "ending_boundary",
            "enclosing_clock",
            "counted_transition",
            "measured_rate",
            "scale_address",
            "final_frontier",
        ):
            _require_text(record.get(field), f"time_address.{field}")
        if "completed_passages" not in record:
            raise MapError("time_address.completed_passages is required")
        if record.get("phase") not in (-1, 0, 1, "unassigned"):
            raise MapError("time_address.phase must be -1, 0, +1, or unassigned")
        return cls(
            record["beginning_boundary"],
            record["ending_boundary"],
            record["enclosing_clock"],
            record["counted_transition"],
            record["completed_passages"],
            record["phase"],
            _require_text(record.get("passage_direction"), "time_address.passage_direction"),
            record["measured_rate"],
            record["scale_address"],
            record["final_frontier"],
        )


@dataclass(frozen=True)
class FrontierModule:
    observed_end: str
    derived_end: str
    unavailable: str
    halt_reason: str
    inward: Mapping[str, Any]
    outward: Mapping[str, Any]
    temporal: Mapping[str, Any]

    @classmethod
    def map(cls, record: Mapping[str, Any]) -> "FrontierModule":
        values = [
            _require_text(record.get(field), f"final_frontier.{field}")
            for field in ("observed_end", "derived_end", "unavailable", "halt_reason")
        ]
        extremes = record.get("scale_extremes", {})
        inward = extremes.get("inward", {})
        outward = extremes.get("outward", {})
        temporal = record.get("temporal_frontier", {})
        for direction, extreme in (("inward", inward), ("outward", outward)):
            for field in ("mapped_anchor", "frontier_beyond", "reason"):
                _require_text(extreme.get(field), f"final_frontier.scale_extremes.{direction}.{field}")
        for field in ("beginning_boundary", "ending_boundary", "beyond_current_count", "halt_condition"):
            _require_text(temporal.get(field), f"final_frontier.temporal_frontier.{field}")
        return cls(*values, inward, outward, temporal)


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
