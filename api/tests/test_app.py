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
        {
            "country": "US",
            "region": "California",
            "city": "San Francisco",
            "asOrganization": "Comcast Cable Communications, LLC",
        },
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
            "network": "Comcast Cable Communications, LLC",
        }
    ]


def test_missing_geo_is_unknown():
    d = deps()
    get("/api/visit", d, {"path": "/"})
    visit = d.store.visits[0]
    assert (visit["ip"], visit["country"], visit["region"], visit["city"]) == ("unknown",) * 4


def test_junk_referrer_is_empty():
    d = deps()
    for junk in ("undefined", "null", " "):
        get("/api/visit", d, {"path": "/", "referrer": junk})
    assert [v["referrer"] for v in d.store.visits] == ["", "", ""]


def test_retention_prunes_old_visits():
    from site_api import app

    app._last_prune.clear()
    store = MemoryStore()
    store.visits = [
        {"ts": "2025-08-01T00:00:00.000Z", "path": "/old"},
        {"ts": "2025-10-01T00:00:00.000Z", "path": "/recent"},
    ]
    d = deps(store=store, visit_retention_days=30)
    get("/api/visit", d, {"path": "/new"})
    assert [v["path"] for v in store.visits] == ["/recent", "/new"]


def test_no_retention_keeps_everything():
    from site_api import app

    app._last_prune.clear()
    store = MemoryStore()
    store.visits = [{"ts": "2020-01-01T00:00:00.000Z", "path": "/old"}]
    get("/api/visit", deps(store=store), {"path": "/new"})
    res = get("/api/admin/visits", deps(store=store), headers={"x-admin-token": "secret"})
    assert json.loads(res.body)["total"] == 2


def test_admin_view_prunes_on_read():
    store = MemoryStore()
    store.visits = [{"ts": "2025-08-01T00:00:00.000Z", "path": "/old"}]
    d = deps(store=store, visit_retention_days=30)
    res = get("/api/admin/visits", d, headers={"x-admin-token": "secret"})
    assert json.loads(res.body)["total"] == 0


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
    body = json.loads(res.body)
    assert [v["ts"] for v in body["items"]] == [
        "2026-02-01T00:00:00.000Z",
        "2026-01-01T00:00:00.000Z",
    ]
    assert (body["total"], body["page"], body["per"]) == (2, 1, 100)


def test_admin_visits_pages():
    d = deps()
    d.store.visits = [{"ts": f"2026-01-01T00:00:{i:02d}.000Z"} for i in range(25)]
    auth = {"x-admin-token": "secret"}
    body = json.loads(get("/api/admin/visits", d, {"page": "2", "per": "10"}, auth).body)
    assert [v["ts"][17:19] for v in body["items"]] == [f"{i:02d}" for i in range(14, 4, -1)]
    assert body["total"] == 25
    last = json.loads(get("/api/admin/visits", d, {"page": "3", "per": "10"}, auth).body)
    assert len(last["items"]) == 5
    # Junk and out-of-range values fall back to something sensible.
    junk = json.loads(get("/api/admin/visits", d, {"page": "x", "per": "9999"}, auth).body)
    assert (junk["page"], junk["per"], len(junk["items"])) == (1, 500, 25)
    zero = json.loads(get("/api/admin/visits", d, {"page": "-3", "per": "0"}, auth).body)
    assert (zero["page"], zero["per"]) == (1, 1)


def test_admin_visits_tag_and_hide_bots():
    d = deps()
    chrome = "Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/131.0 Safari/537.36"
    google = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
    d.store.visits = [
        {"ts": "2026-01-01T00:00:01.000Z", "userAgent": chrome, "network": "Comcast"},
        {"ts": "2026-01-01T00:00:02.000Z", "userAgent": google},
        {"ts": "2026-01-01T00:00:03.000Z", "userAgent": chrome, "network": "DigitalOcean, LLC"},
        {"ts": "2026-01-01T00:00:04.000Z", "userAgent": chrome},
    ]
    auth = {"x-admin-token": "secret"}
    every = json.loads(get("/api/admin/visits", d, {}, auth).body)
    assert [v["bot"] for v in every["items"]] == ["", "DigitalOcean", "Googlebot", ""]
    assert every["total"] == 4
    people = json.loads(get("/api/admin/visits", d, {"bots": "hide"}, auth).body)
    assert [v["ts"][-6:-5] for v in people["items"]] == ["4", "1"]
    assert people["total"] == 2


def score(i, method="keyboard", points=10):
    return {
        "id": f"id{i}",
        "ts": f"2026-01-01T00:00:{i:02d}.000Z",
        "initials": "ABC",
        "score": points,
        "input": method,
        "city": "Burbank",
        "country": "US",
        "ip_hash": f"hash{i}",
    }


def test_admin_snek_requires_token():
    assert get("/api/admin/snek", deps()).status == 401
    assert get("/api/admin/snek", deps(), headers={"x-admin-token": "nope"}).status == 401


def test_admin_snek_lists_every_score_ranked_with_details():
    d = deps()
    d.store.scores = [score(i, points=i) for i in range(1, 16)] + [score(99, "touch", 7)]
    auth = {"x-admin-token": "secret"}
    res = get("/api/admin/snek", d, {"input": "keyboard", "per": "10", "page": "2"}, auth)
    assert res.status == 200
    assert res.headers["cache-control"] == "no-store"
    body = json.loads(res.body)
    assert body["total"] == 15
    assert [(s["rank"], s["score"]) for s in body["items"]] == [
        (11, 5),
        (12, 4),
        (13, 3),
        (14, 2),
        (15, 1),
    ]
    assert body["items"][0]["ip_hash"] == "hash5"
    touch = json.loads(get("/api/admin/snek", d, {"input": "touch"}, auth).body)
    assert [s["id"] for s in touch["items"]] == ["id99"]
    assert get("/api/admin/snek", d, {"input": "mouse"}, auth).status == 400


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
    assert get("/api/snek/games", d).status == 405
    assert get("/api/nope", d).status == 404
