/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          blue: {
            DEFAULT: '#1E3A8A', // Xanh dương đậm hành chính
            dark: '#172554',
            light: '#1D4ED8',
            surface: '#EFF6FF',
          },
          gold: {
            DEFAULT: '#F59E0B', // Vàng hổ phách điểm nhấn
            dark: '#D97706',
            light: '#FEF3C7',
          },
          slate: {
            bg: '#F8FAFC', // Nền tổng thể
            card: '#FFFFFF', // Nền thẻ nội dung
            text: '#0F172A', // Chữ tương phản cao
            muted: '#475569',
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
        base: ['1rem', { lineHeight: '1.65rem' }], // Cỡ chữ tối thiểu 16px
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};

