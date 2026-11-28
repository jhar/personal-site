"""Tags visits that look automated, for the admin visit log.

Two signals, both plain case-insensitive substring matches so the same rules
run in Python (to label a row) and in SQL (to hide rows before paging):

- the user agent names a crawler, preview fetcher, monitor, scanner or HTTP
  library (or is empty), and
- the visit came from a hosting/cloud network (Cloudflare's asOrganization),
  where real people rarely browse from. Only visits logged since the network
  started being recorded carry this; older rows are judged on user agent alone.

Consumer VPN/relay networks (Cloudflare WARP, iCloud Private Relay on
Akamai/Fastly) are deliberately not listed: real people browse through them.
"""

import re

# Lower-case substrings of a user agent. Order doesn't matter: the label comes
# from the product token at the earliest match.
UA_PATTERNS = (
    # Crawlers and generic bot names ("Googlebot/2.1", "bingbot/2.0", "-bot").
    "bot/",
    "bot;",
    "bot-",
    "bot.",
    "-bot",
    "crawl",
    "spider",
    "slurp",
    "bytespider",
    "yeti/",
    "archive",
    "google-",
    "googleother",
    "mediapartners",
    "ahrefs",
    "semrush",
    "mj12",
    "dataforseo",
    # AI fetchers.
    "chatgpt",
    "perplexity",
    "anthropic",
    "claude",
    "cohere",
    # Link previews and feed readers.
    "externalhit",
    "externalagent",
    "whatsapp",
    "telegram",
    "skypeuri",
    "iframely",
    "embedly",
    "cardyb",
    "mastodon",
    "preview",
    "feed",
    "rss",
    # Monitors and audits.
    "uptime",
    "pingdom",
    "monitor",
    "lighthouse",
    "headless",
    "phantomjs",
    # Scanners.
    "scan",
    "zgrab",
    "nmap",
    "censys",
    "expanse",
    # HTTP clients and scripts.
    "curl/",
    "wget/",
    "python",
    "aiohttp",
    "go-http",
    "okhttp",
    "java/",
    "apache-httpclient",
    "http-client",
    "httpclient",
    "axios",
    "node-fetch",
    "node.js",
    "undici",
    "libwww",
    "scrapy",
    "wordpress",
)

# (lower-case substring of the network name, label). First match wins.
NETWORKS = (
    ("amazon", "AWS"),
    ("google llc", "Google"),
    ("google cloud", "Google Cloud"),
    ("microsoft", "Microsoft/Azure"),
    ("digitalocean", "DigitalOcean"),
    ("ovh", "OVH"),
    ("hetzner", "Hetzner"),
    ("linode", "Linode"),
    ("akamai connected cloud", "Linode"),
    ("vultr", "Vultr"),
    ("choopa", "Vultr"),
    ("constant company", "Vultr"),
    ("contabo", "Contabo"),
    ("scaleway", "Scaleway"),
    ("online s.a.s", "Scaleway"),
    ("leaseweb", "Leaseweb"),
    ("m247", "M247"),
    ("datacamp", "DataCamp"),
    ("alibaba", "Alibaba Cloud"),
    ("tencent", "Tencent Cloud"),
    ("oracle", "Oracle Cloud"),
    ("huawei", "Huawei Cloud"),
    ("hostinger", "Hostinger"),
    ("ionos", "IONOS"),
    ("netcup", "netcup"),
    ("colocrossing", "ColoCrossing"),
    ("racknerd", "RackNerd"),
    ("hostwinds", "Hostwinds"),
    ("psychz", "Psychz"),
    ("quadranet", "QuadraNet"),
    ("frantech", "BuyVM"),
    ("g-core", "G-Core"),
    ("zenlayer", "Zenlayer"),
    ("censys", "Censys"),
    ("shadowserver", "Shadowserver"),
)

# Patterns go into SQL LIKE as literals, so they must not hold LIKE wildcards
# or quotes.
for _p in (*UA_PATTERNS, *(n for n, _ in NETWORKS)):
    assert _p == _p.lower() and not set(_p) & set("%_'\\"), _p

_TOKEN_END = re.compile(r"[\s;()\[\],]")


def classify(user_agent: str, network: str = "") -> str:
    """A short label if the visit looks automated ("Googlebot", "AWS", "no UA"), else ""."""
    ua = (user_agent or "").strip()
    if not ua or ua.lower() in ("undefined", "null"):
        return "no UA"
    lower = ua.lower()
    hits = [i for i in (lower.find(p) for p in UA_PATTERNS) if i >= 0]
    if hits:
        return _token_at(ua, min(hits))
    net = (network or "").lower()
    for pattern, label in NETWORKS:
        if pattern in net:
            return label
    return ""


def _token_at(ua: str, i: int) -> str:
    """The product name around ua[i]: "Googlebot/2.1; +http..." -> "Googlebot"."""
    start = i
    while start > 0 and not _TOKEN_END.match(ua[start - 1]):
        start -= 1
    end = _TOKEN_END.search(ua, i)
    token = ua[start : end.start() if end else len(ua)]
    name = token.split("/")[0].lstrip("+") or token
    if name.lower().startswith(("http:", "https:")) or not name:
        name = token
    return name[:32]


def human_sql(ua_column: str = "user_agent", network_column: str = "network") -> str:
    """A WHERE condition true for rows classify() would leave untagged."""
    ua = f"lower(trim({ua_column}))"
    automated = [f"{ua} IN ('', 'undefined', 'null')"]
    automated += [f"{ua_column} LIKE '%{p}%'" for p in UA_PATTERNS]
    automated += [f"{network_column} LIKE '%{n}%'" for n, _ in NETWORKS]
    return f"NOT ({' OR '.join(automated)})"
