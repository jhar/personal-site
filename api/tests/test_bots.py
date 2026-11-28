import asyncio

import pytest

from site_api.bots import classify
from site_api.store import D1Store

from .fake_d1 import FakeD1

CHROME = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
)
IPHONE = (
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 "
    "(KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1"
)
ANDROID = (
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36"
)
FACEBOOK_APP = (
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 "
    "(KHTML, like Gecko) Mobile/22B83 [FBAN/FBIOS;FBAV/489.0.0.38.105;FBBV/662316834]"
)
FIREFOX = "Mozilla/5.0 (X11; Linux x86_64; rv:133.0) Gecko/20100101 Firefox/133.0"
DUCKDUCKGO = (
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 "
    "(KHTML, like Gecko) Version/18.1 Mobile/15E148 DuckDuckGo/7 Safari/605.1.15"
)

CASES = [
    # People.
    (CHROME, "", ""),
    (IPHONE, "Comcast Cable Communications, LLC", ""),
    (ANDROID, "T-Mobile USA, Inc.", ""),
    (FACEBOOK_APP, "", ""),
    (FIREFOX, "Cloudflare, Inc.", ""),  # WARP
    (DUCKDUCKGO, "Akamai Technologies, Inc.", ""),  # iCloud Private Relay
    (CHROME, "Google Fiber Inc.", ""),
    # Bots by user agent.
    ("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)", "", "Googlebot"),
    ("Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)", "", "bingbot"),
    ("Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)", "", "AhrefsBot"),
    (
        "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0)",
        "",
        "ClaudeBot",
    ),
    (
        "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
        "",
        "facebookexternalhit",
    ),
    ("Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)", "", "Slackbot-LinkExpanding"),
    ("WhatsApp/2.23.20.0", "", "WhatsApp"),
    ("curl/8.7.1", "", "curl"),
    ("python-requests/2.32.3", "", "python-requests"),
    ("Go-http-client/1.1", "", "Go-http-client"),
    (
        "Mozilla/5.0 (X11; Linux x86_64) HeadlessChrome/120.0.0.0 Safari/537.36",
        "",
        "HeadlessChrome",
    ),
    ("Mozilla/5.0 (compatible; CensysInspect/1.1; +https://about.censys.io/)", "", "CensysInspect"),
    ("", "", "no UA"),
    ("undefined", "", "no UA"),
    # Normal browser, but from a hosting network.
    (CHROME, "DigitalOcean, LLC", "DigitalOcean"),
    (CHROME, "Amazon.com, Inc.", "AWS"),
    (CHROME, "Hetzner Online GmbH", "Hetzner"),
    (CHROME, "Google LLC", "Google"),
    (IPHONE, "OVH SAS", "OVH"),
]


@pytest.mark.parametrize(("ua", "network", "label"), CASES)
def test_classify(ua, network, label):
    assert classify(ua, network) == label


def test_sql_filter_agrees_with_classify():
    store = D1Store(FakeD1())

    async def run():
        for i, (ua, network, _) in enumerate(CASES):
            visit = {"ts": f"2026-01-01T00:00:{i:02d}.000Z", "path": f"/{i}"}
            await store.add_visit({**visit, "userAgent": ua, "network": network}, str(i))
        return (
            await store.recent_visits(100, 0, humans_only=True),
            await store.count_visits(humans_only=True),
            await store.count_visits(),
        )

    people, n_people, n_all = asyncio.run(run())
    expected = sorted((i for i, c in enumerate(CASES) if not c[2]), reverse=True)
    assert [int(v["path"][1:]) for v in people] == expected
    assert (n_people, n_all) == (len(expected), len(CASES))
