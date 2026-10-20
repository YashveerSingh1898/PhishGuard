/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cipher: {
          bg: '#060504',
          surface: '#121110',
          elevated: '#191816',
          border: '#262422',
          borderLight: '#383532',
          text: '#F2F0EC',
          muted: '#A2A19F',
          terracotta: '#B4492A',
          'terracotta-hover': '#C95535',
          sage: '#878D6B',
          'sage-hover': '#989E7A',
          green: '#4E8752',
          amber: '#C88A35',
          danger: '#C74334',
        },
        navy: {
          950: '#060504',
          900: '#121110',
          850: '#191816',
          800: '#262422',
          700: '#383532',
        },
        cyber: {
          teal: '#878D6B',
          emerald: '#4E8752',
          amber: '#C88A35',
          rose: '#B4492A',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

