/** The six pieces of the hex-G, ordered clockwise from the top. */
export const MARK_PIECES = [
  "M52.20 5.27 L89.84 27.00 L71.65 37.50 L52.20 26.27Z",
  "M57.86 52.00 L89.84 52.00 L89.84 70.46Z",
  "M87.64 74.27 L52.20 94.73 L52.20 73.73 L69.45 63.77Z",
  "M47.80 94.73 L12.36 74.27 L30.55 63.77 L47.80 73.73Z",
  "M10.16 70.46 L10.16 29.54 L28.35 40.04 L28.35 59.96Z",
  "M12.36 25.73 L47.80 5.27 L47.80 26.27 L30.55 36.23Z",
] as const;

export function Mark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="currentColor"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <path d={MARK_PIECES.join(" ")} />
    </svg>
  );
}

/**
 * The mark reversed out of a solid Prussian square. Plays the part YC's orange
 * square plays on its sites, in Graphite's own color. Used by the site header,
 * footer and the portal.
 */
export function MarkTile({ size = 40, className = "", title }: { size?: number; className?: string; title?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center bg-prussian text-white ${className}`}
      style={{ width: size, height: size }}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <Mark className="h-[62%] w-[62%]" />
    </span>
  );
}
