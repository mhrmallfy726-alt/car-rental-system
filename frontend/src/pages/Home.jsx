import { getImageUrl } from '../utils/imageUtils';
// import { useEffect, useState } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { carsAPI } from '../services/api';
// import useAuthStore from '../store/authStore';
// import { CalendarDays, CarFront, CheckCircle2, ChevronLeft, Clock3, CreditCard, Heart, MapPin, Menu, ShieldCheck, Sparkles, Star, Users, X } from 'lucide-react';
// import toast from 'react-hot-toast';
// import heroCar from '../assets/marketing/hero-3d-marketplace.webp';
// import sanaa from '../assets/marketing/LOGO.png';

// const demoCars = [
//   { id: 'demo-1', make: 'تويوتا', model: 'كامري 2024', category: 'سيدان', price_per_day: 45, seats: 5, transmission: 'automatic', primary_image: heroCar, average_rating: 4.9 },
//   { id: 'demo-2', make: 'هيونداي', model: 'توسان 2023', category: 'دفع رباعي', price_per_day: 55, seats: 5, transmission: 'automatic', primary_image: sanaa, average_rating: 4.8 },
//   { id: 'demo-3', make: 'تويوتا', model: 'برادو 2022', category: 'عائلية', price_per_day: 75, seats: 7, transmission: 'automatic', primary_image: heroCar, average_rating: 4.9 },
// ];

// export default function Home() {
//   const navigate = useNavigate();
//   const { isAuthenticated } = useAuthStore();
//   const [cars, setCars] = useState([]);
//   const [menuOpen, setMenuOpen] = useState(false);
//   const [search, setSearch] = useState({ location: 'صنعاء', startDate: '', endDate: '', pickupTime: '09:00', returnTime: '18:00' });

//   useEffect(() => {
//     carsAPI.getAll().then((res) => setCars((res.data.data || []).slice(0, 6))).catch(() => setCars([]));
//   }, []);

//   const featuredCars = cars.length ? cars.slice(0, 3) : demoCars;
//   const imageUrl = (car) => {
//     if (!car?.primary_image) return heroCar;
//     if (car.primary_image.startsWith('http') || car.primary_image.startsWith('data:') || car.primary_image.includes('/src/')) return car.primary_image;
//     return getImageUrl(car.primary_image);
//   };

//   const submitSearch = (event) => {
//     event.preventDefault();
//     if (search.startDate && search.endDate) {
//       const pickup = new Date(`${search.startDate}T${search.pickupTime}`);
//       const returned = new Date(`${search.endDate}T${search.returnTime}`);
//       if (returned <= pickup) {
//         toast.error('وقت الإرجاع يجب أن يكون بعد وقت الاستلام');
//         return;
//       }
//     }
//     navigate(`/cars?${new URLSearchParams(search).toString()}`);
//   };

