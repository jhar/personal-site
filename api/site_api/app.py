"""Routes for /api/*, independent of Lambda so the local dev server can reuse them."""

import hmac
import json
import logging
import time
import uuid
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any
from urllib.parse import unquote

from .letterboxd import Movie, fetch_movies
from .store import Visit, VisitStore

log = logging.getLogger(__name__)

NO_STORE = {"cache-control": "no-store"}
MOVIES_TTL_SECONDS = 15 * 60
MAX_FIELD = 1024


@dataclass
class Request:
    method: str
    path: str
    query: dict[str, str] = field(default_factory=dict)
    # Lower-cased header names.
    headers: dict[str, str] = field(default_factory=dict)


@dataclass
class Response:
    status: int
    headers: dict[str, str]
    body: str = ""


@dataclass
class Deps:
    store: VisitStore
    admin_token: str | None = None
    fetch_movies: Callable[[], list[Movie]] = fetch_movies
    now: Callable[[], float] = time.time


def handle_request(req: Request, deps: Deps) -> Response:
    if req.method != "GET":
        return _json(405, {"error": "method not allowed"}, NO_STORE)
    if req.path == "/api/visit":
        return _log_visit(req, deps)
    if req.path == "/api/letterboxd":
        return _letterboxd(deps)
    if req.path == "/api/admin/visits":
        return _admin_visits(req, deps)
    return _json(404, {"error": "not found"}, NO_STORE)


def _log_visit(req: Request, deps: Deps) -> Response:
    path = req.query.get("path", "")
    if not path.startswith("/") or path.startswith("/admin"):
        return Response(204, NO_STORE)

    h = req.headers
    visit: Visit = {
        "ip": _client_ip(h),
        # CloudFront geolocation headers, the AWS equivalent of Deno's x-deno-geo-*.
        "country": _clip(h.get("cloudfront-viewer-country")) or "unknown",
        "region": _clip(
            h.get("cloudfront-viewer-country-region-name")
            or h.get("cloudfront-viewer-country-region")
        )
        or "unknown",
        "city": _clip(unquote(h.get("cloudfront-viewer-city", ""))) or "unknown",
        "path": _clip(path),
        "referrer": _clip(req.query.get("referrer")),
        "userAgent": _clip(h.get("user-agent")),
        "ts": datetime.fromtimestamp(deps.now(), UTC)
        .isoformat(timespec="milliseconds")
        .replace("+00:00", "Z"),
    }
    try:
        deps.store.add(visit, str(uuid.uuid4()))
    except Exception:
        # Never let logging break the app
        log.exception("failed to store visit")
    return Response(204, NO_STORE)


_movies_cache: dict[str, Any] = {}


def _letterboxd(deps: Deps) -> Response:
    now = deps.now()
    cached = _movies_cache.get("value")
    if cached is None or now - cached["fetched_at"] >= MOVIES_TTL_SECONDS:
        try:
            _movies_cache["value"] = cached = {"movies": deps.fetch_movies(), "fetched_at": now}
        except Exception:
            log.exception("letterboxd fetch failed")
            if cached is None:
                return _json(502, [], NO_STORE)
    # CloudFront caches this response for 15 minutes, like the old Deno KV cache.
    return _json(200, cached["movies"], {"cache-control": "public, max-age=900"})


def _admin_visits(req: Request, deps: Deps) -> Response:
    given = req.headers.get("x-admin-token", "")
    if not deps.admin_token or not hmac.compare_digest(deps.admin_token, given):
        return _json(401, {"error": "unauthorized"}, NO_STORE)
    return _json(200, deps.store.recent(500), NO_STORE)


def _client_ip(h: dict[str, str]) -> str:
    # CloudFront-Viewer-Address is "ip:port" (IPv6 addresses contain colons too).
    address = h.get("cloudfront-viewer-address")
    if address and ":" in address:
        return address.rsplit(":", 1)[0]
    forwarded = h.get("x-forwarded-for", "")
    return forwarded.split(",")[0].strip() or "unknown"


def _clip(value: str | None) -> str:
    return (value or "")[:MAX_FIELD]


def _json(status: int, body: Any, headers: dict[str, str]) -> Response:
    return Response(status, {"content-type": "application/json", **headers}, json.dumps(body))


def reset_movies_cache() -> None:
    """Test hook."""
    _movies_cache.clear()
