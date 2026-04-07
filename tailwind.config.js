/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Original colors
        glass: "rgba(255, 255, 255, 0.05)",
        glassBorder: "rgba(255, 255, 255, 0.1)",
        accent: "#8b5cf6", // Violet
        darkBg: "#050505",
        
        // New Aesthetic Colors
        olive: {
          dark: "#0a0f0d", // Deep organic black/green
          light: "#1a211e", // Rich dark green
          muted: "#2A3330", // UI elements
        },
        cream: "#F2F0E9", // Warmer, more paper-like
        neon: {
          lime: "#CCFF00", // Maximum punch acid green
        },
        near: {
          black: "#050505",
        },
      },
      fontFamily: {
        // Original fonts
        sans: ['Inter', 'sans-serif'],
        
        // New Aesthetic Fonts
        display: ['Space Grotesk', 'sans-serif'],
        serif: ['Cormorant Garamond', 'serif'],
        script: ['Rock Salt', 'cursive'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'spin-slow': 'spin 8s linear infinite',
        'shine': 'shine 8s ease-in-out infinite',
        'marquee': 'marquee 25s linear infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        shine: {
          '0%, 100%': { transform: 'translateX(-100%) skewX(-12deg)' },
          '50%': { transform: 'translateX(200%) skewX(-12deg)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' },
        }
      },
      backgroundImage: {
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E\")",
      }
    },
  },
  plugins: [],
}