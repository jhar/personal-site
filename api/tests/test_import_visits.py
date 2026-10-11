import importlib.util
from pathlib import Path

spec = importlib.util.spec_from_file_location(
    "import_visits", Path(__file__).resolve().parents[2] / "scripts" / "import_visits.py"
)
import_visits = importlib.util.module_from_spec(spec)
spec.loader.exec_module(import_visits)


def test_kv_entry_keeps_id_and_timestamp():
    visit, visit_id = import_visits.to_visit(
        {
            "key": ["visits", "1760000000000", "abc-123"],
            "value": {"ip": "1.2.3.4", "path": "/", "ts": "2025-10-09T08:53:20.000Z"},
        }
    )
    assert visit_id == "abc-123"
    assert visit["ts"] == "2025-10-09T08:53:20.000Z"
    assert visit["country"] == "unknown"
    assert visit["referrer"] == ""


def test_missing_ts_falls_back_to_key_time():
    visit, _ = import_visits.to_visit({"key": ["visits", "1760000000000", "x"], "value": {}})
    assert visit["ts"] == "2025-10-09T08:53:20.000Z"
