import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowRight, Search as SearchIcon } from 'lucide-react';
import SearchFilter from '../components/SearchFilter';

const defaultSearch = {
  location: '',
  startDate: '',
  endDate: '',
  pickupTime: '09:00',
  returnTime: '18:00',
  withDriver: 'false',
  minPrice: '',
  maxPrice: '',
  latitude: '',
  longitude: '',
  radius: 10,
};

function readSearchParams(search) {
  const params = new URLSearchParams(search);
  return {
    ...defaultSearch,
    location: params.get('location') || '',
    startDate: params.get('startDate') || '',
    endDate: params.get('endDate') || '',
    pickupTime: params.get('pickupTime') || params.get('pickup_time') || '09:00',
    returnTime: params.get('returnTime') || params.get('return_time') || '18:00',
    withDriver: params.get('withDriver') || params.get('with_driver') || 'false',
    minPrice: params.get('minPrice') || params.get('min_price') || '',
    maxPrice: params.get('maxPrice') || params.get('max_price') || '',
    latitude: params.get('latitude') || '',
    longitude: params.get('longitude') || '',
    radius: Number(params.get('radius')) || 10,
  };
}

export default function SearchPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useState(() => readSearchParams(location.search));

  const originalParams = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const updateSearchParams = (nextValue) => {
    setSearchParams(typeof nextValue === 'function' ? nextValue : () => nextValue);
  };

  const handleSearch = (event) => {
    event.preventDefault();

    if (!searchParams.location.trim()) {
      toast.error('يرجى تحديد موقع الاستلام');
      return;
    }
    if (!searchParams.startDate || !searchParams.endDate) {
      toast.error('يرجى إدخال تاريخ الاستلام وتاريخ الإرجاع');
      return;
    }
    const now = new Date();
    const todayValue = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    if (searchParams.startDate < todayValue || searchParams.endDate < todayValue) {
      toast.error('لا يمكن البحث بتاريخ قبل اليوم');
      return;
    }
    if (!searchParams.pickupTime || !searchParams.returnTime) {
      toast.error('يرجى إدخال وقت الاستلام ووقت الإرجاع');
      return;
    }

    const pickup = new Date(`${searchParams.startDate}T${searchParams.pickupTime}`);
    const returned = new Date(`${searchParams.endDate}T${searchParams.returnTime}`);
    if (Number.isNaN(pickup.getTime()) || Number.isNaN(returned.getTime()) || returned <= pickup) {
      toast.error('وقت الإرجاع يجب أن يكون بعد وقت الاستلام');
      return;
    }

    if (searchParams.minPrice && searchParams.maxPrice && Number(searchParams.minPrice) > Number(searchParams.maxPrice)) {
      toast.error('الحد الأدنى للسعر يجب أن يكون أقل من الحد الأعلى');
      return;
    }

    const query = new URLSearchParams(originalParams);
    query.set('location', searchParams.location.trim());
    query.set('startDate', searchParams.startDate);
    query.set('endDate', searchParams.endDate);
    query.set('pickupTime', searchParams.pickupTime);
    query.set('returnTime', searchParams.returnTime);
    query.set('withDriver', searchParams.withDriver || 'false');
    query.set('radius', String(searchParams.radius || 10));

    if (searchParams.latitude) query.set('latitude', String(searchParams.latitude));
    else query.delete('latitude');
    if (searchParams.longitude) query.set('longitude', String(searchParams.longitude));
    else query.delete('longitude');
    if (searchParams.minPrice) query.set('min_price', searchParams.minPrice);
    else query.delete('min_price');
    if (searchParams.maxPrice) query.set('max_price', searchParams.maxPrice);
    else query.delete('max_price');

    navigate(`/cars?${query.toString()}`);
  };

  return (
    <main dir="rtl" style={{ minHeight: '100vh', background: '#f6f9fb', padding: '110px 20px 60px' }}>
      <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', color: '#173a52', textDecoration: 'none', fontWeight: 800, marginBottom: '28px' }}>
          <ArrowRight size={18} /> العودة للرئيسية
        </Link>

        <section style={{ maxWidth: '820px', margin: '0 auto 28px', textAlign: 'center' }}>
          <span style={{ color: '#178263', fontWeight: 900, fontSize: '13px' }}>خطوة واحدة قبل استكشاف السيارات</span>
          <h1 style={{ margin: '8px 0', color: '#173a52', fontSize: 'clamp(28px, 5vw, 44px)' }}>أكمل بيانات البحث</h1>
          <p style={{ margin: 0, color: '#647780', lineHeight: 1.8 }}>
            أدخل موقع الاستلام وتفاصيل الرحلة أولًا، ثم سنعرض لك السيارات المتاحة المطابقة لبحثك.
          </p>
        </section>

        <section style={{ background: '#fff', border: '1px solid #e1eaed', borderRadius: '22px', padding: '22px', boxShadow: '0 14px 40px rgba(23,58,82,.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '8px', color: '#173a52' }}>
            <SearchIcon size={21} color="#178263" />
            <h2 style={{ margin: 0, fontSize: '20px' }}>بيانات البحث</h2>
          </div>
          <p style={{ margin: '0 0 20px', color: '#74858d', fontSize: '13px' }}>الحقول المعلّمة مطلوبة للانتقال إلى السيارات المتاحة.</p>
          <SearchFilter
            searchParams={searchParams}
            setSearchParams={updateSearchParams}
            handleSearch={handleSearch}
          />
        </section>
      </div>
    </main>
  );
}
