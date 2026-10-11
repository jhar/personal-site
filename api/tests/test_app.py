import json

import pytest

from site_api.app import Deps, Request, handle_request, reset_movies_cache
from site_api.store import MemoryVisitStore

NOW = 1_760_000_000.0  # 2025-10-09T08:53:20Z


@pytest.fixture(autouse=True)
def _reset():
    reset_movies_cache()


def deps(**kwargs):
    return Deps(store=MemoryVisitStore(), admin_token="secret", now=lambda: NOW, **kwargs)


def get(path, d, query=None, headers=None):
    return handle_request(Request("GET", path, query or {}, headers or {}), d)


def test_logs_visit_with_cloudfront_geo_headers():
    d = deps()
    res = get(
        "/api/visit",
        d,
        {"path": "/about", "referrer": "https://google.com/"},
        {
            "cloudfront-viewer-address": "2001:db8::1:51234",
            "cloudfront-viewer-country": "US",
            "cloudfront-viewer-country-region-name": "California",
            "cloudfront-viewer-city": "San%20Francisco",
            "user-agent": "test-agent",
        },
    )
    assert res.status == 204
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


def test_skips_admin_and_invalid_paths():
    d = deps()
    for path in ("/admin/visits", "about", ""):
        assert get("/api/visit", d, {"path": path}).status == 204
    assert d.store.visits == []


def test_store_failure_does_not_break_logging():
    class Broken(MemoryVisitStore):
        def add(self, visit, visit_id):
            raise RuntimeError("down")

    d = Deps(store=Broken(), now=lambda: NOW)
    assert get("/api/visit", d, {"path": "/"}).status == 204


def test_admin_requires_token():
    d = deps()
    assert get("/api/admin/visits", d).status == 401
    assert get("/api/admin/visits", d, headers={"x-admin-token": "wrong"}).status == 401
    assert get("/api/admin/visits", Deps(store=MemoryVisitStore())).status == 401


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


def test_letterboxd_is_cached_and_cacheable():
    calls = []

    def fetch():
        calls.append(1)
        return [{"title": "Heat"}]

    d = deps(fetch_movies=fetch)
    res = get("/api/letterboxd", d)
    get("/api/letterboxd", d)
    assert res.status == 200
    assert res.headers["cache-control"] == "public, max-age=900"
    assert json.loads(res.body) == [{"title": "Heat"}]
    assert len(calls) == 1


def test_letterboxd_serves_stale_data_when_feed_fails():
    clock = [NOW]
    movies = [[{"title": "Heat"}]]

    def fetch():
        if not movies:
            raise OSError("feed down")
        return movies.pop()

    d = Deps(store=MemoryVisitStore(), fetch_movies=fetch, now=lambda: clock[0])
    get("/api/letterboxd", d)
    clock[0] += 16 * 60
    res = get("/api/letterboxd", d)
    assert res.status == 200
    assert json.loads(res.body) == [{"title": "Heat"}]


def test_letterboxd_failure_without_cache_is_502():
    def fetch():
        raise OSError("feed down")

    assert get("/api/letterboxd", deps(fetch_movies=fetch)).status == 502


def test_rejects_other_methods_and_paths():
    d = deps()
    assert handle_request(Request("POST", "/api/visit"), d).status == 405
    assert get("/api/nope", d).status == 404
