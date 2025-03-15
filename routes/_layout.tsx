import { LayoutProps } from "$fresh/server.ts";
import { Partial } from "$fresh/runtime.ts";
import Footer from "../components/Footer.tsx";
import Nav from "../islands/Nav/index.tsx";

export default function Layout({ Component }: LayoutProps) {
  return (
    <body class="h-full w-full" f-client-nav>
      <Nav />
      <Partial name="main">
        <Component />
      </Partial>
      <Footer />
    </body>
  );
}
