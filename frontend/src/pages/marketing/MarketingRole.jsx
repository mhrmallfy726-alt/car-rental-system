import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, BarChart3, CheckCircle2, Globe2, Headphones, Lock, Search, ShieldCheck, Sparkles, TrendingUp, Users, Zap } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import supplierBenefits from '../../assets/marketing/supplier-benefits-3d.webp';
import renterBenefits from '../../assets/marketing/customer-benefits-3d.webp';
import logoMarketplace from '../../assets/marketing/LOGO.png';

const NAVY = '#1a3a52';
const NAVY_DARK = '#122737';
const GOLD = '#d4af37';
const INK = '#14222f';
const WARM = '#fbfaf6';

function useMobileLayout() {
  const [isMobile, setIsMobile] = React.useState(() => typeof window !== 'undefined' && window.innerWidth < 820);

  React.useEffect(() => {
    const media = window.matchMedia('(max-width: 819px)');
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);

  return isMobile;
}

const supplierContent = {
  eyebrow: 'مساحة نمو مصممة للموردين',
  title: 'حوّل خبرتك إلى حضور تجاري أوضح',
  description: 'اعرض خدماتك وأساطيلك أمام العملاء داخل تجربة تأجير منظمة، وامنح علامتك مساحة تليق بما تقدمه.',
  image: supplierBenefits,
  heroButton: 'ابدأ طلب الانضمام',
  heroPath: '/Vendor-Join',
  accent: NAVY,
  accentSoft: '#eef4f5',
  features: [
    { icon: TrendingUp, title: 'فرص نمو أوضح', text: 'قدّم خدماتك ضمن مسار يساعد العميل على اكتشافها واتخاذ قرار أسرع.' },
    { icon: Globe2, title: 'وصول منظم للعملاء', text: 'استفد من حضورك داخل نظام تأجير يربطك بالباحثين عن خيارات موثوقة.' },
    { icon: BarChart3, title: 'قراءة أفضل للأداء', text: 'تابع ما يهمك من الطلبات والعروض ووجّه جهودك بصورة أكثر عملية.' },
    { icon: Users, title: 'علاقات أسهل', text: 'تواصل بوضوح مع العملاء وقلل الخطوات المتكررة في دورة الحجز.' },
    { icon: ShieldCheck, title: 'هوية موثوقة', text: 'اعرض معلوماتك وخدماتك في واجهة واضحة تعزز الثقة قبل التواصل.' },
    { icon: Zap, title: 'بداية أسرع', text: 'انتقل من التسجيل إلى تقديم خدماتك عبر خطوات محددة وسهلة المتابعة.' },
  ],
  process: [
    ['01', 'جهّز معلوماتك', 'أضف بيانات النشاط والخدمات التي ترغب في إبرازها.'],
    ['02', 'أكمل الطلب', 'أرسل طلب الانضمام عبر النموذج الموجود في النظام.'],
    ['03', 'ابدأ الحضور', 'بعد المراجعة، جهّز عروضك وابدأ استقبال فرص الحجز.'],
  ],
};

const renterContent = {
  eyebrow: 'تجربة أوضح للمستأجرين',
  title: 'اكتشف خياراتك، واحجز بثقة',
  description: 'ابحث وقارن بين السيارات والخدمات داخل نظام تأجير واحد، مع تفاصيل تساعدك على اختيار ما يناسب رحلتك.',
  image: renterBenefits,
  heroButton: 'استكشف السيارات',
  heroPath: '/register',
  accent: GOLD,
  accentSoft: '#fbf6e8',
  features: [
    { icon: Search, title: 'خيارات في مكان واحد', text: 'ابدأ من احتياجك واستعرض السيارات والموردين في تجربة منظمة.' },
    { icon: CheckCircle2, title: 'مقارنة أسهل', text: 'اقرأ التفاصيل المهمة وقارن بين الأسعار والخيارات قبل اتخاذ القرار.' },
    { icon: Lock, title: 'حجز أكثر وضوحاً', text: 'تابع خطوات الحجز والبيانات المطلوبة دون تشتيت أو تعقيد.' },
    { icon: ShieldCheck, title: 'حماية واطمئنان', text: 'استفد من مسارات الدعم والشكاوى الموجودة داخل النظام عند الحاجة.' },
    { icon: Headphones, title: 'مساعدة عند الحاجة', text: 'احتفظ بقنوات التواصل المناسبة قريبة منك أثناء رحلة الحجز.' },
    { icon: Sparkles, title: 'تجربة مصممة حولك', text: 'دع اختيارك يبدأ من تاريخك وموقعك واحتياجك الفعلي.' },
  ],
  process: [
    ['01', 'حدد احتياجك', 'اختر الموقع والتاريخ والتفاصيل التي تهم رحلتك.'],
    ['02', 'قارن الخيارات', 'استعرض السيارات والخدمات المتاحة واختر الأنسب لك.'],
    ['03', 'أكمل الحجز', 'انتقل إلى خطوة الحجز وتابع تفاصيل رحلتك بوضوح.'],
  ],
};

function FeatureCard({ feature, index, accent }) {
  const Icon = feature.icon;
  return (
    <motion.article initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.45, delay: index * 0.06 }} whileHover={{ y: -7 }} style={{ minHeight: 232, padding: 26, borderRadius: 24, background: 'rgba(255,255,255,0.86)', border: '1px solid rgba(212,175,55,0.22)', borderInlineStart: `3px solid ${accent}`, boxShadow: '0 18px 46px rgba(26,58,82,0.08)' }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, display: 'grid', placeItems: 'center', color: '#fff', background: accent, boxShadow: `0 12px 24px ${accent}30`, marginBottom: 20 }}>
        <Icon size={26} />
      </div>
      <h3 style={{ margin: '0 0 10px', color: INK, fontSize: 21, fontWeight: 900 }}>{feature.title}</h3>
      <p style={{ margin: 0, color: '#5c6b76', fontSize: 15, lineHeight: 1.85 }}>{feature.text}</p>
    </motion.article>
  );
}

