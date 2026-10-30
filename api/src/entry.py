"""Python Worker entry point.

Static files in out/ are served by Workers static assets without running this
code; only /api/* reaches it (see run_worker_first in wrangler.jsonc).
"""

from urllib.parse import parse_qsl, urlsplit

from workers import Response, WorkerEntrypoint, fetch

from site_api.app import Deps, Request, handle_request
from site_api.letterboxd import RSS_URL, Movie, parse_feed
from site_api.store import D1Store

GEO_FIELDS = ("country", "region", "city")


async def fetch_movies() -> list[Movie]:
    res = await fetch(RSS_URL, headers={"User-Agent": "personal-site"})
    if not res.ok:
        raise OSError(f"letterboxd returned {res.status}")
    return parse_feed(await res.text())


class Default(WorkerEntrypoint):
    async def fetch(self, request):
        url = urlsplit(request.url)
        cf = getattr(request.js_object, "cf", None)
        res = await handle_request(
            Request(
                method=request.js_object.method,
                path=url.path,
                query=dict(parse_qsl(url.query)),
                headers={k.lower(): v for k, v in request.headers.items()},
                geo={k: str(getattr(cf, k, None) or "") for k in GEO_FIELDS} if cf else {},
            ),
            Deps(
                store=D1Store(self.env.DB),
                fetch_movies=fetch_movies,
                admin_token=getattr(self.env, "ADMIN_TOKEN", None),
            ),
        )
        # A 204 must not have a body, not even an empty one.
        return Response(res.body or None, status=res.status, headers=res.headers)
