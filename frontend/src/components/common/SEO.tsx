import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

const SITE = 'https://lescracks.com';
const DEFAULT_IMAGE = `${SITE}/images/og-image.png`;
const DEFAULT_TITLE = 'LesCracks – Devenez un crack de la tech';
const DEFAULT_DESC = "Un accompagnement structuré de 6 à 12 mois pour passer de débutant à profil employable — avec un mentor, des projets réels et une communauté.";

const setMeta = (selector: string, value: string) => {
  const el = document.querySelector(selector);
  if (el) el.setAttribute('content', value);
};

const SEO = ({
  title,
  description = DEFAULT_DESC,
  image = DEFAULT_IMAGE,
  url,
}: SEOProps) => {
  const fullTitle = title ? `${title} — LesCracks` : DEFAULT_TITLE;
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

  return null;
};

export default SEO;
