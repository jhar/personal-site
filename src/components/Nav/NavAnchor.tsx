import NextLink from "next/link";
import { useSyncExternalStore } from "react";
import type { Link } from "./links";

interface NavAnchorProps extends Link {
  className: string;
  onClick?: () => void;
}

// Whether the browser says it can't show PDFs inline (iOS Lockdown Mode, for one).
// Browsers that don't report it are assumed to manage.
function usePdfUnsupported() {
  return useSyncExternalStore(
    () => () => {},
    () => navigator.pdfViewerEnabled === false,
    () => false,
  );
}

// Native links (like the resume PDF) skip client-side navigation and load as a normal page
// in the same tab. They used to open in a new tab, but DuckDuckGo on iOS shows a black
// screen for same-site files opened with target="_blank". A native link with a fallback
// goes there instead when the browser can't show PDFs.
export default function NavAnchor({ href, text, native, fallback, className, onClick }: NavAnchorProps) {
  const pdfUnsupported = usePdfUnsupported();
  if (native && !(fallback && pdfUnsupported)) {
    return (
      <a className={className} href={href} onClick={onClick}>
        {text}
      </a>
    );
  }
  return (
    <NextLink className={className} href={native ? fallback! : href} onClick={onClick}>
      {text}
    </NextLink>
  );
}
