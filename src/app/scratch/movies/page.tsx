import type { Metadata } from "next";
import RecentMovies from "./RecentMovies";

export const metadata: Metadata = {
  title: "Recently Watched Movies",
};

export default function Movies() {
  return (
    <div className="max-w-5xl pb-20 mx-auto w-[86%]">
      <h1 className="mb-4 text-lg">Recently Watched Movies</h1>
      <RecentMovies />
    </div>
  );
}
