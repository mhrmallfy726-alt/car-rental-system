import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { carsAPI, reservationsAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { Calendar, MapPin, User, Settings, Check, Star, Shield, Car as CarIcon, Upload, X, Info, CheckCircle, Fuel, Gauge, ArrowRight, Flame, Heart } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { getImageUrl } from '../utils/imageUtils';

export default function CarDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isCustomer, fetchMe } = useAuthStore();
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  const [bookingData, setBookingData] = useState({
    start_date: '',
    end_date: '',
    pickup_location: '',
    customer_notes: ''
  });

  useEffect(() => {
    fetchCar();
  }, [id]);

  const fetchCar = async () => {
    try {
      const res = await carsAPI.getOne(id);
      setCar(res.data.data);
      
      // إذا كان المستخدم مسجل دخوله كعميل، تحقق إذا كانت السيارة في المفضلة
      if (isAuthenticated() && isCustomer()) {
        const favsRes = await carsAPI.getFavorites();
        const exists = favsRes.data.data.some(f => f.id === id);
        setIsFavorite(exists);
      }
    } catch (error) {
      toast.error('السيارة غير موجودة');
      navigate('/cars');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async () => {
    if (!isAuthenticated()) return navigate('/login');
    if (!isCustomer()) return toast.error('فقط العملاء يمكنهم الإضافة للمفضلة');

    try {
      const res = await carsAPI.toggleFavorite(id);
      setIsFavorite(res.data.isFavorite);
      toast.success(res.data.message);
    } catch (error) {
      toast.error('فشل تحديث المفضلة');
    }
  };

  // التحقق من صحة التواريخ قبل الحجز
  const validateDates = () => {
    if (!bookingData.start_date || !bookingData.end_date) {
      toast.error('يرجى اختيار تاريخ الاستلام والتسليم');
      return false;
    }
    const start = new Date(bookingData.start_date);
    const end = new Date(bookingData.end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      toast.error('لا يمكن اختيار تاريخ استلام في الماضي');
      return false;
    }
    if (end <= start) {
      toast.error('تاريخ التسليم يجب أن يكون بعد تاريخ الاستلام');
      return false;
    }
    return true;
  };

  const handleBook = async (e) => {
    e.preventDefault();
    if (!isAuthenticated()) return navigate('/login');
    if (!isCustomer()) return toast.error('فقط العملاء يمكنهم الحجز');
    if (!validateDates()) return;

    try {
      await reservationsAPI.create({ car_id: id, ...bookingData });
      toast.success('تم إرسال طلب الحجز بنجاح');
      navigate('/my-reservations');
    } catch (error) {
      toast.error(error.response?.data?.message || 'فشل الحجز');
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;
  if (!car) return null;

  const totalDays = bookingData.start_date && bookingData.end_date
    ? Math.max(0, differenceInDays(new Date(bookingData.end_date), new Date(bookingData.start_date)))
    : 0;

  // الحصول على أقل تاريخ مسموح (اليوم)
  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div className="page container pb-60">
      {/* Breadcrumbs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', margin: '20px 0', fontSize: '0.9rem', color: '#666' }}>
        <Link to="/" style={{ color: 'var(--primary-light)' }}>الرئيسية</Link>
        <ArrowRight size={14} />
        <Link to="/cars" style={{ color: 'var(--primary-light)' }}>السيارات</Link>
        <ArrowRight size={14} />
        <span>{car.make} {car.model}</span>
      </div>

      <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start' }} className="detail-layout">

        {/* القسم الأيسر: الصور والمواصفات */}
        <div style={{ flex: 1 }}>
          <div className="card" style={{ overflow: 'hidden', background: 'white', marginBottom: '30px', borderRadius: '12px' }}>
            {/* الصورة الرئيسية */}
            <div style={{ height: '380px', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
              <img
                src={car.images?.length > 0 ? getImageUrl(car.images[activeImageIndex]?.image_url) : 'https://via.placeholder.com/600x400?text=No+Image'}
                alt={`${car.make} ${car.model}`}
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px' }}
              />
            </div>
            {/* الصور المصغرة */}
            {car.images?.length > 1 && (
              <div style={{ display: 'flex', gap: '8px', padding: '12px 16px', overflowX: 'auto', background: 'white', borderTop: '1px solid #eee' }}>
                {car.images.map((img, idx) => (
                  <img
                    key={img.id || idx}
                    src={getImageUrl(img.image_url)}
                    alt={`صورة ${idx + 1}`}
                    onClick={() => setActiveImageIndex(idx)}
                    style={{
                      width: '70px', height: '50px', objectFit: 'cover', borderRadius: '6px', cursor: 'pointer', flexShrink: 0,
                      border: activeImageIndex === idx ? '2px solid #0a58ca' : '2px solid transparent',
                      opacity: activeImageIndex === idx ? 1 : 0.6,
                      transition: 'all 0.2s'
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="card p-32 mb-30" style={{ background: 'white', borderRadius: '12px' }}>
            <h2 style={{ marginBottom: '20px' }}>مواصفات السيارة</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px' }}>
              <div className="feature-item" style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <User size={20} color="var(--primary)" />
                <div><p style={{ fontSize: '0.8rem', color: '#666' }}>المقاعد</p><p style={{ fontWeight: '700' }}>{car.seats} ركاب</p></div>
              </div>
              <div className="feature-item" style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Settings size={20} color="var(--primary)" />
                <div><p style={{ fontSize: '0.8rem', color: '#666' }}>الناقل</p><p style={{ fontWeight: '700' }}>{car.transmission === 'automatic' ? 'أوتوماتيك' : 'يدوي'}</p></div>
              </div>
              <div className="feature-item" style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Fuel size={20} color="var(--primary)" />
                <div><p style={{ fontSize: '0.8rem', color: '#666' }}>الوقود</p><p style={{ fontWeight: '700' }}>{car.fuel_type === 'petrol' ? 'بنزين' : 'ديزل'}</p></div>
              </div>
              <div className="feature-item" style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Gauge size={20} color="var(--primary)" />
                <div><p style={{ fontSize: '0.8rem', color: '#666' }}>الكيلومترات</p><p style={{ fontWeight: '700' }}>مفتوح</p></div>
              </div>
            </div>
          </div>

          <div className="card p-32" style={{ background: 'white', borderRadius: '12px' }}>
            <h3 style={{ marginBottom: '15px' }}>الوصف</h3>
            <p style={{ color: '#666', lineHeight: '1.8' }}>{car.description || 'لا يوجد وصف متاح حالياً لهذه السيارة.'}</p>
          </div>
        </div>

        {/* القسم الأيمن: نموذج الحجز */}
        <aside style={{ width: '400px', position: 'sticky', top: '100px' }} className="booking-sidebar">
          {/* معلومات المورد */}
          <div className="card p-24 mb-24" style={{ background: 'white', borderRadius: '12px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', overflow: 'hidden', border: '1px solid #eee', flexShrink: 0, padding: '5px' }}>
                <img src={car.brand_logo ? (car.brand_logo.startsWith('http') ? car.brand_logo : `http://localhost:5000/${car.brand_logo}`) : 'https://via.placeholder.com/60?text=Logo'} alt="Supplier Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <div>
                <h3 className="font-bold" style={{ color: 'var(--primary)' }}>{car.supplier_name}</h3>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center', color: '#f4b400', fontSize: '0.85rem', fontWeight: 'bold' }}>
                  <Star size={14} fill="currentColor" /> {car.average_rating || 'جديد'}
                </div>
              </div>
            </div>
            {car.brand_description && (
              <p className="text-sm" style={{ color: '#666', lineHeight: '1.6' }}>{car.brand_description}</p>
            )}
          </div>

          {/* بطاقة السعر والحجز */}
          <div className="card p-32" style={{ background: 'white', borderTop: '5px solid var(--secondary)', borderRadius: '12px' }}>
            <div style={{ textAlign: 'center', marginBottom: '25px', paddingBottom: '20px', borderBottom: '1px solid #eee', position: 'relative' }}>
              {car.discount_percentage > 0 && (
                <div style={{ position: 'absolute', top: '-15px', right: '50%', transform: 'translateX(50%)', background: '#E3000F', color: 'white', padding: '4px 12px', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Flame size={14} /> خصم {car.discount_percentage}%
                </div>
              )}
              <span style={{ fontSize: '0.9rem', color: '#666', display: 'block', marginTop: car.discount_percentage > 0 ? '15px' : '0' }}>السعر لليوم الواحد</span>
              {car.discount_percentage > 0 ? (
                <>
                  <div style={{ textDecoration: 'line-through', color: '#999', fontSize: '1.2rem', marginBottom: '-5px' }}>${car.price_per_day}</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: '900', color: '#E3000F' }}>${(car.price_per_day * (1 - car.discount_percentage / 100)).toFixed(2)}</div>
                </>
              ) : (
                <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--primary)' }}>${car.price_per_day}</div>
              )}
            </div>

            {/* زر المفضلة */}
            {isCustomer() && (
              <button 
                onClick={toggleFavorite}
                style={{
                  position: 'absolute',
                  top: '20px',
                  left: '20px',
                  background: 'white',
                  border: '1px solid #eee',
                  borderRadius: '50%',
                  width: '45px',
                  height: '45px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  zIndex: 5,
                  transition: 'all 0.2s'
                }}
                className="fav-btn"
                title={isFavorite ? "حذف من المفضلة" : "إضافة للمفضلة"}
              >
                <Heart size={24} fill={isFavorite ? "#dc3545" : "none"} color={isFavorite ? "#dc3545" : "#666"} />
              </button>
            )}

            <form onSubmit={handleBook} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="input-wrapper">
    <label>موقع الاستلام</label>
    <div style={{ position: 'relative' }}>
      <MapPin size={18} style={{ position: 'absolute', right: '12px', top: '12px', color: '#999' }} />
      <LocationSearch
value={searchParams.location}
onChange={(location) => {
setSearchParams((prev) => ({
...prev,
location: location.name,
latitude: location.latitude,
longitude: location.longitude,
radius: 10,
}));
}}
/>             </div>
  </div>


              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="input-wrapper">
                  <label>تاريخ الاستلام</label>
                  <input type="date" className="custom-input" required
                    min={minDate}
                    value={bookingData.start_date}
                    onChange={e => setBookingData({ ...bookingData, start_date: e.target.value })} />
                </div>
                <div className="input-wrapper">
                  <label>تاريخ التسليم</label>
                  <input type="date" className="custom-input" required
                    min={bookingData.start_date || minDate}
                    value={bookingData.end_date}
                    onChange={e => setBookingData({ ...bookingData, end_date: e.target.value })} />
                </div>
              </div>

              {totalDays > 0 && (
                <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span>عدد الأيام:</span>
                    <span style={{ fontWeight: '700' }}>{totalDays} أيام</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', color: 'var(--primary)', fontWeight: '900', borderTop: '1px solid #ddd', paddingTop: '10px', marginTop: '5px' }}>
                    <span>الإجمالي:</span>
                    <span>${(totalDays * (car.price_per_day * (1 - (car.discount_percentage || 0) / 100))).toFixed(2)}</span>
                  </div>
                </div>
              )}

              <button type="submit" className="btn btn-primary btn-full" style={{ height: '55px', fontSize: '1.2rem' }}>
                احجز الآن
              </button>
            </form>

            <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.85rem', color: '#666' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', color: '#008009', fontWeight: '700', marginBottom: '10px' }}>
                <Shield size={16} /> حجز آمن ومؤمن 100%
              </div>
              <p>لن يتم خصم أي مبالغ الآن، الدفع يتم لاحقاً</p>
            </div>
          </div>
        </aside>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @media (max-width: 992px) {
          .detail-layout { flex-direction: column; }
          .booking-sidebar { width: 100% !important; position: static !important; }
        }
        .custom-input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          font-size: 0.9rem;
        }
        .btn-primary {
          background-color: var(--secondary);
          color: white;
        }
        .btn-primary:hover {
          background-color: var(--secondary-hover);
        }
      `}} />
    </div>
  );
}