//   return (
//     <div className="marketing-page" dir="rtl">
//       <section className="marketing-hero">
//         <div className="hero-overlay" />
//         <div className="hero-nav container">
//           <Link className="brand-mark" to="/">سَفَر <span>SAFAR</span></Link>
//           <button className="mobile-menu-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="القائمة">{menuOpen ? <X /> : <Menu />}</button>
//           <nav className={menuOpen ? 'hero-links open' : 'hero-links'}>
//             <Link to="/cars">استكشف السيارات</Link>
//             <a href="#how-it-works">كيف تعمل؟</a>
//             <a href="#trust">لماذا سفر؟</a>
//             <Link to="/Vendor-Join">أضف سياراتك</Link>
//             <Link className="nav-login" to={isAuthenticated() ? '/profile' : '/login'}>{isAuthenticated() ? 'حسابي' : 'تسجيل الدخول'}</Link>
//           </nav>
//         </div>
//         <div className="hero-content container">
//           <div className="hero-copy">
//             <span className="eyebrow"><Sparkles size={16} /> رحلتك تبدأ من هنا</span>
//             <h1>استأجر سيارتك<br /><span>بثقة وراحة.</span></h1>
//             <p>سيارات موثوقة من موردين معتمدين في اليمن، بأسعار واضحة وحجز أسهل من أي وقت.</p>
//             <div className="hero-proof"><span><CheckCircle2 size={17} /> موردون موثقون</span><span><ShieldCheck size={17} /> دفع آمن</span><span><Clock3 size={17} /> دعم سريع</span></div>
//           </div>
//           <div className="hero-car-card"><img src={heroCar} alt="سيارة للإيجار" /><div className="hero-car-caption"><span>سيارات مختارة بعناية</span><strong>جاهز للانطلاق؟</strong></div></div>
//         </div>
//         <form className="search-panel container" onSubmit={submitSearch}>
//           <div className="search-field"><MapPin size={20} /><label>موقع الاستلام<input value={search.location} onChange={e => setSearch({ ...search, location: e.target.value })} placeholder="صنعاء، عدن..." /></label></div>
//           <div className="search-field"><CalendarDays size={20} /><label>تاريخ الاستلام<input type="date" value={search.startDate} onChange={e => setSearch({ ...search, startDate: e.target.value })} /></label></div>
//           <div className="search-field"><CalendarDays size={20} /><label>تاريخ التسليم<input type="date" value={search.endDate} onChange={e => setSearch({ ...search, endDate: e.target.value })} /></label></div>
//           <div className="search-field"><Clock3 size={20} /><label>وقت الاستلام<input type="time" value={search.pickupTime} onChange={e => setSearch({ ...search, pickupTime: e.target.value })} /></label></div>
//           <div className="search-field"><Clock3 size={20} /><label>وقت الإرجاع<input type="time" value={search.returnTime} onChange={e => setSearch({ ...search, returnTime: e.target.value })} /></label></div>
//           <button className="primary-button search-button" type="submit">ابحث عن سيارة <ChevronLeft size={19} /></button>
//         </form>
//       </section>

//       <section className="trust-strip" id="trust"><div className="container trust-grid"><div><ShieldCheck /><span><strong>حجز آمن وواضح</strong><small>بدون رسوم مخفية</small></span></div><div><CreditCard /><span><strong>ادفع بالطريقة التي تناسبك</strong><small>خيارات دفع مرنة</small></span></div><div><Users /><span><strong>موردون موثوقون</strong><small>نراجع كل شريك بعناية</small></span></div><div><Clock3 /><span><strong>دعم يرد عليك</strong><small>نحن قريبون منك دائماً</small></span></div></div></section>

//       <section className="section container"><div className="section-heading"><div><span className="section-kicker">اختيارات المسافرين</span><h2>سيارات جاهزة لمشوارك</h2><p>اختر من عروضنا المميزة واستلم سيارتك في الوقت والمكان المناسبين.</p></div><Link to="/cars" className="text-link">شاهد كل السيارات <ChevronLeft size={18} /></Link></div><div className="featured-grid">{featuredCars.map((car) => <Link className="car-showcase-card" to={car.id?.toString().startsWith('demo') ? '/cars' : `/cars/${car.id}`} key={car.id}><div className="car-image-wrap"><img src={imageUrl(car)} alt={`${car.make} ${car.model}`} /><span className="car-badge">الأكثر طلباً</span><button className="heart-button" onClick={(e) => { e.preventDefault(); toast('سجّل دخولك لحفظ السيارة'); }}><Heart size={18} /></button></div><div className="car-card-body"><div className="car-title-row"><div><h3>{car.make} {car.model}</h3><span>{car.category || 'سيارة مميزة'}</span></div><div className="rating"><Star size={15} fill="currentColor" /> {car.average_rating || '4.8'}</div></div><div className="car-meta"><span><Users size={15} /> {car.seats || 5} ركاب</span><span><Sparkles size={15} /> أوتوماتيك</span><strong>${car.price_per_day || 45}<small>/اليوم</small></strong></div></div></Link>)}</div></section>

