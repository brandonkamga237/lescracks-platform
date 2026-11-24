import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import LesCracksLogo from '@/components/common/LesCracksLogo';
import TileGrid from '@/components/decor/TileGrid';
import { LEGAL_LINKS } from '@/config/site';

/**
 * The airlock between the landing and the platform: no menu to wander off through,
 * only the way back and the form.
 */
export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative isolate flex min-h-screen flex-col overflow-hidden bg-black font-geist text-white antialiased">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[70vh] bg-[radial-gradient(ellipse_60%_60%_at_50%_0%,rgba(212,175,55,0.10),transparent_70%)]" />
      <TileGrid fade="hero" />
      <header className="mx-auto flex w-full max-w-[1320px] items-center justify-between px-4 pt-5 sm:px-8 sm:pt-7">
        <Link to="/" aria-label="LesCracks, accueil"><LesCracksLogo height={36} className="w-auto" /></Link>
        <Link to="/" className="group inline-flex min-h-11 items-center gap-2 text-sm text-white/55 transition-colors hover:text-white">
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />Retour à l’accueil
        </Link>
      </header>
      <main id="main-content" tabIndex={-1} className="flex flex-1 items-center justify-center px-4 py-12 focus:outline-none sm:px-8">{children}</main>
      <footer className="flex flex-wrap justify-center gap-x-6 gap-y-2 px-4 pb-8 text-xs text-white/35">
        <span>© {new Date().getFullYear()} LesCracks</span>
        {LEGAL_LINKS.map((link) => <Link key={link.to} to={link.to} className="transition-colors hover:text-white">{link.label}</Link>)}
      </footer>
    </div>
  );
}
