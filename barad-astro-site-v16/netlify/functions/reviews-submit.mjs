import crypto from 'node:crypto';
import { json, readBody, cleanText, clientIp, sameOrigin, rateLimited, reviewsStore, purgeOldLimits, dupKey, hashOf } from './_lib/util.mjs';

const MAX_PENDING = 300;

export default async (req, context) => {
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  if (!sameOrigin(req)) return json({ error: 'forbidden' }, 403);
  const body = await readBody(req);

  // حقل فخّ للروبوتات: الإنسان لا يراه فلا يملؤه
  if (body.website) return json({ ok: true });

  const rating = Number(body.rating);
  const name = cleanText(body.name, 40);
  const text = cleanText(body.text, 600);
  const service = cleanText(body.service, 80);
  // الجوال اختياري: يراه المالك فقط للتأكد من أنه عميل، ويُحذف عند الموافقة أو الرفض
  const phone = String(body.phone || '')
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/[\s\-()]/g, '');
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return json({ error: 'اختر عدد النجوم' }, 400);
  if (name.length < 2) return json({ error: 'اكتب اسمك' }, 400);
  if (phone && !/^\+?\d{9,15}$/.test(phone)) return json({ error: 'رقم الجوال غير صحيح' }, 400);
  if (text.length < 10) return json({ error: 'اكتب تقييماً لا يقل عن 10 أحرف' }, 400);
  if (/https?:\/\/|www\./i.test(name + ' ' + text)) return json({ error: 'لا يمكن وضع روابط في التقييم' }, 400);

  const ip = clientIp(req, context);
  try {
    if (await rateLimited('submit-hour:' + ip, 4, 3600)) return json({ error: 'محاولات كثيرة. حاول لاحقاً.' }, 429);
    if (await rateLimited('submit-day:' + ip, 10, 86400)) return json({ error: 'تجاوزت الحد اليومي للتقييمات.' }, 429);

    const store = reviewsStore();
    // منع تكرار نفس التقييم خلال اليوم (بعد تطبيع الفراغات وحالة الأحرف)
    const dup = dupKey(hashOf(name.toLowerCase() + '|' + text.toLowerCase().replace(/\s+/g, '')));
    if (await store.get(dup)) return json({ error: 'تم استلام هذا التقييم من قبل.' }, 409);

    const { blobs } = await store.list({ prefix: 'pending/' });
    if (blobs.length >= MAX_PENDING) return json({ error: 'تعذر استقبال تقييمات جديدة حالياً.' }, 503);

    const id = Date.now().toString(36) + crypto.randomBytes(3).toString('hex');
    await store.setJSON('pending/' + id, { id, name, rating, service, text, phone, createdAt: new Date().toISOString() });
    await store.set(dup, '1');

    // تنظيف دوري خفيف للملفات المنتهية (لا يؤخر الرد عند الأغلبية)
    if (Math.random() < 0.05) await purgeOldLimits().catch(() => {});
    return json({ ok: true });
  } catch (err) {
    console.error('reviews-submit error', err);
    return json({ error: 'تعذر حفظ التقييم. حاول لاحقاً.' }, 500);
  }
};

export const config = { path: '/api/reviews/submit' };
