import { User } from 'lucide-react';

import { cn } from '@/lib/utils';

interface MemberAvatarProps {
  name: string | null;
  avatarUrl?: string;
  className?: string;
}

/** The member's photo, or the first letter of their name on gold. */
export default function MemberAvatar({ name, avatarUrl, className }: MemberAvatarProps) {
  const initial = name?.trim().charAt(0).toLocaleUpperCase('fr');
  return (
    <span aria-hidden="true" className={cn('flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gold-400/30 bg-gold-400/10 text-sm font-semibold text-gold-400', className)}>
      {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : initial || <User className="h-4 w-4" />}
    </span>
  );
}
