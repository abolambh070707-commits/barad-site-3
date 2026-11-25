import {
  json, readBody, clientIp, sameOrigin, isLimited, hit, safeEqual, reviewsStore,
  makeSession, verifySession, readSessionCookie, sessionCookie, SESSION_TTL,
  listApproved, rebuildPublicCache,
} from './_lib/util.mjs';

// صفحة صاحب الموقع: دخول بكوكي موقّع، ثم عرض التقييمات المعلّقة والموافقة والرفض والحذف
export default async (req, context) => {
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  // حماية من الطلبات القادمة من مواقع أخرى (CSRF): ترويسة خاصة + نفس الأصل
  if (req.headers.get('x-requested-with') !== 'barad-admin' || !sameOrigin(req)) return json({ error: 'forbidden' }, 403);

  const pw = process.env.ADMIN_PASSWORD || '';
  if (pw.length < 8) return json({ error: 'ADMIN_PASSWORD غير مضبوط على الخادم' }, 500);

  const body = await readBody(req);
  const { action } = body;

  try {
    if (action === 'login') {
      const ipKey = 'admin-fail:' + clientIp(req, context);
      // حدّ لكل عنوان، وحدّ عام ضد التخمين الموزّع
      if ((await isLimited(ipKey, 10, 3600)) || (await isLimited('admin-fail:all', 60, 3600))) {
        return json({ error: 'محاولات كثيرة. حاول بعد ساعة.' }, 429);
      }
      if (!safeEqual(String(body.password || ''), pw)) {
        await hit(ipKey, 3600);
        await hit('admin-fail:all', 3600);
        return json({ error: 'كلمة المرور غير صحيحة' }, 401);
      }
      return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie(makeSession(), SESSION_TTL) });
    }
    if (action === 'logout') return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie('', 0) });

    if (!verifySession(readSessionCookie(req))) return json({ error: 'يلزم تسجيل الدخول' }, 401);

    const store = reviewsStore();

    if (action === 'list') {
      const { blobs } = await store.list({ prefix: 'pending/' });
      const pending = (await Promise.all(blobs.map((b) => store.get(b.key, { type: 'json' })))).filter(Boolean);
      pending.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return json({ pending, approved: await listApproved(store) });
    }

    const id = String(body.id || '').replace(/[^a-z0-9]/gi, '');
    if (!id) return json({ error: 'id مطلوب' }, 400);

    if (action === 'approve') {
      const review = await store.get('pending/' + id, { type: 'json' });
      if (!review) return json({ error: 'غير موجود' }, 404);
      const { phone, ...publicReview } = review; // الجوال لا يُنشر ولا يُحفظ بعد الموافقة
      await store.setJSON('approved/' + id, { ...publicReview, approvedAt: new Date().toISOString() });
      await store.delete('pending/' + id);
      await rebuildPublicCache(store);
      return json({ ok: true });
    }
    if (action === 'reject') {
      await store.delete('pending/' + id);
      return json({ ok: true });
    }
    if (action === 'delete') {
      await store.delete('approved/' + id);
      await rebuildPublicCache(store);
      return json({ ok: true });
    }
    return json({ error: 'إجراء غير معروف' }, 400);
  } catch (err) {
    console.error('admin error', err);
    return json({ error: 'خطأ في الخادم' }, 500);
  }
};

export const config = { path: '/api/admin' };
