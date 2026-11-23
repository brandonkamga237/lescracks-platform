/** A link of the site bar: a route or an in-page anchor, with what the phone menu shows beside it. */
export interface NavItem {
  label: string;
  to?: string;
  href?: string;
  soon?: boolean;
  /** Illustration file name, for the phone menu. */
  illustration?: string;
  summary?: string;
  /** The section of the current page that lights this link up while it is read. */
  section?: string;
}
