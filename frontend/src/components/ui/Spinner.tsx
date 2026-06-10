interface SpinnerProps {
  size?: number;
  color?: string;
}

export function Spinner({ size = 22, color = 'var(--mv-primary)' }: SpinnerProps) {
  return (
    <span className="mv-anim-spin inline-flex" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke={color} strokeOpacity={0.22} strokeWidth="3" />
        <path d="M21 12a9 9 0 0 0-9-9" stroke={color} strokeWidth="3" strokeLinecap="round" />
      </svg>
    </span>
  );
}
