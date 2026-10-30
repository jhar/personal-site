"""In-process stand-in for a D1 binding, backed by sqlite3 with the real migrations.

Mirrors what the Workers Python SDK hands back: run() / all() / first() are
awaitable and return plain Python values.
"""

import sqlite3
from pathlib import Path

MIGRATIONS = Path(__file__).resolve().parents[1] / "migrations"


class FakeD1:
    def __init__(self) -> None:
        self.conn = sqlite3.connect(":memory:")
        self.conn.row_factory = sqlite3.Row
        for migration in sorted(MIGRATIONS.glob("*.sql")):
            self.conn.executescript(migration.read_text())

    def prepare(self, sql: str) -> "Statement":
        return Statement(self.conn, sql)


class Statement:
    def __init__(self, conn: sqlite3.Connection, sql: str, params: tuple = ()) -> None:
        self.conn, self.sql, self.params = conn, sql, params

    def bind(self, *params) -> "Statement":
        return Statement(self.conn, self.sql, params)

    async def run(self) -> dict:
        self.conn.execute(self.sql, self.params)
        return {"success": True}

    async def all(self) -> dict:
        rows = self.conn.execute(self.sql, self.params).fetchall()
        return {"success": True, "results": [dict(r) for r in rows]}

    async def first(self) -> dict | None:
        row = self.conn.execute(self.sql, self.params).fetchone()
        return dict(row) if row else None
