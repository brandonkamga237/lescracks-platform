import { CalendarDays, GraduationCap, House, Mic, Newspaper, type LucideIcon } from 'lucide-react';

import { SPACES } from '@/config/site';

export interface MemberTab {
  label: string;
  to: string;
  Icon: LucideIcon;
  soon?: boolean;
}

const ICON_OF: Record<string, LucideIcon> = { '/blog': Newspaper, '/rendez-vous': CalendarDays, '/talk': Mic, '/cours': GraduationCap };

/** The member's tabs: their home, then the platform's spaces in the order every menu shows them. */
export const MEMBER_TABS: MemberTab[] = [
  { label: 'Accueil', to: '/', Icon: House },
  ...SPACES.map((space) => ({ label: space.label, to: space.to, Icon: ICON_OF[space.to] ?? Newspaper, soon: space.soon })),
];

/** The home only on its own address; a space with all its sub-pages. */
export const isTabActive = (tab: MemberTab, pathname: string) =>
  tab.to === '/' ? pathname === '/' : pathname === tab.to || pathname.startsWith(`${tab.to}/`);
