/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Mempool.space inspired dark theme
        background: {
          DEFAULT: '#11131f',
          secondary: '#1a1d2e',
          tertiary: '#24283b',
        },
        primary: {
          DEFAULT: '#7c3aed', // Purple for Twilight branding
          light: '#a78bfa',
          dark: '#5b21b6',
        },
        accent: {
          blue: '#3b82f6',
          green: '#22c55e',
          yellow: '#eab308',
          red: '#ef4444',
          orange: '#f97316',
        },
        text: {
          DEFAULT: '#ffffff',
          secondary: '#94a3b8',
          muted: '#64748b',
        },
        border: {
          DEFAULT: '#334155',
          light: '#475569',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};
