export interface MemberSpace {
  index: number;
  label: string;
  /** A fifth of a phone's width is too narrow for the long labels. */
  short: string;
  to: string;
}

/** The numbered spaces of the notebook, in the order the sidebar and the tab bar show them. */
export const MEMBER_SPACES: MemberSpace[] = [
  { index: 0, label: 'Mon carnet', short: 'Carnet', to: '/' },
  { index: 1, label: 'Apprendre', short: 'Apprendre', to: '/cours' },
  { index: 2, label: 'Lire', short: 'Lire', to: '/blog' },
  { index: 3, label: 'Rendez-vous', short: 'Agenda', to: '/rendez-vous' },
];

/** The space a page belongs to; the notebook only on its own address, the others with their sub-pages. */
export function spaceOf(pathname: string): number | undefined {
  if (pathname === '/') return 0;
  return MEMBER_SPACES.find((space) => space.to !== '/' && (pathname === space.to || pathname.startsWith(`${space.to}/`)))?.index;
}