//       <section className="categories-section"><div className="container"><div className="section-heading"><div><span className="section-kicker">اختر ما يناسبك</span><h2>كل مشوار له سيارة</h2></div></div><div className="category-grid"><Link to="/cars?category=اقتصادية" className="category-card economy"><span>للمشاوير اليومية</span><strong>اقتصادية</strong><ChevronLeft /></Link><Link to="/cars?category=سيدان" className="category-card sedan"><span>راحة وأناقة</span><strong>سيدان</strong><ChevronLeft /></Link><Link to="/cars?category=دفع رباعي" className="category-card suv"><span>للطريق المفتوح</span><strong>دفع رباعي</strong><ChevronLeft /></Link><Link to="/cars?category=عائلية" className="category-card family"><span>تسع الجميع</span><strong>عائلية</strong><ChevronLeft /></Link></div></div></section>

//       <section className="steps-section container" id="how-it-works"><div className="steps-intro"><span className="section-kicker">بكل بساطة</span><h2>من البحث إلى الطريق<br /><em>في ثلاث خطوات.</em></h2><p>لا تضيع وقتك بين الاتصالات والانتظار. كل ما تحتاجه في مكان واحد.</p><Link to="/cars" className="primary-button">ابدأ البحث الآن <ChevronLeft size={18} /></Link></div><div className="steps-list"><div className="step-item"><span>01</span><div><CarFront /><h3>اختر سيارتك</h3><p>ابحث وقارن بين السيارات حسب الموقع والسعر والمواصفات.</p></div></div><div className="step-item"><span>02</span><div><CalendarDays /><h3>احجز في دقائق</h3><p>حدد تاريخك وبيانات الاستلام، وستصلك التفاصيل فوراً.</p></div></div><div className="step-item"><span>03</span><div><CheckCircle2 /><h3>استلم وانطلق</h3><p>استلم سيارتك من المورد الموثوق وابدأ رحلتك براحة.</p></div></div></div></section>

//       <section className="supplier-cta"><div className="container supplier-cta-inner"><div><span className="section-kicker">لديك سيارات؟</span><h2>حوّل سياراتك إلى<br /><em>مصدر دخل مستمر.</em></h2><p>انضم إلى شبكة الموردين في سفر، وأدر سياراتك وحجوزاتك من لوحة واحدة.</p><Link to="/Vendor-Join" className="light-button">انضم كمورد <ChevronLeft size={18} /></Link></div><div className="supplier-stat"><strong>+200</strong><span>سيارة قيد الحجز</span><strong>24/7</strong><span>دعم للموردين</span></div></div></section>

//       <footer className="marketing-footer"><div className="container footer-grid"><div><Link className="brand-mark light" to="/">سَفَر <span>SAFAR</span></Link><p>طريقك الأسهل لاستئجار سيارة في اليمن.</p></div><div><strong>اكتشف</strong><Link to="/cars">السيارات</Link><Link to="/login">تسجيل الدخول</Link></div><div><strong>للموردين</strong><Link to="/Vendor-Join">انضم كمورد</Link><Link to="/supplier/dashboard">لوحة المورد</Link></div><div><strong>تواصل معنا</strong><span>صنعاء، اليمن</span><span>support@safar.ye</span></div></div><div className="container footer-bottom">© 2026 سفر. كل الحقوق محفوظة.</div></footer>
//     </div>
//   );
// }
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { carsAPI } from '../services/api';
import { Search, MapPin, Calendar, Check, Shield, Star, Zap, Phone, Mail, Map, Flame, Car, Heart } from 'lucide-react';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import SearchFilter from '../components/SearchFilter';
import AdvertisementBanner from '../components/AdvertisementBanner';

