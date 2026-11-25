import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// عنوان الموقع: غيّره هنا فقط، أو اضبط متغير SITE_URL في Netlify.
// كل الروابط (canonical وخريطة الموقع وrobots وبيانات جوجل) تُبنى منه تلقائياً.
const SITE_URL = process.env.SITE_URL || 'https://alshehri-ac.org';

export default defineConfig({
  site: SITE_URL,
  srcDir: './src',
  trailingSlash: 'always',
  compressHTML: true,
  integrations: [tailwind({ applyBaseStyles: false })],
  build: {
    inlineStylesheets: 'never',
    assets: '_astro',
  },
});
