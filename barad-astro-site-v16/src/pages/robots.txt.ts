// robots.txt يُبنى من عنوان الموقع في astro.config.mjs، فلا يحتاج تعديلاً يدوياً عند تغيير الدومين.
import { siteConfig } from '../data/siteData';

export function GET() {
  const body = `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /cms/\nDisallow: /api/\n\nSitemap: ${siteConfig.url}/sitemap.xml\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
