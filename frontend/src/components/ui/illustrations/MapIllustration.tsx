interface Props {
  size?: number;
}

/** Ilustração de mapa dobrado com rota e pino — estado vazio de viagens. */
export function MapIllustration({ size = 132 }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Mapa">
      <rect x="6" y="6" width="128" height="128" rx="34" fill="var(--mv-primary-l)" />

      {/* papel do mapa, dobrado em 3 painéis */}
      <path
        d="M30 40 L57 31 L84 40 L110 31 L110 100 L84 109 L57 100 L30 109 Z"
        fill="var(--mv-surface)"
        stroke="var(--mv-primary)"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />
      {/* vincos das dobras */}
      <path d="M57 31 V100 M84 40 V109" stroke="var(--mv-primary)" strokeWidth="2" strokeOpacity="0.35" strokeDasharray="2 6" strokeLinecap="round" />

      {/* rota pontilhada */}
      <path
        d="M44 90 C 44 70, 72 76, 70 58 S 90 48, 96 46"
        stroke="var(--mv-primary)"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeDasharray="0.5 9"
        fill="none"
      />
      <circle cx="44" cy="90" r="4.5" fill="var(--mv-primary)" />

      {/* pino de destino */}
      <path
        d="M97 33 c -9.4 0 -17 7.6 -17 17 c 0 11.7 17 26 17 26 s 17 -14.3 17 -26 c 0 -9.4 -7.6 -17 -17 -17 Z"
        fill="var(--mv-primary)"
      />
      <circle cx="97" cy="50" r="6.2" fill="var(--mv-surface)" />
    </svg>
  );
}
