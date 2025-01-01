/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/renderer/index.html",
    "./src/renderer/src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#007AFF',    // 蓝色主色调
        accent: '#FF3B30',     // 红色强调色
        highlight: '#FFD700',  // 金色高亮
        neutral: '#8E8E93'     // 灰色辅助色
      }
    }
  },
  plugins: [],
} 