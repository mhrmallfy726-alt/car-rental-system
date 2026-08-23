import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { carsAPI } from '../services/api';
import AdvertisementBanner from '../components/AdvertisementBanner';
import { Search, Filter, Star, User, Settings, CheckCircle, ShieldCheck, Car, MapPin, Gauge, Fuel, Percent, X, Calendar, Heart } from 'lucide-react';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
// import ActiveAdvertisements from '../components/ActiveAdvertisements';

// import SearchFilter from "../components/SearchFilter";
export default function Cars() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const locationSearch = useLocation().search;
  const initialParams = new URLSearchParams(locationSearch);

  // إضافة حالة لرسالة خطأ التاريخ
  const [dateError, setDateError] = useState('');

  const [filters, setFilters] = useState({
    category: initialParams.get('category') || '',
    search: initialParams.get('location') || '',
    min_price: '',
    max_price: '',
    transmission: '',
    fuel_type: '',
    sort_by: initialParams.get('sort_by') || 'newest',
    startDate: initialParams.get('startDate') || '',
    endDate: initialParams.get('endDate') || '',
    pickup_time: initialParams.get('pickupTime') || initialParams.get('pickup_time') || '09:00',
    return_time: initialParams.get('returnTime') || initialParams.get('return_time') || '18:00',
    latitude: initialParams.get('latitude') || '',
    longitude: initialParams.get('longitude') || '',
    radius: Number(initialParams.get('radius')) || 10
  });

  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState([]);
  const { user, isAuthenticated, isCustomer } = useAuthStore();
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const displayCategories = useMemo(() => {
    const unique = new Map();
    categories.forEach((category) => {
      const label = String(category.name_ar || category.name || '').trim();
      const key = label.toLocaleLowerCase('ar') || String(category.id);
      if (label && !unique.has(key)) unique.set(key, { ...category, displayName: label });
    });
    return Array.from(unique.values());
  }, [categories]);

  // جلب البيانات الأولية
  useEffect(() => {
    fetchInitialData();
  }, []);

  // التحقق من صحة التواريخ قبل كل عملية جلب
  const validateDates = useCallback(() => {
    if (filters.startDate && filters.endDate) {
      const pickup = new Date(`${filters.startDate}T${filters.pickup_time || '09:00'}`);
      const returned = new Date(`${filters.endDate}T${filters.return_time || '18:00'}`);
      if (returned <= pickup) {
        setDateError('وقت الإرجاع يجب أن يكون بعد وقت الاستلام');
        return false;
      }
    }
    setDateError('');
    return true;
  }, [filters.startDate, filters.endDate, filters.pickup_time, filters.return_time]);

  const fetchCars = useCallback(async () => {
    if (!validateDates()) return;

    setLoading(true);
    try {
      const res = await carsAPI.getAll(filters);
      setCars(res.data.data);
    } catch (error) {
      toast.error('فشل جلب السيارات');
    } finally {
      setLoading(false);
    }
  }, [filters, validateDates]);

  // تحديث تلقائي عند تغيير الفلاتر (مع debounce خفيف لتقليل الطلبات)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCars();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchCars]);

  const fetchInitialData = async () => {
    try {
      const catRes = await carsAPI.getCategories();
      const incomingCategories = Array.isArray(catRes.data?.data) ? catRes.data.data : [];
      setCategories(incomingCategories);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
    // عند تغيير التواريخ، امسح الخطأ فوراً
    if (name === 'startDate' || name === 'endDate' || name === 'pickup_time' || name === 'return_time') {
      setDateError('');
    }
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      search: '',
      min_price: '',
      max_price: '',
      transmission: '',
      fuel_type: '',
      sort_by: 'newest',
      startDate: '',
      endDate: '',
      pickup_time: '09:00',
      return_time: '18:00'
    });
    setDateError('');
  };

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

  useEffect(() => {
    fetchFavorites();
  }, [user]);

  // دالة لزر "بحث" - تقوم بنفس عملية الجلب (لإرضاء توقع المستخدم)
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCars();
  };

  return (
    <div className="page" style={{ background: '#f8f9fa', minHeight: '100vh', paddingTop: '72px' }}>

      <section className="cars-hero-3d">
        <div className="cars-hero-orb cars-hero-orb-one" />
        <div className="cars-hero-orb cars-hero-orb-two" />
        <div className="cars-hero-grid" />
        <div className="container cars-hero-inner">
          <div className="cars-hero-copy">
            <span className="cars-eyebrow"><span className="cars-live-dot" /> منصة تأجير موثوقة</span>
            <h1>اختر رحلتك<br /><em>بأسلوبك.</em></h1>
            <p>استكشف أسطولاً منتقياً من السيارات الموثوقة، واختر السيارة التي تناسب يومك وميزانيتك.</p>
            <form className="cars-hero-search" onSubmit={handleSearchSubmit}>
              <Search size={18} />
              <input value={filters.search} onChange={(e) => handleFilterChange('search', e.target.value)} placeholder="ابحث عن مدينة أو موقع الاستلام" aria-label="البحث عن موقع الاستلام" />
              <button type="submit">بحث</button>
            </form>
            <div className="cars-hero-actions">
              <button type="button" className="cars-hero-action" onClick={() => document.getElementById('cars-results')?.scrollIntoView({ behavior: 'smooth' })}>
                <Search size={17} /> استكشف السيارات
              </button>
              <span className="cars-hero-meta"><strong>{cars.length || '—'}</strong> سيارة متاحة الآن</span>
            </div>
            {displayCategories.length > 0 && <div className="cars-quick-categories"><span>الأكثر طلباً:</span>{displayCategories.slice(0, 4).map((category) => <button key={category.id} type="button" onClick={() => handleFilterChange('category', category.id)}>{category.displayName}</button>)}</div>}
          </div>
          <div className="cars-hero-stat-card">
            <div className="cars-stat-glow" />
            <span className="cars-stat-label">اختيارك الذكي</span>
            <strong>رحلة أسهل<br /><span>تبدأ من هنا</span></strong>
            <div className="cars-stat-row"><span><CheckCircle size={16} /> سيارات موثقة</span><span><Star size={16} /> تقييمات حقيقية</span></div>
          </div>
        </div>
      </section>
      <AdvertisementBanner placement="cars" />
      <div className="container py-40">
        <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }} className="cars-layout">

          {/* Sidebar Filters */}
          <aside className={`filters-sidebar ${showFilters ? 'show' : ''}`} style={{ width: '300px', flexShrink: 0 }}>
            <div className="card p-24 sticky" style={{ top: '90px', background: 'white', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e9ecef', paddingBottom: '12px' }}>
                <h3 style={{ fontWeight: 'bold', display: 'flex', gap: '8px', alignItems: 'center', margin: 0 }}><Filter size={20} /> التصفية</h3>
                <button onClick={clearFilters} style={{ background: 'none', border: 'none', color: '#dc3545', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>مسح الكل</button>
              </div>

              {/* Category Filter - تحويل إلى radio buttons */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontWeight: 'bold', marginBottom: '12px', display: 'block', fontSize: '0.85rem' }}>نوع السيارة</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {displayCategories.map(cat => (
                    <label key={cat.id} style={{ display: 'flex', gap: '10px', alignItems: 'center', cursor: 'pointer', fontSize: '0.85rem', padding: '4px 0' }}>
                      <input
                        type="radio"
                        name="category"
                        checked={filters.category === cat.id}
                        onChange={() => handleFilterChange('category', filters.category === cat.id ? '' : cat.id)}
                      />
                      {cat.displayName}
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontWeight: 'bold', marginBottom: '12px', display: 'block', fontSize: '0.85rem' }}>نطاق السعر (USD)</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="number"
                    placeholder="من"
                    className="form-input"
                    style={{ padding: '8px', fontSize: '0.85rem', width: '100%' }}
                    value={filters.min_price}
                    onChange={e => handleFilterChange('min_price', e.target.value)}
                  />
                  <span>-</span>
                  <input
                    type="number"
                    placeholder="إلى"
                    className="form-input"
                    style={{ padding: '8px', fontSize: '0.85rem', width: '100%' }}
                    value={filters.max_price}
                    onChange={e => handleFilterChange('max_price', e.target.value)}
                  />
                </div>
              </div>

              {/* Transmission */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontWeight: 'bold', marginBottom: '12px', display: 'block', fontSize: '0.85rem' }}>ناقل الحركة</label>
                <select
                  className="form-input"
                  style={{ fontSize: '0.85rem', padding: '8px', width: '100%' }}
                  value={filters.transmission}
                  onChange={e => handleFilterChange('transmission', e.target.value)}
                >
                  <option value="">الكل</option>
                  <option value="automatic">أوتوماتيك</option>
                  <option value="manual">يدوي</option>
                </select>
              </div>

              {/* Fuel Type */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontWeight: 'bold', marginBottom: '12px', display: 'block', fontSize: '0.85rem' }}>نوع الوقود</label>
                <select
                  className="form-input"
                  style={{ fontSize: '0.85rem', padding: '8px', width: '100%' }}
                  value={filters.fuel_type}
                  onChange={e => handleFilterChange('fuel_type', e.target.value)}
                >
                  <option value="">الكل</option>
                  <option value="petrol">بنزين</option>
                  <option value="diesel">ديزل</option>
                  <option value="hybrid">هايبرد</option>
                  <option value="electric">كهربائي</option>
                </select>
              </div>

              {/* إزالة زر "تطبيق التغييرات" لأنه غير ضروري (الفلاتر تعمل تلقائياً) */}
            </div>
          </aside>

          {/* Results Area */}
          <main style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>السيارات المتاحة</h2>
                <p style={{ color: '#6c757d', fontSize: '0.85rem' }}>تم العثور على {cars.length} سيارة تطابق بحثك</p>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: '#6c757d' }} className="hide-mobile">ترتيب حسب:</span>
                <select
                  className="form-input"
                  style={{ padding: '6px 12px', fontSize: '0.85rem', borderRadius: '999px', width: 'auto' }}
                  value={filters.sort_by}
                  onChange={e => handleFilterChange('sort_by', e.target.value)}
                >
                  <option value="newest">الأحدث</option>
                  <option value="price_asc">السعر: من الأقل</option>
                  <option value="price_desc">السعر: من الأعلى</option>
                  <option value="rating">الأعلى تقييماً</option>
                </select>
                <button className="btn btn-icon show-tablet" style={{ background: 'transparent', border: '1px solid #ccc', borderRadius: '8px', padding: '6px', cursor: 'pointer' }} onClick={() => setShowFilters(true)}>
                  <Filter size={20} />
                </button>
              </div>
            </div>

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px' }}><div className="spinner"></div></div>
            ) : cars.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '12px' }}>
                <Car size={64} style={{ margin: '0 auto 20px', opacity: 0.2 }} />
                <h3 style={{ fontWeight: 'bold', marginBottom: '8px' }}>لم نجد سيارات تطابق بحثك</h3>
                <p style={{ color: '#6c757d', marginBottom: '24px' }}>حاول تغيير الفلاتر أو البحث في مدينة أخرى.</p>
                <button onClick={clearFilters} className="btn btn-secondary" style={{ background: '#6c757d', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>عرض جميع السيارات</button>
              </div>
            ) : (
              <div id="cars-results" className="cars-grid-3d">
                {cars.map((car, index) => {
                  const carImage = car.primary_image ? (car.primary_image.startsWith('http') ? car.primary_image : `http://localhost:5000/${car.primary_image}`) : 'https://via.placeholder.com/640x420';
                  const discountedPrice = car.price_per_day * (1 - (car.discount_percentage || 0) / 100);
                  return (
                    <Link
                      key={car.id}
                      to={{
                        pathname: `/cars/${car.id}`,
                        search: new URLSearchParams({ location: filters.search || '', startDate: filters.startDate || '', endDate: filters.endDate || '', pickupTime: filters.pickup_time || '09:00', returnTime: filters.return_time || '18:00', latitude: filters.latitude || '', longitude: filters.longitude || '', radius: String(filters.radius || 10), minPrice: filters.min_price || '', maxPrice: filters.max_price || '' }).toString(),
                        state: { search: filters },
                      }}
                      className="car-card-3d"
                      style={{ '--card-index': index }}
                    >
                      <div className="car-card-image-wrap">
                        <div className="car-card-image-shine" />
                        <img src={carImage} alt={`${car.make} ${car.model}`} className="car-card-image" />
                        <div className="car-card-topline"><span className="car-card-status"><span /> متاح للحجز</span>{car.discount_percentage > 0 && <span className="car-card-discount"><Percent size={12} /> {car.discount_percentage}%</span>}</div>
                        {isCustomer() && <button onClick={(e) => { e.preventDefault(); toggleFavorite(e, car.id); }} className="car-card-favorite" aria-label="إضافة للمفضلة"><Heart size={18} fill={favoriteIds.has(car.id) ? '#e85b54' : 'none'} color={favoriteIds.has(car.id) ? '#e85b54' : 'currentColor'} /></button>}
                        <div className="car-card-image-caption"><span>{car.category || 'اختيار مميز'}</span><span><Star size={13} fill="currentColor" /> {car.average_rating || 'جديد'}</span></div>
                      </div>
                      <div className="car-card-content">
                        <div className="car-card-title-row"><div><h3>{car.make} {car.model}</h3><p><MapPin size={13} /> {car.location_city || 'صنعاء'} · {car.year || '2024'}</p></div><span className="car-card-arrow">↗</span></div>
                        <div className="car-specs-row"><span><User size={14} /> {car.seats || 5}</span><span><Settings size={14} /> {car.transmission === 'automatic' ? 'أوتوماتيك' : 'يدوي'}</span><span><Fuel size={14} /> {car.fuel_type === 'petrol' ? 'بنزين' : car.fuel_type === 'hybrid' ? 'هايبرد' : 'ديزل'}</span></div>
                        <div className="car-card-footer"><div className="car-card-perks"><span><CheckCircle size={13} /> موثقة</span><span><ShieldCheck size={13} /> تأمين متاح</span></div><div className="car-card-price">{car.discount_percentage > 0 && <del>${Number(car.price_per_day).toFixed(0)}</del>}<strong>${Number(discountedPrice).toFixed(0)}</strong><small>/ يوم</small></div></div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filter Overlay */}
      {showFilters && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000 }}
          onClick={() => setShowFilters(false)}
          className="show-tablet"
        />
      )}
{/* <ActiveAdvertisements placement="cars" /> */}

      <style dangerouslySetInnerHTML={{ __html: `
        .cars-hero-3d { position: relative; overflow: hidden; min-height: 390px; color: #f8fafc; background: radial-gradient(circle at 80% 12%, rgba(198,83,69,.35), transparent 28%), linear-gradient(135deg, #101827 0%, #18263a 58%, #263f58 100%); }
        .cars-hero-inner { position: relative; z-index: 2; min-height: 390px; display: flex; align-items: center; justify-content: space-between; gap: 40px; padding-top: 45px; padding-bottom: 45px; }
        .cars-hero-copy { max-width: 620px; }
        .cars-eyebrow { display: inline-flex; align-items: center; gap: 9px; padding: 8px 13px; border: 1px solid rgba(255,255,255,.16); border-radius: 999px; color: #e9c9a8; background: rgba(255,255,255,.07); font-size: .75rem; font-weight: 800; }
        .cars-live-dot { width: 7px; height: 7px; border-radius: 50%; background: #7de2ab; box-shadow: 0 0 0 5px rgba(125,226,171,.12); }
        .cars-hero-copy h1 { margin: 18px 0 12px; font-size: clamp(2.6rem, 6vw, 5.4rem); line-height: .98; letter-spacing: -.07em; font-weight: 950; }
        .cars-hero-copy h1 em { color: #eaa98e; font-style: normal; text-shadow: 0 10px 30px rgba(234,169,142,.24); }
        .cars-hero-copy p { max-width: 500px; margin: 0; color: rgba(241,245,249,.72); line-height: 1.9; font-size: .95rem; }
        .cars-hero-search { display: flex; align-items: center; gap: 10px; max-width: 520px; margin-top: 23px; padding: 7px 8px 7px 15px; border: 1px solid rgba(255,255,255,.18); border-radius: 15px; color: rgba(255,255,255,.7); background: rgba(255,255,255,.1); box-shadow: inset 0 1px rgba(255,255,255,.12); backdrop-filter: blur(12px); }
        .cars-hero-search input { min-width: 0; flex: 1; border: 0; outline: 0; color: #fff; background: transparent; font: inherit; font-size: .78rem; }
        .cars-hero-search input::placeholder { color: rgba(255,255,255,.55); }
        .cars-hero-search button { border: 0; border-radius: 10px; padding: 10px 16px; color: #172033; background: #f4d4b3; font-weight: 900; cursor: pointer; }
        .cars-hero-actions { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; margin-top: 18px; }
        .cars-quick-categories { display: flex; align-items: center; flex-wrap: wrap; gap: 7px; margin-top: 18px; color: rgba(241,245,249,.58); font-size: .68rem; }
        .cars-quick-categories button { border: 1px solid rgba(255,255,255,.14); border-radius: 999px; padding: 6px 10px; color: rgba(255,255,255,.82); background: rgba(255,255,255,.07); font-size: .67rem; cursor: pointer; transition: background .18s ease, transform .18s ease; }
        .cars-quick-categories button:hover { transform: translateY(-2px); color: #172033; background: #f4d4b3; }
        .cars-hero-action { display: inline-flex; align-items: center; gap: 9px; border: 0; border-radius: 13px; padding: 13px 18px; color: #172033; background: #f4d4b3; font-weight: 900; cursor: pointer; box-shadow: 0 12px 28px rgba(0,0,0,.18); transition: transform .18s ease, box-shadow .18s ease; }
        .cars-hero-action:hover { transform: translateY(-3px); box-shadow: 0 17px 34px rgba(0,0,0,.26); }
        .cars-hero-meta { color: rgba(241,245,249,.65); font-size: .78rem; }
        .cars-hero-meta strong { display: block; color: #fff; font-size: 1.35rem; }
        .cars-hero-stat-card { position: relative; width: min(300px, 32vw); min-height: 210px; padding: 25px; overflow: hidden; transform: rotate(5deg) perspective(900px) rotateY(-8deg); border: 1px solid rgba(255,255,255,.21); border-radius: 26px; background: linear-gradient(150deg, rgba(255,255,255,.18), rgba(255,255,255,.04)); box-shadow: 22px 28px 50px rgba(0,0,0,.26), inset 0 1px rgba(255,255,255,.25); backdrop-filter: blur(14px); }
        .cars-stat-glow { position: absolute; width: 130px; height: 130px; top: -55px; left: -30px; border-radius: 50%; background: #efb087; filter: blur(28px); opacity: .7; }
        .cars-stat-label { position: relative; color: #f2d9bb; font-size: .7rem; font-weight: 800; }
        .cars-hero-stat-card strong { position: relative; display: block; margin-top: 24px; color: #fff; font-size: 1.7rem; line-height: 1.35; }
        .cars-hero-stat-card strong span { color: #f1ba98; }
        .cars-stat-row { position: absolute; right: 20px; bottom: 20px; left: 20px; display: flex; justify-content: space-between; gap: 8px; color: rgba(255,255,255,.72); font-size: .62rem; }
        .cars-stat-row span { display: inline-flex; align-items: center; gap: 4px; }
        .cars-stat-row svg { color: #8fe0b1; }
        .cars-hero-orb { position: absolute; border-radius: 50%; pointer-events: none; filter: blur(1px); opacity: .35; }
        .cars-hero-orb-one { width: 260px; height: 260px; top: -120px; right: 25%; border: 1px solid rgba(255,255,255,.22); box-shadow: 0 0 0 28px rgba(255,255,255,.025), 0 0 0 56px rgba(255,255,255,.018); }
        .cars-hero-orb-two { width: 160px; height: 160px; bottom: -95px; left: 12%; background: rgba(226,143,116,.34); }
        .cars-hero-grid { position: absolute; inset: 0; opacity: .12; background-image: linear-gradient(rgba(255,255,255,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.18) 1px, transparent 1px); background-size: 34px 34px; mask-image: linear-gradient(90deg, transparent, #000 25%, #000 75%, transparent); }
        .cars-grid-3d { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 22px; perspective: 1200px; }
        .car-card-3d { position: relative; overflow: hidden; min-width: 0; border: 1px solid rgba(25,43,64,.1); border-radius: 24px; color: inherit; text-decoration: none; background: linear-gradient(155deg, #fff, #f7f9fb); box-shadow: 0 16px 34px rgba(25,43,64,.08), 0 2px 4px rgba(25,43,64,.05); transform: translateY(0) rotateX(0) rotateY(0); transition: transform .28s cubic-bezier(.23,1,.32,1), box-shadow .28s ease, border-color .28s ease; animation: cardIn .55s both; animation-delay: calc(var(--card-index) * 45ms); }
        .car-card-3d:hover { z-index: 2; border-color: rgba(198,83,69,.28); transform: translateY(-9px) rotateX(2deg) rotateY(-2deg); box-shadow: 0 28px 55px rgba(25,43,64,.16), 0 8px 18px rgba(198,83,69,.1); }
        .car-card-image-wrap { position: relative; height: 220px; overflow: hidden; background: linear-gradient(135deg, #d9e0e7, #a9b8c7); }
        .car-card-image { display: block; width: 100%; height: 100%; object-fit: cover; transition: transform .65s cubic-bezier(.23,1,.32,1), filter .3s ease; }
        .car-card-3d:hover .car-card-image { transform: scale(1.08) rotate(1deg); filter: saturate(1.08) contrast(1.03); }
        .car-card-image-shine { position: absolute; z-index: 1; inset: 0; opacity: 0; background: linear-gradient(115deg, transparent 25%, rgba(255,255,255,.28) 45%, transparent 65%); transform: translateX(-100%); transition: opacity .2s, transform .75s ease; pointer-events: none; }
        .car-card-3d:hover .car-card-image-shine { opacity: 1; transform: translateX(100%); }
        .car-card-topline { position: absolute; z-index: 2; top: 14px; right: 14px; left: 14px; display: flex; justify-content: space-between; align-items: center; gap: 8px; }
        .car-card-status, .car-card-discount { display: inline-flex; align-items: center; gap: 5px; padding: 7px 9px; border-radius: 999px; color: #fff; background: rgba(13,25,39,.62); font-size: .65rem; font-weight: 900; backdrop-filter: blur(8px); }
        .car-card-status span { width: 6px; height: 6px; border-radius: 50%; background: #7de2ab; box-shadow: 0 0 0 4px rgba(125,226,171,.17); }
        .car-card-discount { background: #d85d4f; }
        .car-card-favorite { position: absolute; z-index: 3; right: 14px; bottom: 14px; display: grid; width: 39px; height: 39px; place-items: center; border: 1px solid rgba(255,255,255,.55); border-radius: 50%; color: #fff; background: rgba(13,25,39,.58); cursor: pointer; backdrop-filter: blur(8px); transition: transform .18s ease, background .18s ease; }
        .car-card-favorite:hover { transform: scale(1.12); background: rgba(216,93,79,.92); }
        .car-card-image-caption { position: absolute; right: 15px; bottom: 15px; left: 66px; z-index: 2; display: flex; justify-content: space-between; gap: 8px; color: rgba(255,255,255,.9); font-size: .68rem; font-weight: 800; text-shadow: 0 2px 8px #000; }
        .car-card-image-caption span:last-child { display: inline-flex; align-items: center; gap: 4px; color: #ffd37d; }
        .car-card-content { padding: 18px; }
        .car-card-title-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
        .car-card-title-row h3 { margin: 0; color: #162337; font-size: 1.17rem; font-weight: 950; letter-spacing: -.02em; }
        .car-card-title-row p { display: flex; align-items: center; gap: 5px; margin: 7px 0 0; color: #81909f; font-size: .69rem; }
        .car-card-title-row p svg { color: #cf6655; }
        .car-card-arrow { display: grid; width: 34px; height: 34px; place-items: center; border-radius: 11px; color: #c65345; background: #fbeeea; font-size: 1.25rem; transition: transform .2s ease; }
        .car-card-3d:hover .car-card-arrow { transform: translate(-2px, -2px); }
        .car-specs-row { display: flex; flex-wrap: wrap; gap: 7px; margin: 18px 0; padding-bottom: 16px; border-bottom: 1px solid #edf0f2; }
        .car-specs-row span { display: inline-flex; align-items: center; gap: 5px; padding: 7px 8px; border-radius: 9px; color: #6d7e8e; background: #f3f6f8; font-size: .66rem; font-weight: 800; }
        .car-specs-row svg { color: #c85d4d; }
        .car-card-footer { display: flex; align-items: flex-end; justify-content: space-between; gap: 10px; }
        .car-card-perks { display: flex; flex-direction: column; gap: 7px; color: #4d9a70; font-size: .64rem; font-weight: 800; }
        .car-card-perks span { display: inline-flex; align-items: center; gap: 5px; }
        .car-card-price { text-align: left; color: #17283d; white-space: nowrap; }
        .car-card-price del { display: block; color: #9ba6af; font-size: .65rem; }
        .car-card-price strong { font-size: 1.45rem; font-weight: 950; }
        .car-card-price small { margin-right: 4px; color: #8996a3; font-size: .65rem; }
        .cars-layout { align-items: flex-start; }
        .filters-sidebar .card { border: 1px solid #e8edf1; box-shadow: 0 17px 40px rgba(25,43,64,.06); }
        .spinner { width: 40px; height: 40px; border: 4px solid #e7edf1; border-top-color: #c65345; border-radius: 50%; animation: spin .8s linear infinite; }
        @keyframes cardIn { from { opacity: 0; transform: translateY(16px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 992px) { .cars-layout { flex-direction: column; } .filters-sidebar { position: fixed; right: -320px; top: 0; bottom: 0; z-index: 2001; width: 300px !important; transition: right .28s ease; background: white; box-shadow: -12px 0 35px rgba(0,0,0,.18); overflow-y: auto; padding: 20px; } .filters-sidebar.show { right: 0; } .hide-mobile { display: none; } .show-tablet { display: block; } .cars-hero-stat-card { width: 270px; } }
        @media (max-width: 720px) { .cars-hero-inner { min-height: 520px; align-items: flex-start; flex-direction: column; justify-content: center; gap: 25px; } .cars-hero-stat-card { align-self: flex-start; width: min(290px, 80vw); min-height: 155px; transform: rotate(2deg); } .cars-hero-copy h1 { font-size: 3.2rem; } .cars-hero-search { width: 100%; } .cars-hero-search button { padding-inline: 12px; } .cars-grid-3d { grid-template-columns: 1fr; gap: 16px; } .car-card-image-wrap { height: 210px; } }
        @media (min-width: 993px) { .show-tablet { display: none; } }
        @media (prefers-reduced-motion: reduce) { .car-card-3d, .car-card-image, .cars-hero-action, .car-card-favorite { animation: none; transition: none; } }
      ` }} />
    </div>
  );
}