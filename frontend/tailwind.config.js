/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
  	extend: {
 fontFamily: {
  sans: [
    'Inter',
    'system-ui',
    '-apple-system',
    'sans-serif'
  ],
  display: [
    'Space Grotesk',
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
    t1: '#ffffff',
    t2: 'rgba(255, 255, 255, 0.78)',
    t3: 'rgba(255, 255, 255, 0.60)',
    t4: 'rgba(255, 255, 255, 0.50)',

    // ── BORDER RAMP — decorative only, never used for text.
    line: {
      soft: 'rgba(255, 255, 255, 0.08)',
      DEFAULT: 'rgba(255, 255, 255, 0.12)',
      strong: 'rgba(255, 255, 255, 0.20)',
    },

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
    },
    // Noir pur pour fond
    noir: {
      950: '#000000',
      900: '#0a0a0a',
      800: '#111111',
      700: '#1a1a1a',
      600: '#222222',
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
    // ── SURFACE RAMP — panel grounds stacked above the black page.
    //    The page itself stays pure black (see `background`); these are what sits on it.
    //    surface.1 cards and table headers · surface.2 hover rows and popovers
    //    surface.3 modals and the highest elevation · surface.sunken wells and code
    surface: {
      1: '#0d0d10',
      2: '#141418',
      3: '#1c1c22',
      sunken: '#050506',
      DEFAULT: '#0d0d10',
    },

    // ── STATE RAMP — meaning, never decoration. Tuned for the black ground:
    //    the light-context values these replaced glared at 21:1 against it.
    //    `.subtle` is the badge/row background, `.DEFAULT` the text and icon.
    //    Gold is the accent and never a state — a warning must not read as a brand moment.
    success: {
      DEFAULT: '#3fb950',
      subtle: 'rgba(63, 185, 80, 0.14)',
      foreground: '#031306',
    },
    error: {
      DEFAULT: '#f0656f',
      subtle: 'rgba(240, 101, 111, 0.14)',
      foreground: '#1a0405',
    },
    warning: {
      DEFAULT: '#d29922',
      subtle: 'rgba(210, 153, 34, 0.14)',
      foreground: '#150e01',
    },
    info: {
      DEFAULT: '#58a6ff',
      subtle: 'rgba(88, 166, 255, 0.14)',
      foreground: '#02101f',
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
      DEFAULT: '#111111',
      foreground: '#ffffff',
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
    border: 'rgba(255, 255, 255, 0.08)',
    input: 'rgba(255, 255, 255, 0.08)',
    ring: '#d4af37',
  },
    // ── DENSITY — the two rhythms the product works in.
    //    `comfortable` is the public site: reading, breathing, one thing at a time.
    //    `compact` is the back office: rows scanned by the dozen, never read.
    //    A component takes one or the other; it never invents a third.
    spacing: {
      'row-compact': '2.25rem',
      'row': '2.75rem',
      'row-comfortable': '3.5rem',
      'cell-x': '0.75rem',
      'cell-y': '0.5rem',
      'cell-y-comfortable': '0.875rem',
      'gutter': '1.25rem',
      'gutter-lg': '2rem',
    },

    fontSize: {
      // Data and labels, distinct from the reading scale above them.
      'label': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.08em' }],
      'data': ['0.8125rem', { lineHeight: '1.25rem' }],
      'data-lg': ['0.9375rem', { lineHeight: '1.375rem' }],
    },

    animation: {
      'fade-in': 'fadeIn 0.5s ease-in-out',
      'slide-up': 'slideUp 0.5s ease-out',
      'bounce-slow': 'bounce 2s infinite',
      'slide-left': 'slideLeft 0.8s ease-out',
      'slide-right': 'slideRight 0.8s ease-out',
      'bounce-soft': 'bounceSoft 2s infinite',
      'pulse-soft': 'pulseSoft 3s infinite',
      float: 'float 6s ease-in-out infinite',
      glow: 'glow 2s ease-in-out infinite alternate',
      shimmer: 'shimmer 2s linear infinite',
      'gradient-x': 'gradient-x 15s ease infinite',
      'gradient-y': 'gradient-y 15s ease infinite',
      'gradient-xy': 'gradient-xy 15s ease infinite',
      'scale-in': 'scaleIn 0.5s ease-out',
      'rotate-in': 'rotateIn 0.6s ease-out',
      flip: 'flip 0.6s ease-in-out',
      swing: 'swing 1s ease-in-out',
      wobble: 'wobble 1s ease-in-out',
      heartbeat: 'heartbeat 1.5s ease-in-out infinite',
      typewriter: 'typewriter 4s steps(40) 1s infinite'
    },
    keyframes: {
      fadeIn: {
        '0%': {
          opacity: '0',
          transform: 'translateY(10px)'
        },
        '100%': {
          opacity: '1',
          transform: 'translateY(0)'
        }
      },
      slideUp: {
        '0%': {
          opacity: '0',
          transform: 'translateY(30px)'
        },
        '100%': {
          opacity: '1',
          transform: 'translateY(0)'
        }
      },
      slideDown: {
        '0%': {
          opacity: '0',
          transform: 'translateY(-30px)'
        },
        '100%': {
          opacity: '1',
          transform: 'translateY(0)'
        }
      },
      slideLeft: {
        '0%': {
          opacity: '0',
          transform: 'translateX(30px)'
        },
        '100%': {
          opacity: '1',
          transform: 'translateX(0)'
        }
      },
      slideRight: {
        '0%': {
          opacity: '0',
          transform: 'translateX(-30px)'
        },
        '100%': {
          opacity: '1',
          transform: 'translateX(0)'
        }
      },
      bounceSoft: {
        '0%, 100%': {
          transform: 'translateY(0)'
        },
        '50%': {
          transform: 'translateY(-10px)'
        }
      },
      pulseSoft: {
        '0%, 100%': {
          transform: 'scale(1)'
        },
        '50%': {
          transform: 'scale(1.05)'
        }
      },
      float: {
        '0%, 100%': {
          transform: 'translateY(0px)'
        },
        '50%': {
          transform: 'translateY(-20px)'
        }
      },
      glow: {
        '0%': {
          boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)'
        },
        '100%': {
          boxShadow: '0 0 30px rgba(212, 175, 55, 0.6)'
        }
      },
      shimmer: {
        '0%': {
          backgroundPosition: '-200% 0'
        },
        '100%': {
          backgroundPosition: '200% 0'
        }
      }
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
    boxShadow: {
      soft: '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
      medium: '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 30px -5px rgba(0, 0, 0, 0.05)',
      large: '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 20px 50px -10px rgba(0, 0, 0, 0.1)',
      gold: '0 10px 40px -10px rgba(212, 175, 55, 0.3)',
      'gold-lg': '0 20px 60px -10px rgba(212, 175, 55, 0.4)',
    },
    screens: {
      xs: '475px',
      '3xl': '1600px'
    }
  }
 },
  plugins: [require("tailwindcss-animate")],
};
