import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  /** Optional schema.org object injected as a per-page JSON-LD block. */
  jsonLd?: Record<string, unknown>;
  /** Keeps the page out of search results (an attestation names a person). */
  noindex?: boolean;
}

const SITE = 'https://lescracks.com';
const DEFAULT_IMAGE = `${SITE}/preview.jpg`;
const DEFAULT_TITLE = 'LesCracks · Apprendre la tech et passer à la pratique';
const DEFAULT_DESC = 'Articles, ateliers et le Talk pour apprendre la tech et passer à la pratique, avec une communauté qui apprend en faisant.';

const setMeta = (selector: string, value: string) => {
  const el = document.querySelector(selector);
  if (el) el.setAttribute('content', value);
};

const SEO = ({
  title,
  description = DEFAULT_DESC,
  image = DEFAULT_IMAGE,
  url,
  jsonLd,
  noindex = false,
}: SEOProps) => {
  const fullTitle = title ? `${title} · LesCracks` : DEFAULT_TITLE;
  const canonicalUrl = url ? `${SITE}${url}` : SITE;

  useEffect(() => {
    document.title = fullTitle;

    setMeta('meta[name="description"]', description);
    setMeta('meta[property="og:title"]', fullTitle);
    setMeta('meta[property="og:description"]', description);
    setMeta('meta[property="og:image"]', image);
    setMeta('meta[property="og:url"]', canonicalUrl);
    setMeta('meta[name="twitter:title"]', fullTitle);
    setMeta('meta[name="twitter:description"]', description);
    setMeta('meta[name="twitter:image"]', image);

    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute('href', canonicalUrl);

    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [fullTitle, description, image, canonicalUrl]);

  useEffect(() => {
    if (!noindex) return;
    setMeta('meta[name="robots"]', 'noindex, follow');
    return () => setMeta('meta[name="robots"]', 'index, follow');
  }, [noindex]);

  // Per-page structured data (schema.org). Injected as its own tagged block so it
  // never clobbers the static Organization JSON-LD in index.html.
  useEffect(() => {
    if (!jsonLd) return;
    const el = document.createElement('script');
    el.type = 'application/ld+json';
    el.setAttribute('data-seo-jsonld', '');
    el.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(el);
    return () => { el.remove(); };
  }, [jsonLd]);

  return null;
};

export default SEO;
