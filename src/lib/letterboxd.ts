// Shape of /api/letterboxd responses (produced by api/site_api/letterboxd.py).
export interface Movie {
  title: string;
  year: string;
  watchedDate: string;
  posterUrl: string;
  rating?: number;
  link: string;
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
