import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#3b82f6',
          dark: '#0b1437',
          deep: '#070d24',
          light: '#8b5cf6',
          accent: '#22d3ee',
          glow: '#a855f7',
        },
        ink: {
          900: '#0b1437',
          800: '#1f2a4d',
          700: '#39426b',
          500: '#64708f',
          300: '#aab2c8',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['var(--font-sora)', 'Sora', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)',
        'brand-gradient-soft':
          'linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(139,92,246,0.12) 50%, rgba(236,72,153,0.12) 100%)',
        'hero-radial':
          'radial-gradient(ellipse 80% 60% at 70% 0%, rgba(139,92,246,0.20), transparent 60%), radial-gradient(ellipse 60% 50% at 0% 100%, rgba(34,211,238,0.18), transparent 60%)',
      },
      boxShadow: {
        glow: '0 20px 60px -12px rgba(59, 130, 246, 0.45)',
        soft: '0 10px 30px -10px rgba(15, 23, 42, 0.15)',
      },
    },
  },
  plugins: [],
};

export default config;
