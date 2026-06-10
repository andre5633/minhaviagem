interface Props {
  size?: number;
}

/** Ilustração de nota/recibo com selo de confirmação — estado vazio de despesas. */
export function NoteIllustration({ size = 132 }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Nota">
      <rect x="6" y="6" width="128" height="128" rx="34" fill="var(--mv-primary-l)" />

      {/* corpo da nota com borda serrilhada embaixo */}
      <path
        d="M40 28 H96 V104 l-7 -5 -7 5 -7 -5 -7 5 -7 -5 -7 5 -7 -5 -7 5 V28 Z"
        fill="var(--mv-surface)"
        stroke="var(--mv-primary)"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />

      {/* título da nota */}
      <rect x="52" y="40" width="32" height="6.5" rx="3.25" fill="var(--mv-primary)" />

      {/* linhas de texto */}
      <g stroke="var(--mv-muted)" strokeWidth="3.2" strokeLinecap="round" strokeOpacity="0.5">
        <path d="M52 59 H84" />
        <path d="M52 69 H78" />
        <path d="M52 79 H84" />
      </g>

      {/* selo de confirmação */}
      <circle cx="94" cy="93" r="16.5" fill="var(--mv-primary)" />
      <path d="M87 93 l4.5 4.5 l8 -9" stroke="var(--mv-surface)" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}
