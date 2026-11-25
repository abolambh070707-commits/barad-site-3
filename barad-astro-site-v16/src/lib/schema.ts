// بيانات جوجل المنظمة (JSON-LD). كل دالة تبني عقدة جاهزة تُجمع في BaseLayout.
import { siteConfig as c, type ServiceItem } from '../data/siteData';
import type { FaqItem } from '../data/content';

export const abs = (path: string) => (path.startsWith('http') ? path : `${c.url}${path}`);
export const businessId = `${c.url}/#business`;

export function businessSchema() {
  return {
    '@type': 'HVACBusiness',
    '@id': businessId,
    name: c.name,
    alternateName: c.alternateName,
    url: c.url,
    logo: abs('/images/logo.webp'),
    image: [abs(c.ogImage), abs('/images/gallery-1.webp'), abs('/images/gallery-4.webp')],
    description: c.defaultDescription,
    telephone: c.phoneIntl,
    email: c.email,
    identifier: { '@type': 'PropertyValue', name: 'السجل التجاري', value: c.crNumber },
    paymentAccepted: c.paymentAccepted,
    ...(c.priceRange ? { priceRange: c.priceRange } : {}),
    // نشاط متنقل بلا محل: مدينة ودولة فقط، دون عنوان شارع
    address: {
      '@type': 'PostalAddress',
      addressLocality: c.city,
      addressRegion: 'مكة المكرمة',
      addressCountry: 'SA',
    },
    openingHoursSpecification: c.hours.map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: h.days,
      opens: h.opens,
      closes: h.closes,
    })),
    areaServed: { '@type': 'City', name: c.city },
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((b, i) => ({ '@type': 'ListItem', position: i + 1, name: b.name, item: b.url })),
  };
}

export function faqSchema(faqs: FaqItem[]) {
  return {
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export function serviceSchema(s: ServiceItem) {
  const url = `${c.url}/services/${s.slug}/`;
  return {
    '@type': 'Service',
    '@id': `${url}#service`,
    name: s.title,
    serviceType: s.title,
    description: s.metaDescription,
    url,
    image: abs(`${s.imageBase}.webp`),
    provider: { '@id': businessId },
    areaServed: { '@type': 'City', name: c.city },
  };
}
