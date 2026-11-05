export interface Link {
  href: string;
  text: string;
  native?: boolean;
  // Page to use instead of a native PDF link when the browser can't show PDFs.
  fallback?: string;
}

export const links: Link[] = [
  {
    href: "/",
    text: "home",
  },
  {
    href: "/about",
    text: "about",
  },
  {
    href: "/resume.pdf",
    text: "resume",
    native: true,
    fallback: "/resume",
  },
  {
    href: "/scratch",
    text: "scratch",
  },
];
