"""Composition and validation for a complete Continuum Map record."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Mapping

from .modules import (
    DepartureModule,
    EnclosureModule,
    ExchangeModule,
    FrontierModule,
    IVMPassageModule,
    ReferenceModule,
    ScaleRouteModule,
    TargetingModule,
)


@dataclass(frozen=True)
class AtlasRecord:
    raw: Mapping[str, Any]
    reference: ReferenceModule
    departure: DepartureModule
    enclosure: EnclosureModule
    ivm_passage: IVMPassageModule
    exchange: ExchangeModule
    scale_route: ScaleRouteModule
    frontier: FrontierModule
    target: TargetingModule

    @classmethod
    def compose(cls, raw: Mapping[str, Any]) -> "AtlasRecord":
        if raw.get("schema_version") != "0.1.0":
            raise ValueError("unsupported atlas schema version")
        return cls(
            raw=raw,
            reference=ReferenceModule.map(raw.get("reference", {})),
            departure=DepartureModule.map(raw.get("departure", {})),
            enclosure=EnclosureModule.map(
                raw.get("active_enclosure", {}),
                raw.get("enclosing_enclosures", []),
                raw.get("enclosed_enclosures", []),
                raw.get("parallel_enclosures", []),
            ),
            ivm_passage=IVMPassageModule.map(raw.get("ivm_passage", {})),
            exchange=ExchangeModule.map(raw.get("exchanges", [])),
            scale_route=ScaleRouteModule.map(raw.get("scale_route", {})),
            frontier=FrontierModule.map(raw.get("final_frontier", {})),
            target=TargetingModule.map(raw.get("target", {})),
        )

    def summary(self) -> dict[str, Any]:
        return {
            "id": self.raw["inquiry"]["id"],
            "title": self.raw["inquiry"]["title"],
            "departure": self.departure.description,
            "active_enclosure": self.enclosure.active["name"],
            "enclosing_count": len(self.enclosure.enclosing),
            "enclosed_count": len(self.enclosure.enclosed),
            "parallel_count": len(self.enclosure.parallel),
            "ivm_address": self.ivm_passage.current_address,
            "jitterbug_state": self.ivm_passage.jitterbug_state,
            "exchange_count": len(self.exchange.exchanges),
            "unresolved_exchange_count": len(self.exchange.unresolved),
            "current_tier": self.scale_route.current_tier,
            "frontier": self.frontier.halt_reason,
            "target": self.target.boundary_condition,
        }


def load_record(path: str | Path) -> AtlasRecord:
    with Path(path).open("r", encoding="utf-8") as handle:
        return AtlasRecord.compose(json.load(handle))
