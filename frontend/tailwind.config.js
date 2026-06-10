/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Source Sans 3"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        // ── Tokens de tema (resolvem via CSS vars em [data-theme]) ──
        primary: {
          DEFAULT: 'var(--mv-primary)',
          dark: 'var(--mv-primary-d)',
          soft: 'var(--mv-primary-l)',
        },
        bg: 'var(--mv-bg)',
        surface: {
          DEFAULT: 'var(--mv-surface)',
          2: 'var(--mv-surface-2)',
        },
        line: {
          DEFAULT: 'var(--mv-border)',
          2: 'var(--mv-border-2)',
        },
        subtle: 'var(--mv-subtle)',
        ink: {
          DEFAULT: 'var(--mv-ink)',
          2: 'var(--mv-ink-2)',
          3: 'var(--mv-ink-3)',
        },
        muted: 'var(--mv-muted)',
        faint: {
          DEFAULT: 'var(--mv-faint)',
          2: 'var(--mv-faint-2)',
        },
        ok: {
          DEFAULT: 'var(--mv-ok)',
          l: 'var(--mv-ok-l)',
          c: 'var(--mv-ok-c)',
        },
        bad: {
          DEFAULT: 'var(--mv-bad)',
          l: 'var(--mv-bad-l)',
          l2: 'var(--mv-bad-l2)',
          bd: 'var(--mv-bad-bd)',
        },
        accent2: {
          DEFAULT: 'var(--mv-accent2)',
          l: 'var(--mv-accent2-l)',
        },
        // ── Paleta fixa da marca (Leva Meu Guia) ──
        brand: {
          sunset: '#EF5244',
          sunny: '#FEAC3A',
          flower: '#FD796D',
          skyfull: '#43346A',
          violet: '#231B37',
          dayon: '#DF8E1E',
          plane: '#F6F7F9',
          grays: '#D7D9DF',
        },
      },
      borderRadius: {
        card: 'var(--mv-radius)',
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,.04), 0 8px 24px -16px rgba(15,23,42,.18)',
        cardHover: '0 4px 8px rgba(0,0,0,.06), 0 18px 36px -18px rgba(15,23,42,.28)',
        fab: '0 14px 30px -8px var(--mv-primary)',
      },
    },
  },
  plugins: [],
};
