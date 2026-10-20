interface MemberAvatarProps {
  name: string;
  avatarUrl?: string;
  size?: 'sm' | 'lg';
}

/** The photo, or the initial on gold when there is none. */
export default function MemberAvatar({ name, avatarUrl, size = 'sm' }: MemberAvatarProps) {
  const box = size === 'lg' ? 'h-20 w-20 text-3xl' : 'h-12 w-12 text-lg';
  return (
    <span aria-hidden="true" className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-gold-400/30 bg-gold-400/10 font-display text-gold-ink ${box}`}>
      {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : name.trim().charAt(0).toLocaleUpperCase('fr') || '?'}
    </span>
  );
}
