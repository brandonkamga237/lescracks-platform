/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    // Touch screens fire :hover on tap and leave it stuck; hover styles only apply to real pointers.
    future: { hoverOnlyWhenSupported: true },
    content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
  	extend: {
 fontFamily: {
  sans: [
    'DM Sans',
    'Inter',
    '-apple-system',
    'BlinkMacSystemFont',
    'system-ui',
    'sans-serif'
  ],
  display: [
    'DM Sans',
    'Inter',
    'system-ui',
    'sans-serif'
  ],
  mono: [
    'JetBrains Mono',
    'Monaco',
    'Cascadia Code',
    'Segoe UI Mono',
    'Roboto Mono',
    'Oxygen Mono',
    'Ubuntu Monospace',
    'Source Code Pro',
    'Fira Mono',
    'Droid Sans Mono',
    'Courier New',
    'monospace'
  ]
},
  colors: {
    // ── TEXT RAMP — the only tints allowed for text. All WCAG AA on #000.
    //    t1 21:1 · t2 12.5:1 · t3 7.4:1 · t4 5.3:1 (floor)
    t1: 'var(--text-1)',
    t2: 'var(--text-2)',
    t3: 'var(--text-3)',
    t4: 'var(--text-4)',

    // ── BORDER RAMP — decorative only, never used for text.
    line: {
      soft: 'var(--line-soft)',
      DEFAULT: 'var(--line)',
      strong: 'var(--line-strong)',
    },

    // Section-aware surfaces: they flip inside .mode-light.
    ink: '#0b1215',
    graphite: '#394649',
    fog: '#e0e0e0',
    ash: '#757575',
    charcoal: '#232424',

    // Jaune Or / Hirki (Accent principal)
    gold: {
      50: '#fdf8e7',
      100: '#faecc5',
      200: '#f5d98b',
      300: '#f0c451',
      400: '#d4af37',
      500: '#b8962e',
      600: '#9c7c25',
      700: '#80631d',
      800: '#644914',
      900: '#48300c',
      DEFAULT: '#d4af37',
      light: '#e8c547',
      dark: '#b8962e',
      // Accent text that stays AA on both black and white sections.
      ink: 'var(--gold-ink)',
    },
    // Noir pur pour fond
    noir: {
      950: '#000000',
      900: 'var(--surface-1)',
      800: 'var(--surface-2)',
      700: 'var(--surface-3)',
      600: 'var(--surface-4)',
      DEFAULT: '#000000',
    },
    // Blanc pour texte en mode sombre
    blanc: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
      DEFAULT: '#ffffff',
    },
    // Couleurs semantiques
    // `ink` is the text tint: DEFAULT red drops to ~4.2:1 on the #232424 card, ink stays above 5.5:1.
    success: {
      DEFAULT: '#22c55e',
      foreground: '#ffffff',
      ink: '#4ade80',
    },
    error: {
      DEFAULT: '#ef4444',
      foreground: '#ffffff',
      ink: '#f87171',
    },
    warning: {
      DEFAULT: '#f59e0b',
      foreground: '#000000',
      ink: '#fcd34d',
    },
    // Legacy - garder pour compatibilite
    primary: {
      DEFAULT: '#d4af37',
      foreground: '#000000',
      blue: '#0a0f1e',
      yellow: '#d4af37',
    },
    background: '#000000',
    foreground: '#ffffff',
    card: {
      DEFAULT: 'var(--card)',
      foreground: 'var(--text-1)',
    },
    popover: {
      DEFAULT: '#111111',
      foreground: '#ffffff',
    },
    secondary: {
      DEFAULT: '#1a1a1a',
      foreground: '#ffffff',
    },
    muted: {
      DEFAULT: '#1a1a1a',
      foreground: '#a3a3a3',
    },
    accent: {
      DEFAULT: '#d4af37',
      foreground: '#000000',
    },
    destructive: {
      DEFAULT: '#ef4444',
      foreground: '#ffffff',
    },
    border: 'var(--line-soft)',
    input: 'var(--line)',
    ring: '#d4af37',
  },
    // Only what the app uses. `rise` staggers the hero in; `page-in` softens route changes.
    animation: {
      rise: 'rise 300ms var(--ease-out) both',
      'page-in': 'page-in 180ms var(--ease-out) both',
    },
    keyframes: {
      rise: {
        from: { opacity: '0', transform: 'translateY(8px)' },
        to: { opacity: '1', transform: 'translateY(0)' },
      },
      'page-in': {
        from: { opacity: '0' },
        to: { opacity: '1' },
      },
    },
    // Overrides Tailwind's weak defaults so every existing `ease-out` / `ease-in-out` gets the strong curve.
    transitionTimingFunction: {
      out: 'var(--ease-out)',
      'in-out': 'var(--ease-in-out)',
    },
    boxShadow: {
      soft: '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
      medium: '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 30px -5px rgba(0, 0, 0, 0.05)',
      large: '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 20px 50px -10px rgba(0, 0, 0, 0.1)',
      gold: '0 10px 40px -10px rgba(212, 175, 55, 0.3)',
      'gold-lg': '0 20px 60px -10px rgba(212, 175, 55, 0.4)',
    },
    backdropBlur: {
      xs: '2px'
    },
    backgroundImage: {
      'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      shimmer: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)'
    },
    backgroundSize: {
      '200%': '200% 100%'
    },
    letterSpacing: {
      tighter: '-0.05em',
      wider: '0.05em'
    },
    lineHeight: {
      'extra-tight': '1.1',
      'extra-loose': '2'
    },
    borderRadius: {
      '4xl': '2rem',
      '5xl': '2.5rem',
      '6xl': '3rem',
      lg: 'var(--radius)',
      md: 'calc(var(--radius) - 2px)',
      sm: 'calc(var(--radius) - 4px)'
    },
    screens: {
      xs: '475px',
      '3xl': '1600px'
    }
  }
 },
  plugins: [require("tailwindcss-animate")],
};
