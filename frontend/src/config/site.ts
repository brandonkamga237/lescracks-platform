import type { ComponentType } from 'react';

import { GitHubIcon, LinkedInIcon, YouTubeIcon } from '@/components/icons/BrandIcons';
import WhatsAppIcon from '@/components/icons/WhatsAppIcon';

export const COMMUNITY_URL = 'https://chat.whatsapp.com/BQvJNnAxAWw3NWCkqCfhQK';
export const CONTACT_EMAIL = 'contact@lescracks.com';

export interface SocialLink {
  label: string;
  href: string;
  Icon: ComponentType<{ className?: string }>;
}

export const COMMUNITY_LINK: SocialLink = { label: 'WhatsApp', href: COMMUNITY_URL, Icon: WhatsAppIcon };

export const SOCIAL_LINKS: SocialLink[] = [
  { label: 'LinkedIn', href: 'https://linkedin.com/company/lescracks', Icon: LinkedInIcon },
  { label: 'GitHub', href: 'https://github.com/lescracks', Icon: GitHubIcon },
  { label: 'YouTube', href: 'https://youtube.com/@lescracks', Icon: YouTubeIcon },
];

export interface Space {
  label: string;
  to: string;
  /** File name in /images/illustrations, without the extension. */
  illustration: string;
  /** One line, for menus. */
  summary: string;
  /** Two or three sentences, for the page that presents the platform. */
  description: string;
  /** The call to open it; absent while the space is not open yet. */
  action?: string;
  soon?: boolean;
}

/** The spaces of the platform, in the order every menu and presentation shows them. */
export const SPACES: Space[] = [
  {
    label: 'Blog',
    to: '/blog',
    illustration: 'memo',
    summary: 'Notions et retours d’expérience',
    description: 'Des articles écrits par des praticiens : notions expliquées simplement, retours d’expérience, bonnes pratiques.',
    action: 'Lire le blog',
  },
  {
    label: 'Rendez-vous',
    to: '/evenements',
    illustration: 'calendar',
    summary: 'Ateliers, webinaires et conférences',
    description: 'Ateliers, webinaires et conférences, en ligne ou sur place. Tu t’inscris en un clic, et chaque participation te vaut une attestation vérifiable.',
    action: 'Voir l’agenda',
  },
  {
    label: 'Le Talk',
    to: '/talk',
    illustration: 'mic',
    summary: 'Des parcours réels, en vidéo',
    description: 'Des conversations vidéo avec celles et ceux qui construisent la tech africaine : des parcours réels, pas des légendes.',
    action: 'Regarder les épisodes',
  },
  {
    label: 'Cours',
    to: '/formations',
    illustration: 'cap',
    summary: 'Des parcours pas à pas',
    description: 'Des parcours pour apprendre pas à pas, leçon après leçon. Certains en accès libre, d’autres en premium. Les premiers arrivent bientôt.',
    soon: true,
  },
];

export const LEGAL_LINKS = [
  { label: 'Conditions d’utilisation', to: '/conditions-utilisation' },
  { label: 'Confidentialité', to: '/politique-confidentialite' },
];

export const illustrationSrc = (name: string) => `/images/illustrations/${name}.webp`;
