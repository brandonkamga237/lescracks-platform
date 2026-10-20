import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Loader2, MapPin } from 'lucide-react';

import MemberAvatar from '@/components/community/MemberAvatar';
import BadgeList from '@/components/recognition/BadgeList';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useApi } from '@/hooks/useApi';
import { api } from '@/services/api';

const sinceFormat = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });

interface MemberLinkProps {
  id: number;
  name: string;
  className?: string;
  /** What is clicked; the name by default. */
  children?: ReactNode;
}

function Preview({ id, name }: { id: number; name: string }) {
  const profile = useApi((signal) => api.publicProfile(id, signal), [id]);
  const data = profile.data;

  return (
    <>
      <div className="flex items-center gap-4 pr-8">
        <MemberAvatar name={data?.name ?? name} avatarUrl={data?.avatarUrl} />
        <div className="min-w-0">
          <DialogTitle className="truncate font-display text-lg font-bold text-t1">{data?.name ?? name}</DialogTitle>
          <DialogDescription className="text-sm text-t3">
            {data ? `Membre depuis ${sinceFormat.format(new Date(data.memberSince))}` : 'Profil LesCracks'}
          </DialogDescription>
        </div>
      </div>
      {profile.loading ? (
        <p role="status" className="flex items-center gap-2 text-sm text-t3"><Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />Chargement…</p>
      ) : profile.error ? (
        <p className="text-sm text-t3">Ce profil n’est pas disponible.</p>
      ) : data && (
        <div className="space-y-4">
          {data.location && <p className="flex items-center gap-1.5 text-sm text-t2"><MapPin className="h-4 w-4 text-t4" aria-hidden />{data.location}</p>}
          {data.bio && <p className="line-clamp-3 text-sm leading-relaxed text-t2">{data.bio}</p>}
          {data.badges.length > 0 ? <BadgeList badges={data.badges.slice(0, 6)} compact /> : <p className="text-sm text-t4">Pas encore de badge.</p>}
          <Link to={`/membres/${data.id}`} className="btn-secondary w-full">Voir le profil<ArrowRight className="h-4 w-4" aria-hidden /></Link>
        </div>
      )}
    </>
  );
}

/** A member's name that opens a quick look at their public profile: photo, badges, a few words. */
export default function MemberLink({ id, name, className = '', children }: MemberLinkProps) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className={`text-left underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${className}`}>
          {children ?? name}
        </button>
      </DialogTrigger>
      <DialogContent className="mode-raised w-[calc(100%-2rem)] max-w-sm rounded-lg border-line bg-card">
        {open && <Preview id={id} name={name} />}
      </DialogContent>
    </Dialog>
  );
}
