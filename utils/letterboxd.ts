export interface Movie {
  title: string;
  year: string;
  watchedDate: string;
  posterUrl: string;
  rating?: number;
  link: string;
}

export async function fetchRecentMovies(): Promise<Movie[]> {
  const res = await fetch("https://letterboxd.com/maybejustin/rss/");
  const xml = await res.text();
  return parseLetterboxdFeed(xml);
}

function decodeEntities(str: string): string {
  return str
    .replace(/&#0*39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)));
}

function parseLetterboxdFeed(xml: string): Movie[] {
  const itemChunks = xml.split(/<item>/).slice(1);
  return itemChunks.flatMap((chunk) => {
    const filmTitle = decodeEntities(
      chunk.match(/<letterboxd:filmTitle>([^<]+)<\/letterboxd:filmTitle>/)?.[1]
        ?.trim() ?? ""
    );
    const filmYear =
      chunk.match(/<letterboxd:filmYear>([^<]+)<\/letterboxd:filmYear>/)?.[1]
        ?.trim() ?? "";
    const watchedDate =
      chunk.match(
        /<letterboxd:watchedDate>([^<]+)<\/letterboxd:watchedDate>/,
      )?.[1]?.trim() ?? "";
    const memberRating =
      chunk.match(
        /<letterboxd:memberRating>([^<]+)<\/letterboxd:memberRating>/,
      )?.[1]?.trim();
    const reviewLink = chunk.match(/<link>([^<]+)<\/link>/)?.[1]?.trim() ?? "";
    const link = reviewLink.replace(/\/maybejustin\/film\//, "/film/");

    const cdata =
      chunk.match(
        /<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/,
      )?.[1] ?? "";
    const posterUrl = cdata.match(/src="([^"]+)"/)?.[1] ?? "";

    if (!filmTitle || !posterUrl) return [];
    return [{
      title: filmTitle,
      year: filmYear,
      watchedDate,
      posterUrl,
      rating: memberRating ? parseFloat(memberRating) : undefined,
      link,
    }];
  });
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ratingToStars(rating?: number): string {
  if (!rating) return "";
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return "★".repeat(full) + (half ? "½" : "");
}
