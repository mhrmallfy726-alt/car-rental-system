import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { carsAPI } from '../services/api';
import { Search, MapPin, Calendar, Check, Shield, Star, Zap, Phone, Mail, Map, Flame, Car, Heart } from 'lucide-react';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

export default function Home() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useState({
    location: '',
    startDate: '',
    endDate: ''
  });
  const [deals, setDeals] = useState([]);
  const { user, isAuthenticated, isCustomer } = useAuthStore();
  const [favoriteIds, setFavoriteIds] = useState(new Set());

  useEffect(() => {
    // Fetch all cars and filter those with discount > 0 for the deals section
    carsAPI.getAll().then(res => {
      const discounted = res.data.data.filter(car => car.discount_percentage > 0).slice(0, 4);
      setDeals(discounted);
    }).catch(err => console.error(err));
    
    fetchFavorites();
  }, [user]);

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
        <form onSubmit={handleSearch} className="hero-search-container fade-in" style={{ background: 'white', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', padding: '20px' }}>
          <div className="search-grid">
            <div className="input-wrapper">
              <label>موقع الاستلام</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={18} style={{ position: 'absolute', right: '12px', top: '12px', color: '#999' }} />
                <input
                  type="text"
                  className="custom-input"
                  style={{ paddingRight: '40px' }}
                  placeholder="المدينة أو المطار..."
                  required
                  value={searchParams.location}
                  onChange={e => setSearchParams({ ...searchParams, location: e.target.value })}
                />
              </div>
            </div>

            <div className="input-wrapper">
              <label>تاريخ الاستلام</label>
              <input
                type="date"
                className="custom-input"
                required
                value={searchParams.startDate}
                onChange={e => setSearchParams({ ...searchParams, startDate: e.target.value })}
              />
            </div>

            <div className="input-wrapper">
              <label>تاريخ التسليم</label>
              <input
                type="date"
                className="custom-input"
                required
                value={searchParams.endDate}
                onChange={e => setSearchParams({ ...searchParams, endDate: e.target.value })}
              />
            </div>

            <div className="input-wrapper" style={{ justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary btn-full" style={{ height: '50px', fontSize: '1.1rem' }}>
                <Search size={20} /> ابحث الآن
              </button>
            </div>
          </div>
        </form>
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
                    <img src={car.primary_image ? (car.primary_image.startsWith('http') ? car.primary_image : `http://localhost:5000/${car.primary_image}`) : 'https://via.placeholder.com/300x200'} alt={car.make} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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