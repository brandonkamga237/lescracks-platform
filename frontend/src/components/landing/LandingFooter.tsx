import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';
import { ArrowRight, ArrowUp, ArrowUpRight, BadgeCheck, CircleCheck, Mail } from 'lucide-react';

import LesCracksLogo from '@/components/common/LesCracksLogo';
import { GitHubIcon, LinkedInIcon, YouTubeIcon } from '@/components/icons/BrandIcons';
import WhatsAppIcon from '@/components/icons/WhatsAppIcon';
import { Reveal, RevealWords } from '@/components/motion/Reveal';
import TileGrid from '@/components/decor/TileGrid';
import { EASE } from '@/lib/motion';
import { ApiError } from '@/services/http';
import { api } from '@/services/api';

const SOCIALS = [
  { label: 'WhatsApp', href: 'https://chat.whatsapp.com/BQvJNnAxAWw3NWCkqCfhQK', Icon: WhatsAppIcon, gold: true },
  { label: 'LinkedIn', href: 'https://linkedin.com/company/lescracks', Icon: LinkedInIcon, gold: false },
  { label: 'GitHub', href: 'https://github.com/lescracks', Icon: GitHubIcon, gold: false },
  { label: 'YouTube', href: 'https://youtube.com/@lescracks', Icon: YouTubeIcon, gold: false },
];

const COLUMNS: Array<{ title: string; links: Array<{ label: string; to?: string; href?: string; soon?: boolean }> }> = [
  { title: 'Plateforme', links: [{ label: 'Blog', to: '/blog' }, { label: 'Rendez-vous', to: '/evenements' }, { label: 'Le Talk', to: '/talk' }, { label: 'Cours', to: '/formations', soon: true }] },
  { title: 'LesCracks', links: [{ label: 'À propos', to: '/a-propos' }, { label: 'FAQ', href: '#faq' }, { label: 'contact@lescracks.com', href: 'mailto:contact@lescracks.com' }] },
  { title: 'Légal', links: [{ label: 'Conditions d’utilisation', to: '/conditions-utilisation' }, { label: 'Confidentialité', to: '/politique-confidentialite' }] },
];

// A line that draws itself under the link on hover, from the left.
const LINK = 'bg-[linear-gradient(currentColor,currentColor)] bg-[length:0_1px] bg-left-bottom bg-no-repeat pb-0.5 transition-[color,background-size] duration-[400ms] ease-[cubic-bezier(.22,1,.36,1)] hover:bg-[length:100%_1px] hover:text-white';

const clockFormat = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Douala' });

function useYaoundeTime(): string {
  const [time, setTime] = useState(() => clockFormat.format(new Date()));
  useEffect(() => {
    const timer = window.setInterval(() => setTime(clockFormat.format(new Date())), 15_000);
    return () => window.clearInterval(timer);
  }, []);
  return time;
}

function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);
  const field = useAnimationControls();

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!event.currentTarget.checkValidity()) {
      setError('Saisis une adresse e-mail valide.');
      void field.start({ x: [0, -6, 6, -4, 4, 0], transition: { duration: 0.4 } });
      return;
    }
    setState('sending');
    setError(null);
    try {
      await api.newsletterPublicSubscribe({ email: email.trim() });
      setState('sent');
    } catch (failure) {
      setState('idle');
      setError(failure instanceof ApiError ? failure.message : 'L’inscription n’a pas abouti. Réessaie dans un instant.');
    }
  };

  return (
    <form onSubmit={submit} noValidate className="relative mt-6">
      <label htmlFor="footer-email" className="sr-only">Adresse e-mail</label>
      <motion.div animate={field} className="flex items-center gap-2 rounded-full border border-white/12 bg-black/60 p-1.5 transition-colors focus-within:border-gold-400/60">
        <input
          id="footer-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={state === 'sent'}
          placeholder="ton@email.com"
          aria-describedby="footer-email-help"
          aria-invalid={error ? true : undefined}
          className="min-w-0 flex-1 bg-transparent px-4 text-[15px] text-white placeholder:text-white/35 focus:outline-none disabled:opacity-60"
        />
        <button type="submit" disabled={state !== 'idle'} className="group inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-gold-400 px-5 text-sm font-semibold text-black transition-colors hover:bg-gold-300 disabled:opacity-70">
          {state === 'sending' ? 'Envoi…' : 'S’inscrire'}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </button>
      </motion.div>
      <div id="footer-email-help" aria-live="polite" className="mt-3 min-h-5 text-[13px]">
        <AnimatePresence mode="wait" initial={false}>
          {state === 'sent' ? (
            <motion.p key="sent" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }} className="flex items-center gap-2 text-gold-400">
              <CircleCheck className="h-4 w-4 shrink-0" aria-hidden="true" />C’est noté : confirme ton inscription depuis l’e-mail reçu.
            </motion.p>
          ) : error ? (
            <motion.p key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} role="alert" className="text-error-ink">{error}</motion.p>
          ) : (
            <motion.p key="help" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-white/45">Un e-mail de confirmation t’est envoyé. Désinscription en un clic.</motion.p>
          )}
        </AnimatePresence>
      </div>
    </form>
  );
}

