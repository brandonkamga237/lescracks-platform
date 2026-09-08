import { Link } from 'react-router-dom';
import { Linkedin, Github, Youtube, Mail, BookOpen, Calendar } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import WhatsAppIcon from '@/components/icons/WhatsAppIcon';
import LesCracksLogo from '@/components/common/LesCracksLogo';

/** Not every link carries every flag; declaring them optional avoids casting at each read. */
type FooterLink = {
  label: string;
  href: string;
  icon: LucideIcon | null;
  highlight?: boolean;
  isWhatsApp?: boolean;
  external?: boolean;
};

const NAV: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Plateforme',
    links: [
      { label: 'Toutes les ressources', href: '/ressources', icon: BookOpen },
      { label: 'Événements', href: '/evenements', icon: Calendar },
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
  { icon: Linkedin, href: 'https://linkedin.com/company/lescracks', label: 'LinkedIn' },
  { icon: Github,   href: 'https://github.com/lescracks',           label: 'GitHub' },
  { icon: Youtube,  href: 'https://youtube.com/@lescracks',         label: 'YouTube' },
];

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black border-t border-line-soft/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">

        {/* ── Main grid ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-10 md:grid-cols-[2fr_1fr_1fr] md:gap-12">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="inline-block mb-5">
              <LesCracksLogo
                height={52}
                lesColor="#000000"
                className="w-auto opacity-90"
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
                  className="w-9 h-9 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-t3 hover:text-gold hover:border-gold/30 hover:bg-gold/10 transition-all"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Nav columns */}
          {NAV.map((col) => (
            <div key={col.title}>
              <p className="text-[11px] font-semibold text-t4 tracking-wide mb-4">
                {col.title}
              </p>
              <ul className="space-y-3">
                {col.links.map((link) => {
                  const content = (
                    <span className={`flex items-center gap-2 text-sm transition-colors ${
                      link.highlight
                        ? 'text-gold hover:text-gold-light font-medium'
                        : 'text-t3 hover:text-t1'
                    }`}>
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
            Conçu &amp; développé avec <span className="text-gold/70">♥</span> depuis Yaoundé, Cameroun
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
