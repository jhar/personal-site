"use client";

import { useEffect, useState } from "react";
import { formatDate, Movie, ratingToStars } from "@/lib/letterboxd";

// Fetched in the browser from /api/letterboxd, which the API caches for 15 minutes.
export default function RecentMovies() {
  const [movies, setMovies] = useState<Movie[] | null>(null);

  useEffect(() => {
    fetch("/api/letterboxd")
      .then((res) => (res.ok ? res.json() : []))
      .then(setMovies)
      .catch(() => setMovies([]));
  }, []);

  if (movies === null) return <p className="text-sm opacity-50">Loading…</p>;
  if (movies.length === 0) {
    return <p className="text-sm opacity-50">Couldn&apos;t load movies right now.</p>;
  }

  return (
    <div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
        {movies.map((movie) => (
          <a
            href={movie.link}
            target="_blank"
            key={movie.link}
            className="group block"
          >
            <div className="overflow-hidden rounded mb-1.5 aspect-[2/3] bg-gray-800">
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                loading="lazy"
              />
            </div>
            <p className="text-xs font-medium leading-tight truncate">
              {movie.title}
            </p>
            {movie.rating && (
              <p className="text-xs text-yellow-400">
                {ratingToStars(movie.rating)}
              </p>
            )}
            <p className="text-xs opacity-50">{formatDate(movie.watchedDate)}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
