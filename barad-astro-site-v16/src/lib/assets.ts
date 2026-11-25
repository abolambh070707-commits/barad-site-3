// يضيف بصمة المحتوى (?v=...) لملفات /public/js ليتحدّث الكاش تلقائياً عند أي تعديل.
// تُحسب وقت البناء فقط، ولا تؤثر على سرعة الموقع.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const cache = new Map<string, string>();

export function assetUrl(path: string): string {
  const hit = cache.get(path);
  if (hit) return hit;
  let url = path;
  try {
    const buf = readFileSync(join(process.cwd(), 'public', path));
    url = `${path}?v=${createHash('sha256').update(buf).digest('hex').slice(0, 8)}`;
  } catch {
    // الملف غير موجود: نترك المسار كما هو
  }
  cache.set(path, url);
  return url;
}
