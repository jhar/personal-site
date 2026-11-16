import asyncio
import json

import pytest

from site_api import snek
from site_api.app import Deps, Request, handle_request
from site_api.store import D1Store, MemoryStore

from .fake_d1 import FakeD1

NOW = 1_760_000_000.0  # 2025-10-09T08:53:20Z
JSON = {"content-type": "application/json"}


class Clock:
    def __init__(self, t=NOW):
        self.t = t

    def __call__(self):
        return self.t


async def no_movies():
    return []


def make(store=None, admin_token="secret"):
    clock = Clock()
    d = Deps(
        store=store or MemoryStore(),
        fetch_movies=no_movies,
        admin_token=admin_token,
        now=clock,
    )
    return d, clock


def call(d, method, path, body="", headers=None, geo=None):
    req = Request(method, path, {}, headers or {}, geo or {}, body)
    return asyncio.run(handle_request(req, d))


def new_game(d):
    res = call(d, "POST", "/api/snek/games")
    assert res.status == 200
    return json.loads(res.body)["token"]


def submit(d, token, initials="JMH", score=10, method="keyboard", ip="1.2.3.4", **extra):
    body = json.dumps(
        {"initials": initials, "score": score, "input": method, "token": token, **extra}
    )
    return call(
        d,
        "POST",
        "/api/snek/scores",
        body,
        {**JSON, "cf-connecting-ip": ip},
        {"city": "Burbank", "country": "US", "region": "California"},
    )


def play(d, clock, seconds=60, **kwargs):
    token = new_game(d)
    clock.t += seconds
    return submit(d, token, **kwargs)


def test_submit_and_read_board():
    d, clock = make()
    res = play(d, clock, initials="AB", score=7, method="touch")
    assert res.status == 201
    body = json.loads(res.body)
    entry = {
        "id": body["id"],
        "ts": "2025-10-09T08:54:20.000Z",
        "initials": "AB",
        "score": 7,
        "input": "touch",
        "city": "Burbank",
        "country": "US",
    }
    assert body["scores"] == {"keyboard": [], "touch": [entry]}
    board = call(d, "GET", "/api/snek/scores")
    assert board.status == 200
    assert board.headers["cache-control"] == "no-store"
    assert json.loads(board.body) == {"keyboard": [], "touch": [entry]}
    # Neither the IP nor its hash is ever returned.
    assert "1.2.3.4" not in board.body and "ip" not in json.loads(board.body)["touch"][0]


def test_board_is_top_ten_highest_first_ties_to_earliest():
    d, clock = make()
    for i, score in enumerate([5, 9, 5, 1, 2, 3, 4, 6, 7, 8, 10, 11]):
        assert (
            play(d, clock, initials="ABCDEFGHIJKL"[i], score=score, ip=f"10.0.0.{i}").status == 201
        )
    board = json.loads(call(d, "GET", "/api/snek/scores").body)["keyboard"]
    assert [(s["initials"], s["score"]) for s in board] == [
        ("L", 11),
        ("K", 10),
        ("B", 9),
        ("J", 8),
        ("I", 7),
        ("H", 6),
        ("A", 5),
        ("C", 5),
        ("G", 4),
        ("F", 3),
    ]


@pytest.mark.parametrize(
    "initials",
    ["", "ABCD", "ab", "A1", "A B", "<b>", "A\n", "ÀB", "Ａ", "http", None, 123, ["A"]],
)
def test_rejects_bad_initials(initials):
    d, clock = make()
    res = play(d, clock, initials=initials)
    assert res.status == 400
    assert d.store.scores == []


@pytest.mark.parametrize("score", [0, -1, 5001, 1.5, "10", True, None])
def test_rejects_bad_scores(score):
    d, clock = make()
    assert play(d, clock, seconds=10_000, score=score).status == 400


@pytest.mark.parametrize("method", ["mouse", "", None, "Keyboard"])
def test_rejects_bad_input_method(method):
    d, clock = make()
    assert play(d, clock, method=method).status == 400


