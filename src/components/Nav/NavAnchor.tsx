import NextLink from "next/link";
import type { Link } from "./links";

interface NavAnchorProps extends Link {
  className: string;
  onClick?: () => void;
}

export default function NavAnchor({ href, text, className, onClick }: NavAnchorProps) {
  return (
    <NextLink className={className} href={href} onClick={onClick}>
      {text}
    </NextLink>
  );
}
