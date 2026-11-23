import { Link } from 'react-router-dom';
import { useReducedMotion } from 'framer-motion';
import { ArrowUp, ArrowUpRight, BadgeCheck, Mail } from 'lucide-react';

import LesCracksLogo from '@/components/common/LesCracksLogo';
import TileGrid from '@/components/decor/TileGrid';
import { Reveal } from '@/components/motion/Reveal';
import { SplitText } from '@/components/motion/SplitText';
import NewsletterSignup from '@/components/newsletter/NewsletterSignup';
import CertificateLookup from '@/components/recognition/CertificateLookup';
import { Badge } from '@/components/ui/badge';
import { Container } from '@/components/ui/container';
import { PulseDot } from '@/components/ui/pulse-dot';
import { COMMUNITY_LINK, CONTACT_EMAIL, LEGAL_LINKS, SOCIAL_LINKS } from '@/config/site';
import { useClock } from '@/hooks/useClock';

interface FooterLink {
  label: string;
  to?: string;
  href?: string;
  soon?: boolean;
}

const COLUMNS: Array<{ title: string; links: FooterLink[] }> = [
  // The landing's footer moves through the landing, like its bar; the platform is entered through its calls to action.
  { title: 'Sur cette page', links: [{ label: 'La plateforme', href: '#plateforme' }, { label: 'Agenda', href: '#rendez-vous' }, { label: 'Blog', href: '#blog' }, { label: 'FAQ', href: '#faq' }] },
  { title: 'LesCracks', links: [{ label: 'À propos', to: '/a-propos' }, { label: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` }] },
  { title: 'Légal', links: LEGAL_LINKS },
];

// The underline draws itself from the left on hover.
const LINK = 'bg-[linear-gradient(currentColor,currentColor)] bg-[length:0_1px] bg-left-bottom bg-no-repeat pb-0.5 transition-[color,background-size] duration-[400ms] ease-out hover:bg-[length:100%_1px] hover:text-white';

function FooterLinkItem({ link }: { link: FooterLink }) {
  return (
    <li>
      {link.to ? <Link to={link.to} className={LINK}>{link.label}</Link> : <a href={link.href} className={LINK}>{link.label}</a>}
      {link.soon && <Badge className="ml-2">Bientôt</Badge>}
    </li>
  );
}

/** The site footer: what LesCracks stands for, the newsletter, the links and a certificate check. */
export default function SiteFooter() {
  const time = useClock('Africa/Douala');
  const reduced = useReducedMotion();

  return (
    <footer className="relative isolate overflow-hidden border-t border-white/10 bg-black">
      <TileGrid fade="bottom" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[70%] bg-[radial-gradient(ellipse_60%_70%_at_50%_100%,rgba(212,175,55,0.13),transparent_70%)]" />

      <Container className="pt-20 sm:pt-28">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:items-end lg:gap-20">
          <div>
            <LesCracksLogo height={40} className="w-auto" />
            <SplitText as="p" className="mt-8 max-w-xl text-[clamp(1.85rem,3.6vw,3rem)] font-semibold leading-[1.08] tracking-[-0.04em]" parts={['Le savoir tech,', { text: 'partagé par ceux qui le pratiquent.', className: 'text-gold-400' }]} />
            <Reveal className="mt-8 flex flex-wrap gap-2">
              {[COMMUNITY_LINK, ...SOCIAL_LINKS].map(({ label, href, Icon }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={`${label}, nouvel onglet`} className="group inline-flex h-11 items-center gap-2 rounded-full border border-white/12 bg-white/[0.03] pl-3 pr-4 text-sm text-white/80 transition-[border-color,background-color,color,transform] duration-300 ease-out hover:-translate-y-0.5 hover:border-gold-400/50 hover:bg-gold-400/[0.08] hover:text-white">
                  <Icon className={label === COMMUNITY_LINK.label ? 'h-4 w-4 text-gold-400' : 'h-4 w-4'} />
                  {label}
                  <ArrowUpRight className="h-3.5 w-3.5 text-white/40 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                </a>
              ))}
            </Reveal>
          </div>

          <Reveal className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-noir-900/80 p-6 backdrop-blur sm:p-8">
            <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gold-400/10 blur-3xl" />
            <p className="relative flex items-center gap-2 text-sm font-medium text-gold-400"><Mail className="h-4 w-4" aria-hidden="true" />Newsletter</p>
            <h2 className="relative mt-3 text-xl font-semibold leading-snug tracking-tight sm:text-2xl">Les prochains rendez-vous et articles, dans ta boîte mail.</h2>
            <div className="relative"><NewsletterSignup id="footer-email" /></div>
          </Reveal>
        </div>

        <div className="mt-20 grid grid-cols-2 gap-x-6 gap-y-12 border-t border-white/10 pt-12 md:grid-cols-4 lg:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,1.4fr)]">
          {COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <p className="text-sm font-medium text-white">{column.title}</p>
              <ul className="mt-5 space-y-3.5 text-[15px] text-white/55">
                {column.links.map((link) => <FooterLinkItem key={link.label} link={link} />)}
              </ul>
            </nav>
          ))}
          <div className="col-span-2 md:col-span-1">
            <p className="flex items-center gap-2 text-sm font-medium text-white"><BadgeCheck className="h-4 w-4 text-gold-400" aria-hidden="true" />Vérifier une attestation</p>
            <p className="mb-4 mt-2 text-[13px] leading-relaxed text-white/45">Chaque attestation LesCracks porte un code unique. Saisis-le pour la consulter.</p>
            <CertificateLookup id="footer-certificate" />
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-6 border-t border-white/10 py-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-white/40">© {new Date().getFullYear()} LesCracks. Tous droits réservés.</p>
          <p className="flex items-center gap-2 text-sm text-white/55">
            <PulseDot className="h-2 w-2" />
            Depuis Yaoundé · <time className="tabular-nums text-white">{time}</time> <span className="text-white/35">GMT+1</span>
          </p>
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })} className="group inline-flex items-center gap-3 self-start text-sm text-white/60 transition-colors hover:text-white sm:self-auto">
            Haut de page
            <span className="grid h-11 w-11 place-items-center rounded-full border border-white/15 transition-colors group-hover:border-gold-400 group-hover:bg-gold-400 group-hover:text-black">
              <ArrowUp className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5" aria-hidden="true" />
            </span>
          </button>
        </div>
      </Container>
    </footer>
  );
}
