type ImageComparePairProps = {
  src: string;
  alt: string;
  caption?: React.ReactNode;
};

export function ImageComparePair({ src, alt, caption }: ImageComparePairProps) {
  return (
    <figure>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <CompareColumn label="Standard" className="preview-original" src={src} alt={alt} />
        <CompareColumn label="Ultra" className="gainmap-image" src={src} alt={alt} />
      </div>
      {caption ? (
        <figcaption className="mt-4 text-sm leading-6 text-[var(--muted)]">{caption}</figcaption>
      ) : null}
    </figure>
  );
}

function CompareColumn({
  label,
  className,
  src,
  alt,
}: {
  label: string;
  className: string;
  src: string;
  alt: string;
}) {
  return (
    <div className="grid gap-2">
      <p className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--muted)]">{label}</p>
      <div className="checkerboard grid place-items-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--panel)] p-8 transition hover:border-[color-mix(in_srgb,var(--accent)_30%,var(--border))]">
        <img src={src} alt={alt} className={`${className} max-h-56 max-w-full object-contain`} />
      </div>
    </div>
  );
}
