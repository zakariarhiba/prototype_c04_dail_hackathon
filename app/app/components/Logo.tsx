type LogoProps = { size?: number; className?: string };

// The Dockline mark: a reconciled checkmark inside a dock/parcel shape.
// Same paths as app/app/icon.svg (the favicon) — kept in sync by hand since
// the favicon file can't read CSS variables.
export function Logo({ size = 28, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
    >
      <rect x="1" y="1" width="22" height="22" rx="6" fill="var(--color-primary)" />
      <path
        d="M7 12.5l3 3 7-7"
        fill="none"
        stroke="var(--color-primary-contrast)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
