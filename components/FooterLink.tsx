interface FooterLinkProps {
  name: string;
  href: string;
}

export default function FooterLink({ name, href }: FooterLinkProps) {
  return (
    <a
      class="dark:hover:text-lightblue hover:animate-pulse hover:text-blue dark:text-offwhite"
      href={href}
      target="_blank"
    >
      {name}
    </a>
  );
}
