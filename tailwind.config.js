/** @type {import('tailwindcss').Config} */
module.exports = {
content: [
  "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
  "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
],
  theme: {
    extend: {
      fontFamily: {
        // 見出しやタブなど、黒板の「手書きチョーク文字」っぽく見せたい箇所で
        // font-handwriting クラスとして使う（layout.tsxで読み込んだYomogiフォント）
        handwriting: ["var(--font-handwriting)", "cursive"],
      },
    },
  },
  plugins: [],
};