export default function Home() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useState({
    location: '',
    startDate: '',
    endDate: '',
    pickupTime: '09:00',
    returnTime: '18:00',
    minPrice: '',
    maxPrice: '',
    latitude: '',
    longitude: '',
    radius: 10,
  });
  


  const [deals, setDeals] = useState([]);
  const { user, isAuthenticated, isCustomer } = useAuthStore();
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const fetchFavorites = async () => {
    if (isAuthenticated() && isCustomer()) {
      try {
        const res = await carsAPI.getFavorites();
        setFavoriteIds(new Set(res.data.data.map(c => c.id)));
      } catch (err) {
        console.error('Error fetching favorites:', err);
      }
    }
  };
  useEffect(() => {
    // Fetch all cars and filter those with discount > 0 for the deals section
    carsAPI.getAll().then(res => {
      const discounted = res.data.data.filter(car => car.discount_percentage > 0).slice(0, 4);
      setDeals(discounted);
    }).catch(err => console.error(err));
    
    fetchFavorites();
  }, [user]);



  const toggleFavorite = async (e, carId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated()) return navigate('/login');
    if (!isCustomer()) return toast.error('فقط العملاء يمكنهم الإضافة للمفضلة');

    try {
      const res = await carsAPI.toggleFavorite(carId);
      setFavoriteIds(prev => {
        const next = new Set(prev);
        if (res.data.isFavorite) next.add(carId);
        else next.delete(carId);
        return next;
      });
      toast.success(res.data.message);
    } catch (error) {
      toast.error('فشل تحديث المفضلة');
    }
  };

  // تحقق بسيط من صحة التواريخ في الواجهة
  const isDateValid = () => {
    if (!searchParams.startDate || !searchParams.endDate) return true;
    return new Date(searchParams.startDate) <= new Date(searchParams.endDate);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!isDateValid()) {
      alert('تاريخ التسليم يجب أن يكون بعد تاريخ الاستلام');
      return;
    }
    const query = new URLSearchParams(searchParams).toString();
    navigate(`/cars?${query}`);
  };

  // التوجيه عند النقر على فئة سيارة
  const handleCategoryClick = (category) => {
    navigate(`/cars?category=${encodeURIComponent(category)}`);
  };
 
  
  return (
    <div className="home-wrapper">
      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(rgba(0, 53, 128, 0.7), rgba(0, 53, 128, 0.5)), url("https://images.unsplash.com/photo-1503376780353-7e6692767b70?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        height: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        textAlign: 'center',
        position: 'relative'
      }}>
        <div className="container">
          <h1 style={{ color: 'white', fontSize: '2.5rem', marginBottom: '10px' }}>احجز سيارتك المثالية بأفضل سعر</h1>
          <p style={{ fontSize: '1.2rem', opacity: 0.9 }}>أكثر من 900 شركة تأجير سيارات في مكان واحد</p>
        </div>
      </section>

      {/* Search Widget - مُحسن بتراكب جزئي */}
      <div className="container" style={{ position: 'relative', marginTop: '-50px', zIndex: 5 }}>
      <SearchFilter
  searchParams={searchParams}
  setSearchParams={setSearchParams}
  handleSearch={handleSearch}
