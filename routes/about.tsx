import { Handlers, PageProps } from "$fresh/server.ts";
import {
  fetchRecentMovies,
  formatDate,
  Movie,
  ratingToStars,
} from "../utils/letterboxd.ts";

export const handler: Handlers<Movie[]> = {
  async GET(_, ctx) {
    try {
      const movies = await fetchRecentMovies();
      return ctx.render(movies);
    } catch {
      return ctx.render([]);
    }
  },
};

export default function About({ data: movies }: PageProps<Movie[]>) {
  return (
    <div class="dark:text-offwhite max-w-5xl pb-20 mx-auto w-[86%]">
      <p class="mb-8">
        I'm a software engineer experienced with cloud infrastructure, dev ops,
        full stack development for web and mobile, E2E and integration testing,
        data engineering, and creative coding.
      </p>
      <p class="mb-8">
        My academic background is in cognitive science and conceptual art. In a
        past life, I wanted to be a neuroscientist who helped study the{" "}
        <a
          class="dark:hover:text-lightblue hover:animate-pulse hover:text-blue text-lightblue"
          href="https://www.researchgate.net/publication/233556531_The_Science_of_Art_A_Neurological_Theory_of_Aesthetic_Experience"
          target="_blank"
        >
          neurological foundations of visual art
        </a>.
      </p>
      <p class="mb-2">
        Outside of work, I rotate through a handful of hobbies and interests,
        including:
      </p>
      <ul class="list-disc list-inside mb-8">
        <li>Games (Switch 2, 3DS, PS5, PC)</li>
        <li>Movies (AMC A-List, Kanopy)</li>
        <li>Philosophical and/or spiritual rabbit holes</li>
        <li>
          Serious physical practice (strength training, olympic lifting, aerial
          yoga, yoga sculpt, walking, boxing, etc.)
        </li>
      </ul>

      <h3 class="mb-2 text-lg">Gym bests*</h3>
      <table class="border-separate [border-spacing:1rem] mb-2 table-auto">
        <thead>
          <tr>
            <th class="text-left">Lift</th>
            <th>PR (lbs)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Bench Press</td>
            <td>335x1</td>
          </tr>
          <tr>
            <td>Strict Press</td>
            <td>205x3</td>
          </tr>
          <tr>
            <td class="pr-4">Overhead Pin Press from Nose</td>
            <td>227.5x1</td>
          </tr>
          <tr>
            <td>Power Clean</td>
            <td>225x1</td>
          </tr>
          <tr>
            <td>Overhead Squat</td>
            <td>200x1</td>
          </tr>
          <tr>
            <td>Front Squat</td>
            <td>350x1</td>
          </tr>
          <tr>
            <td>Back Squat</td>
            <td>405x1</td>
          </tr>
          <tr>
            <td>Deadlift</td>
            <td>485x1</td>
          </tr>
        </tbody>
      </table>
      <span class="text-xs">
        * I'm working with a lower extremity disability that skews upper/lower
        ratio from what you might expect.
      </span>

      {movies.length > 0 && (
        <div class="mt-12">
          <h3 class="mb-4 text-lg">Recently Watched Movies</h3>
          <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
            {movies.map((movie) => (
              <a
                href={movie.link}
                target="_blank"
                key={movie.link}
                class="group block"
              >
                <div class="overflow-hidden rounded mb-1.5 aspect-[2/3] bg-gray-800">
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    class="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                    loading="lazy"
                  />
                </div>
                <p class="text-xs font-medium leading-tight truncate">
                  {movie.title}
                </p>
                {movie.rating && (
                  <p class="text-xs text-yellow-400">
                    {ratingToStars(movie.rating)}
                  </p>
                )}
                <p class="text-xs opacity-50">{formatDate(movie.watchedDate)}</p>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
