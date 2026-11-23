import { CalendarDays, GraduationCap, LayoutDashboard, Lock, Mic, Newspaper, User, type LucideIcon } from 'lucide-react';

import { SPACES } from '@/config/site';

export interface SpaceTab {
  label: string;
  to: string;
  Icon: LucideIcon;
  soon?: boolean;
}

export interface TabGroup {
  /** Absent for a group that needs no heading: the dashboard alone. */
  title?: string;
  tabs: SpaceTab[];
}

const ICON_OF: Record<string, LucideIcon> = { '/blog': Newspaper, '/rendez-vous': CalendarDays, '/talk': Mic, '/cours': GraduationCap };

const DASHBOARD: SpaceTab = { label: 'Dashboard', to: '/', Icon: LayoutDashboard };

/** The platform's spaces, in the order every menu shows them. */
const EXPLORE: SpaceTab[] = SPACES.map((space) => ({ label: space.label, to: space.to, Icon: ICON_OF[space.to] ?? Newspaper, soon: space.soon }));

const ACCOUNT: SpaceTab[] = [
  { label: 'Profil', to: '/profil', Icon: User },
  { label: 'Sécurité', to: '/profil/securite', Icon: Lock },
];

/** The sidebar: a member gets their dashboard and their account around the spaces; a visitor only the spaces. */
export const sidebarGroups = (member: boolean): TabGroup[] => (member
  ? [{ tabs: [DASHBOARD] }, { title: 'Explorer', tabs: EXPLORE }, { title: 'Mon compte', tabs: ACCOUNT }]
  : [{ title: 'Explorer', tabs: EXPLORE }]);

/** The phone's bottom bar has room for five: the dashboard and the spaces, the account sits on top. */
export const tabBarTabs = (member: boolean): SpaceTab[] => (member ? [DASHBOARD, ...EXPLORE] : EXPLORE);

/** The dashboard and the profile only on their own address, a space with all its sub-pages. */
export function isTabActive(tab: SpaceTab, pathname: string): boolean {
  if (tab.to === '/' || tab.to === '/profil') return pathname === tab.to;
  return pathname === tab.to || pathname.startsWith(`${tab.to}/`);
}
