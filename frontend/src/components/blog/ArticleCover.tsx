import LineArt from '@/components/illustrations/LineArt';

interface ArticleCoverProps {
  /** `spotlight` adds the oversized label behind the drawing. */
  size?: 'card' | 'spotlight';
}

/** Stands in for a missing cover so an uncovered blog still reads as designed, not empty. */
export default function ArticleCover({ size = 'card' }: ArticleCoverProps) {
  return (
    <span aria-hidden="true" className={`relative flex h-full w-full items-center overflow-hidden bg-noir-900 ${size === 'spotlight' ? 'justify-end pr-[10%]' : 'justify-center'}`}>
      {size === 'spotlight' && (
        <span className="absolute bottom-4 left-6 font-display text-6xl font-bold leading-none text-t4 opacity-20 sm:text-8xl">Blog</span>
      )}
      <LineArt motif="code" className="relative h-3/5 text-gold-400" />
    </span>
  );
}
