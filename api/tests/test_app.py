import asyncio
import json

import pytest

from site_api.app import Deps, Request, handle_request, reset_movies_cache
from site_api.store import MemoryStore

NOW = 1_760_000_000.0  # 2025-10-09T08:53:20Z


@pytest.fixture(autouse=True)
def _reset():
    reset_movies_cache()


async def no_movies():
    return []


def deps(**kwargs):
    kwargs.setdefault("store", MemoryStore())
    kwargs.setdefault("fetch_movies", no_movies)
    kwargs.setdefault("now", lambda: NOW)
    return Deps(admin_token=kwargs.pop("admin_token", "secret"), **kwargs)


def get(path, d, query=None, headers=None, geo=None):
    return asyncio.run(
        handle_request(Request("GET", path, query or {}, headers or {}, geo or {}), d)
    )


def test_logs_visit_with_cloudflare_geo():
    d = deps()
    res = get(
        "/api/visit",
        d,
        {"path": "/about", "referrer": "https://google.com/"},
        {"cf-connecting-ip": "2001:db8::1", "user-agent": "test-agent"},
        {"country": "US", "region": "California", "city": "San Francisco"},
    )
    assert res.status == 204
    assert res.body == ""
    assert d.store.visits == [
        {
            "ip": "2001:db8::1",
            "country": "US",
            "region": "California",
            "city": "San Francisco",
            "path": "/about",
            "referrer": "https://google.com/",
            "userAgent": "test-agent",
            "ts": "2025-10-09T08:53:20.000Z",
        }
    ]


def test_missing_geo_is_unknown():
    d = deps()
    get("/api/visit", d, {"path": "/"})
    visit = d.store.visits[0]
    assert (visit["ip"], visit["country"], visit["region"], visit["city"]) == ("unknown",) * 4


def test_skips_admin_and_invalid_paths():
    d = deps()
    for path in ("/admin/visits", "about", ""):
        assert get("/api/visit", d, {"path": path}).status == 204
    assert d.store.visits == []


def test_store_failure_does_not_break_logging():
    class Broken(MemoryStore):
        async def add_visit(self, visit, visit_id):
            raise RuntimeError("down")

    assert get("/api/visit", deps(store=Broken()), {"path": "/"}).status == 204


def test_admin_requires_token():
    d = deps()
    assert get("/api/admin/visits", d).status == 401
    assert get("/api/admin/visits", d, headers={"x-admin-token": "wrong"}).status == 401
    assert get("/api/admin/visits", deps(admin_token=None)).status == 401


def test_admin_lists_newest_first():
    d = deps()
    d.store.visits = [{"ts": "2026-01-01T00:00:00.000Z"}, {"ts": "2026-02-01T00:00:00.000Z"}]
    res = get("/api/admin/visits", d, headers={"x-admin-token": "secret"})
    assert res.status == 200
    assert res.headers["cache-control"] == "no-store"
    assert [v["ts"] for v in json.loads(res.body)] == [
        "2026-02-01T00:00:00.000Z",
        "2026-01-01T00:00:00.000Z",
    ]


def counting_fetch(calls, movies=({"title": "Heat"},)):
    async def fetch():
        calls.append(1)
        return list(movies)

    return fetch


def test_letterboxd_is_cached_and_cacheable():
    calls = []
    d = deps(fetch_movies=counting_fetch(calls))
    res = get("/api/letterboxd", d)
    get("/api/letterboxd", d)
    assert res.status == 200
    assert res.headers["cache-control"] == "public, max-age=900"
    assert json.loads(res.body) == [{"title": "Heat"}]
    assert len(calls) == 1


def test_letterboxd_cache_is_shared_through_the_store():
    calls = []
    store = MemoryStore()
    get("/api/letterboxd", deps(store=store, fetch_movies=counting_fetch(calls)))
    reset_movies_cache()  # a different isolate
    res = get("/api/letterboxd", deps(store=store, fetch_movies=counting_fetch(calls)))
    assert json.loads(res.body) == [{"title": "Heat"}]
    assert len(calls) == 1


def test_letterboxd_refetches_after_15_minutes():
    calls = []
    clock = [NOW]
    d = deps(fetch_movies=counting_fetch(calls), now=lambda: clock[0])
    get("/api/letterboxd", d)
    clock[0] += 14 * 60
    get("/api/letterboxd", d)
    clock[0] += 2 * 60
    get("/api/letterboxd", d)
    assert len(calls) == 2


def test_letterboxd_serves_stale_data_when_feed_fails():
    clock = [NOW]
    movies = [[{"title": "Heat"}]]

    async def fetch():
        if not movies:
            raise OSError("feed down")
        return movies.pop()

    d = deps(fetch_movies=fetch, now=lambda: clock[0])
    get("/api/letterboxd", d)
    clock[0] += 16 * 60
    res = get("/api/letterboxd", d)
    assert res.status == 200
    assert json.loads(res.body) == [{"title": "Heat"}]


def test_letterboxd_failure_without_cache_is_502():
    async def fetch():
        raise OSError("feed down")

    assert get("/api/letterboxd", deps(fetch_movies=fetch)).status == 502


def test_rejects_other_methods_and_paths():
    d = deps()
    assert asyncio.run(handle_request(Request("POST", "/api/visit"), d)).status == 405
    assert get("/api/nope", d).status == 404
