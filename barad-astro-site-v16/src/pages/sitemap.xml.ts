// خريطة الموقع تُبنى تلقائياً من البيانات: أي خدمة أو حي جديد يظهر هنا وحده.
// تاريخ التحديث يُؤخذ من siteConfig.contentUpdated.
import { services, siteConfig } from '../data/siteData';

export function GET() {
  const pages = [
    { path: '/', priority: '1.0' },
    ...services.map((s) => ({ path: `/services/${s.slug}/`, priority: '0.8' })),
    { path: '/gallery/', priority: '0.6' },
    { path: '/loyalty/', priority: '0.5' },
    { path: '/warranty/', priority: '0.3' },
    { path: '/privacy/', priority: '0.2' },
    { path: '/terms/', priority: '0.2' },
  ];
  const body = pages
    .map((p) => `  <url><loc>${siteConfig.url}${p.path}</loc><lastmod>${siteConfig.contentUpdated}</lastmod><priority>${p.priority}</priority></url>`)
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
