import { PageProps } from "$fresh/server.ts";

export default function App({ Component }: PageProps) {
  return (
    <html class="dark:bg-slate h-full w-full">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Justin Harrison</title>
      </head>
      <script async src="https://www.googletagmanager.com/gtag/js?id=G-CESBR50DBD"></script>
      <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());

        gtag('config', 'G-CESBR50DBD');
      </script>
      <Component />
    </html>
  );
}
