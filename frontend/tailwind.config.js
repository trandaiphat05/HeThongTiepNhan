/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gmail: {
          canvas: '#F6F8FC',
          surface: '#FFFFFF',
          border: '#E2E8F0',
          primary: '#0B57D0',
          primaryHover: '#0842A0',
          composeBg: '#C2E7FF',
          composeText: '#001D35',
          navActiveBg: '#D3E3FD',
          navActiveText: '#041E49',
          text: '#1F1F1F',
          secondary: '#5F6368',
        },
        gov: {
          blue: {
            DEFAULT: '#0B57D0',
            dark: '#0842A0',
            light: '#1D4ED8',
            surface: '#EAF1FB',
          },
          slate: {
            bg: '#F6F8FC',
            card: '#FFFFFF',
            text: '#1F1F1F',
            muted: '#5F6368',
            border: '#E2E8F0',
          },
          danger: '#DC2626',
          success: '#16A34A',
          warning: '#D97706',
        },
      },
      boxShadow: {
        '2xs': '0 1px 1px 0 rgba(0, 0, 0, 0.03)',
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      },
      fontSize: {
        base: ['0.875rem', { lineHeight: '1.5rem' }],
      },
      fontFamily: {
        sans: [
          'Inter',
          'Roboto',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};
