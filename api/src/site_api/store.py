"""Visit storage and the shared cache, in Cloudflare D1 (SQLite).

Schema is in api/migrations. Visits never expire.
"""

from typing import Any, Protocol

Visit = dict[str, str]

FIELDS = ("ip", "country", "region", "city", "path", "referrer", "userAgent", "ts")
# Visit field -> D1 column
COLUMNS = {field: "user_agent" if field == "userAgent" else field for field in FIELDS}

INSERT_VISIT = (
    f"INSERT OR REPLACE INTO visits (id, {', '.join(COLUMNS.values())}) "
    f"VALUES (?, {', '.join('?' for _ in FIELDS)})"
)
RECENT_VISITS = (
    f"SELECT {', '.join(COLUMNS.values())} FROM visits ORDER BY ts DESC, id DESC LIMIT ?"
)


class Store(Protocol):
    async def add_visit(self, visit: Visit, visit_id: str) -> None: ...

    async def recent_visits(self, limit: int) -> list[Visit]:
        """Newest first."""
        ...

    async def get_cached(self, key: str) -> tuple[str, float] | None:
        """(value, fetched_at) or None."""
        ...

    async def put_cached(self, key: str, value: str, fetched_at: float) -> None: ...


class D1Store:
    """Takes the Worker's D1 binding (env.DB)."""

    def __init__(self, db: Any):
        self.db = db

    async def add_visit(self, visit: Visit, visit_id: str) -> None:
        await self.db.prepare(INSERT_VISIT).bind(*visit_row(visit, visit_id)).run()

    async def recent_visits(self, limit: int) -> list[Visit]:
        res = _py(await self.db.prepare(RECENT_VISITS).bind(limit).all())
        return [_from_row(row) for row in res["results"]]

    async def get_cached(self, key: str) -> tuple[str, float] | None:
        row = _py(
            await self.db.prepare("SELECT value, fetched_at FROM cache WHERE key = ?")
            .bind(key)
            .first()
        )
        return (row["value"], float(row["fetched_at"])) if row else None

    async def put_cached(self, key: str, value: str, fetched_at: float) -> None:
        await (
            self.db.prepare(
                "INSERT OR REPLACE INTO cache (key, value, fetched_at) VALUES (?, ?, ?)"
            )
            .bind(key, value, fetched_at)
            .run()
        )


def visit_row(visit: Visit, visit_id: str) -> tuple[str, ...]:
    """Values for INSERT_VISIT, in order."""
    return (visit_id, *(visit[f] for f in FIELDS))


def _from_row(row: dict[str, Any]) -> Visit:
    return {field: str(row.get(column) or "") for field, column in COLUMNS.items()}


def _py(value: Any) -> Any:
    # The Workers SDK usually converts D1 results to Python already; this covers
    # the cases where a raw JS object (or JS null) comes back.
    if value is None or type(value).__name__ == "JsNull":
        return None
    to_py = getattr(value, "to_py", None)
    return to_py() if callable(to_py) else value


class MemoryStore:
    """For tests."""

    def __init__(self) -> None:
        self.visits: list[Visit] = []
        self.cache: dict[str, tuple[str, float]] = {}

    async def add_visit(self, visit: Visit, visit_id: str) -> None:
        self.visits.append(visit)

    async def recent_visits(self, limit: int) -> list[Visit]:
        return sorted(self.visits, key=lambda v: v["ts"], reverse=True)[:limit]

    async def get_cached(self, key: str) -> tuple[str, float] | None:
        return self.cache.get(key)

    async def put_cached(self, key: str, value: str, fetched_at: float) -> None:
        self.cache[key] = (value, fetched_at)
