"""Snek-VG scoreboard: /api/snek/*.

Scores come from the browser, so nothing here can make cheating impossible, but
it keeps the board honest enough for a toy:

- Initials are 1-3 letters A-Z, nothing else (also enforced by a CHECK in D1).
- Each game starts with a signed, single-use token from POST /api/snek/games.
  A score must arrive with its token, at most once, and no faster than
  MIN_SECONDS_PER_POINT per point since the token was issued.
- Submissions are rate limited per IP and overall.
- Keyboard and touch players get a board each.

The signing key is derived from ADMIN_TOKEN, so no new secret is needed.
"""

import hashlib
import hmac
import json
import re
import secrets
from collections.abc import Callable
from datetime import UTC, datetime
from typing import Any

from .store import Score, Store

BOARD_SIZE = 10
MAX_SCORE = 5000
# Nobody scores faster than this on average: at top speed a grub is about a
# second away, and a frenzy's bonus grubs (2-5 points each) only last 10
# seconds. So a score of N needs at least N/10 seconds of game.
MIN_SECONDS_PER_POINT = 0.1
# Long enough for a paused game left open all day.
MAX_GAME_SECONDS = 24 * 60 * 60
PER_IP_PER_HOUR = 10
ALL_PER_HOUR = 200
MAX_BODY = 1024
MAX_GEO = 64

INITIALS = re.compile(r"[A-Z]{1,3}")
INPUTS = ("keyboard", "touch")
TOKEN = re.compile(r"(\d{1,16})\.([0-9a-f]{32})\.([0-9a-f]{64})")


class Rejected(Exception):
    def __init__(self, status: int, message: str):
        super().__init__(message)
        self.status = status
        self.message = message


def _key(admin_token: str) -> bytes:
    return hmac.new(admin_token.encode(), b"snek-vg game tokens", hashlib.sha256).digest()


def _sign(key: bytes, payload: str) -> str:
    return hmac.new(key, payload.encode(), hashlib.sha256).hexdigest()


def issue_token(admin_token: str, now: float) -> str:
    payload = f"{int(now * 1000)}.{secrets.token_hex(16)}"
    return f"{payload}.{_sign(_key(admin_token), payload)}"


def check_token(admin_token: str, token: Any, now: float) -> tuple[str, float]:
    """(nonce, seconds since issued), or raises Rejected."""
    m = TOKEN.fullmatch(token) if isinstance(token, str) else None
    if not m:
        raise Rejected(400, "invalid game")
    issued_ms, nonce, sig = m.groups()
    expected = _sign(_key(admin_token), f"{issued_ms}.{nonce}")
    if not hmac.compare_digest(expected, sig):
        raise Rejected(400, "invalid game")
    elapsed = now - int(issued_ms) / 1000
    if elapsed < 0 or elapsed > MAX_GAME_SECONDS:
        raise Rejected(400, "game expired")
    return nonce, elapsed


def ip_hash(admin_token: str, ip: str) -> str:
    return hmac.new(_key(admin_token), f"ip:{ip}".encode(), hashlib.sha256).hexdigest()[:32]


def parse_submission(body: str) -> dict[str, Any]:
    """The validated initials, score, input and token, or raises Rejected."""
    if len(body) > MAX_BODY:
        raise Rejected(413, "too large")
    try:
        data = json.loads(body)
    except ValueError:
        raise Rejected(400, "invalid JSON") from None
    if not isinstance(data, dict):
        raise Rejected(400, "invalid JSON")

    initials = data.get("initials")
    if not isinstance(initials, str) or not INITIALS.fullmatch(initials):
        raise Rejected(400, "initials must be 1-3 letters A-Z")
    score = data.get("score")
    # bool is an int in Python; True is not a score.
    if type(score) is not int or not 0 < score <= MAX_SCORE:
        raise Rejected(400, "invalid score")
    method = data.get("input")
    if method not in INPUTS:
        raise Rejected(400, "input must be keyboard or touch")
    return {"initials": initials, "score": score, "input": method, "token": data.get("token")}


def iso(ts: float) -> str:
    return datetime.fromtimestamp(ts, UTC).isoformat(timespec="milliseconds").replace("+00:00", "Z")


async def submit(
    store: Store,
    admin_token: str,
    body: str,
    ip: str,
    geo: dict[str, str],
    now: Callable[[], float],
) -> tuple[str, dict[str, list[Score]]]:
    """Stores a score; returns (its id, both boards). Raises Rejected."""
    entry = parse_submission(body)
    t = now()
    nonce, elapsed = check_token(admin_token, entry["token"], t)
    if elapsed < entry["score"] * MIN_SECONDS_PER_POINT:
        raise Rejected(422, "score doesn't fit the game's length")
    if await store.has_score(nonce):
        raise Rejected(409, "already submitted")

    who = ip_hash(admin_token, ip)
    hour_ago = iso(t - 3600)
    if await store.count_scores_since(hour_ago, who) >= PER_IP_PER_HOUR:
        raise Rejected(429, "too many scores, try again later")
    if await store.count_scores_since(hour_ago) >= ALL_PER_HOUR:
        raise Rejected(429, "too many scores, try again later")

    await store.add_score(
        {
            "id": nonce,
            "ts": iso(t),
            "initials": entry["initials"],
            "score": entry["score"],
            "input": entry["input"],
            # Same Cloudflare geolocation the visit log uses.
            "city": (geo.get("city") or "")[:MAX_GEO],
            "country": (geo.get("country") or "")[:MAX_GEO],
            "ip_hash": who,
        }
    )
    return nonce, await boards(store)


async def boards(store: Store) -> dict[str, list[Score]]:
    """The top of each input method's board."""
    return {method: await store.top_scores(method, BOARD_SIZE) for method in INPUTS}
