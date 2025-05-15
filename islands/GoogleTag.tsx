import { useEffect } from 'preact/hooks';

type DataLayer = Array<[string, string | Date]>;

declare global {
  var dataLayer: DataLayer;
}

export default function GoogleTag() {
  useEffect(() => {
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-CESBR50DBD';
    document.head.appendChild(script);

    globalThis.dataLayer = globalThis.dataLayer || [];
    globalThis.dataLayer.push(['js', new Date()]);
    globalThis.dataLayer.push(['config', 'G-CESBR50DBD']);
  }, []);

  return <div id="google-tag-hydration"></div>;
}