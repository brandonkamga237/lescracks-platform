interface DuotonePhotoProps {
  src: string;
  /** Empty when the photo is decorative. Stock photos must never be captioned as the community. */
  alt?: string;
  className?: string;
  loading?: 'eager' | 'lazy';
}

/**
 * Black-and-gold duotone: greyscale, then multiplied by gold, so shadows stay black and
 * highlights land on the accent. Every photo then reads as part of the same poster set.
 */
export default function DuotonePhoto({ src, alt = '', className = '', loading = 'lazy' }: DuotonePhotoProps) {
  return (
    <div className={`relative overflow-hidden bg-black ${className}`}>
      <img
        src={src}
        alt={alt}
        aria-hidden={alt ? undefined : true}
        loading={loading}
        className="h-full w-full object-cover brightness-[0.8] contrast-[1.15] grayscale"
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gold-400 mix-blend-multiply" />
    </div>
  );
}
