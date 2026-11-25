/** @type {import('tailwindcss').Config} */
// الألوان كلها «أدوار» تقرأ من متغيرات في src/styles/global.css.
// لتغيير هوية الموقع عدّل المتغيرات هناك فقط، ولا تلمس القوالب.
const role = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

export default {
  // ملفات public/js تبني عناصر بالجافاسكربت وتستخدم كلاسات Tailwind، لذا تُفحص أيضاً
  content: ['./src/**/*.{astro,html,js,ts}', './public/js/**/*.js'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)'],
      },
      colors: {
        page: role('page'),     // خلفية الصفحة
        card: role('card'),     // البطاقات
        soft: role('soft'),     // أقسام بخلفية مخففة
        line: role('line'),     // الحدود
        ink: role('ink'),       // العناوين
        copy: role('copy'),     // النصوص
        muted: role('muted'),   // نصوص ثانوية
        brand: { DEFAULT: role('brand'), hover: role('brand-hover'), soft: role('brand-soft') },
        wa: { DEFAULT: role('wa'), hover: role('wa-hover') },
        night: role('night'),   // التذييل
        star: role('star'),     // نجوم التقييم
        danger: { DEFAULT: role('danger'), soft: role('danger-soft') },
        ok: { DEFAULT: role('ok'), soft: role('ok-soft') },
      },
    },
  },
  plugins: [],
};
