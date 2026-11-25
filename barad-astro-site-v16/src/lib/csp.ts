// سياسة أمان المحتوى (CSP) لصفحات الموقع، تُكتب في وسم meta داخل BaseLayout.
// (لا تُوضع في ملف _headers حتى لا تُطبَّق على صفحة لوحة التحكم /cms/ التي تحتاج سياسة أوسع.)
export const csp = [
  "default-src 'self'",
  "script-src 'self' https://plausible.io",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self' https://plausible.io",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://wa.me",
  'upgrade-insecure-requests',
].join('; ');
