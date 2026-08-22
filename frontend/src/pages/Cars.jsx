import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { carsAPI } from '../services/api';
import AdvertisementBanner from '../components/AdvertisementBanner';
import { Search, Filter, Star, User, Settings, CheckCircle, Car, MapPin, Gauge, Fuel, Percent, X, Calendar, Heart } from 'lucide-react';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
// import ActiveAdvertisements from '../components/ActiveAdvertisements';

// import SearchFilter from "../components/SearchFilter";
export default function Cars() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
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
      setCategories(catRes.data.data);
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

      {/* Header Search Section */}
      <section style={{ background: 'var(--primary)', padding: '40px 0', color: 'white' }}>
        <div className="container">
          <h1 className="mb-24" style={{ fontSize: '2.2rem', fontWeight: 900 }}>اعثر على سيارتك المثالية</h1>

          {/* <SearchFilter
  searchParams={searchParams}
  setSearchParams={setSearchParams}
  handleSearch={handleSearch}
/> */}



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
                  {categories.map(cat => (
                    <label key={cat.id} style={{ display: 'flex', gap: '10px', alignItems: 'center', cursor: 'pointer', fontSize: '0.85rem', padding: '4px 0' }}>
                      <input
                        type="radio"
                        name="category"
                        checked={filters.category === cat.id}
                        onChange={() => handleFilterChange('category', filters.category === cat.id ? '' : cat.id)}
                      />
                      {cat.name_ar || cat.name}
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {cars.map(car => (
                  <Link
                    key={car.id}
                    to={{
                      pathname: `/cars/${car.id}`,
                      search: new URLSearchParams({
                        location: filters.search || '',
                        startDate: filters.startDate || '',
                        endDate: filters.endDate || '',
                        pickupTime: filters.pickup_time || '09:00',
                        returnTime: filters.return_time || '18:00',
                        latitude: filters.latitude || '',
                        longitude: filters.longitude || '',
                        radius: String(filters.radius || 10),
                        minPrice: filters.min_price || '',
                        maxPrice: filters.max_price || '',
                      }).toString(),
                      state: { search: filters },
                    }}
                    style={{ textDecoration: 'none', color: 'inherit', background: 'white', borderRadius: '12px', overflow: 'hidden', display: 'flex', transition: 'transform 0.2s, box-shadow 0.2s' }}
                    className="hover-up"
                  >
                    <div style={{ width: '280px', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
                      {car.discount_percentage > 0 && (
                        <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10, background: '#E3000F', color: 'white', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Percent size={12} /> خصم {car.discount_percentage}%
                        </div>
                      )}
                      <img
                        src={car.primary_image ? (car.primary_image.startsWith('http') ? car.primary_image : `http://localhost:5000/${car.primary_image}`) : 'https://via.placeholder.com/300x200'}
                        alt={car.make}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      {isCustomer() && (
                        <button
                          onClick={(e) => { e.preventDefault(); toggleFavorite(e, car.id); }}
                          style={{
                            position: 'absolute',
                            bottom: '12px',
                            right: '12px',
                            zIndex: 10,
                            background: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                            transition: 'transform 0.2s'
                          }}
                          className="fav-icon-btn"
                        >
                          <Heart size={18} fill={favoriteIds.has(car.id) ? "#dc3545" : "none"} color={favoriteIds.has(car.id) ? "#dc3545" : "#666"} />
                        </button>
                      )}
                    </div>

                    <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap' }}>
                        <div>
                          <h3 style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '4px', color: '#0a58ca' }}>{car.make} {car.model} {car.year}</h3>
                          <p style={{ fontSize: '0.7rem', color: '#6c757d', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} /> {car.location_city || 'صنعاء'}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ffc107', fontWeight: 'bold' }}>
                          <Star size={14} fill="currentColor" /> {car.average_rating || 'جديد'}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '12px', fontSize: '0.7rem', color: '#6c757d', marginBottom: '20px', flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#f8f9fa', padding: '4px 8px', borderRadius: '20px' }}><User size={12} /> {car.seats} مقاعد</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#f8f9fa', padding: '4px 8px', borderRadius: '20px' }}><Settings size={12} /> {car.transmission === 'automatic' ? 'أوتوماتيك' : 'يدوي'}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#f8f9fa', padding: '4px 8px', borderRadius: '20px' }}><Fuel size={12} /> {car.fuel_type === 'petrol' ? 'بنزين' : 'ديزل'}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#f8f9fa', padding: '4px 8px', borderRadius: '20px' }}><Gauge size={12} /> {car.mileage || 0} كم</span>
                      </div>

                      <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '0.7rem', color: '#28a745', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={12} /> إلغاء مجاني</span>
                          <span style={{ fontSize: '0.7rem', color: '#28a745', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={12} /> تأمين شامل</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          {car.discount_percentage > 0 ? (
                            <>
                              <span style={{ fontSize: '0.7rem', color: '#6c757d', textDecoration: 'line-through', display: 'block' }}>${car.price_per_day}</span>
                              <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#E3000F' }}>${(car.price_per_day * (1 - car.discount_percentage / 100)).toFixed(1)}</span>
                            </>
                          ) : (
                            <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#0a58ca' }}>${car.price_per_day}</span>
                          )}
                          <span style={{ fontSize: '0.7rem', color: '#6c757d', display: 'block' }}>/ يوم</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
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

      <style dangerouslySetInnerHTML={{
        __html: `
        @media (max-width: 992px) {
          .cars-layout { flex-direction: column; }
          .filters-sidebar {
            position: fixed;
            right: -300px;
            top: 0;
            bottom: 0;
            z-index: 2001;
            transition: all 0.3s ease;
            background: white;
            box-shadow: -5px 0 20px rgba(0,0,0,0.2);
            overflow-y: auto;
            padding: 20px;
          }
          .filters-sidebar.show { right: 0; }
          .hover-up {
            flex-direction: column;
          }
          .hover-up > div:first-child {
            width: 100% !important;
            height: 180px;
          }
          .hide-mobile { display: none; }
          .show-tablet { display: block; }
        }
        @media (min-width: 993px) {
          .show-tablet { display: none; }
        }
        .hover-up:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e9ecef;
          border-top-color: #0a58ca;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        `
      }} />
    </div>
  );
}