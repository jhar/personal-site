import NextLink from "next/link";
import type { Link } from "./links";

interface NavAnchorProps extends Link {
  className: string;
  onClick?: () => void;
}

// Native links (like the resume PDF) skip client-side navigation and load as a normal page
// in the same tab. They used to open in a new tab, but DuckDuckGo on iOS shows a black
// screen for same-site files opened with target="_blank".
export default function NavAnchor({ href, text, native, className, onClick }: NavAnchorProps) {
  if (native) {
    return (
      <a
        className={className}
        href={href}
        onClick={onClick}
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
