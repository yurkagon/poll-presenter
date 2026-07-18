import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    resolve(__dirname, './index.html'),
    resolve(__dirname, './src/**/*.{ts,tsx}'),
  ],
  theme: {
    extend: {
      colors: {
        // shadcn tokens
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // єФрендшіп tokens
        ink: {
          DEFAULT: 'var(--ef-ink)',
          soft: 'var(--ef-ink-soft)',
          faint: 'var(--ef-ink-faint)',
        },
        'accent-blue': 'var(--ef-accent-blue)',
        'accent-green': 'var(--ef-accent-green)',
        glow: 'var(--ef-glow)',
        stage: {
          1: 'var(--ef-stage-1)',
          2: 'var(--ef-stage-2)',
          3: 'var(--ef-stage-3)',
        },
        team: {
          1: 'var(--t1)',
          2: 'var(--t2)',
          3: 'var(--t3)',
          4: 'var(--t4)',
          5: 'var(--t5)',
          6: 'var(--t6)',
          7: 'var(--t7)',
        },
        cat: {
          punct: 'var(--cat-punct)',
          sport: 'var(--cat-sport)',
          creative: 'var(--cat-creative)',
          general: 'var(--cat-general)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        '3xl': '1.75rem',
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        display: ['Unbounded', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 12px 24px -10px rgba(0,0,0,0.35)',
        bigscreen: '0 50px 90px -30px rgba(5,10,20,0.55)',
      },
      keyframes: {
        pulse2: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.25 } },
        bounce2: {
          '0%,60%,100%': { transform: 'translateY(0)', opacity: 0.4 },
          '30%': { transform: 'translateY(-8px)', opacity: 1 },
        },
      },
      animation: {
        pulse2: 'pulse2 1.4s infinite',
        bounce2: 'bounce2 1.2s infinite ease-in-out',
      },
    },
  },
  plugins: [],
};
