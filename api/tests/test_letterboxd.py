from site_api.letterboxd import parse_feed

FEED = """<rss><channel>
<item>
  <title>Heat, 1995 - ★★★★½</title>
  <link>https://letterboxd.com/maybejustin/film/heat/</link>
  <letterboxd:watchedDate>2026-09-30</letterboxd:watchedDate>
  <letterboxd:filmTitle>Heat</letterboxd:filmTitle>
  <letterboxd:filmYear>1995</letterboxd:filmYear>
  <letterboxd:memberRating>4.5</letterboxd:memberRating>
  <description><![CDATA[<p><img src="https://a.ltrbxd.com/heat.jpg"/></p>]]></description>
</item>
<item>
  <link>https://letterboxd.com/maybejustin/film/tom-jerry/</link>
  <letterboxd:filmTitle>Tom &amp; Jerry&#039;s</letterboxd:filmTitle>
  <letterboxd:filmYear>2021</letterboxd:filmYear>
  <description><![CDATA[<p><img src="https://a.ltrbxd.com/tj.jpg"/></p>]]></description>
</item>
<item>
  <letterboxd:filmTitle>No Poster</letterboxd:filmTitle>
  <description><![CDATA[<p>text only</p>]]></description>
</item>
</channel></rss>"""


def test_parses_movies_and_skips_items_without_posters():
    movies = parse_feed(FEED)
    assert movies == [
        {
            "title": "Heat",
            "year": "1995",
            "watchedDate": "2026-09-30",
            "posterUrl": "https://a.ltrbxd.com/heat.jpg",
            "link": "https://letterboxd.com/film/heat/",
            "rating": 4.5,
        },
        {
            "title": "Tom & Jerry's",
            "year": "2021",
            "watchedDate": "",
            "posterUrl": "https://a.ltrbxd.com/tj.jpg",
            "link": "https://letterboxd.com/film/tom-jerry/",
        },
    ]
