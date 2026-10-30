"""Routes for /api/*, kept free of Workers APIs so they can be tested with plain pytest.

src/entry.py adapts the Worker's request, env and fetch to these types.
"""

import hmac
import json
import logging
import time
import uuid
from collections.abc import Awaitable, Callable
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any

from .letterboxd import Movie
from .store import Store, Visit

log = logging.getLogger(__name__)

NO_STORE = {"cache-control": "no-store"}
MOVIES_KEY = "letterboxd"
MOVIES_TTL_SECONDS = 15 * 60
MAX_FIELD = 1024


@dataclass
class Request:
    method: str
    path: str
    query: dict[str, str] = field(default_factory=dict)
    # Lower-cased header names.
    headers: dict[str, str] = field(default_factory=dict)
    # Cloudflare's request.cf geolocation: country, region, city.
    geo: dict[str, str] = field(default_factory=dict)


@dataclass
class Response:
    status: int
    headers: dict[str, str]
    body: str = ""


@dataclass
class Deps:
    store: Store
    fetch_movies: Callable[[], Awaitable[list[Movie]]]
    admin_token: str | None = None
    now: Callable[[], float] = time.time


async def handle_request(req: Request, deps: Deps) -> Response:
    if req.method != "GET":
        return _json(405, {"error": "method not allowed"}, NO_STORE)
    if req.path == "/api/visit":
        return await _log_visit(req, deps)
    if req.path == "/api/letterboxd":
        return await _letterboxd(deps)
    if req.path == "/api/admin/visits":
        return await _admin_visits(req, deps)
    return _json(404, {"error": "not found"}, NO_STORE)


async def _log_visit(req: Request, deps: Deps) -> Response:
    path = req.query.get("path", "")
    if not path.startswith("/") or path.startswith("/admin"):
        return Response(204, NO_STORE)

    h, geo = req.headers, req.geo
    visit: Visit = {
        "ip": _clip(h.get("cf-connecting-ip")) or "unknown",
        # Cloudflare's request.cf geolocation.
        "country": _clip(geo.get("country")) or "unknown",
        "region": _clip(geo.get("region")) or "unknown",
        "city": _clip(geo.get("city")) or "unknown",
        "path": _clip(path),
        "referrer": _clip(req.query.get("referrer")),
        "userAgent": _clip(h.get("user-agent")),
        "ts": datetime.fromtimestamp(deps.now(), UTC)
        .isoformat(timespec="milliseconds")
        .replace("+00:00", "Z"),
    }
    try:
        await deps.store.add_visit(visit, str(uuid.uuid4()))
    except Exception:
        # Never let logging break the app
        log.exception("failed to store visit")
    return Response(204, NO_STORE)


# Per-isolate copy of the feed, in front of the D1 copy every isolate shares.
_movies_cache: dict[str, Any] = {}


async def _letterboxd(deps: Deps) -> Response:
    now = deps.now()
    cached = _movies_cache.get("value")
    if cached is None or now - cached["fetched_at"] >= MOVIES_TTL_SECONDS:
        shared = await _shared_movies(deps)
        if shared and (cached is None or shared["fetched_at"] > cached["fetched_at"]):
            cached = shared
    if cached is None or now - cached["fetched_at"] >= MOVIES_TTL_SECONDS:
        try:
            movies = await deps.fetch_movies()
            cached = {"body": json.dumps(movies), "fetched_at": now}
            await _save_movies(deps, cached)
        except Exception:
            log.exception("letterboxd fetch failed")
            if cached is None:
                return _json(502, [], NO_STORE)
    _movies_cache["value"] = cached
    # Browsers may keep it for 15 minutes too.
    return Response(
        200,
        {"content-type": "application/json", "cache-control": "public, max-age=900"},
        cached["body"],
    )


async def _shared_movies(deps: Deps) -> dict[str, Any] | None:
    try:
        row = await deps.store.get_cached(MOVIES_KEY)
    except Exception:
        log.exception("failed to read letterboxd cache")
        return None
    return {"body": row[0], "fetched_at": row[1]} if row else None


async def _save_movies(deps: Deps, cached: dict[str, Any]) -> None:
    try:
        await deps.store.put_cached(MOVIES_KEY, cached["body"], cached["fetched_at"])
    except Exception:
        log.exception("failed to write letterboxd cache")


async def _admin_visits(req: Request, deps: Deps) -> Response:
    given = req.headers.get("x-admin-token", "")
    if not deps.admin_token or not hmac.compare_digest(deps.admin_token, given):
        return _json(401, {"error": "unauthorized"}, NO_STORE)
    return _json(200, await deps.store.recent_visits(500), NO_STORE)


def _clip(value: str | None) -> str:
    return (value or "")[:MAX_FIELD]


def _json(status: int, body: Any, headers: dict[str, str]) -> Response:
    return Response(status, {"content-type": "application/json", **headers}, json.dumps(body))


def reset_movies_cache() -> None:
    """Test hook."""
    _movies_cache.clear()
