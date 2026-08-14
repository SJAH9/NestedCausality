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

    def test_all_ten_volume_slots_exist(self):
        registry = json.loads((ROOT / "data" / "volume_destinations.json").read_text(encoding="utf-8"))
        self.assertEqual([item["volume"] for item in registry["volumes"]], list(range(1, 11)))


if __name__ == "__main__":
    unittest.main()
