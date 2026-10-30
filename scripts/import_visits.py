"""Turn visits exported from Deno KV into SQL for the D1 visits table.

Export first with scripts/deno/export-kv-visits.ts, then:

    npm run import-visits -- visits.json > visits.sql
    npx wrangler d1 execute DB --remote --env production --file visits.sql

Original timestamps are kept, and each visit keeps its KV id, so re-running
overwrites instead of duplicating.
"""

import json
import sys
from datetime import UTC, datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "api" / "src"))

from site_api.store import FIELDS, INSERT_VISIT, visit_row  # noqa: E402


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
    return visit, str(visit_id)


def sql_literal(value: str) -> str:
    return "'" + value.replace("\x00", "").replace("'", "''") + "'"


def to_sql(entries: list[dict]) -> str:
    head = INSERT_VISIT.split(" VALUES ")[0]
    lines = []
    for entry in entries:
        values = ", ".join(sql_literal(v) for v in visit_row(*to_visit(entry)))
        lines.append(f"{head} VALUES ({values});")
    return "\n".join(lines) + "\n"


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit("usage: npm run import-visits -- <visits.json> > visits.sql")
    entries = json.loads(Path(sys.argv[1]).read_text())
    sys.stdout.write(to_sql(entries))
    print(f"wrote {len(entries)} visits", file=sys.stderr)


if __name__ == "__main__":
    main()
