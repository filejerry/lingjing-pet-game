/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 黑白主题色
        primary: {
          black: '#000000',
          white: '#FFFFFF',
          gray: {
            50: '#F9FAFB',
            100: '#F3F4F6',
            200: '#E5E7EB',
            300: '#D1D5DB',
            400: '#9CA3AF',
            500: '#6B7280',
            600: '#4B5563',
            700: '#374151',
            800: '#1F2937',
            900: '#111827',
          }
        },
        // 稀有度颜色
        rarity: {
          N: '#9CA3AF',      // 普通-灰色
          R: '#3B82F6',      // 稀有-蓝色
          SR: '#8B5CF6',     // 超稀有-紫色
          SSR: '#EF4444',    // 极稀有-红色
          SSS: 'linear-gradient(90deg, #FF0080, #FF8C00, #FFD700, #00FF00, #00CED1, #4169E1, #9370DB)' // 传说-七彩
        },
        // 场景氛围色
        scene: {
          volcano: 'rgba(255,60,60,0.14)',
          sky: 'rgba(70,140,255,0.12)',
          forest: 'rgba(60,200,120,0.10)',
          desert: 'rgba(240,200,120,0.12)'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans SC', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
