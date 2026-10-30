interface FooterLinkProps {
  name: string;
  href: string;
}

export default function FooterLink({ name, href }: FooterLinkProps) {
  return (
    <a
      className="hover:animate-pulse hover:text-link-hover text-ink"
      href={href}
      target="_blank"
    >
      {name}
    </a>
  );
}