/>
      </div>

      {/* Trust Elements - ألوان موحدة */}
      <section className="container" style={{ padding: '60px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: '#f0f4f8', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#0a58ca' }}>
              <Shield size={32} />
            </div>
            <h3 style={{ marginBottom: '10px' }}>إلغاء مجاني</h3>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>إلغاء مجاني لمعظم الحجوزات قبل 48 ساعة من موعد الاستلام.</p>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ background: '#f0f4f8', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#0a58ca' }}>
              <Star size={32} />
            </div>
            <h3 style={{ marginBottom: '10px' }}>تقييمات حقيقية</h3>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>نحن نعتمد فقط على تقييمات العملاء الحقيقيين لضمان جودة الموردين.</p>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ background: '#f0f4f8', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#0a58ca' }}>
              <Zap size={32} />
            </div>
            <h3 style={{ marginBottom: '10px' }}>حجز فوري</h3>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>تأكيد فوري لحجزك وسرعة في استلام السيارة دون تعقيدات.</p>
          </div>
        </div>
      </section>
      <AdvertisementBanner placement="home" />


      {/* Today's Deals - بدون إيموجي نار */}
      {deals.length > 0 && (
        <section style={{ padding: '60px 0', background: '#fff' }}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Flame size={28} color="#E3000F" />
              <h2 style={{ fontSize: '2rem', margin: 0 }}>عروض اليوم المميزة</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {deals.map(car => (
                <Link to={`/cars/${car.id}`} key={car.id} style={{ border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden', display: 'block', transition: 'transform 0.2s, box-shadow 0.2s', background: '#fff', textDecoration: 'none' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                  <div style={{ position: 'relative', height: '200px', background: '#f5f5f5' }}>
                    <div style={{ position: 'absolute', top: '10px', right: '10px', background: '#E3000F', color: 'white', padding: '4px 10px', borderRadius: '4px', fontWeight: 'bold', zIndex: 2 }}>
                      خصم {car.discount_percentage}%
                    </div>
                    <img src={car.primary_image ? (car.primary_image.startsWith('http') ? car.primary_image : getImageUrl(car.primary_image)) : 'https://via.placeholder.com/300x200'} alt={car.make} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    {isCustomer() && (
                      <button
                        onClick={(e) => toggleFavorite(e, car.id)}
                        style={{
                          position: 'absolute',
                          bottom: '10px',
                          left: '10px',
                          background: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                          zIndex: 3
                        }}
                      >
                        <Heart size={16} fill={favoriteIds.has(car.id) ? "#dc3545" : "none"} color={favoriteIds.has(car.id) ? "#dc3545" : "#666"} />
                      </button>
                    )}
                  </div>
                  <div style={{ padding: '15px' }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '5px', color: '#1a1a1a' }}>{car.make} {car.model}</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
                      <span style={{ textDecoration: 'line-through', color: '#999' }}>${car.price_per_day}</span>
                      <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#E3000F' }}>${(car.price_per_day * (1 - car.discount_percentage / 100)).toFixed(2)} <span style={{ fontSize: '0.8rem', color: '#666' }}>/يوم</span></span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Car Types Quick Links - مع أيقونات Lucide وروابط فعلية */}
      <section style={{ background: '#f8f9fa', padding: '60px 0', borderTop: '1px solid #eee' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', marginBottom: '40px' }}>تصفح حسب فئة السيارة</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
            {['اقتصادية', 'سيدان', 'دفع رباعي', 'فاخرة', 'عائلية'].map((cat, i) => (
              <div key={i} onClick={() => handleCategoryClick(cat)} style={{ border: '1px solid #eee', borderRadius: '8px', padding: '20px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', background: 'white' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#0a58ca'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#eee'}
              >
                <div style={{ fontSize: '2rem', marginBottom: '10px', color: '#0a58ca', display: 'flex', justifyContent: 'center' }}>
                  <Car size={32} />
                </div>
                <p style={{ fontWeight: '700' }}>{cat}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works (بدون تغيير) */}
      <section style={{ padding: '60px 0', background: '#f8f9fa' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', marginBottom: '40px' }}>كيف تعمل منصتنا؟</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '40px', textAlign: 'center' }}>
            <div>
              <div style={{ background: 'var(--primary)', color: 'white', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold', margin: '0 auto 15px' }}>1</div>
              <h3>ابحث و قارن</h3>
              <p style={{ color: '#666', marginTop: '10px' }}>حدد موقع وتاريخ الاستلام، وقارن بين مئات السيارات والأسعار.</p>
            </div>
            <div>
              <div style={{ background: 'var(--primary)', color: 'white', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold', margin: '0 auto 15px' }}>2</div>
              <h3>اختر العرض المناسب</h3>
              <p style={{ color: '#666', marginTop: '10px' }}>اختر السيارة والمورد الذي يناسبك، وتأكد من قراءة التقييمات وشروط الخصم.</p>
            </div>
            <div>
              <div style={{ background: 'var(--primary)', color: 'white', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold', margin: '0 auto 15px' }}>3</div>
              <h3>انطلق بثقة</h3>
              <p style={{ color: '#666', marginTop: '10px' }}>أتمم الحجز بأمان، استلم سيارتك، واستمتع برحلتك بكل راحة بال.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Top Brands Slider (لا تغيير) */}
      <section style={{ padding: '60px 0', background: 'white' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: '40px' }}>أشهر شركائنا الموثوقين</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', justifyContent: 'center', alignItems: 'center', opacity: 0.7 }}>
            <div style={{ fontSize: '2rem', fontWeight: '900', color: '#1a1a1a' }}>AVIS</div>
            <div style={{ fontSize: '2rem', fontWeight: '900', color: '#006400' }}>Europcar</div>
            <div style={{ fontSize: '2rem', fontWeight: '900', color: '#FFB300' }}>Hertz</div>
            <div style={{ fontSize: '2rem', fontWeight: '900', color: '#E3000F' }}>Budget</div>
            <div style={{ fontSize: '2rem', fontWeight: '900', color: '#000000' }}>SIXT</div>
            <div style={{ fontSize: '2rem', fontWeight: '900', color: '#00A0C6' }}>Enterprise</div>
          </div>
        </div>
      </section>

      {/* Contact Us Footer */}
      <footer style={{ background: '#1a1a1a', color: 'white', padding: '60px 0 20px' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '40px', borderBottom: '1px solid #333', paddingBottom: '40px', marginBottom: '20px' }}>
            <div>
              <h3 style={{ color: 'white', marginBottom: '20px' }}>تواصل معنا</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '15px', color: '#ccc' }}>
                <li style={{ display: 'flex', gap: '10px', alignItems: 'center' }}><Phone size={18} /> +967 777 123 456</li>
                <li style={{ display: 'flex', gap: '10px', alignItems: 'center' }}><Mail size={18} /> support@carflexi-clone.com</li>
                <li style={{ display: 'flex', gap: '10px', alignItems: 'center' }}><Map size={18} /> شارع الستين، صنعاء، اليمن</li>
              </ul>
            </div>

            <div>
              <h3 style={{ color: 'white', marginBottom: '20px' }}>روابط سريعة</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', color: '#ccc' }}>
                <li><a href="#" style={{ color: '#ccc' }}>من نحن</a></li>
                <li><a href="#" style={{ color: '#ccc' }}>الأسئلة الشائعة</a></li>
                <li><a href="#" style={{ color: '#ccc' }}>الشروط والأحكام</a></li>
                <li><a href="#" style={{ color: '#ccc' }}>سياسة الخصوصية</a></li>
              </ul>
            </div>

            <div>
              <h3 style={{ color: 'white', marginBottom: '20px' }}>النشرة البريدية</h3>
              <p style={{ color: '#ccc', marginBottom: '15px' }}>اشترك للحصول على أحدث العروض والخصومات مباشرة في بريدك.</p>
              <form style={{ display: 'flex' }} onSubmit={e => e.preventDefault()}>
                <input type="email" placeholder="البريد الإلكتروني" style={{ padding: '10px 15px', border: 'none', borderRadius: '4px 0 0 4px', outline: 'none', flex: 1 }} required />
                <button type="submit" className="btn btn-primary" style={{ borderRadius: '0 4px 4px 0' }}>اشترك</button>
              </form>
            </div>
          </div>
          <div style={{ textAlign: 'center', color: '#888', fontSize: '0.9rem' }}>
            © {new Date().getFullYear()} Car Rental System. جميع الحقوق محفوظة.
          </div>
        </div>
      </footer>
    </div>
  );
}
