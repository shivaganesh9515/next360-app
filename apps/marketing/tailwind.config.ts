import type { Config } from 'tailwindcss';

/**
 * Next360 Marketing — Tailwind Configuration
 *
 * NOTE: Tailwind v4 uses CSS-first config via @theme in globals.css.
 * This file exists for documentation and IDE support only.
 * The actual design tokens are defined in src/app/globals.css.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#FFFFFF',
        text: '#1C1B17',
        brass: '#C9A66B',
        'brass-hover': '#B8954F',
        organic: {
          accent: '#5C6B4D',
          tint: '#EDF0E8',
          border: 'rgba(92,107,77,0.3)',
        },
        natural: {
          accent: '#9B6A3F',
          tint: '#F4ECE3',
          border: 'rgba(155,106,63,0.3)',
        },
        eco: {
          accent: '#2F5D62',
          tint: '#E7EEEE',
          border: 'rgba(47,93,98,0.3)',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
