import json
import unittest
from pathlib import Path

from src.atlas import load_record
from src.modules import MapError


ROOT = Path(__file__).resolve().parents[1]


class AtlasTests(unittest.TestCase):
    def setUp(self):
        self.path = ROOT / "data" / "candle_flame.json"
        self.raw = json.loads(self.path.read_text(encoding="utf-8"))

    def test_worked_record_composes(self):
        record = load_record(self.path)
        self.assertEqual(record.reference.scale_address, "human-visible combustion enclosure")
        self.assertEqual(record.enclosure.active["id"], "flame-envelope")
        self.assertEqual(len(record.enclosure.projection_tests()), 1)
        self.assertEqual(record.ivm_passage.active_cell["geometry"], "tetrahedral_octahedral_junction")

    def test_exchange_retains_residual(self):
        record = load_record(self.path)
        self.assertTrue(all("residual" in item for item in record.exchange.exchanges))

    def test_time_address_is_bounded_and_ternary(self):
        record = load_record(self.path)
        self.assertTrue(record.time_address.beginning_boundary)
        self.assertTrue(record.time_address.ending_boundary)
        self.assertIn(record.time_address.phase, (-1, 0, 1, "unassigned"))
        self.assertTrue(record.time_address.final_frontier)

    def test_final_frontier_has_two_scale_extremes_and_time(self):
        record = load_record(self.path)
        self.assertIn("Planck", record.frontier.inward["mapped_anchor"])
        self.assertIn("beyond", record.frontier.inward["frontier_beyond"])
        self.assertIn("beyond", record.frontier.outward["frontier_beyond"])
        self.assertTrue(record.frontier.temporal["ending_boundary"])

    def test_projection_is_outer_to_inner(self):
        record = load_record(self.path)
        outer_ids = {item["id"] for item in record.enclosure.enclosing}
        layout = json.loads((ROOT / "data" / "star_layout.json").read_text(encoding="utf-8"))
        projection_edges = [edge for edge in layout["edges"] if edge["kind"] == "projection"]
        self.assertTrue(projection_edges)
        self.assertTrue(all(edge["source"] in outer_ids for edge in projection_edges))
        self.assertTrue(all(edge["target"] == record.enclosure.active["id"] for edge in projection_edges))

    def test_missing_enclosing_relation_fails(self):
        broken = dict(self.raw)
        broken["enclosing_enclosures"] = []
        with self.assertRaises(MapError):
            from src.atlas import AtlasRecord
            AtlasRecord.compose(broken)

    def test_scale_route_names_the_ivm_passage(self):
        record = load_record(self.path)
        self.assertEqual(
            record.raw["scale_route"]["ivm_passage_id"],
            record.ivm_passage.current_address,
        )

    def test_ivm_passage_requires_preserved_quantities(self):
        broken = json.loads(json.dumps(self.raw))
        broken["ivm_passage"]["preserved_across_passage"] = []
        with self.assertRaises(MapError):
            from src.atlas import AtlasRecord
            AtlasRecord.compose(broken)

    def test_all_ten_volume_slots_exist(self):
        registry = json.loads((ROOT / "data" / "volume_destinations.json").read_text(encoding="utf-8"))
        self.assertEqual([item["volume"] for item in registry["volumes"]], list(range(1, 11)))

    def test_star_map_contains_repeated_ivm_passage(self):
        layout = json.loads((ROOT / "data" / "star_layout.json").read_text(encoding="utf-8"))
        roles = {cell["role"] for cell in layout["ivm_cells"]}
        self.assertIn("active", roles)
        self.assertIn("adjacent", roles)
        self.assertGreaterEqual(len(layout["ivm_cells"]), 3)
        passages = [edge for edge in layout["edges"] if edge["kind"] == "ivm"]
        self.assertEqual(len(passages), 1)
        self.assertEqual(passages[0]["target"], "adjacent-ivm")

    def test_star_map_places_frontiers_beyond_displayed_scale_anchors(self):
        layout = json.loads((ROOT / "data" / "star_layout.json").read_text(encoding="utf-8"))
        frontiers = layout["frontiers"]
        outward = frontiers["outward"]

        displayed_points = []
        for node in layout["nodes"]:
            radius = node["size"] + 11
            displayed_points.extend((
                (node["x"] - radius, node["y"]),
                (node["x"] + radius, node["y"]),
                (node["x"], node["y"] - radius),
                (node["x"], node["y"] + radius),
            ))
        for cell in layout["ivm_cells"]:
            displayed_points.extend((
                (cell["cx"] - .866 * cell["radius"], cell["cy"]),
                (cell["cx"] + .866 * cell["radius"], cell["cy"]),
                (cell["cx"], cell["cy"] - cell["radius"]),
                (cell["cx"], cell["cy"] + cell["radius"]),
            ))

        for x, y in displayed_points:
            position = ((x - outward["cx"]) / outward["rx"]) ** 2 + ((y - outward["cy"]) / outward["ry"]) ** 2
            self.assertLess(position, 1, f"displayed point {(x, y)} crosses the outward Final Frontier")

        self.assertIn("PLANCK", frontiers["inward"]["label"].upper())
        self.assertTrue(frontiers["temporal"]["path"].startswith("M"))
        self.assertNotEqual(frontiers["temporal"]["begin_x"], frontiers["temporal"]["end_x"])

    def test_schema_requires_temporal_address_and_three_frontier_directions(self):
        schema = json.loads((ROOT / "data" / "atlas.schema.json").read_text(encoding="utf-8"))
        self.assertIn("time_address", schema["required"])
        frontier_required = schema["properties"]["final_frontier"]["required"]
        self.assertIn("scale_extremes", frontier_required)
        self.assertIn("temporal_frontier", frontier_required)


if __name__ == "__main__":
    unittest.main()
