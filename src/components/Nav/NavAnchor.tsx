import NextLink from "next/link";
import type { Link } from "./links";

interface NavAnchorProps extends Link {
  className: string;
  onClick?: () => void;
}

// Native links (like the resume PDF) open in a new tab instead of client-side navigation.
export default function NavAnchor({ href, text, native, className, onClick }: NavAnchorProps) {
  if (native) {
    return (
      <a
        className={className}
        href={href}
        onClick={onClick}
        target="_blank"
        rel="noopener noreferrer"
      >
        {text}
      </a>
    );
  }
  return (
    <NextLink className={className} href={href} onClick={onClick}>
      {text}
    </NextLink>
  );
}
