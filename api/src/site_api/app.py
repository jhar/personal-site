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

from . import snek
from .letterboxd import Movie
from .store import Store, Visit

log = logging.getLogger(__name__)

NO_STORE = {"cache-control": "no-store"}
MOVIES_KEY = "letterboxd"
MOVIES_TTL_SECONDS = 15 * 60
MAX_FIELD = 1024
ADMIN_PAGE_SIZE = 100
MAX_ADMIN_PAGE_SIZE = 500


@dataclass
class Request:
    method: str
    path: str
    query: dict[str, str] = field(default_factory=dict)
    # Lower-cased header names.
    headers: dict[str, str] = field(default_factory=dict)
    # Cloudflare's request.cf geolocation: country, region, city.
    geo: dict[str, str] = field(default_factory=dict)
    # Request body, read only for POST.
    body: str = ""


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
    route = ROUTES.get(req.path)
    if route is None:
        return _json(404, {"error": "not found"}, NO_STORE)
    handler = route.get(req.method)
    if handler is None:
        return _json(405, {"error": "method not allowed"}, NO_STORE)
    return await handler(req, deps)


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
        "referrer": _referrer(req.query.get("referrer")),
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


async def _letterboxd(req: Request, deps: Deps) -> Response:
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


def _is_admin(req: Request, deps: Deps) -> bool:
    given = req.headers.get("x-admin-token", "")
    return bool(deps.admin_token) and hmac.compare_digest(deps.admin_token, given)


def _paging(req: Request) -> tuple[int, int]:
    """(page, per_page) from ?page= (1-based) and ?per=, clamped to sane values."""

    def num(name: str, default: int) -> int:
        try:
            return int(req.query.get(name, ""))
        except ValueError:
            return default

    per = min(max(num("per", ADMIN_PAGE_SIZE), 1), MAX_ADMIN_PAGE_SIZE)
    return max(num("page", 1), 1), per


async def _admin_visits(req: Request, deps: Deps) -> Response:
    if not _is_admin(req, deps):
        return _json(401, {"error": "unauthorized"}, NO_STORE)
    page, per = _paging(req)
    items = await deps.store.recent_visits(per, (page - 1) * per)
    total = await deps.store.count_visits()
    return _json(200, {"items": items, "total": total, "page": page, "per": per}, NO_STORE)


async def _admin_snek(req: Request, deps: Deps) -> Response:
    if not _is_admin(req, deps):
        return _json(401, {"error": "unauthorized"}, NO_STORE)
    method = req.query.get("input", "keyboard")
    if method not in snek.INPUTS:
        return _json(400, {"error": "input must be keyboard or touch"}, NO_STORE)
    page, per = _paging(req)
    offset = (page - 1) * per
    scores = await deps.store.ranked_scores(method, per, offset)
    items = [{"rank": offset + i + 1, **s} for i, s in enumerate(scores)]
    total = await deps.store.count_scores(method)
    return _json(200, {"items": items, "total": total, "page": page, "per": per}, NO_STORE)


async def _snek_scores(req: Request, deps: Deps) -> Response:
    return _json(200, await snek.boards(deps.store), NO_STORE)


async def _snek_new_game(req: Request, deps: Deps) -> Response:
    if not deps.admin_token:
        return _json(503, {"error": "scoreboard unavailable"}, NO_STORE)
    return _json(200, {"token": snek.issue_token(deps.admin_token, deps.now())}, NO_STORE)


async def _snek_submit(req: Request, deps: Deps) -> Response:
    if not deps.admin_token:
        return _json(503, {"error": "scoreboard unavailable"}, NO_STORE)
    # Browsers can't send JSON cross-site without a CORS preflight, which this
    # API never approves.
    if not req.headers.get("content-type", "").startswith("application/json"):
        return _json(415, {"error": "expected application/json"}, NO_STORE)
    try:
        score_id, board = await snek.submit(
            deps.store,
            deps.admin_token,
            req.body,
            req.headers.get("cf-connecting-ip") or "unknown",
            req.geo,
            deps.now,
        )
    except snek.Rejected as e:
        return _json(e.status, {"error": e.message}, NO_STORE)
    return _json(201, {"id": score_id, "scores": board}, NO_STORE)


Handler = Callable[[Request, Deps], Awaitable[Response]]
ROUTES: dict[str, dict[str, Handler]] = {
    "/api/visit": {"GET": _log_visit},
    "/api/letterboxd": {"GET": _letterboxd},
    "/api/admin/visits": {"GET": _admin_visits},
    "/api/admin/snek": {"GET": _admin_snek},
    "/api/snek/scores": {"GET": _snek_scores, "POST": _snek_submit},
    "/api/snek/games": {"POST": _snek_new_game},
}


def _clip(value: str | None) -> str:
    return (value or "")[:MAX_FIELD]


def _referrer(value: str | None) -> str:
    # Some clients send a stringified JS undefined/null instead of nothing.
    value = (value or "").strip()
    return "" if value.lower() in ("undefined", "null") else _clip(value)


def _json(status: int, body: Any, headers: dict[str, str]) -> Response:
    return Response(status, {"content-type": "application/json", **headers}, json.dumps(body))


def reset_movies_cache() -> None:
    """Test hook."""
    _movies_cache.clear()
