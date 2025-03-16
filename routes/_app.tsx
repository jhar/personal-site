import { PageProps } from "$fresh/server.ts";

export default function App({ Component }: PageProps) {
  return (
    <html class="dark:bg-slate h-full w-full">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Justin Harrison</title>
      </head>
      <Component />
    </html>
  );
}
