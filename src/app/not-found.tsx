import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "404 - Page not found",
};

export default function NotFound() {
  return (
    <div className="px-4 py-8 mx-auto">
      <div className="max-w-3xl mx-auto flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold">404 - Page not found</h1>
        <p className="my-4">
          The page you were looking for doesn&apos;t exist.
        </p>
        <Link href="/" className="underline">Go back home</Link>
      </div>
    </div>
  );
}
