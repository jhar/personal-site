export interface Link {
  href: string;
  text: string;
  native?: boolean;
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
  },
  {
    href: "/scratch",
    text: "scratch",
  },
];
