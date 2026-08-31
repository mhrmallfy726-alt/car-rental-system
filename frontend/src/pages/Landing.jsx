import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import LocationSearch from '../components/LocationPicker';

import {
  Car, Shield, Star, Clock, Users, TrendingUp, ChevronRight,
  CheckCircle2, ArrowLeft, MapPin, CreditCard, Headphones,
  Sparkles, Building2, DollarSign, BarChart3, Globe, Award,
  Phone, Mail, Search
} from 'lucide-react';
// import MarketingChoice from './marketing/MarketingChoice';
export default function Landing() {
  const locationSearch = useLocation().search;
  const [scrollY, setScrollY] = useState(0);
  const [visibleSections, setVisibleSections] = useState({});
  const sectionElements = {};

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setVisibleSections(prev => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    Object.values(sectionElements).forEach(el => {
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  });

  const setRef = (id) => (el) => { sectionElements[id] = el; };

  const fadeInUp = {
    opacity: 0,
    transform: 'translateY(40px)',
    transition: 'opacity 0.8s ease, transform 0.8s ease',
  };
  const fadeInUpVisible = {
    opacity: 1,
    transform: 'translateY(0)',
    transition: 'opacity 0.8s ease, transform 0.8s ease',
  };

  return (
    <div style={{ overflow: 'hidden' }}>

      {/* ===== HERO SECTION ===== */}
      <section
        style={{
          position: 'relative',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0a1628 0%, #1a2d5a 40%, #0f2044 100%)',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Animated background elements */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', top: '-20%', right: '-10%', width: '600px', height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,108,228,0.15) 0%, transparent 70%)',
            animation: 'float 8s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute', bottom: '-10%', left: '-5%', width: '400px', height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(254,187,2,0.1) 0%, transparent 70%)',
            animation: 'float 6s ease-in-out infinite 2s',
          }} />
          <div style={{
            position: 'absolute', top: '30%', left: '30%', width: '300px', height: '300px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,128,9,0.08) 0%, transparent 70%)',
            animation: 'float 10s ease-in-out infinite 4s',
          }} />
        </div>

        {/* Grid pattern overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: '1200px', margin: '0 auto', padding: '0 20px', width: '100%' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '60px' }}>
            {/* Text side */}
            <div style={{ flex: '1 1 500px', textAlign: 'right' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: 'rgba(254,187,2,0.1)', border: '1px solid rgba(254,187,2,0.3)',
                borderRadius: '50px', padding: '8px 20px', marginBottom: '24px',
                color: '#febb02', fontSize: '0.85rem', fontWeight: '600',
              }}>
                <Sparkles size={16} /> المنصة الأولى لتأجير السيارات في اليمن
              </div>

              <h1 style={{
                fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                fontWeight: '900',
                color: 'white',
                lineHeight: 1.3,
                marginBottom: '20px',
              }}>
                تأجير السيارات<br />
                <span style={{
                  background: 'linear-gradient(135deg, #febb02, #f5a623)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>بكل سهولة وأمان</span>
              </h1>

              <p style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: '1.15rem',
                lineHeight: 1.8,
                marginBottom: '40px',
                maxWidth: '550px',
                marginRight: 'auto',
              }}>
                نربط بين أفضل موردي السيارات والعملاء في منصة واحدة آمنة وموثوقة.
                سواء كنت تبحث عن سيارة أو تمتلك أسطول سيارات، نحن هنا لخدمتك.
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                {/* <Link
                  to="/cars"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '10px',
                    background: 'linear-gradient(135deg, #008009, #00a10d)',
                    color: 'white', padding: '16px 36px', borderRadius: '12px',
                    fontSize: '1.1rem', fontWeight: '700',
                    boxShadow: '0 8px 25px rgba(0,128,9,0.35)',
                    transition: 'all 0.3s ease',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 35px rgba(0,128,9,0.45)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,128,9,0.35)'; }}
                >
                  استكشف السيارات <ArrowLeft size={20} />
                </Link> */}

                <Link
                  to="/marketing"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '10px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: 'white', padding: '16px 36px', borderRadius: '12px',
                    fontSize: '1.1rem', fontWeight: '700',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s ease',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                >
                  ابدا رحلتك <Building2 size={20} />
                </Link>
              </div>

              {/* Trust badges */}
              <div style={{ display: 'flex', gap: '30px', marginTop: '50px', flexWrap: 'wrap' }}>
                {[
                  { icon: Shield, text: 'دفع آمن' },
                  { icon: CheckCircle2, text: 'تأكيد فوري' },
                  { icon: Headphones, text: 'دعم 24/7' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                    <item.icon size={18} style={{ color: '#febb02' }} />
                    {item.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Visual side - Floating card */}
            <div style={{ flex: '1 1 400px', display: 'flex', justifyContent: 'center' }}>
              <div style={{
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '24px',
                padding: '40px',
                maxWidth: '400px',
                width: '100%',
                transform: `translateY(${scrollY * 0.05}px)`,
              }}>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '12px',
                    background: 'linear-gradient(135deg, #008009, #00a10d)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Car size={24} style={{ color: 'white' }} />
                  </div>
                  <div>
                    <div style={{ color: 'white', fontWeight: '700', fontSize: '1.1rem' }}>سيارة متاحة</div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>تويوتا كامري 2024</div>
                  </div>
                </div>

                <div style={{
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '16px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                }}>
                  <div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>السعر اليومي</div>
                    <div style={{ color: 'white', fontWeight: '800', fontSize: '1.3rem' }}>$45</div>
                  </div>
                  <div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>التقييم</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#febb02' }}>
                      <Star size={14} fill="#febb02" /> 4.9
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['أوتوماتيك / عادي', 'بنزين','هايبرد', 'كهربائيه ', 'بلوتوث','مكيف',' 5 مقاعد',].map((tag, i) => (
                    <span key={i} style={{
                      background: 'rgba(255,255,255,0.08)',
                      border: '2px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      fontSize: '0.75rem',
                      color: 'rgba(255,255,255,0.7)',
                    }}>{tag}</span>
                  ))}
                </div>

                <div style={{
                  marginTop: '20px',
                  padding: '16px',
                  background: 'linear-gradient(135deg, rgba(0,128,9,0.2), rgba(0,108,228,0.2))',
                  borderRadius: '12px',
                  border: '1px solid rgba(0,128,9,0.3)',
                }}>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginBottom: '4px' }}>احجز الآن</div>
                  <div style={{ color: 'white', fontWeight: '700' }}>من <span style={{ color: '#008009' }}>$135</span> لـ 3 أيام</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== STATS BAR ===== */}
      <section style={{ background: '#0f2044', padding: '10px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(50px, 1fr))',
            gap: '10px',
            textAlign: 'center',
          }}>
            {[
              { num: '100+', label: 'شريك تأجير', icon: Building2 },
              { num: '50K+', label: 'حجز ناجح', icon: TrendingUp },
              { num: '500+', label: 'سيارة متاحة', icon: Car },
              { num: '4.9', label: 'تقييم العملاء', icon: Star },
            ].map((stat, i) => (
              <div key={i} style={{ color: 'white' }}>
                <div style={{ fontSize: '2.2rem', fontWeight: '900', marginBottom: '4px' }}>{stat.num}</div>
                <div style={{ fontSize: '0.90rem', opacity: 0.7 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FOR CUSTOMERS SECTION ===== */}
      <section
        id="customers"
        ref={setRef('customers')}
        style={{
          padding: '100px 0',
          background: 'linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%)',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={visibleSections.customers ? fadeInUpVisible : fadeInUp}>
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          
              <h2 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '16px', color: '#1a1a1a' }}>
                احجز سيارتك في لحظات
              </h2>
              <p style={{ color: '#6b6b6b', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
                تجربة حجز سلسة ومريحة مع ضمان أفضل الأسعار والخدمات
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
              {[
                {
                  icon: Search,
                  title: 'ابحث وقارن',
                  desc: 'تصفح مئات السيارات من موردين مختلفين وقارن الأسعار والتقييمات بسهولة',
                  color: '#003580',
                  bg: 'rgba(0,53,128,0.08)',
                },
                {
                  icon: CreditCard,
                  title: 'ادفع بأمان',
                  desc: 'دفع إلكتروني آمن ومشفر مع إمكانية حفظ البطاقة للتسريع في المرات القادمة',
                  color: '#008009',
                  bg: 'rgba(0,128,9,0.08)',
                },
                {
                  icon: CheckCircle2,
                  title: 'تأكيد فوري',
                  desc: 'احصل على تأكيد فوري لحجزك مع إمكانية المراسلة المباشرة مع المورد',
                  color: '#febb02',
                  bg: 'rgba(254,187,2,0.15)',
                },
                {
                  icon: Shield,
                  title: 'حماية كاملة',
                  desc: 'سياسات إلغاء مرنة وحماية لحقوقك مع إمكانية رفع الشكاوى والنزاعات',
                  color: '#dc3545',
                  bg: 'rgba(220,53,69,0.08)',
                },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '32px',
                    border: '1px solid #eee',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 15px 40px rgba(0,0,0,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{
                    width: '56px', height: '56px', borderRadius: '14px',
                    background: item.bg, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', marginBottom: '20px',
                  }}>
                    <item.icon size={28} style={{ color: item.color }} />
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '12px', color: '#1a1a1a' }}>{item.title}</h3>
                  <p style={{ color: '#6b6b6b', lineHeight: 1.7, fontSize: '0.95rem' }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOR SUPPLIERS SECTION ===== */}
      <section
        id="suppliers"
        ref={setRef('suppliers')}
        style={{
          padding: '100px 0',
          background: 'linear-gradient(135deg, #0a1628 0%, #1a2d5a 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }} />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={visibleSections.suppliers ? fadeInUpVisible : fadeInUp}>
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
              <h2 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '16px', color: 'white' }}>
                أدر أعمالك من مكان واحد
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
                لوحة تحكم متكاملة لإدارة أسطولك وحجوزاتك وتقييماتك
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
              {[
                {
                  icon: BarChart3,
                  title: 'لوحة تحكم ذكية',
                  desc: 'إحصائيات مفصلة عن حجوزاتك وإيراداتك مع رسوم بيانية واضحة',
                  gradient: 'linear-gradient(135deg, #008009, #00a10d)',
                },
                {
                  icon: DollarSign,
                  title: 'إدارة الإيرادات',
                  desc: 'تتبع مدفوعاتك بسهولة مع تقارير مالية شاملة ومحدثة',
                  gradient: 'linear-gradient(135deg, #febb02, #f5a623)',
                },
                {
                  icon: Globe,
                  title: 'وصول عالمي',
                  desc: 'اعرض سياراتك لآلاف العملاء المحتملين في جميع أنحاء المنصة',
                  gradient: 'linear-gradient(135deg, #003580, #006ce4)',
                },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '16px',
                    padding: '32px',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'translateY(-5px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <div style={{
                    width: '56px', height: '56px', borderRadius: '14px',
                    background: item.gradient,
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', marginBottom: '20px',
                  }}>
                    <item.icon size={28} style={{ color: 'white' }} />
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '12px', color: 'white' }}>{item.title}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, fontSize: '0.95rem' }}>{item.desc}</p>
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'center', marginTop: '50px' }}>
              <Link
                to="/marketing"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '10px',
                  background: 'linear-gradient(135deg, #febb02, #f5a623)',
                  color: '#1a1a1a', padding: '16px 40px', borderRadius: '12px',
                  fontSize: '1.1rem', fontWeight: '800',
                  boxShadow: '0 8px 25px rgba(254,187,2,0.3)',
                  transition: 'all 0.3s ease',
                  textDecoration: 'none',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 35px rgba(254,187,2,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(254,187,2,0.3)'; }}
              >
                انضم كمورد الآن <ChevronRight size={20} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section
        id="how-it-works"
        ref={setRef('how-it-works')}
        style={{ padding: '100px 0', background: 'white' }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={visibleSections['how-it-works'] ? fadeInUpVisible : fadeInUp}>
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
              <h2 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '16px', color: '#1a1a1a' }}>
                كيف تعمل المنصة؟
              </h2>
              <p style={{ color: '#6b6b6b', fontSize: '1.1rem' }}>3 خطوات بسيطة للحصول على سيارتك</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '40px' }}>
              {[
                {
                  step: '01',
                  icon: MapPin,
                  title: 'حدد موقعك وتواريخك',
                  desc: 'اختر مدينة الاستلام وفترة التأجير التي تناسبك',
                  color: '#003580',
                },
                {
                  step: '02',
                  icon: Car,
                  title: 'اختر سيارتك',
                  desc: 'قارن بين العروض والأسعار واختر الأنسب لك',
                  color: '#008009',
                },
                {
                  step: '03',
                  icon: CreditCard,
                  title: 'ادفع وانطلق',
                  desc: 'أكمل الدفع بأمان واستلم سيارتك في الموعد المحدد',
                  color: '#febb02',
                },
              ].map((item, i) => (
                <div key={i} style={{ textAlign: 'center', position: 'relative' }}>
                  <div style={{
                    width: '80px', height: '80px', borderRadius: '20px',
                    background: `${item.color}10`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 24px',
                    position: 'relative',
                  }}>
                    <item.icon size={36} style={{ color: item.color }} />
                    <span style={{
                      position: 'absolute', top: '-8px', right: '-8px',
                      background: item.color,
                      color: 'white',
                      width: '28px', height: '28px',
                      borderRadius: '8px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.75rem', fontWeight: '800',
                    }}>{item.step}</span>
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '12px', color: '#1a1a1a' }}>{item.title}</h3>
                  <p style={{ color: '#6b6b6b', fontSize: '0.95rem' }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== WHY CHOOSE US ===== */}
      <section
        id="why-us"
        ref={setRef('why-us')}
        style={{ padding: '100px 0', background: '#f8f9fa' }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={visibleSections['why-us'] ? fadeInUpVisible : fadeInUp}>
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
              <h2 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '16px', color: '#1a1a1a' }}>
                لماذا تختار منصتنا؟
              </h2>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: '24px',
            }}>
              {[
                {
                  icon: Award,
                  title: 'موردون معتمدون',
                  desc: 'جميع موردي السيارات لدينا تم التحقق منهم واعتمادهم لضمان جودة الخدمة',
                  color: '#008009',
                },
                {
                  icon: Shield,
                  title: 'تأمين شامل',
                  desc: 'جميع السيارات مؤمنة بالكامل مع تغطية شاملة لأية حوادث أو أعطال',
                  color: '#003580',
                },
                {
                  icon: Clock,
                  title: 'توافر على مدار الساعة',
                  desc: 'نظامنا يعمل 24/7 مع إمكانية الحجز في أي وقت ومن أي مكان',
                  color: '#febb02',
                },
                {
                  icon: Headphones,
                  title: 'دعم فوري',
                  desc: 'فريق دعم محترف متاح لمساعدتك في أي وقت عبر المحادثة المباشرة',
                  color: '#8e44ad',
                },
                {
                  icon: DollarSign,
                  title: 'أسعار تنافسية',
                  desc: 'نضمن لك أفضل الأسعار مع خيارات خصومات وعروض حصرية',
                  color: '#e67e22',
                },
                {
                  icon: Users,
                  title: 'مجتمع موثوق',
                  desc: 'تقييمات حقيقية من عملاء حقيقيين تساعدك على اتخاذ القرار الصحيح',
                  color: '#0a58ca',
                },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '28px',
                    display: 'flex',
                    gap: '20px',
                    alignItems: 'flex-start',
                    border: '1px solid #eee',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = item.color; e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.06)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#eee'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '12px',
                    background: `${item.color}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <item.icon size={24} style={{ color: item.color }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '8px', color: '#1a1a1a' }}>{item.title}</h3>
                    <p style={{ color: '#6b6b6b', fontSize: '0.9rem', lineHeight: 1.6 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section style={{
        padding: '100px 0',
        background: 'linear-gradient(135deg, #003580 0%, #006ce4 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '25px 25px',
        }} />
        <div style={{
          position: 'absolute', top: '-50%', right: '-20%', width: '600px', height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(254,187,2,0.1) 0%, transparent 70%)',
        }} />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: '800px', margin: '0 auto', padding: '0 20px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'white', marginBottom: '16px' }}>
            جاهز للبدء؟
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.2rem', marginBottom: '40px', lineHeight: 1.8 }}>
            سواء كنت تبحث عن سيارة أو تريد إدارة أسطولك، منصتنا هي الخيار الأمثل لك
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px' }}>
            <Link
              to="/cars"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '10px',
                background: 'white', color: '#003580',
                padding: '16px 36px', borderRadius: '12px',
                fontSize: '1.1rem', fontWeight: '800',
                boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                transition: 'all 0.3s ease',
                textDecoration: 'none',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              تصفح السيارات <ArrowLeft size={20} />
            </Link>
            <Link
              to="/marketing"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '10px',
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white',
                padding: '16px 36px', borderRadius: '12px',
                fontSize: '1.1rem', fontWeight: '800',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                textDecoration: 'none',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
            >
              سجّل حسابك <ChevronRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer style={{
        background: '#0a1628',
        padding: '60px 0 30px',
        color: 'rgba(255,255,255,0.6)',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px', marginBottom: '40px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, #008009, #00a10d)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Car size={22} style={{ color: 'white' }} />
                </div>
                <span style={{ color: 'white', fontWeight: '800', fontSize: '1.2rem' }}>كار فلكسي</span>
              </div>
              <p style={{ fontSize: '0.85rem', lineHeight: 1.8 }}>المنصة الأولى لتأجير السيارات التي تربط الموردين بالعملاء في مكان واحد آمن وموثوق.</p>
            </div>
            <div>
              <h4 style={{ color: 'white', fontWeight: '700', marginBottom: '16px' }}>روابط سريعة</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Link to="/cars" style={{ fontSize: '0.85rem', transition: 'color 0.3s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'white'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
                >تصفح السيارات</Link>
                <Link to="/register" style={{ fontSize: '0.85rem', transition: 'color 0.3s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'white'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
                >سجّل كمورد</Link>
              </div>
            </div>
            <div>
              <h4 style={{ color: 'white', fontWeight: '700', marginBottom: '16px' }}>تواصل معنا</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                  <Phone size={14} /> support@carflexi.com
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                  <Mail size={14} /> info@carflexi.com
                </div>
              </div>
            </div>
          </div>
          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.1)',
            paddingTop: '20px',
            textAlign: 'center',
            fontSize: '0.8rem',
          }}>
            جميع الحقوق محفوظة © {new Date().getFullYear()} كار فلكسي
          </div>
        </div>
      </footer>

      {/* Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(5deg); }
        }
      `}</style>
    </div>
  );
}
