import { Link } from 'react-router-dom';
import { Lock, User, type LucideIcon } from 'lucide-react';

import { ArrowCircle } from '@/components/ui/arrow-circle';
import { Container } from '@/components/ui/container';
import { COMMUNITY_LINK } from '@/config/site';

interface Shortcut {
  label: string;
  summary: string;
  Icon: LucideIcon | typeof COMMUNITY_LINK.Icon;
  to?: string;
  href?: string;
}

const SHORTCUTS: Shortcut[] = [
  { label: 'Mon compte', summary: 'Tes informations et ton profil public', Icon: User, to: '/profil' },
  { label: 'Sécurité et connexion', summary: 'Mot de passe, Google et GitHub', Icon: Lock, to: '/profil#securite' },
  { label: 'La communauté', summary: 'La conversation continue sur WhatsApp', Icon: COMMUNITY_LINK.Icon, href: COMMUNITY_LINK.href },
];

const TILE = 'group flex h-full items-center gap-4 rounded-3xl border border-white/10 p-5 transition-colors hover:border-gold-400/40 sm:p-6';

function Body({ label, summary, Icon }: Shortcut) {
  return (
    <>
      <Icon className="h-5 w-5 shrink-0 text-gold-400" aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{label}</span>
        <span className="mt-1 block text-sm text-white/50">{summary}</span>
      </span>
      <ArrowCircle size="sm" />
    </>
  );
}

/** The member's account and the community, one step away. */
export default function MemberShortcuts() {
  return (
    <nav aria-label="Mon compte" className="border-t border-white/10">
      <Container className="py-16 sm:py-20">
        <ul className="grid gap-3 md:grid-cols-3">
          {SHORTCUTS.map((shortcut) => (
            <li key={shortcut.label}>
              {shortcut.to
                ? <Link to={shortcut.to} className={TILE}><Body {...shortcut} /></Link>
                : <a href={shortcut.href} target="_blank" rel="noopener noreferrer" aria-label={`${shortcut.label}, nouvel onglet`} className={TILE}><Body {...shortcut} /></a>}
            </li>
          ))}
        </ul>
      </Container>
    </nav>
  );
}
