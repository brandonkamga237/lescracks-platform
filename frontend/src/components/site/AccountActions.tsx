import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import { Magnetic } from '@/components/motion/Magnetic';
import { Button } from '@/components/ui/button';

const ARROW = <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />;

/** The way in from the bar: sign in and join for a visitor, their account for a member, whose home is the logo. */
export default function AccountActions({ isSignedIn }: { isSignedIn: boolean }) {
  if (isSignedIn) {
    return (
      <Magnetic className="hidden sm:inline-flex">
        <Button asChild className="font-semibold"><Link to="/profil">Mon compte {ARROW}</Link></Button>
      </Magnetic>
    );
  }
  return (
    <>
      <Button asChild variant="ghost" className="hidden px-4 sm:inline-flex"><Link to="/connexion">Se connecter</Link></Button>
      <Magnetic className="hidden sm:inline-flex">
        <Button asChild className="font-semibold"><Link to="/inscription">Rejoindre {ARROW}</Link></Button>
      </Magnetic>
    </>
  );
}
