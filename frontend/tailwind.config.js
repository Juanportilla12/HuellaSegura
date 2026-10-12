/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Coral de la marca. Para texto y botones se usa primary-700 (contraste AA sobre blanco)
        primary: {
          50:  '#FFF5F2',
          100: '#FFE8E0',
          200: '#FFCFC2',
          300: '#FFB09E',
          400: '#FF9280',
          500: '#F97B62',
          600: '#E8614A',
          700: '#CC4A34',
          800: '#A83B28',
          900: '#7A2B1C',
          DEFAULT: '#F97B62',
        },
        // Neutros cálidos de fondo y bordes (modo claro)
        warm: {
          50:  '#FFF8F5',
          100: '#FFF0EA',
          border: '#EDE5E1',
        },
        // Texto oscuro y superficies del modo oscuro
        dark: {
          900: '#0F0F1A',
          800: '#161622',
          700: '#1E1E30',
        },
        danger:  '#EF4444',
        success: '#10B981',
      },

      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        inter:   ['Inter', 'sans-serif'],
        sans:    ['Inter', 'sans-serif'],
      },

      boxShadow: {
        card:      '0 2px 16px rgba(26,26,46,0.08)',
        'card-lg': '0 8px 40px rgba(26,26,46,0.14)',
      },

      animation: {
        'pulse-soft': 'pulseSoft 2s cubic-bezier(0.4,0,0.6,1) infinite',
      },

      keyframes: {
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.5' },
        },
      },

      maxWidth: {
        mobile: '430px',
      },
    },
  },
  plugins: [],
};
