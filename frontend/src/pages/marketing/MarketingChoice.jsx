import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Building2, Users, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import heroMarketplace from '../../assets/marketing/LOGO.png';
import logoMarketplace from '../../assets/marketing/LOGO.png';

const NAVY = '#1a3a52';
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

const cardBase = {
  position: 'relative',
  overflow: 'hidden',
  borderRadius: 28,
  minHeight: 430,
  padding: 32,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  border: `1px solid rgba(212, 175, 55, 0.28)`,
  boxShadow: '0 24px 70px rgba(26, 58, 82, 0.12), 0 1px 0 rgba(255,255,255,0.8) inset',
  cursor: 'pointer',
  textAlign: 'right',
};

export default function MarketingChoice() {
  const navigate = useNavigate();
  const isMobile = useMobileLayout();

  return (
    <main dir="rtl" style={{ minHeight: 'calc(100vh - 72px)', background: WARM, color: INK, overflow: 'hidden' }}>
      <section style={{ position: 'relative', padding: isMobile ? '54px 16px 72px' : '82px 24px 96px', minHeight: 'calc(100vh - 72px)' }}>
        <div style={{ position: 'absolute', width: 440, height: 440, borderRadius: '50%', background: 'rgba(212,175,55,0.10)', filter: 'blur(10px)', top: -180, left: -160, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 420, height: 420, borderRadius: '50%', background: 'rgba(26,58,82,0.10)', filter: 'blur(18px)', bottom: -220, right: -170, pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', justifyContent: 'space-between', gap: isMobile ? 28 : 48, marginBottom: isMobile ? 36 : 58 }}>
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} style={{ flex: '1 1 52%', textAlign: 'right' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: GOLD, fontWeight: 700, fontSize: 14, marginBottom: 16 }}>
                <Sparkles size={17} />
                مساحة واحدة لفرص أكبر
              </div>
              <h1 style={{ margin: 0, color: INK, fontSize: isMobile ? 'clamp(2.2rem, 11vw, 3rem)' : 'clamp(3rem, 5vw, 4.8rem)', lineHeight: 1.15, fontWeight: 900, letterSpacing: '-0.04em' }}>
                منصة التسويق الفاخرة
              </h1>
              <p style={{ margin: '18px 0 0', maxWidth: 620, color: '#546471', fontSize: isMobile ? 17 : 20, lineHeight: 1.9 }}>
                اختر دورك وابدأ رحلتك في عالم تأجير السيارات بثقة، وضوح، وتجربة مصممة لتقربك من القرار المناسب.
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.95, rotate: -3 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 0.75, delay: 0.1 }} style={{ flex: '0 1 390px', width: '100%', maxWidth: 390, padding: 10, borderRadius: 32, background: 'rgba(255,255,255,0.75)', border: `1px solid rgba(212,175,55,0.28)`, boxShadow: '0 28px 80px rgba(26,58,82,0.14)' }}>
              <img src={heroMarketplace} alt="مشهد ثلاثي الأبعاد يربط الموردين بالمستأجرين" style={{ display: 'block', width: '100%', borderRadius: 24, objectFit: 'cover' }} />
            </motion.div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: 20 }}>
            <motion.button type="button" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.2 }} whileHover={{ y: -8 }} whileTap={{ scale: 0.985 }} onClick={() => navigate('/supplier-benefits')} style={{ ...cardBase, background: 'linear-gradient(145deg, #ffffff, #eef4f5)' }}>
              <div style={{ position: 'absolute', width: 220, height: 220, borderRadius: '50%', background: 'rgba(26,58,82,0.08)', top: -100, left: -70, pointerEvents: 'none' }} />
              <div>
                <div style={{ width: 64, height: 64, borderRadius: 18, display: 'grid', placeItems: 'center', color: '#fff', background: `linear-gradient(145deg, ${NAVY}, #2d5b76)`, boxShadow: '0 14px 28px rgba(26,58,82,0.22)', marginBottom: 24 }}>
                  <Building2 size={30} />
                </div>
                <h2 style={{ margin: 0, color: INK, fontSize: 30, fontWeight: 900 }}>أنا مورد</h2>
                <p style={{ margin: '12px 0 22px', color: '#5d6d78', lineHeight: 1.85, fontSize: 16 }}>حوّل خبرتك وأساطيلك إلى حضور تجاري أوضح، وكن أقرب إلى العملاء الباحثين عن خدمة موثوقة.</p>
                <div style={{ display: 'grid', gap: 10, color: '#52636e', fontSize: 14 }}>
                  {['ملف تجاري يبرز نقاط قوتك', 'وصول منظم إلى عملاء جدد', 'أدوات تساعدك على النمو'].map((item) => <span key={item} style={{ display: 'flex', alignItems: 'center', gap: 9 }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: NAVY }} />{item}</span>)}
                </div>
              </div>
              <span style={{ alignSelf: 'stretch', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, minHeight: 50, marginTop: 28, borderRadius: 14, background: NAVY, color: '#fff', fontWeight: 800 }}>استكشف مزايا الموردين <ArrowLeft size={18} /></span>
            </motion.button>

            <motion.button type="button" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.3 }} whileHover={{ y: -8 }} whileTap={{ scale: 0.985 }} onClick={() => navigate('/renter-benefits')} style={{ ...cardBase, background: 'linear-gradient(145deg, #ffffff, #fbf6e8)' }}>
              <div style={{ position: 'absolute', width: 220, height: 220, borderRadius: '50%', background: 'rgba(212,175,55,0.13)', top: -100, left: -70, pointerEvents: 'none' }} />
              <div>
                <div style={{ width: 64, height: 64, borderRadius: 18, display: 'grid', placeItems: 'center', color: '#fff', background: `linear-gradient(145deg, ${GOLD}, #b9922c)`, boxShadow: '0 14px 28px rgba(185,146,44,0.22)', marginBottom: 24 }}>
                  <Users size={30} />
                </div>
                <h2 style={{ margin: 0, color: INK, fontSize: 30, fontWeight: 900 }}>أنا مستأجر</h2>
                <p style={{ margin: '12px 0 22px', color: '#5d6d78', lineHeight: 1.85, fontSize: 16 }}>اكتشف خيارات تأجير واضحة، قارن ما يناسبك، وابدأ حجزك من داخل نظامك الحالي بسهولة.</p>
                <div style={{ display: 'grid', gap: 10, color: '#52636e', fontSize: 14 }}>
                  {['خيارات تساعدك على المقارنة', 'أسعار وشروط أوضح', 'رحلة حجز أسهل وأكثر راحة'].map((item) => <span key={item} style={{ display: 'flex', alignItems: 'center', gap: 9 }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: GOLD }} />{item}</span>)}
                </div>
              </div>
              <span style={{ alignSelf: 'stretch', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, minHeight: 50, marginTop: 28, borderRadius: 14, background: `linear-gradient(135deg, ${GOLD}, #b9922c)`, color: '#fff', fontWeight: 800 }}>استكشف مزايا المستأجرين <ArrowLeft size={18} /></span>
            </motion.button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 28, color: '#788691', fontSize: 14 }}>
            <img src={logoMarketplace} alt="شعار منصة التسويق" style={{ width: 28, height: 28, objectFit: 'contain' }} />
            <span>اختر المسار الأنسب لك، ويمكنك العودة إلى نظام التأجير في أي وقت.</span>
          </div>
        </div>
      </section>
    </main>
  );
}

