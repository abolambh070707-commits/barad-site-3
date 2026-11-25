// أدوات مشتركة لدوال الخادم: الردود، الحماية من التكرار، الجلسات، وتخزين التقييمات.
import crypto from 'node:crypto';
import { getStore } from '@netlify/blobs';

/* ---------- التخزين ----------
   barad-reviews:  pending/<id>   تقييم بانتظار المراجعة (فيه الجوال)
                   approved/<id>  تقييم منشور (بلا جوال)
                   public-cache   نسخة جاهزة للعرض العام (تُعاد بناؤها من approved/)
                   dup/<يوم>/<hash> منع تكرار نفس التقييم خلال اليوم
   barad-limits:   rl/<نافذة>/<رقم>/<hash>  عدّادات حدّ التكرار (تُنظَّف تلقائياً)
*/
export const reviewsStore = () => getStore({ name: 'barad-reviews', consistency: 'strong' });
const limitsStore = () => getStore({ name: 'barad-limits', consistency: 'strong' });

const sha = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');

/* ---------- الطلبات والردود ---------- */
export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extraHeaders },
  });
}

export async function readBody(req, maxChars = 8192) {
  try {
    const text = await req.text();
    if (text.length > maxChars) return {};
    const v = JSON.parse(text);
    return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  } catch {
    return {};
  }
}

export function clientIp(req, context) {
  return context?.ip || req.headers.get('x-nf-client-connection-ip') || 'unknown';
}

// يرفض الطلبات القادمة من موقع آخر (إن أرسل المتصفح ترويسة Origin)
export function sameOrigin(req) {
  const origin = req.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(req.url).host;
  } catch {
    return false;
  }
}

export function cleanText(v, max) {
  return String(v || '')
    .replace(/[\u0000-\u001F\u007F<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

export function safeEqual(a, b) {
  return crypto.timingSafeEqual(crypto.createHash('sha256').update(String(a)).digest(), crypto.createHash('sha256').update(String(b)).digest());
}

/* ---------- حدّ التكرار ---------- */
const rlKey = (name, windowSec) => `rl/${windowSec}/${Math.floor(Date.now() / 1000 / windowSec)}/${sha(name)}`;

export async function isLimited(name, limit, windowSec) {
  const n = await limitsStore().get(rlKey(name, windowSec), { type: 'json' }).catch(() => null);
  return (n || 0) >= limit;
}
export async function hit(name, windowSec) {
  const store = limitsStore();
  const key = rlKey(name, windowSec);
  const n = (await store.get(key, { type: 'json' }).catch(() => null)) || 0;
  await store.setJSON(key, n + 1);
}
export async function rateLimited(name, limit, windowSec) {
  if (await isLimited(name, limit, windowSec)) return true;
  await hit(name, windowSec);
  return false;
}

// حذف العدّادات المنتهية (تُستدعى أحياناً فقط حتى لا تتراكم الملفات)
export async function purgeOldLimits() {
  const limits = limitsStore();
  const now = Date.now() / 1000;
  const { blobs } = await limits.list({ prefix: 'rl/' });
  const expired = blobs.filter((b) => {
    const [, w, i] = b.key.split('/');
    return (Number(i) + 2) * Number(w) < now;
  });
  await Promise.all(expired.map((b) => limits.delete(b.key)));

  const reviews = reviewsStore();
  const today = Math.floor(now / 86400);
  const dups = await reviews.list({ prefix: 'dup/' });
  await Promise.all(dups.blobs.filter((b) => Number(b.key.split('/')[1]) < today).map((b) => reviews.delete(b.key)));
}

export const dayBucket = () => Math.floor(Date.now() / 86400000);
export const dupKey = (hash) => `dup/${dayBucket()}/${hash}`;
export const hashOf = sha;

/* ---------- جلسة الإدارة (كوكي موقّع، HttpOnly) ---------- */
export const SESSION_TTL = 8 * 3600;
const COOKIE = 'barad_admin';
const hmac = (data) =>
  crypto
    .createHmac('sha256', crypto.createHash('sha256').update('barad-admin-session|' + (process.env.ADMIN_PASSWORD || '')).digest())
    .update(data)
    .digest('hex');

export function makeSession() {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL;
  return `${exp}.${hmac(String(exp))}`;
}
export function verifySession(token) {
  const [exp, sig] = String(token || '').split('.');
  if (!exp || !sig || !/^\d+$/.test(exp) || Number(exp) < Date.now() / 1000) return false;
  return safeEqual(sig, hmac(exp));
}
export function readSessionCookie(req) {
  const m = (req.headers.get('cookie') || '').match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  return m ? m[1] : '';
}
export const sessionCookie = (token, maxAge) =>
  `${COOKIE}=${token}; Path=/api/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;

/* ---------- التقييمات المنشورة ---------- */
// ترحيل تلقائي من الصيغة القديمة (مصفوفة واحدة باسم approved) إلى ملف لكل تقييم
async function migrateLegacy(store) {
  const legacy = await store.get('approved', { type: 'json' }).catch(() => null);
  if (!Array.isArray(legacy)) return;
  await Promise.all(legacy.filter((r) => r && r.id).map((r) => store.setJSON('approved/' + r.id, r)));
  await store.delete('approved');
}

export async function listApproved(store) {
  await migrateLegacy(store);
  const { blobs } = await store.list({ prefix: 'approved/' });
  const items = (await Promise.all(blobs.map((b) => store.get(b.key, { type: 'json' }).catch(() => null)))).filter(Boolean);
  items.sort((a, b) => String(b.approvedAt || b.createdAt || '').localeCompare(String(a.approvedAt || a.createdAt || '')));
  return items;
}

// النسخة العامة تُبنى من الملفات الأصلية، فلا يضيع شيء إن تزامنت موافقتان
export async function rebuildPublicCache(store) {
  const all = await listApproved(store);
  const count = all.length;
  const average = count ? Math.round((all.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10 : 0;
  const data = { reviews: all.slice(0, 100), count, average };
  await store.setJSON('public-cache', data);
  return data;
}
