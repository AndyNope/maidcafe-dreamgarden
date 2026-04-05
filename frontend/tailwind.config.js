/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        sakura:    { DEFAULT: '#FFB7D5', light: '#FFEEF5', dark: '#FF6B9D' },
        maid:      { DEFAULT: '#FF6B9D', dark: '#E91E8C' },
        sky:       { DEFAULT: '#BAE6FD', dark: '#93C5FD' },
        lavender:  { DEFAULT: '#DDD6FE', dark: '#C4B5FD' },
        cream:     { DEFAULT: '#FFF8F0' },
        petal:     { DEFAULT: '#FFD6E7' },
        dream:     { DEFAULT: '#FFF0F5' },
        dusk:      { DEFAULT: '#4A1942' },
      },
      fontFamily: {
        display:  ['"Playfair Display"', 'Georgia', 'serif'],
        kawaii:   ['"Nunito"', 'sans-serif'],
        japanese: ['"Noto Serif JP"', 'serif'],
      },
      backgroundImage: {
        'sakura-gradient':  'linear-gradient(135deg, #FFEEF5 0%, #FFD6E7 50%, #BAE6FD 100%)',
        'hero-gradient':    'linear-gradient(160deg, #FFF0F5 0%, #FFE4F0 40%, #EEF7FF 100%)',
        'admin-gradient':   'linear-gradient(135deg, #4A1942 0%, #7B2F7A 100%)',
        'lace-gradient':    'repeating-linear-gradient(90deg, transparent, transparent 8px, #FFB7D540 8px, #FFB7D540 9px)',
      },
      animation: {
        'float':         'float 6s ease-in-out infinite',
        'float-slow':    'float 9s ease-in-out infinite',
        'flutter':       'flutter 4s ease-in-out infinite',
        'sparkle':       'sparkle 1.5s ease-in-out infinite',
        'shimmer':       'shimmer 2s linear infinite',
        'bow-bounce':    'bowBounce 2s ease-in-out infinite',
        'heart-pop':     'heartPop 0.4s ease-out',
        'petal-fall':    'petalFall linear infinite',
        'fade-up':       'fadeUp 0.6s ease-out',
        'slide-in-left': 'slideInLeft 0.5s ease-out',
        'pulse-soft':    'pulseSoft 2s ease-in-out infinite',
        'cursor-ring':   'cursorRing 0.4s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-16px)' },
        },
        flutter: {
          '0%, 100%': { transform: 'rotate(-8deg) scale(1)' },
          '50%':      { transform: 'rotate(8deg) scale(1.05)' },
        },
        sparkle: {
          '0%, 100%': { opacity: '1', transform: 'scale(1) rotate(0deg)' },
          '50%':      { opacity: '0.6', transform: 'scale(1.3) rotate(180deg)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        bowBounce: {
          '0%, 100%': { transform: 'scaleX(1) scaleY(1)' },
          '50%':      { transform: 'scaleX(1.05) scaleY(0.95)' },
        },
        heartPop: {
          '0%':   { transform: 'scale(0) rotate(-20deg)', opacity: '0' },
          '60%':  { transform: 'scale(1.4) rotate(10deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
        petalFall: {
          '0%':   { transform: 'translateY(-10%) rotate(0deg)', opacity: '0.9' },
          '100%': { transform: 'translateY(110vh) rotate(720deg)', opacity: '0' },
        },
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%':   { opacity: '0', transform: 'translateX(-32px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.7' },
        },
        cursorRing: {
          '0%':   { transform: 'scale(0)', opacity: '1' },
          '100%': { transform: 'scale(2.5)', opacity: '0' },
        },
      },
      boxShadow: {
        'kawaii':   '0 4px 24px 0 rgba(255, 107, 157, 0.18), 0 1px 4px 0 rgba(255, 107, 157, 0.08)',
        'kawaii-lg':'0 8px 40px 0 rgba(255, 107, 157, 0.24), 0 2px 8px 0 rgba(255, 107, 157, 0.12)',
        'blue':     '0 4px 24px 0 rgba(147, 197, 253, 0.3)',
      },
      borderRadius: {
        'kawaii': '1.5rem',
      },
    },
  },
  plugins: [],
}
