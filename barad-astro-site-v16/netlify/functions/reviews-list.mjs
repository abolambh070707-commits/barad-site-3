import { json, reviewsStore, rebuildPublicCache } from './_lib/util.mjs';

// قائمة التقييمات المعتمدة فقط (العامة). تُقرأ من نسخة جاهزة فتكون سريعة.
export default async (req) => {
  if (req.method !== 'GET') return json({ error: 'method' }, 405);
  try {
    const store = reviewsStore();
    const data = (await store.get('public-cache', { type: 'json' })) || (await rebuildPublicCache(store));
    return json(data, 200, { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' });
  } catch (err) {
    console.error('reviews-list error', err);
    return json({ reviews: [], count: 0, average: 0 });
  }
};

export const config = { path: '/api/reviews' };
