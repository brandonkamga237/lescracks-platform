import { Link } from 'react-router-dom';
import { Linkedin, Github, Youtube, Mail, BookOpen, Video, Code2, Users, Compass, Calendar, Info, ArrowUpRight } from 'lucide-react';
import WhatsAppIcon from '@/components/icons/WhatsAppIcon';
import LesCracksLogo from '@/components/common/LesCracksLogo';

const NAV = [
  {
    title: 'Accompagnement',
    links: [
      { label: 'Accompagnement 360', href: '/postuler', icon: Compass },
      { label: 'Postuler maintenant', href: '/postuler', icon: ArrowUpRight, highlight: true },
    ],
  },
  {
    title: 'Plateforme',
    links: [
      { label: 'Bibliothèque', href: '/ressources#bibliotheque', icon: BookOpen },
      { label: 'Vidéothèque', href: '/ressources#videotheque', icon: Video },
      { label: 'Événements', href: '/evenements', icon: Calendar },
      { label: 'Open Source', href: '/open-source', icon: Code2 },
    ],
  },
  {
    title: 'Entreprise',
    links: [
      { label: 'À propos', href: '/about', icon: Info },
      { label: 'Communauté', href: '/open-source#contributors', icon: Users },
      { label: 'WhatsApp', href: 'https://wa.me/237690000000', icon: null, isWhatsApp: true, external: true },
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
    <footer className="bg-black border-t border-white/8">

      {/* Gold accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">

        {/* ── Main grid ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-8">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="inline-block mb-5">
              <LesCracksLogo
                height={52}
                lesColor="#000000"
                className="w-auto opacity-90"
              />
            </Link>
            <p className="text-sm text-white/40 leading-relaxed mb-6 max-w-[220px]">
              Agence edtech au service des talents tech d'Afrique francophone.
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
                  className="w-8 h-8 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center text-white/40 hover:text-gold hover:border-gold/30 hover:bg-gold/8 transition-all"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Nav columns */}
          {NAV.map((col) => (
            <div key={col.title}>
              <p className="text-[11px] font-semibold text-white/25 uppercase tracking-[0.12em] mb-4">
                {col.title}
              </p>
              <ul className="space-y-3">
                {col.links.map((link) => {
                  const content = (
                    <span className={`flex items-center gap-2 text-sm transition-colors ${
                      (link as any).highlight
                        ? 'text-gold hover:text-gold-light font-medium'
                        : 'text-white/45 hover:text-white/80'
                    }`}>
                      {(link as any).isWhatsApp ? (
                        <WhatsAppIcon className="w-3.5 h-3.5 flex-shrink-0" />
                      ) : link.icon ? (
                        <link.icon className="w-3.5 h-3.5 flex-shrink-0 opacity-50" />
                      ) : null}
                      {link.label}
                    </span>
                  );

                  return (
                    <li key={link.label}>
                      {(link as any).external ? (
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
        <div className="mt-12 pt-6 border-t border-white/6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/25">
            © {currentYear} LesCracks. Tous droits réservés.
          </p>
          <p className="text-xs text-white/20">
            Conçu &amp; développé avec <span className="text-gold/70">♥</span> depuis Yaoundé, Cameroun
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
