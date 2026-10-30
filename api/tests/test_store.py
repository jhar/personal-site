import asyncio

from site_api.store import D1Store

from .fake_d1 import FakeD1


def visit(ts, path="/"):
    return {
        "ip": "1.2.3.4",
        "country": "US",
        "region": "California",
        "city": "San Francisco",
        "path": path,
        "referrer": "",
        "userAgent": "agent",
        "ts": ts,
    }


def test_visits_round_trip_newest_first():
    store = D1Store(FakeD1())

    async def run():
        await store.add_visit(visit("2026-01-01T00:00:00.000Z", "/old"), "a")
        await store.add_visit(visit("2026-02-01T00:00:00.000Z", "/new"), "b")
        await store.add_visit(visit("2026-02-01T00:00:00.000Z", "/new-again"), "b")
        return await store.recent_visits(10), await store.recent_visits(1)

    everything, newest = asyncio.run(run())
    # Same id overwrites, so re-imports don't duplicate.
    assert [v["path"] for v in everything] == ["/new-again", "/old"]
    assert everything[1] == visit("2026-01-01T00:00:00.000Z", "/old")
    assert [v["path"] for v in newest] == ["/new-again"]


def test_cache_round_trip():
    store = D1Store(FakeD1())

    async def run():
        missing = await store.get_cached("k")
        await store.put_cached("k", "v1", 1.0)
        await store.put_cached("k", "v2", 2.5)
        return missing, await store.get_cached("k")

    assert asyncio.run(run()) == (None, ("v2", 2.5))
