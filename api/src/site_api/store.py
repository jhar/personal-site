"""Visit storage, Snek-VG scores and the shared cache, in Cloudflare D1 (SQLite).

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
    f"SELECT {', '.join(COLUMNS.values())} FROM visits ORDER BY ts DESC, id DESC LIMIT ? OFFSET ?"
)

# Snek-VG scoreboard entry, as stored.
Score = dict[str, Any]
SCORE_FIELDS = ("id", "ts", "initials", "score", "input", "city", "country", "ip_hash")
# What the public scoreboard shows: no ip_hash.
PUBLIC_SCORE_FIELDS = ("id", "ts", "initials", "score", "input", "city", "country")

INSERT_SCORE = (
    f"INSERT INTO snek_scores ({', '.join(SCORE_FIELDS)}) "
    f"VALUES ({', '.join('?' for _ in SCORE_FIELDS)})"
)
TOP_SCORES = (
    f"SELECT {', '.join(PUBLIC_SCORE_FIELDS)} FROM snek_scores WHERE input = ? "
    "ORDER BY score DESC, ts ASC, id ASC LIMIT ?"
)
# The admin view: every score on a board, ip_hash included, same order.
RANKED_SCORES = (
    f"SELECT {', '.join(SCORE_FIELDS)} FROM snek_scores WHERE input = ? "
    "ORDER BY score DESC, ts ASC, id ASC LIMIT ? OFFSET ?"
)


class Store(Protocol):
    async def add_visit(self, visit: Visit, visit_id: str) -> None: ...

    async def recent_visits(self, limit: int, offset: int = 0) -> list[Visit]:
        """Newest first, skipping the first offset."""
        ...

    async def count_visits(self) -> int: ...

    async def get_cached(self, key: str) -> tuple[str, float] | None:
        """(value, fetched_at) or None."""
        ...

    async def put_cached(self, key: str, value: str, fetched_at: float) -> None: ...

    async def add_score(self, score: Score) -> None: ...

    async def has_score(self, score_id: str) -> bool: ...

    async def top_scores(self, method: str, limit: int) -> list[Score]:
        """One input method's board, highest first; ties go to whoever got there first."""
        ...

    async def count_scores_since(self, ts: str, ip_hash: str | None = None) -> int:
        """Scores submitted at or after ts, from ip_hash if given."""
        ...

    async def ranked_scores(self, method: str, limit: int, offset: int = 0) -> list[Score]:
        """Like top_scores, but with every stored field (ip_hash too) and an offset."""
        ...

    async def count_scores(self, method: str) -> int: ...


class D1Store:
    """Takes the Worker's D1 binding (env.DB)."""

    def __init__(self, db: Any):
        self.db = db

    async def add_visit(self, visit: Visit, visit_id: str) -> None:
        await self.db.prepare(INSERT_VISIT).bind(*visit_row(visit, visit_id)).run()

    async def recent_visits(self, limit: int, offset: int = 0) -> list[Visit]:
        res = _py(await self.db.prepare(RECENT_VISITS).bind(limit, offset).all())
        return [_from_row(row) for row in res["results"]]

    async def count_visits(self) -> int:
        row = _py(await self.db.prepare("SELECT COUNT(*) AS n FROM visits").first())
        return int(row["n"]) if row else 0

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

    async def add_score(self, score: Score) -> None:
        await self.db.prepare(INSERT_SCORE).bind(*(score[f] for f in SCORE_FIELDS)).run()

    async def has_score(self, score_id: str) -> bool:
        row = _py(
            await self.db.prepare("SELECT 1 AS found FROM snek_scores WHERE id = ?")
            .bind(score_id)
            .first()
        )
        return bool(row)

    async def top_scores(self, method: str, limit: int) -> list[Score]:
        res = _py(await self.db.prepare(TOP_SCORES).bind(method, limit).all())
        return [_score_from_row(row) for row in res["results"]]

    async def count_scores_since(self, ts: str, ip_hash: str | None = None) -> int:
        if ip_hash is None:
            stmt = self.db.prepare("SELECT COUNT(*) AS n FROM snek_scores WHERE ts >= ?").bind(ts)
        else:
            stmt = self.db.prepare(
                "SELECT COUNT(*) AS n FROM snek_scores WHERE ip_hash = ? AND ts >= ?"
            ).bind(ip_hash, ts)
        row = _py(await stmt.first())
        return int(row["n"]) if row else 0

    async def ranked_scores(self, method: str, limit: int, offset: int = 0) -> list[Score]:
        res = _py(await self.db.prepare(RANKED_SCORES).bind(method, limit, offset).all())
        return [_score_from_row(row, SCORE_FIELDS) for row in res["results"]]

    async def count_scores(self, method: str) -> int:
        row = _py(
            await self.db.prepare("SELECT COUNT(*) AS n FROM snek_scores WHERE input = ?")
            .bind(method)
            .first()
        )
        return int(row["n"]) if row else 0


def visit_row(visit: Visit, visit_id: str) -> tuple[str, ...]:
    """Values for INSERT_VISIT, in order."""
    return (visit_id, *(visit[f] for f in FIELDS))


def _from_row(row: dict[str, Any]) -> Visit:
    return {field: str(row.get(column) or "") for field, column in COLUMNS.items()}


def _score_from_row(row: dict[str, Any], fields: tuple[str, ...] = PUBLIC_SCORE_FIELDS) -> Score:
    score = {field: str(row.get(field) or "") for field in fields}
    score["score"] = int(row.get("score") or 0)
    return score


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
        self.scores: list[Score] = []

    async def add_visit(self, visit: Visit, visit_id: str) -> None:
        self.visits.append(visit)

    async def recent_visits(self, limit: int, offset: int = 0) -> list[Visit]:
        return sorted(self.visits, key=lambda v: v["ts"], reverse=True)[offset : offset + limit]

    async def count_visits(self) -> int:
        return len(self.visits)

    async def get_cached(self, key: str) -> tuple[str, float] | None:
        return self.cache.get(key)

    async def put_cached(self, key: str, value: str, fetched_at: float) -> None:
        self.cache[key] = (value, fetched_at)

    async def add_score(self, score: Score) -> None:
        if await self.has_score(score["id"]):
            raise ValueError("duplicate score id")
        self.scores.append(dict(score))

    async def has_score(self, score_id: str) -> bool:
        return any(s["id"] == score_id for s in self.scores)

    async def top_scores(self, method: str, limit: int) -> list[Score]:
        return [{f: s[f] for f in PUBLIC_SCORE_FIELDS} for s in self._ranked(method)[:limit]]

    async def ranked_scores(self, method: str, limit: int, offset: int = 0) -> list[Score]:
        return [dict(s) for s in self._ranked(method)[offset : offset + limit]]

    async def count_scores(self, method: str) -> int:
        return len(self._ranked(method))

    def _ranked(self, method: str) -> list[Score]:
        mine = [s for s in self.scores if s["input"] == method]
        return sorted(mine, key=lambda s: (-s["score"], s["ts"], s["id"]))

    async def count_scores_since(self, ts: str, ip_hash: str | None = None) -> int:
        return sum(
            1 for s in self.scores if s["ts"] >= ts and (ip_hash is None or s["ip_hash"] == ip_hash)
        )