export default function MarketingRole({ role: roleProp }) {
  const { role: routeRole } = useParams();
  const role = roleProp || routeRole;
  const navigate = useNavigate();
  const isMobile = useMobileLayout();
  const content = role === 'supplier' ? supplierContent : renterContent;
  const isSupplier = role === 'supplier';

  return (
    <main dir="rtl" style={{ minHeight: 'calc(100vh - 72px)', background: WARM, color: INK, overflow: 'hidden' }}>
      <section style={{ position: 'relative', padding: isMobile ? '46px 16px 70px' : '74px 24px 92px', background: `linear-gradient(135deg, ${content.accentSoft} 0%, #fff 54%, ${WARM} 100%)` }}>
        <div style={{ position: 'absolute', width: 460, height: 460, borderRadius: '50%', background: `${content.accent}14`, filter: 'blur(8px)', top: -220, left: -160, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, marginBottom: isMobile ? 44 : 64 }}>
            <Link to="/landing" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#5d6d78', fontSize: 14, fontWeight: 700 }}><ArrowRight size={16} /> العودة للاختيار</Link>
            <button type="button" onClick={() => navigate(content.heroPath)} style={{ border: 0, background: 'transparent', color: content.accent, fontWeight: 800, cursor: 'pointer' }}>{isSupplier ? 'أكمل طلب الانضمام' : 'اذهب إلى السيارات'} <ArrowLeft size={16} style={{ verticalAlign: 'middle', marginInlineStart: 5 }} /></button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.04fr 0.96fr', gap: isMobile ? 34 : 70, alignItems: 'center' }}>
            <motion.div initial={{ opacity: 0, x: 22 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: content.accent, fontWeight: 800, fontSize: 14, marginBottom: 16 }}><Sparkles size={16} />{content.eyebrow}</div>
              <h1 style={{ margin: 0, fontSize: isMobile ? 'clamp(2.3rem, 11vw, 3.1rem)' : 'clamp(3rem, 5vw, 5rem)', lineHeight: 1.16, letterSpacing: '-0.04em', color: INK, fontWeight: 900 }}>{content.title}</h1>
              <p style={{ margin: '20px 0 28px', maxWidth: 590, color: '#5c6b76', fontSize: isMobile ? 17 : 20, lineHeight: 1.9 }}>{content.description}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                <Link to={content.heroPath} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9, padding: '14px 24px', borderRadius: 13, background: content.accent, color: '#fff', fontWeight: 800, boxShadow: `0 14px 26px ${content.accent}35` }}>{content.heroButton}<ArrowLeft size={18} /></Link>
                <Link to="/landing" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9, padding: '14px 24px', borderRadius: 13, background: 'rgba(255,255,255,0.72)', color: NAVY, border: '1px solid rgba(26,58,82,0.18)', fontWeight: 800 }}>تغيير المسار</Link>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.96, rotate: isSupplier ? 2 : -2 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 0.7, delay: 0.08 }} style={{ padding: 10, borderRadius: 32, background: 'rgba(255,255,255,0.78)', border: `1px solid ${GOLD}55`, boxShadow: '0 28px 80px rgba(26,58,82,0.14)' }}>
              <img src={content.image} alt={isSupplier ? 'مزايا الموردين' : 'مزايا المستأجرين'} style={{ display: 'block', width: '100%', borderRadius: 24, objectFit: 'cover' }} />
            </motion.div>
          </div>
        </div>
      </section>

      <section style={{ padding: isMobile ? '68px 16px' : '100px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ maxWidth: 720, marginBottom: 44 }}>
            <div style={{ color: content.accent, fontWeight: 800, fontSize: 14, marginBottom: 12 }}>ما الذي تحصل عليه؟</div>
            <h2 style={{ margin: 0, color: INK, fontSize: isMobile ? 34 : 48, lineHeight: 1.2, fontWeight: 900 }}>مزايا عملية، بتجربة تشبه علامتك</h2>
            <p style={{ margin: '16px 0 0', color: '#697782', fontSize: 18, lineHeight: 1.8 }}>صممنا هذا المسار ليختصر عليك الخطوات ويجعل القيمة واضحة منذ اللحظة الأولى.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, minmax(0, 1fr))', gap: 18 }}>
            {content.features.map((feature, index) => <FeatureCard key={feature.title} feature={feature} index={index} accent={content.accent} />)}
          </div>
        </div>
      </section>

      <section style={{ padding: isMobile ? '70px 16px' : '92px 24px', background: `linear-gradient(135deg, ${NAVY_DARK}, ${NAVY})`, color: '#fff' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', flexWrap: 'wrap', gap: 24, marginBottom: 36 }}>
            <div><div style={{ color: GOLD, fontWeight: 800, fontSize: 14, marginBottom: 10 }}>المسار في ثلاث خطوات</div><h2 style={{ margin: 0, color: '#fff', fontSize: isMobile ? 32 : 44, lineHeight: 1.2, fontWeight: 900 }}>ابدأ من الخطوة التي تناسبك</h2></div>
            <p style={{ maxWidth: 360, color: 'rgba(255,255,255,0.68)', lineHeight: 1.8, margin: 0 }}>تجربة مركزة تساعدك على الانتقال من الاختيار إلى الفعل دون زحام بصري أو خطوات غير ضرورية.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, minmax(0, 1fr))', gap: 16 }}>
            {content.process.map(([number, title, text]) => <div key={number} style={{ minHeight: 190, padding: 24, borderRadius: 22, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(212,175,55,0.3)' }}><div style={{ color: GOLD, fontSize: 42, fontWeight: 900, lineHeight: 1 }}>{number}</div><h3 style={{ color: '#fff', margin: '24px 0 8px', fontSize: 21, fontWeight: 800 }}>{title}</h3><p style={{ color: 'rgba(255,255,255,0.68)', margin: 0, lineHeight: 1.75 }}>{text}</p></div>)}
          </div>
        </div>
      </section>

      <section style={{ padding: isMobile ? '68px 16px' : '92px 24px', background: WARM }}>
        <div style={{ maxWidth: 850, margin: '0 auto', padding: isMobile ? 28 : 48, borderRadius: 28, background: 'linear-gradient(145deg, #fff, #f7f4ea)', border: `1px solid ${GOLD}45`, boxShadow: '0 24px 70px rgba(26,58,82,0.12)', textAlign: 'center' }}>
          <img src={logoMarketplace} alt="شعار منصة التسويق" style={{ width: 54, height: 54, objectFit: 'contain', marginBottom: 16 }} />
          <h2 style={{ margin: 0, color: INK, fontSize: isMobile ? 30 : 42, fontWeight: 900 }}>{isSupplier ? 'جاهز لتقديم ما يميزك؟' : 'جاهز لاكتشاف خيارك؟'}</h2>
          <p style={{ margin: '14px auto 26px', color: '#63737e', maxWidth: 600, fontSize: 17, lineHeight: 1.8 }}>{isSupplier ? 'انتقل إلى نموذج الانضمام الحالي وأكمل بياناتك من المسار المناسب.' : 'ابدأ البحث داخل نظام تأجير السيارات واستكشف الخيارات المتاحة لك.'}</p>
          <Link to={content.heroPath} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9, minWidth: 190, padding: '14px 24px', borderRadius: 13, background: content.accent, color: '#fff', fontWeight: 800 }}>{content.heroButton}<ArrowLeft size={18} /></Link>
        </div>
      </section>

      <footer style={{ padding: '26px 20px', background: NAVY_DARK, color: 'rgba(255,255,255,0.62)', textAlign: 'center', fontSize: 13 }}>
        <span>© 2026 منصة تأجير السيارات. تجربة تسويقية متوافقة مع النظام الحالي.</span>
      </footer>
    </main>
  );
}
