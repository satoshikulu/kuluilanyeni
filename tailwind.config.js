/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito Sans', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.35s ease-out',
        'download-pulse': 'downloadPulse 2s ease-in-out infinite',
        'download-cycle': 'downloadCycle 20s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { 
            transform: 'translateY(40px)', 
            opacity: '0' 
          },
          '100%': { 
            transform: 'translateY(0)', 
            opacity: '1' 
          },
        },
        downloadPulse: {
          '0%, 100%': { 
            transform: 'scale(1)',
            boxShadow: '0 0 0 0 rgba(59, 130, 246, 0.7)'
          },
          '50%': { 
            transform: 'scale(1.05)',
            boxShadow: '0 0 0 10px rgba(59, 130, 246, 0)'
          },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(59, 130, 246, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.8)' },
        },
        downloadCycle: {
          '0%': { 
            transform: 'scale(1)',
            boxShadow: '0 0 0 0 rgba(59, 130, 246, 0)',
            opacity: '1'
          },
          '5%': { 
            transform: 'scale(1.05)',
            boxShadow: '0 0 0 8px rgba(59, 130, 246, 0.3)',
            opacity: '0.8'
          },
          '10%': { 
            transform: 'scale(1)',
            boxShadow: '0 0 0 0 rgba(59, 130, 246, 0)',
            opacity: '1'
          },
          '15%': { 
            transform: 'scale(1.05)',
            boxShadow: '0 0 0 8px rgba(59, 130, 246, 0.3)',
            opacity: '0.8'
          },
          '20%': { 
            transform: 'scale(1)',
            boxShadow: '0 0 0 0 rgba(59, 130, 246, 0)',
            opacity: '1'
          },
          '25%': { 
            transform: 'scale(1)',
            boxShadow: '0 0 0 0 rgba(59, 130, 246, 0)',
            opacity: '1'
          },
          '100%': { 
            transform: 'scale(1)',
            boxShadow: '0 0 0 0 rgba(59, 130, 246, 0)',
            opacity: '1'
          },
        },
      },
    },
  },
  plugins: [],
}


