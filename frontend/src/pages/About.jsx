import { ShieldCheck, Sparkles, Car, Headphones } from 'lucide-react';

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
            <a href="/supplier/join" className="about-secondary-action">انضم كمورد</a>
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
    </main>
  );
}
