import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import type { NavItem } from '@/components/site/navigation';

interface NavItemLinkProps {
  item: NavItem;
  className: string;
  children: ReactNode;
  onClick?: () => void;
  onMouseEnter?: () => void;
}

/** A router link for a route, a plain anchor for a place on the page. */
export default function NavItemLink({ item, children, ...props }: NavItemLinkProps) {
  if (item.to) return <Link to={item.to} {...props}>{children}</Link>;
  return <a href={item.href} {...props}>{children}</a>;
}
