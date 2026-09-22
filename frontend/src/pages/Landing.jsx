import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useSpring, useTransform } from 'framer-motion';
import { ArrowLeft, ArrowUpLeft, Award, BarChart3, Building2, Car, CheckCircle2, ChevronLeft, ChevronRight, CreditCard, Headphones, Search, Shield, Sparkles, Star } from 'lucide-react';
import heroCar from '../assets/hero.png';
import '../styles/landing-luxury.css';

const cars = [
  { name: 'BMW M4', type: 'Luxury Performance', price: 120, meta: 'أوتوماتيك • بنزين • 4 مقاعد', accent: '#c99a24' },
  { name: 'Toyota Camry', type: 'Executive Comfort', price: 65, meta: 'أوتوماتيك • هايبرد • 5 مقاعد', accent: '#2b6f9f' },
  { name: 'Mercedes C-Class', type: 'Premium Sedan', price: 145, meta: 'أوتوماتيك • بنزين • 5 مقاعد', accent: '#087f68' },
];
const dealers = [
  { city: 'صنعاء', count: '42 معرض', x: 49, y: 38 }, { city: 'تعز', count: '31 معرض', x: 39, y: 64 },
  { city: 'عدن', count: '27 معرض', x: 62, y: 77 }, { city: 'إب', count: '18 معرض', x: 56, y: 51 }, { city: 'الحديدة', count: '16 معرض', x: 23, y: 48 },
];
const testimonials = [
  { quote: 'الحجز كان واضحًا وسريعًا، والسيارة كانت مطابقة للتفاصيل والصور.', name: 'محمد', role: 'عميل' },
  { quote: 'أصبحت إدارة سيارات المعرض والحجوزات أسهل بكثير من مكان واحد.', name: 'أحمد', role: 'مالك معرض' },
  { quote: 'تجربة مرتبة من البحث حتى الاستلام. كل خطوة كانت واضحة.', name: 'سارة', role: 'عميلة' },
];

function Counter({ value, suffix }) {
  const [count, setCount] = useState(0); const ref = useRef(null);
  useEffect(() => {
    let started = false;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || started) return;
      started = true; const start = performance.now();
      const tick = now => { const p = Math.min((now - start) / 1500, 1); setCount(Math.round(value * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick); observer.disconnect();
    }, { threshold: 0.4 });
    if (ref.current) observer.observe(ref.current); return () => observer.disconnect();
  }, [value]);
  return <span ref={ref}>{count.toLocaleString('en-US')}{suffix}</span>;
}

