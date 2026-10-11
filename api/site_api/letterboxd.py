"""Recently watched movies from Justin's Letterboxd RSS feed."""

import re
import urllib.request
from typing import Any

RSS_URL = "https://letterboxd.com/maybejustin/rss/"

Movie = dict[str, Any]


def fetch_movies(timeout: float = 5) -> list[Movie]:
    req = urllib.request.Request(RSS_URL, headers={"User-Agent": "personal-site"})
    with urllib.request.urlopen(req, timeout=timeout) as res:
        return parse_feed(res.read().decode("utf-8"))


def _decode_entities(text: str) -> str:
    text = re.sub(r"&#0*39;", "'", text)
    text = text.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
    text = text.replace("&quot;", '"')
    return re.sub(r"&#(\d+);", lambda m: chr(int(m.group(1))), text)


def _tag(chunk: str, pattern: str) -> str | None:
    match = re.search(pattern, chunk)
    return match.group(1).strip() if match else None


def parse_feed(xml: str) -> list[Movie]:
    movies: list[Movie] = []
    for chunk in xml.split("<item>")[1:]:
        title = _decode_entities(
            _tag(chunk, r"<letterboxd:filmTitle>([^<]+)</letterboxd:filmTitle>") or ""
        )
        year = _tag(chunk, r"<letterboxd:filmYear>([^<]+)</letterboxd:filmYear>") or ""
        watched = _tag(chunk, r"<letterboxd:watchedDate>([^<]+)</letterboxd:watchedDate>") or ""
        rating = _tag(chunk, r"<letterboxd:memberRating>([^<]+)</letterboxd:memberRating>")
        review_link = _tag(chunk, r"<link>([^<]+)</link>") or ""
        link = review_link.replace("/maybejustin/film/", "/film/")

        cdata_match = re.search(r"<description><!\[CDATA\[([\s\S]*?)\]\]></description>", chunk)
        cdata = cdata_match.group(1) if cdata_match else ""
        poster = _tag(cdata, r'src="([^"]+)"') or ""

        if not title or not poster:
            continue
        movie: Movie = {
            "title": title,
            "year": year,
            "watchedDate": watched,
            "posterUrl": poster,
            "link": link,
        }
        if rating:
            movie["rating"] = float(rating)
        movies.append(movie)
    return movies