def test_rejects_non_json_and_oversized_bodies():
    d, _ = make()
    assert call(d, "POST", "/api/snek/scores", "{}", {"content-type": "text/plain"}).status == 415
    assert call(d, "POST", "/api/snek/scores", "not json", JSON).status == 400
    assert call(d, "POST", "/api/snek/scores", "[]", JSON).status == 400
    big = json.dumps({"initials": "A", "pad": "x" * 2000})
    assert call(d, "POST", "/api/snek/scores", big, JSON).status == 413


def test_rejects_forged_missing_and_reused_tokens():
    d, clock = make()
    assert play(d, clock).status == 201
    token = new_game(d)
    clock.t += 60
    issued, nonce, sig = token.split(".")
    assert submit(d, None).status == 400
    assert submit(d, "abc").status == 400
    # Backdating the token breaks its signature.
    assert submit(d, f"{int(issued) - 3_600_000}.{nonce}.{sig}", score=1000).status == 400
    assert submit(d, f"{issued}.{nonce}.{'0' * 64}").status == 400
    # A token signed with another key.
    other, _ = make(admin_token="other")
    assert submit(d, new_game(other)).status == 400
    assert submit(d, token).status == 201
    assert submit(d, token).status == 409


def test_rejects_scores_too_fast_for_the_game():
    d, clock = make()
    # 100 points need at least 10 seconds.
    assert play(d, clock, seconds=9, score=100).status == 422
    assert play(d, clock, seconds=10, score=100).status == 201


def test_rejects_expired_tokens():
    d, clock = make()
    assert play(d, clock, seconds=snek.MAX_GAME_SECONDS + 1).status == 400


def test_rate_limits_per_ip_then_recovers():
    d, clock = make()
    for _ in range(snek.PER_IP_PER_HOUR):
        assert play(d, clock, seconds=1, score=1).status == 201
    assert play(d, clock, seconds=1, score=1).status == 429
    assert play(d, clock, seconds=1, score=1, ip="5.6.7.8").status == 201
    clock.t += 3600
    assert play(d, clock, seconds=1, score=1).status == 201


def test_rate_limits_overall(monkeypatch):
    monkeypatch.setattr(snek, "ALL_PER_HOUR", 3)
    d, clock = make()
    for i in range(3):
        assert play(d, clock, seconds=1, score=1, ip=f"10.0.0.{i}").status == 201
    assert play(d, clock, seconds=1, score=1, ip="10.0.0.9").status == 429


def test_unavailable_without_admin_token():
    d, _ = make(admin_token=None)
    assert call(d, "POST", "/api/snek/games").status == 503
    assert call(d, "POST", "/api/snek/scores", "{}", JSON).status == 503
    assert call(d, "GET", "/api/snek/scores").status == 200


def test_keyboard_and_touch_have_their_own_boards():
    d, clock = make()
    for i in range(12):
        ip = f"10.0.0.{i}"
        assert play(d, clock, initials="K", score=100 + i, ip=ip).status == 201
        assert play(d, clock, initials="T", score=1 + i, method="touch", ip=ip).status == 201
    boards = json.loads(call(d, "GET", "/api/snek/scores").body)
    assert [s["score"] for s in boards["keyboard"]] == list(range(111, 101, -1))
    # Touch scores aren't crowded out by the higher keyboard ones.
    assert [s["score"] for s in boards["touch"]] == list(range(12, 2, -1))
    assert {s["initials"] for s in boards["touch"]} == {"T"}


def test_works_against_d1_schema():
    d, clock = make(store=D1Store(FakeD1()))
    assert play(d, clock, initials="Q", score=3, method="touch").status == 201
    assert play(d, clock, initials="ZZZ", score=4).status == 201
    boards = json.loads(call(d, "GET", "/api/snek/scores").body)
    assert [(s["initials"], s["score"], s["city"]) for s in boards["keyboard"]] == [
        ("ZZZ", 4, "Burbank")
    ]
    assert [(s["initials"], s["score"], s["city"]) for s in boards["touch"]] == [
        ("Q", 3, "Burbank")
    ]


def test_d1_check_constraint_rejects_bad_initials():
    store = D1Store(FakeD1())
    row = {
        "id": "x",
        "ts": "t",
        "initials": "<a>",
        "score": 1,
        "input": "touch",
        "city": "",
        "country": "",
        "ip_hash": "",
    }
    with pytest.raises(Exception, match="CHECK"):
        asyncio.run(store.add_score(row))
