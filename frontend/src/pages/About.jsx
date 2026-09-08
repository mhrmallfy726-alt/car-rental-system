import { useEffect, useState } from 'react';
import { ShieldCheck, Sparkles, Car, Headphones, Star } from 'lucide-react';
import { reviewsAPI } from '../services/api';

const highlights = [
  {
    icon: Car,
    title: 'أسطول متنوع',
    text: 'اختر السيارة المناسبة لرحلتك من سيارات موثوقة ومحدثة باستمرار.',
  },
  {
    icon: ShieldCheck,
    title: 'ثقة ووضوح',
    text: 'أسعار واضحة، موردون موثقون، وتجربة حجز مصممة بدون تعقيد.',
  },
  {
    icon: Headphones,
    title: 'دعم مستمر',
    text: 'فريقنا قريب منك قبل الحجز وأثناء الرحلة وبعدها.',
  },
];

export default function About() {
  const [platformRating, setPlatformRating] = useState({ average_rating: 0, total_reviews: 0 });
  const [platformReviews, setPlatformReviews] = useState([]);

  useEffect(() => {
    reviewsAPI.getPlatform().then(({ data }) => {
      setPlatformRating(data.data?.summary || { average_rating: 0, total_reviews: 0 });
      setPlatformReviews(data.data?.reviews || []);
    }).catch(() => {});
  }, []);

  return (
    <main className="about-page" dir="rtl">
      <section className="about-hero">
        <div className="about-hero-orb about-hero-orb-one" />
        <div className="about-hero-orb about-hero-orb-two" />
        <div className="about-hero-content">
          <span className="about-kicker"><Sparkles size={15} /> تجربة تأجير أذكى</span>
          <h1>رحلتك تبدأ من سيارة تثق بها.</h1>
          <p>نوصل العملاء بموردين موثوقين ونحوّل استئجار السيارة إلى تجربة سهلة، شفافة، ومريحة من أول بحث حتى إعادة السيارة.</p>
          <div className="about-hero-actions">
            <a href="/cars" className="about-primary-action">استكشف السيارات</a>
            <a href="/supplier-benefits" className="about-secondary-action">انضم كمورد</a>
          </div>
        </div>
        <div className="about-hero-stat-card">
          <strong>RC</strong>
          <span>Rental Circle</span>
          <small>نصنع لحظات قيادة أفضل</small>
        </div>
      </section>

      <section className="about-section">
        <div className="about-section-heading">
          <span className="about-kicker about-kicker-light">لماذا نحن؟</span>
          <h2>منصة تجمع الثقة، التقنية، والمرونة.</h2>
          <p>صممنا المنصة لتكون واضحة للمستأجر، عملية للمورد، ومرنة لكل رحلة.</p>
        </div>
        <div className="about-highlights">
          {highlights.map(({ icon: Icon, title, text }) => (
            <article className="about-highlight-card" key={title}>
              <div className="about-icon"><Icon size={21} /></div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="about-section" style={{ paddingTop: 0 }}>
        <div className="about-section-heading">
          <span className="about-kicker about-kicker-light">آراء العملاء</span>
          <h2>كيف يقيّم العملاء المنصة؟</h2>
          <p>تقييمات حقيقية بعد اكتمال الحجوزات، وتشمل السيارة والمورد والمنصة.</p>
        </div>
        <div style={{ background: '#fff', borderRadius: 20, padding: 24, maxWidth: 850, margin: '0 auto', boxShadow: '0 12px 35px rgba(23,58,82,.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <Star size={28} fill="#f4b740" color="#f4b740" />
            <strong style={{ fontSize: 28, color: '#173a52' }}>{Number(platformRating.average_rating || 0).toFixed(1)}</strong>
            <span style={{ color: '#64748b' }}>من 5 — {platformRating.total_reviews || 0} تقييم</span>
          </div>
          {platformReviews.slice(0, 3).map((review) => (
            <article key={review.id} style={{ borderTop: '1px solid #edf1f4', padding: '14px 0', color: '#53636e' }}>
              <strong style={{ color: '#173a52' }}>{review.reviewer_name || 'عميل'}</strong> · {review.platform_rating}/5 نجوم
              {review.platform_comment && <p style={{ margin: '6px 0 0', lineHeight: 1.7 }}>{review.platform_comment}</p>}
            </article>
          ))}
          {!platformReviews.length && <p style={{ color: '#64748b', margin: 0 }}>ستظهر تقييمات المنصة هنا بعد اكتمال أول حجز.</p>}
        </div>
      </section>
    </main>
  );
}
