import LineArt from '@/components/illustrations/LineArt';
import type { LineArtMotif } from '@/components/illustrations/LineArt';
import { KIND_LABEL } from '@/lib/resources';
import type { ResourceKind } from '@/services/types';

const KIND_MOTIF: Record<ResourceKind, LineArtMotif> = { EBOOK: 'book', EXTERNAL_VIDEO: 'video', ARTICLE: 'code' };

interface KindCoverProps {
  kind: ResourceKind;
  /** `spotlight` adds the oversized kind label behind the drawing. */
  size?: 'card' | 'spotlight';
}

/** Stands in for a missing cover so an uncovered catalogue still reads as designed, not empty. */
export default function KindCover({ kind, size = 'card' }: KindCoverProps) {
  return (
    <span aria-hidden="true" className={`relative flex h-full w-full items-center overflow-hidden bg-noir-900 ${size === 'spotlight' ? 'justify-end pr-[10%]' : 'justify-center'}`}>
      {size === 'spotlight' && (
        <span className="absolute bottom-4 left-6 font-display text-6xl font-bold leading-none text-t4 opacity-20 sm:text-8xl">
          {KIND_LABEL[kind]}
        </span>
      )}
      <LineArt motif={KIND_MOTIF[kind]} className="relative h-3/5 text-gold-400" />
    </span>
  );
}
