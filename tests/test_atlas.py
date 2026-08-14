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


if __name__ == "__main__":
    unittest.main()
