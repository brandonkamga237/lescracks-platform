import { Link } from 'react-router-dom';
import { Mail, Newspaper, GraduationCap, Calendar, Podcast } from 'lucide-react';
import { GitHubIcon, LinkedInIcon, YouTubeIcon } from '@/components/icons/BrandIcons';
import type { LucideIcon } from 'lucide-react';
import WhatsAppIcon from '@/components/icons/WhatsAppIcon';
import LesCracksLogo from '@/components/common/LesCracksLogo';

/** Not every link carries every flag; declaring them optional avoids casting at each read. */
type FooterLink = {
  label: string;
  href: string;
  icon: LucideIcon | null;
  isWhatsApp?: boolean;
  external?: boolean;
};

const NAV: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Plateforme',
    links: [
      { label: 'Blog', href: '/blog', icon: Newspaper },
      { label: 'Formations', href: '/formations', icon: GraduationCap },
      { label: 'Événements', href: '/evenements', icon: Calendar },
      { label: 'LesCracks Talk', href: '/talk', icon: Podcast },
      { label: 'À propos', href: '/a-propos', icon: null },
    ],
  },
  {
    title: 'Légal',
    links: [
      { label: "Conditions d'utilisation", href: '/conditions-utilisation', icon: null },
      { label: 'Politique de confidentialité', href: '/politique-confidentialite', icon: null },
    ],
  },
  {
    title: 'Nous retrouver',
    links: [
      { label: 'WhatsApp', href: 'https://chat.whatsapp.com/BQvJNnAxAWw3NWCkqCfhQK', icon: null, isWhatsApp: true, external: true },
      { label: 'contact@lescracks.com', href: 'mailto:contact@lescracks.com', icon: Mail, external: true },
    ],
  },
];

const SOCIALS = [
  { icon: LinkedInIcon, href: 'https://linkedin.com/company/lescracks', label: 'LinkedIn' },
  { icon: GitHubIcon,   href: 'https://github.com/lescracks',           label: 'GitHub' },
  { icon: YouTubeIcon,  href: 'https://youtube.com/@lescracks',         label: 'YouTube' },
];

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8">
        <p className="mb-10 max-w-3xl font-display text-3xl font-bold leading-[0.95] tracking-tight text-t1 sm:text-5xl">
          Deviens aussi un crack <span className="text-gold-400">de la tech.</span>
        </p>

        {/* ── Main grid ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-10 md:grid-cols-[2fr_1fr_1fr] md:gap-12">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="inline-block mb-5">
              <LesCracksLogo
                height={52}
                lesColor="#000000"
                className="w-auto"
              />
            </Link>
            <p className="text-sm text-t3 leading-relaxed mb-6 max-w-[220px]">
              Comprendre, explorer, pratiquer. La tech avance, toi aussi.
            </p>

            {/* Socials */}
            <div className="flex items-center gap-2">
              {SOCIALS.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded bg-card text-t3 transition-colors hover:text-gold-400"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Nav columns */}
          {NAV.map((col) => (
            <div key={col.title}>
              <p className="label mb-4">
                {col.title}
              </p>
              <ul className="space-y-3">
                {col.links.map((link) => {
                  const content = (
                    <span className="flex items-center gap-2 text-sm text-t3 transition-colors hover:text-t1">
                      {link.isWhatsApp ? (
                        <WhatsAppIcon className="w-3.5 h-3.5 flex-shrink-0" />
                      ) : link.icon ? (
                        <link.icon className="w-3.5 h-3.5 flex-shrink-0 opacity-50" />
                      ) : null}
                      {link.label}
                    </span>
                  );

                  return (
                    <li key={link.label}>
                      {link.external ? (
                        <a href={link.href} target="_blank" rel="noopener noreferrer">
                          {content}
                        </a>
                      ) : (
                        <Link to={link.href}>{content}</Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Bottom bar ─────────────────────────────────────────── */}
        <div className="mt-12 pt-6 border-t border-line-soft flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-t4">
            © {currentYear} LesCracks. Tous droits réservés.
          </p>
          <p className="text-xs text-t4">
            Fait avec <span className="text-gold/70">♥</span> par la communauté
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
