"""Load visits exported from Deno KV into the DynamoDB visits table.

Export first with scripts/deno/export-kv-visits.ts, then:

    npm run import-visits -- visits.json personal-site-prod-visits

Uses your local AWS credentials (AWS_PROFILE / AWS_REGION as usual). Original
timestamps are kept, and each visit keeps its KV id, so re-running overwrites
instead of duplicating.
"""

import json
import os
import sys
from datetime import UTC, datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "api"))

from site_api.store import FIELDS, DynamoVisitStore  # noqa: E402


def to_visit(entry: dict) -> tuple[dict[str, str], str]:
    key, value = entry["key"], entry["value"]
    defaults = {"country": "unknown", "region": "unknown", "city": "unknown", "ip": "unknown"}
    visit = {f: str(value.get(f) or defaults.get(f, "")) for f in FIELDS}
    if not visit["ts"]:
        visit["ts"] = (
            datetime.fromtimestamp(int(key[1]) / 1000, UTC)
            .isoformat(timespec="milliseconds")
            .replace("+00:00", "Z")
        )
    visit_id = key[2] if len(key) > 2 else "-".join(map(str, key))
    return visit, visit_id


def main() -> None:
    if len(sys.argv) != 3:
        sys.exit("usage: npm run import-visits -- <visits.json> <table>")
    file, table = sys.argv[1], sys.argv[2]
    visits = [to_visit(e) for e in json.loads(Path(file).read_text())]
    DynamoVisitStore(table, os.environ.get("DYNAMODB_ENDPOINT")).add_many(visits)
    print(f"imported {len(visits)} visits into {table}")


if __name__ == "__main__":
    main()
