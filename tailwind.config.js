/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ds: {
          bg:      '#070C14',
          surface: '#0D1625',
          card:    '#111F34',
          border:  '#1A2E4A',
          teal:    '#00D9C0',
          tealDim: '#00A896',
          red:     '#FF4C6A',
          amber:   '#FFB347',
          green:   '#3DDC84',
          text:    '#D8E8FF',
          muted:   '#6B8CAE',
        },
      },
      fontFamily: {
        display: ['"Syne"', 'sans-serif'],
        body:    ['"DM Sans"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan':       'scan 4s linear infinite',
        'glow':       'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        scan: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        glow: {
          from: { boxShadow: '0 0 10px #00D9C040' },
          to:   { boxShadow: '0 0 30px #00D9C080, 0 0 60px #00D9C020' },
        },
      },
    },
  },
  plugins: [],
}
