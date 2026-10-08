import type { CrackLabMember } from '@/services/types';

interface AvatarProps {
  member: CrackLabMember;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-lg', xl: 'h-20 w-20 text-2xl sm:h-24 sm:w-24 sm:text-3xl' };

export default function Avatar({ member, size = 'md', className = '' }: AvatarProps) {
  return (
    <span aria-hidden className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-noir-800 font-semibold text-t2 ${SIZE[size]} ${className}`}>
      {member.avatarUrl
        ? <img src={member.avatarUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
        : member.displayName.trim().charAt(0).toLocaleUpperCase('fr')}
    </span>
  );
}