function VerifyCertificate() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = code.trim().toUpperCase();
    if (value) navigate(`/attestations/${encodeURIComponent(value)}`);
  };
  return (
    <form onSubmit={submit} className="mt-4 flex items-center gap-2 rounded-2xl border border-white/12 bg-white/[0.03] p-1.5 transition-colors focus-within:border-gold-400/60">
      <label htmlFor="footer-certificate" className="sr-only">Code de l’attestation</label>
      <input
        id="footer-certificate"
        type="text"
        required
        spellCheck={false}
        autoComplete="off"
        value={code}
        onChange={(event) => setCode(event.target.value)}
        placeholder="LC-2026-4F7Q"
        className="min-w-0 flex-1 bg-transparent px-3 font-mono text-sm uppercase tracking-[0.12em] text-white placeholder:text-white/30 focus:outline-none"
      />
      <button type="submit" aria-label="Vérifier l’attestation" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[0.08] text-white transition-colors hover:bg-gold-400 hover:text-black">
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </form>
  );
}

/** The landing's footer: what LesCracks stands for, the newsletter, the links and a certificate check. */
export default function LandingFooter() {
  const time = useYaoundeTime();

  return (
    <footer className="relative isolate overflow-hidden border-t border-white/10 bg-black">
      <TileGrid fade="bottom" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[70%] bg-[radial-gradient(ellipse_60%_70%_at_50%_100%,rgba(212,175,55,0.13),transparent_70%)]" />

      <div className="mx-auto max-w-[1320px] px-4 pt-20 sm:px-8 sm:pt-28">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:items-end lg:gap-20">
          <div>
            <LesCracksLogo height={40} className="w-auto" />
            <RevealWords as="p" className="mt-8 max-w-xl text-[clamp(1.85rem,3.6vw,3rem)] font-semibold leading-[1.08] tracking-[-0.04em]" parts={['Le savoir tech,', { text: 'partagé par ceux qui le pratiquent.', className: 'text-gold-400' }]} />
            <Reveal className="mt-8 flex flex-wrap gap-2">
              {SOCIALS.map(({ label, href, Icon, gold }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={`${label}, nouvel onglet`} className="group inline-flex h-11 items-center gap-2 rounded-full border border-white/12 bg-white/[0.03] pl-3 pr-4 text-sm text-white/80 transition-[border-color,background-color,color,transform] duration-300 hover:-translate-y-0.5 hover:border-gold-400/50 hover:bg-gold-400/[0.08] hover:text-white">
                  <Icon className={`h-4 w-4 ${gold ? 'text-gold-400' : ''}`} />
                  {label}
                  <ArrowUpRight className="h-3.5 w-3.5 text-white/40 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                </a>
              ))}
            </Reveal>
          </div>

          <Reveal className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0a0a0a]/80 p-6 backdrop-blur sm:p-8">
            <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gold-400/10 blur-3xl" />
            <p className="relative flex items-center gap-2 text-sm font-medium text-gold-400"><Mail className="h-4 w-4" aria-hidden="true" />Newsletter</p>
            <h2 className="relative mt-3 text-xl font-semibold leading-snug tracking-tight sm:text-2xl">Les prochains rendez-vous et articles, dans ta boîte mail.</h2>
            <NewsletterForm />
          </Reveal>
        </div>

        <div className="mt-20 grid grid-cols-2 gap-x-6 gap-y-12 border-t border-white/10 pt-12 md:grid-cols-4 lg:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,1.4fr)]">
          {COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <p className="text-sm font-medium text-white">{column.title}</p>
              <ul className="mt-5 space-y-3.5 text-[15px] text-white/55">
                {column.links.map((link) => (
                  <li key={link.label}>
                    {link.to ? <Link to={link.to} className={LINK}>{link.label}</Link> : <a href={link.href} className={LINK}>{link.label}</a>}
                    {link.soon && <span className="ml-2 rounded-full bg-gold-400/15 px-1.5 py-px text-[10px] font-medium text-gold-400">Bientôt</span>}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
          <div className="col-span-2 md:col-span-1">
            <p className="flex items-center gap-2 text-sm font-medium text-white"><BadgeCheck className="h-4 w-4 text-gold-400" aria-hidden="true" />Vérifier une attestation</p>
            <p className="mt-2 text-[13px] leading-relaxed text-white/45">Chaque attestation LesCracks porte un code unique. Saisis-le pour la consulter.</p>
            <VerifyCertificate />
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-6 border-t border-white/10 py-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-white/40">© {new Date().getFullYear()} LesCracks. Tous droits réservés.</p>
          <p className="flex items-center gap-2 text-sm text-white/55">
            <span className="relative flex h-2 w-2" aria-hidden="true"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-400 opacity-60 motion-reduce:animate-none" /><span className="relative inline-flex h-2 w-2 rounded-full bg-gold-400" /></span>
            Depuis Yaoundé · <time className="tabular-nums text-white">{time}</time> <span className="text-white/35">GMT+1</span>
          </p>
          <a href="#top" className="group inline-flex items-center gap-3 self-start text-sm text-white/60 transition-colors hover:text-white sm:self-auto">
            Haut de page
            <span className="grid h-11 w-11 place-items-center rounded-full border border-white/15 transition-colors group-hover:border-gold-400 group-hover:bg-gold-400 group-hover:text-black">
              <ArrowUp className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5" aria-hidden="true" />
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
}