function Reveal({ children, className = '' }) {
  return <motion.div className={className} initial={{ opacity: 0, y: 45 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.18 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.div>;
}

function Tilt({ children, className }) {
  const [style, setStyle] = useState({});
  return <div className={className} style={style}
    onMouseMove={e => { const r=e.currentTarget.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5; setStyle({transform:'perspective(900px) rotateX('+(-y*5)+'deg) rotateY('+(x*7)+'deg) translateY(-8px)'}); }}
    onMouseLeave={() => setStyle({transform:'perspective(900px) rotateX(0deg) rotateY(0deg)'})}>{children}</div>;
}

export default function Landing() {
  const [activeCar,setActiveCar]=useState(0), [activeDealer,setActiveDealer]=useState(0), [activeTestimonial,setActiveTestimonial]=useState(0);
  const {scrollYProgress}=useScroll();
  const progress=useSpring(scrollYProgress,{stiffness:90,damping:25});
  const heroY=useTransform(progress,[0,.18],[0,-150]), heroScale=useTransform(progress,[0,.12],[1,.92]), heroOpacity=useTransform(progress,[0,.13],[1,.35]);
  const carY=useTransform(progress,[0,.16],[0,-55]), lightX=useTransform(progress,[0,.22],['0%','70%']), testimonialX=useTransform(progress,[.66,.98],['0%','-22%']);

  return <main className="landing-luxury">
    <motion.div className="lux-scroll-progress" style={{scaleX:scrollYProgress}}/>
    <section className="lux-hero">
      <motion.div className="hero-light hero-light-one" style={{x:lightX}}/><div className="hero-light hero-light-two"/><div className="hero-grid"/>
      <div className="lux-container hero-container">
        <motion.div className="hero-copy" style={{y:heroY,opacity:heroOpacity}}>
          <motion.div className="hero-eyebrow" initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{duration:.7}}><Sparkles size={15}/> تجربة تأجير سيارات بمستوى مختلف</motion.div>
          <h1><span className="word-reveal">{['استأجر','السيارة','التي','تناسب','رحلتك'].map((w,i)=><motion.span key={w} initial={{opacity:0,y:30,filter:'blur(8px)'}} animate={{opacity:1,y:0,filter:'blur(0)'}} transition={{delay:.2+i*.075,duration:.65}}>{w}</motion.span>)}</span><motion.span className="hero-gold-line" initial={{opacity:0,x:35}} animate={{opacity:1,x:0}} transition={{delay:.8,duration:.8}}>بسهولة، سرعة، وثقة.</motion.span></h1>
          <motion.p className="hero-description" initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{delay:1,duration:.75}}>اكتشف سيارات مختارة من معارض موثوقة، قارن العروض، واحجز رحلتك من مكان واحد بتجربة مصممة لتكون بسيطة وفاخرة.</motion.p>
          <div className="hero-actions"><Link className="lux-btn lux-btn-primary" to="/search">استكشف السيارات <ArrowLeft size={19}/></Link><Link className="lux-btn lux-btn-ghost" to="/marketing">سجّل كمعرض <Building2 size={19}/></Link></div>
          <div className="hero-trust">{[[Shield,'معارض موثوقة'],[CheckCircle2,'حجز واضح'],[Headphones,'دعم مباشر']].map(([Icon,text],i)=><motion.div key={text} initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{delay:1.3+i*.12}}><Icon size={17}/><span>{text}</span></motion.div>)}</div>
        </motion.div>
        <motion.div className="hero-visual" style={{scale:heroScale,y:useTransform(progress,[0,.18],[0,85])}}>
          <div className="hero-orbit hero-orbit-a"/><div className="hero-orbit hero-orbit-b"/>
          <motion.div className="hero-car-stage" initial={{opacity:0,scale:.84,x:50,rotateY:-12}} animate={{opacity:1,scale:1,x:0,rotateY:0}} transition={{delay:.35,duration:1.2}}>
            <div className="car-light-sweep"/><motion.img src={heroCar} alt="سيارة للتأجير" className="hero-car-image" style={{y:carY}}/><div className="car-shadow"/>
          </motion.div>
          <motion.div className="floating-spec-card spec-card-top" initial={{opacity:0,x:35}} animate={{opacity:1,x:0}} transition={{delay:1.15}}><span>متاحة الآن</span><strong>BMW M4</strong><small>من $120 / DAY</small></motion.div>
          <motion.div className="floating-spec-card spec-card-bottom" initial={{opacity:0,x:-35}} animate={{opacity:1,x:0}} transition={{delay:1.3}}><Star size={16} fill="currentColor"/><strong>4.9</strong><span>تقييم العملاء</span></motion.div>
        </motion.div>
      </div>
      <div className="hero-scroll-hint"><span>SCROLL TO EXPLORE</span><motion.div animate={{y:[0,9,0]}} transition={{duration:1.8,repeat:Infinity}}><ChevronRight size={18}/></motion.div></div>
    </section>

    <section className="lux-stats"><div className="lux-container stats-grid">{[[25000,'+','سيارة'],[180,'+','معرض'],[12000,'+','عملية حجز'],[98,'%','رضا العملاء']].map(([v,s,l])=><div className="stat-item" key={l}><strong><Counter value={v} suffix={s}/></strong><span>{l}</span></div>)}</div></section>

    <section className="lux-section cars-section"><div className="lux-container"><Reveal className="section-heading"><span className="section-kicker">CURATED FLEET</span><h2>السيارة التي تختارها، تصنع بداية الرحلة</h2><p>بطاقات كبيرة بتفاصيل واضحة، مصممة لتشاهد السيارة قبل أن تحجزها.</p></Reveal>
      <div className="cinematic-cars">{cars.map((car,index)=><Tilt key={car.name} className={'cinematic-car-card '+(activeCar===index?'is-active':'is-dimmed')}><button className="car-card-hit" type="button" aria-label={'عرض '+car.name} onMouseEnter={()=>setActiveCar(index)} onFocus={()=>setActiveCar(index)}/><div className="car-card-glow" style={{'--accent':car.accent}}/><div className="car-card-number">0{index+1}</div><div className="car-card-image"><img src={heroCar} alt={car.name}/></div><div className="car-card-info"><span>{car.type}</span><h3>{car.name}</h3><div className="car-card-divider"/><p>{car.meta}</p><div className="car-card-bottom"><div><small>السعر اليومي</small><strong>{'$'}{car.price}<em> / DAY</em></strong></div><Link to="/search">View Details <ArrowLeft size={16}/></Link></div></div><div className="car-card-specs"><span>★★★★★</span><span>متاح للحجز</span></div></Tilt>)}</div>
    </div></section>

    <section className="lux-section how-section"><div className="lux-container"><Reveal className="section-heading section-heading-left"><span className="section-kicker">THE JOURNEY</span><h2>كيف تعمل المنصة؟</h2><p>ثلاث مراحل، بدون تعقيد.</p></Reveal>
      <div className="journey-steps">{[['01',Search,'اختر','ابحث عن السيارة والموقع والتاريخ الذي يناسبك.'],['02',CreditCard,'احجز','قارن العرض، راجع التفاصيل، وأكمل الحجز بثقة.'],['03',Car,'استلم','تواصل مع المعرض واستلم سيارتك في الموعد.']].map(([n,Icon,t,d],i)=><motion.article className="journey-step" key={n} initial={{opacity:0,y:70}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:.35}} transition={{delay:i*.14,duration:.75}}><span className="journey-number">{n}</span><div className="journey-icon"><Icon size={27}/></div><div><span className="journey-label">STEP {n}</span><h3>{t}</h3><p>{d}</p></div>{i<2&&<ArrowLeft className="journey-arrow" size={28}/>}</motion.article>)}</div>
    </div></section>

    <section className="lux-section dealers-section"><div className="lux-container dealer-layout"><Reveal className="dealer-copy"><span className="section-kicker">DEALER NETWORK</span><h2>معارض قريبة من وجهتك</h2><p>شبكة من المعارض تظهر لك بشكل واضح، لتختار العرض والموقع الذي يناسب رحلتك.</p><div className="dealer-list">{dealers.map((d,i)=><button type="button" className={'dealer-list-item '+(activeDealer===i?'active':'')} key={d.city} onClick={()=>setActiveDealer(i)}><span>{d.city}</span><small>{d.count}</small><ChevronLeft size={16}/></button>)}</div></Reveal>
      <motion.div className="dealer-map" initial={{opacity:0,scale:.94}} whileInView={{opacity:1,scale:1}} viewport={{once:true,amount:.25}} transition={{duration:1}}><div className="map-glow"/><div className="map-surface"><div className="map-label">YEMEN • DEALER NETWORK</div><div className="map-route route-one"/><div className="map-route route-two"/><div className="map-route route-three"/><div className="map-center"><span>YOU</span></div>{dealers.map((d,i)=><button type="button" className={'map-pin '+(activeDealer===i?'active':'')} key={d.city} style={{left:d.x+'%',top:d.y+'%'}} onClick={()=>setActiveDealer(i)}><span/><b>{d.city}</b></button>)}<AnimatePresence mode="wait"><motion.div className="map-info-card" key={dealers[activeDealer].city} initial={{opacity:0,y:12,scale:.96}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-8}}><span>SELECTED DEALER</span><strong>{dealers[activeDealer].city}</strong><small>{dealers[activeDealer].count} • متاحون على المنصة</small></motion.div></AnimatePresence></div></motion.div>
    </div></section>

    <section className="lux-section trust-section"><div className="lux-container"><Reveal className="section-heading"><span className="section-kicker">TRUST BY NUMBERS</span><h2>الثقة تُقاس بالتجربة</h2><p>أرقام متحركة تبدأ من الصفر عندما تدخل إلى القسم.</p></Reveal><div className="trust-grid">{[[25000,'+','سيارة متاحة',Car],[180,'+','معرض موثوق',Building2],[12000,'+','عملية حجز',BarChart3],[98,'%','رضا العملاء',Award]].map(([v,s,l,Icon],i)=><motion.div className="trust-number" key={l} initial={{opacity:0,y:35}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:.4}} transition={{delay:i*.1}}><Icon size={20}/><strong><Counter value={v} suffix={s}/></strong><span>{l}</span></motion.div>)}</div></div></section>

    <section className="lux-section testimonials-section"><div className="lux-container"><Reveal className="section-heading section-heading-left"><span className="section-kicker">REAL STORIES</span><h2>تجارب تتحرك مع رحلتك</h2></Reveal><div className="testimonial-window"><motion.div className="testimonial-track" style={{x:testimonialX}}>{[...testimonials,...testimonials].map((t,i)=><motion.article className={'testimonial-card '+(i===activeTestimonial?'featured':'')} key={t.name+i} whileHover={{y:-10}} onMouseEnter={()=>setActiveTestimonial(i%testimonials.length)}><div className="testimonial-top"><div className="testimonial-avatar">{t.name.charAt(0)}</div><div><strong>{t.name}</strong><span>{t.role}</span></div><div className="testimonial-stars">{[1,2,3,4,5].map(n=><Star key={n} size={13} fill="currentColor"/>)}</div></div><p>“{t.quote}”</p><div className="testimonial-line"/></motion.article>)}</motion.div></div></div></section>

    <section className="lux-cta"><div className="cta-noise"/><div className="cta-light cta-light-one"/><div className="lux-container cta-content"><Reveal><span className="section-kicker">YOUR NEXT JOURNEY</span><h2>READY<br/><span>FOR YOUR</span><br/>NEXT JOURNEY?</h2><Link className="lux-btn lux-btn-primary cta-button" to="/search">START NOW <ArrowUpLeft size={18}/></Link></Reveal></div></section>

    <footer className="lux-footer"><div className="lux-container"><div className="footer-top"><div className="footer-brand"><div className="footer-mark"><Car size={21}/></div><strong>CAR RENTAL</strong><p>رحلتك تبدأ من السيارة المناسبة.</p></div><div className="footer-links"><div><span>EXPLORE</span><Link to="/search">Vehicles</Link><Link to="/search">Dealers</Link></div><div><span>COMPANY</span><Link to="/marketing">For Dealers</Link><Link to="/marketing">Support</Link></div><div><span>CONTACT</span><a href="mailto:support@rentalcr.com">support@rentalcr.com</a><a href="mailto:info@rentalcr.com">info@rentalcr.com</a></div></div></div><div className="footer-bottom"><span>CAR RENTAL • 2026</span><span>BUILT FOR THE NEXT JOURNEY</span></div></div></footer>
  </main>;
}
