/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // 🚀 เปิดระบบสลับโหมด Light/Dark ด้วยคลาส
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // กลุ่มสีหลักของ PAWIN-ASSETS
        'pawin-darkblue': '#001F5B',
        'pawin-orange': '#FF8C00',
        'pawin-purple': '#7A82AB',
        'pawin-light': '#F3F4F6',
        // 🚀 ลบการล็อคสี slate ออก ปล่อยให้ Tailwind ใช้เฉดสีเทา-ดำมาตรฐาน ซึ่งรองรับ Dark Mode ดีที่สุด
      },
      fontFamily: {
        // รองรับภาษาไทยที่สวยงาม
        sans: ['"Inter"', '"Prompt"', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}