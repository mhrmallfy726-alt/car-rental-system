import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Clock3,
  Fuel,
  Gauge,
  Heart,
  MapPin,
  ShieldCheck,
  Star,
  Users,
  Settings2,
} from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { carsAPI, reservationsAPI } from '../services/api';
import AdvertisementBanner from '../components/AdvertisementBanner';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { getImageUrl } from '../utils/imageUtils';
import LocationPicker from '../components/LocationPicker';

export default function CarDetail() {
  const { id } = useParams();
  const routerLocation = useLocation();
  const navigate = useNavigate();

  const searchQuery = new URLSearchParams(routerLocation.search);
  const carriedSearch = routerLocation.state?.search || {};
  const { isAuthenticated, isCustomer } = useAuthStore();

  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [favorite, setFavorite] = useState(false);



  const [booking, setBooking] = useState({
    start_date: '',
    end_date: '',
    pickup_time: '09:00',
    return_time: '18:00',
    pickup_location: '',
  });
  const [searchParams, setSearchParams] = useState(() => ({
    location:
      carriedSearch.search ||
      carriedSearch.location ||
      searchQuery.get('location') ||
      '',
    startDate:
      carriedSearch.startDate ||
      searchQuery.get('startDate') ||
      '',
    endDate:
      carriedSearch.endDate ||
      searchQuery.get('endDate') ||
      '',
    pickupTime:
      carriedSearch.pickup_time ||
      carriedSearch.pickupTime ||
      searchQuery.get('pickupTime') ||
      '09:00',
    returnTime:
      carriedSearch.return_time ||
      carriedSearch.returnTime ||
      searchQuery.get('returnTime') ||
      '18:00',
    minPrice:
      carriedSearch.min_price ||
      carriedSearch.minPrice ||
      searchQuery.get('minPrice') ||
      '',
    maxPrice:
      carriedSearch.max_price ||
      carriedSearch.maxPrice ||
      searchQuery.get('maxPrice') ||
      '',
    latitude:
      carriedSearch.latitude ||
      searchQuery.get('latitude') ||
      '',
    longitude:
      carriedSearch.longitude ||
      searchQuery.get('longitude') ||
      '',
    radius:
      carriedSearch.radius ||
      searchQuery.get('radius') ||
      10,
  }));
  
  useEffect(() => {
    carsAPI
      .getOne(id)
      .then((res) => setCar(res.data.data))
      .catch(() => {
        toast.error('السيارة غير موجودة');
        navigate('/cars');
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const images = car?.images?.length
    ? car.images.map((img) => getImageUrl(img.image_url))
    : [
        'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=85',
      ];

  const showPreviousImage = () => setActiveImage((current) => (current - 1 + images.length) % images.length);
  const showNextImage = () => setActiveImage((current) => (current + 1) % images.length);

  const days = useMemo(() => {
    if (!booking.start_date || !booking.end_date) return 0;

    return Math.max(
      0,
      differenceInDays(
        new Date(booking.end_date),
        new Date(booking.start_date)
      )
    );
  }, [booking.start_date, booking.end_date]);

  const price = Number(car?.price_per_day || 0);
  const total = days * price;

  const submitBooking = async (e) => {
    e.preventDefault();

    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    if (!isCustomer()) {
      toast.error('الحجز متاح للعملاء فقط');
      return;
    }

    if (
      !booking.start_date ||
      !booking.end_date ||
      !booking.pickup_location ||
      !booking.pickup_time ||
      !booking.return_time
    ) {
      toast.error('أكمل بيانات الحجز أولاً');
      return;
    }

    const pickupAt = new Date(
      `${booking.start_date}T${booking.pickup_time}`
    );

    const returnAt = new Date(
      `${booking.end_date}T${booking.return_time}`
    );

    if (
      Number.isNaN(pickupAt.getTime()) ||
      Number.isNaN(returnAt.getTime())
    ) {
      toast.error('التاريخ أو الوقت غير صحيح');
      return;
    }

    if (returnAt <= pickupAt) {
      toast.error('وقت الإرجاع يجب أن يكون بعد وقت الاستلام');
      return;
    }

    try {
      const reservationResponse = await reservationsAPI.create({
        car_id: id,
        ...booking,
      });
      const createdReservation = reservationResponse.data?.data;
      if (!createdReservation?.id) {
        throw new Error('لم يتم إنشاء رقم الحجز');
      }

      toast.success('تم إنشاء الحجز، انتقل الآن إلى الدفع');
      navigate(`/checkout/${createdReservation.id}`);
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'تعذر إنشاء الحجز'
      );
    }
  };
  const handleSearch = (e) => {
    e.preventDefault();
  
    if (
      searchParams.startDate &&
      searchParams.endDate &&
      searchParams.startDate > searchParams.endDate
    ) {
      toast.error('تاريخ التسليم يجب أن يكون بعد تاريخ الاستلام');
      return;
    }
  
    const query = new URLSearchParams(searchParams).toString();
    navigate(`/cars?${query}`);
  };
  
  if (loading) {
    return (
      <div
        dir="rtl"
        className="flex min-h-[70vh] items-center justify-center bg-[#faf9f7]"
      >
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-stone-200 border-t-[#c65345]" />
      </div>
    );
  }

  if (!car) return null;

  const hasSearchContext = Boolean(
    searchParams.location ||
    searchParams.startDate ||
    searchParams.endDate ||
    searchParams.latitude ||
    searchParams.longitude
  );

  return (
    
    <div
      dir="rtl"
      className="car-detail-page min-h-screen overflow-hidden bg-gradient-to-b from-[#faf9f7] via-white to-[#f7f7f5] pb-20 text-[#1d1d1f]"
    >
      {/* =====================================================
          Breadcrumb
      ====================================================== */}

      <div className="mx-auto flex w-[calc(100%-24px)] max-w-[1280px] items-center gap-2 py-5 text-xs text-stone-400 sm:w-[calc(100%-40px)] sm:py-7">
        <Link
          to="/"
          className="transition-colors hover:text-[#c65345]"
        >
          الرئيسية
        </Link>

        <ChevronRight
          size={15}
          className="rotate-180 text-stone-300"
        />

        <Link
          to="/cars"
          className="transition-colors hover:text-[#c65345]"
        >
          السيارات
        </Link>

        <ChevronRight
          size={15}
          className="rotate-180 text-stone-300"
        />

        <span className="font-semibold text-stone-700">
          {car.make} {car.model}
        </span>
      </div>

      {/* =====================================================
          Main
      ====================================================== */}

      <AdvertisementBanner placement="car_detail" carId={car.id} />

      {hasSearchContext && (
        <section
          className="car-search-summary"
          aria-label="تفاصيل البحث المستخدم"
        >
          <div className="car-search-summary-heading">
            <div>
              <span>بحثك الحالي</span>
              <h2>تفاصيل الاستئجار المطلوبة</h2>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/cars?${routerLocation.search.replace(/^\\?/, '')}`)}
              className="car-search-summary-edit"
            >
              تعديل البحث
            </button>
          </div>
          <LocationPicker
position={[
Number(searchParams.latitude) || 15.3694,
Number(searchParams.longitude) || 44.1910,
]}
onLocationChange={(location) => {
setSearchParams(prev => ({
...prev,
location: location.name,
latitude: location.latitude,
longitude: location.longitude,
radius: 10,
}));
}}
/>
          <div className="car-search-summary-grid">
            {searchParams.location && (
              <div className="car-search-summary-item">
                <MapPin size={18} />
                <span>الموقع</span>
                <strong>{searchParams.location}</strong>
              </div>
            )}

            {searchParams.startDate && (
              <div className="car-search-summary-item">
                <CalendarDays size={18} />
                <span>فترة الاستئجار</span>
                <strong>
                  {searchParams.startDate}
                  {searchParams.endDate
                    ? ` — ${searchParams.endDate}`
                    : ''}
                </strong>
              </div>
            )}

            {(searchParams.pickupTime || searchParams.returnTime) && (
              <div className="car-search-summary-item">
                <Clock3 size={18} />
                <span>الأوقات</span>
                <strong>
                  {searchParams.pickupTime || '09:00'}
                  {' — '}
                  {searchParams.returnTime || '18:00'}
                </strong>
              </div>
            )}

            {(searchParams.latitude && searchParams.longitude) && (
              <div className="car-search-summary-item">
                <MapPin size={18} />
                <span>الموقع الجغرافي</span>
                <strong>تم تحديده عبر GPS</strong>
              </div>
            )}
          </div>
        </section>
      )}

      <main className="car-detail-main mx-auto grid w-[calc(100%-24px)] max-w-[1280px] items-start gap-6 sm:w-[calc(100%-40px)] lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-7">
        {/* ===================================================
            Gallery
        ==================================================== */}

        <section className="car-detail-gallery detail-gallery-3d overflow-hidden rounded-[28px] border border-stone-200 bg-white p-2.5 shadow-[0_18px_50px_rgba(0,0,0,0.06)] sm:p-3.5">

          {/* Main Image */}

          <div
            className="detail-gallery-stage group relative h-[280px] overflow-hidden rounded-[20px] bg-stone-100 sm:h-[430px] lg:h-[580px]"
            aria-label="معرض صور السيارة"
            style={{
              backgroundImage: `linear-gradient(135deg, rgba(255,255,255,.18), rgba(12,25,40,.3)), url(${images[activeImage]})`,
              backgroundPosition: 'center',
              backgroundSize: 'cover',
            }}
          >
            <div className="detail-gallery-image-backdrop" aria-hidden="true" style={{ backgroundImage: `url(${images[activeImage]})` }} />
            <div className="detail-gallery-grid" />
            <div className="detail-gallery-glow" />

            <img
              src={images[activeImage]}
              alt={`${car.make} ${car.model}`}
              className="detail-gallery-main-image block h-full w-full object-contain transition-transform duration-700"
            />
            {images.length > 1 && <>
              <button type="button" className="detail-gallery-arrow detail-gallery-arrow-next" onClick={(e) => { e.stopPropagation(); showPreviousImage(); }} aria-label="الصورة السابقة"><ChevronRight size={22} /></button>
              <button type="button" className="detail-gallery-arrow detail-gallery-arrow-prev" onClick={(e) => { e.stopPropagation(); showNextImage(); }} aria-label="الصورة التالية"><ChevronLeft size={22} /></button>
            </>}

            <div className="detail-gallery-top-badge"><CheckCircle2 size={14} /> صور حقيقية للسيارة</div>
            <div className="detail-gallery-counter">{activeImage + 1} / {images.length}</div>

            {/* Favorite */}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (!isAuthenticated()) {
                  navigate('/login');
                  return;
                }

                setFavorite(!favorite);
              }}
              className="absolute left-3.5 top-3.5 flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/90 text-stone-700 shadow-lg backdrop-blur-md transition-all hover:scale-110 hover:bg-white sm:left-5 sm:top-5 sm:h-12 sm:w-12"
            >
              <Heart
                size={21}
                fill={favorite ? '#d65a4a' : 'none'}
                color={favorite ? '#d65a4a' : 'currentColor'}
              />
            </button>

            {/* Verified */}

            <div className="absolute bottom-3.5 right-3.5 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-2 text-[10px] font-bold text-emerald-700 shadow-xl backdrop-blur-md sm:bottom-5 sm:right-5 sm:px-4 sm:py-2.5 sm:text-xs">
              <CheckCircle2 size={15} />
              سيارة موثقة
            </div>
            <span className="detail-gallery-open-hint">استخدم الأسهم لاستعراض الصور</span>
          </div>
          <div className="detail-gallery-progress" aria-hidden="true"><span style={{ width: `${((activeImage + 1) / images.length) * 100}%` }} /></div>

          {/* Thumbnails */}


        </section>


        {/* ===================================================
            Booking Sidebar
        ==================================================== */}

        <aside className="car-detail-booking relative w-full rounded-[25px] border border-stone-200 bg-white p-5 shadow-[0_20px_55px_rgba(0,0,0,0.08)] sm:p-6 lg:sticky lg:top-[100px]">

          {/* Supplier */}

          <div className="mb-5 flex items-center gap-3 border-b border-stone-100 pb-5">

            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#262626] to-[#555] text-lg font-extrabold text-white shadow-md">
              {(car.supplier_name || 'م').slice(0, 1)}
            </div>

            <div className="min-w-0">
              <span className="mb-1 block text-[10px] text-stone-400">
                مورد موثوق
              </span>

              <strong className="block truncate text-sm text-stone-800">
                {car.supplier_name || 'مورد معتمد'}
              </strong>

              <small className="mt-1 flex items-center gap-1 text-[10px] text-stone-500">
                <Star
                  size={13}
                  fill="currentColor"
                  className="text-amber-500"
                />

                {car.average_rating || '4.8'} · تقييمات حقيقية
              </small>
            </div>
          </div>

          {/* Title */}

          <div className="mb-5">

            <span className="mb-2 inline-block rounded-full bg-[#f8eeeb] px-2.5 py-1 text-[10px] font-bold text-[#b24e40]">
              {car.category || 'سيارة مميزة'}
            </span>

            <h1 className="m-0 text-[28px] font-extrabold leading-tight tracking-tight text-stone-900 sm:text-[34px]">
              {car.make} {car.model}
            </h1>

            <p className="mt-2 text-xs leading-6 text-stone-500">
              كل ما تحتاجه لرحلة مريحة وآمنة.
            </p>
          </div>

          {/* Price */}

          <div className="mb-5 flex items-baseline gap-1.5 rounded-[17px] border border-stone-200 bg-stone-50 p-4">

            <small className="text-[10px] text-stone-400">
              تبدأ من
            </small>

            <strong className="text-[28px] font-extrabold tracking-tight text-stone-900">
              ${price}
            </strong>

            <span className="text-xs text-stone-500">
              / اليوم
            </span>
          </div>

          {/* Booking Form */}

          <form
            onSubmit={submitBooking}
            className="flex flex-col gap-3.5"
          >

            {/* Location */}

            <label className="flex flex-col gap-2 text-xs font-bold text-stone-700">

              <span className="flex items-center gap-1.5">
                <MapPin
                  size={16}
                  className="text-[#b94f42]"
                />
                موقع الاستلام
              </span>
              <LocationPicker
position={[
Number(searchParams.latitude) || 15.3694,
Number(searchParams.longitude) || 44.1910,
]}
onLocationChange={(location) => {
setSearchParams(prev => ({
...prev,
location: location.name,
latitude: location.latitude,
longitude: location.longitude,
radius: 10,
}));
}}
/>
              <input
                required
                value={booking.pickup_location}
                onChange={(e) =>
                  setBooking({
                    ...booking,
                    pickup_location: e.target.value,
                  })
                }
                placeholder="اكتب المدينة أو الموقع"
                className="h-12 w-full rounded-xl border border-stone-200 bg-white px-3.5 text-xs font-normal text-stone-800 outline-none transition-all placeholder:text-stone-400 focus:border-[#c75b4d] focus:ring-4 focus:ring-[#c65345]/10"
              />
            </label>

            {/* Dates */}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

              <label className="flex flex-col gap-2 text-xs font-bold text-stone-700">

                <span className="flex items-center gap-1.5">
                  <CalendarDays
                    size={16}
                    className="text-[#b94f42]"
                  />
                  تاريخ الاستلام
                </span>

                <input
                  required
                  type="date"
                  min={new Date()
                    .toISOString()
                    .split('T')[0]}
                  value={booking.start_date}
                  onChange={(e) =>
                    setBooking({
                      ...booking,
                      start_date: e.target.value,
                    })
                  }
                  className="h-12 w-full rounded-xl border border-stone-200 bg-white px-3 text-xs text-stone-800 outline-none transition-all focus:border-[#c75b4d] focus:ring-4 focus:ring-[#c65345]/10"
                />
              </label>

              <label className="flex flex-col gap-2 text-xs font-bold text-stone-700">

                <span className="flex items-center gap-1.5">
                  <CalendarDays
                    size={16}
                    className="text-[#b94f42]"
                  />
                  تاريخ الإرجاع
                </span>

                <input
                  required
                  type="date"
                  min={
                    booking.start_date ||
                    new Date()
                      .toISOString()
                      .split('T')[0]
                  }
                  value={booking.end_date}
                  onChange={(e) =>
                    setBooking({
                      ...booking,
                      end_date: e.target.value,
                    })
                  }
                  className="h-12 w-full rounded-xl border border-stone-200 bg-white px-3 text-xs text-stone-800 outline-none transition-all focus:border-[#c75b4d] focus:ring-4 focus:ring-[#c65345]/10"
                />
              </label>
            </div>

            {/* Times */}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

              <label className="flex flex-col gap-2 text-xs font-bold text-stone-700">

                <span className="flex items-center gap-1.5">
                  <Clock3
                    size={16}
                    className="text-[#b94f42]"
                  />
                  وقت الاستلام
                </span>

                <input
                  required
                  type="time"
                  value={booking.pickup_time}
                  onChange={(e) =>
                    setBooking({
                      ...booking,
                      pickup_time: e.target.value,
                    })
                  }
                  className="h-12 w-full rounded-xl border border-stone-200 bg-white px-3 text-xs text-stone-800 outline-none transition-all focus:border-[#c75b4d] focus:ring-4 focus:ring-[#c65345]/10"
                />
              </label>

              <label className="flex flex-col gap-2 text-xs font-bold text-stone-700">

                <span className="flex items-center gap-1.5">
                  <Clock3
                    size={16}
                    className="text-[#b94f42]"
                  />
                  وقت الإرجاع
                </span>

                <input
                  required
                  type="time"
                  value={booking.return_time}
                  onChange={(e) =>
                    setBooking({
                      ...booking,
                      return_time: e.target.value,
                    })
                  }
                  className="h-12 w-full rounded-xl border border-stone-200 bg-white px-3 text-xs text-stone-800 outline-none transition-all focus:border-[#c75b4d] focus:ring-4 focus:ring-[#c65345]/10"
                />
              </label>
            </div>

            {/* Total */}

            {days > 0 && (
              <div className="flex items-center justify-between rounded-[13px] border border-dashed border-[#ddd2ce] bg-[#faf8f6] px-4 py-3.5">

                <span className="text-xs text-stone-500">
                  {days} أيام × ${price}
                </span>

                <strong className="text-lg font-extrabold text-stone-800">
                  ${total}
                </strong>
              </div>
            )}

            {/* CTA */}

            <button
              type="submit"
              className="mt-1 flex min-h-[54px] items-center justify-center gap-2 rounded-[14px] border-0 bg-gradient-to-br from-[#c65345] to-[#a94035] text-xs font-extrabold text-white shadow-[0_10px_25px_rgba(198,83,69,0.22)] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(198,83,69,0.28)] active:translate-y-0"
            >
              احجز الآن 

              <ChevronRight
                size={18}
                className="rotate-180"
              />
            </button>
          </form>
        

          {/* Safe */}

          <div className="mt-5 flex items-start gap-2.5 border-t border-stone-100 pt-4">

            <ShieldCheck
              size={19}
              className="flex-shrink-0 text-emerald-600"
            />

            <span className="flex flex-col gap-1">
              <strong className="text-xs text-stone-700">
                حجزك محمي
              </strong>

              <small className="text-[10px] leading-5 text-stone-400">
                لا توجد رسوم مخفية. تأكيد واضح قبل الدفع.
              </small>
            </span>
          </div>
        </aside>

      {/* =====================================================
          Car Details
      ====================================================== */}

      <section className="car-detail-specs mx-auto mt-6 w-[calc(100%-24px)] max-w-[1280px] rounded-[26px] border border-stone-200 bg-white p-5 shadow-[0_12px_40px_rgba(0,0,0,0.045)] sm:mt-8 sm:w-[calc(100%-40px)] sm:p-8">

        {/* Header */}

        <div className="mb-7 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">

          <div>
            <span className="mb-1.5 block text-[11px] font-extrabold tracking-wide text-[#b65042]">
              تفاصيل السيارة
            </span>

            <h2 className="m-0 text-[21px] font-extrabold tracking-tight text-stone-900 sm:text-[25px]">
              كل التفاصيل قبل أن تقرر
            </h2>
          </div>

          <div className="specs-header-badge">
            <CheckCircle2 size={15} />
            <span>معلومات موثقة قبل الحجز</span>
          </div>
        </div>

        {/* Specifications */}

        <div className="grid grid-cols-1 overflow-hidden rounded-[18px] border border-stone-200 sm:grid-cols-2 lg:grid-cols-4">

          {/* Seats */}

          <div className="flex min-h-[100px] items-center gap-3.5 border-b border-stone-200 p-5 lg:border-b-0 lg:border-l">
            <Users
              size={24}
              className="flex-shrink-0 text-[#bd5547]"
            />

            <span className="flex flex-col gap-1.5 text-[11px] text-stone-400">
              المقاعد

              <strong className="text-sm text-stone-800">
                {car.seats || 5} ركاب
              </strong>
            </span>
          </div>

          {/* Transmission */}

          <div className="flex min-h-[100px] items-center gap-3.5 border-b border-stone-200 p-5 lg:border-b-0 lg:border-l">
            <Settings2
              size={24}
              className="flex-shrink-0 text-[#bd5547]"
            />

            <span className="flex flex-col gap-1.5 text-[11px] text-stone-400">
              ناقل الحركة

              <strong className="text-sm text-stone-800">
                {car.transmission === 'manual'
                  ? 'يدوي'
                  : 'أوتوماتيك'}
              </strong>
            </span>
          </div>

          {/* Fuel */}

          <div className="flex min-h-[100px] items-center gap-3.5 border-b border-stone-200 p-5 lg:border-b-0 lg:border-l">
            <Fuel
              size={24}
              className="flex-shrink-0 text-[#bd5547]"
            />

            <span className="flex flex-col gap-1.5 text-[11px] text-stone-400">
              نوع الوقود

              <strong className="text-sm text-stone-800">
                {car.fuel_type === 'diesel'
                  ? 'ديزل'
                  : 'بنزين'}
              </strong>
            </span>
          </div>

          {/* Mileage */}

          <div className="flex min-h-[100px] items-center gap-3.5 p-5">
            <Gauge
              size={24}
              className="flex-shrink-0 text-[#bd5547]"
            />

            <span className="flex flex-col gap-1.5 text-[11px] text-stone-400">
              الكيلومترات

              <strong className="text-sm text-stone-800">
                مفتوح
              </strong>
            </span>
          </div>
        </div>

        {/* Policies */}

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">

          {/* Policy 1 */}

          <div className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4">

            <CheckCircle2
              size={21}
              className="flex-shrink-0 text-emerald-600"
            />

            <span className="flex flex-col gap-1">
              <strong className="text-xs text-stone-700">
                تأمين شامل
              </strong>

              <small className="text-[10px] leading-5 text-stone-400">
                تغطية أساسية مشمولة في السعر
              </small>
            </span>
          </div>

          {/* Policy 2 */}

          <div className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4">

            <CheckCircle2
              size={21}
              className="flex-shrink-0 text-emerald-600"
            />

            <span className="flex flex-col gap-1">
              <strong className="text-xs text-stone-700">
                وقود واضح
              </strong>

              <small className="text-[10px] leading-5 text-stone-400">
                استلم وأعد السيارة بنفس المستوى
              </small>
            </span>
          </div>

          {/* Policy 3 */}

          <div className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4">

            <CheckCircle2
              size={21}
              className="flex-shrink-0 text-emerald-600"
            />

            <span className="flex flex-col gap-1">
              <strong className="text-xs text-stone-700">
                توصيل مرن
              </strong>

              <small className="text-[10px] leading-5 text-stone-400">
                اتفق مع المورد على موقع الاستلام
              </small>
            </span>
          </div>
        </div>
      </section>
      </main>
      
      <style dangerouslySetInnerHTML={{
        __html: `
        .car-detail-page { min-height: 100vh; padding: 24px 0 70px; background: var(--bg-base); color: var(--text-main); font-family: 'Cairo', 'Inter', sans-serif; }
        .car-detail-page *, .car-detail-page *::before, .car-detail-page *::after { box-sizing: border-box; }
        .car-detail-page h1, .car-detail-page h2, .car-detail-page h3, .car-detail-page p { margin: 0; }
        .car-detail-page button, .car-detail-page input { font-family: inherit; }
        .car-detail-page > div:first-child { max-width: 1200px; width: calc(100% - 40px); margin: 0 auto 18px; padding: 0; }
        .car-detail-main { display: grid !important; grid-template-columns: minmax(0, 1.35fr) minmax(340px, .65fr) !important; grid-template-areas: 'gallery booking' 'specs booking'; gap: 18px 24px !important; width: calc(100% - 40px) !important; max-width: 1200px !important; margin: 0 auto !important; align-items: start !important; }
        .car-detail-gallery { grid-area: gallery; min-width: 0; }
        .car-detail-booking { grid-area: booking; min-width: 0; }
        .car-detail-specs { grid-area: specs; min-width: 0; }
        .car-detail-gallery, .car-detail-booking, .car-detail-specs { border: 1px solid var(--border) !important; border-radius: var(--radius-lg) !important; background: var(--bg-white) !important; box-shadow: var(--shadow-md) !important; }
        .car-detail-gallery { padding: 14px !important; }
        .detail-gallery-stage { height: 320px !important; border-radius: 14px !important; background: linear-gradient(145deg, #eef3f8, #f9fbfd) !important; }
        .car-detail-booking { position: sticky; top: 82px; padding: 24px !important; }
        .car-detail-booking > div:first-child { display: flex; align-items: center; gap: 12px; margin: 0 0 22px; padding: 0 0 18px; border-bottom: 1px solid var(--border); }
        .car-detail-booking > div:first-child > div:first-child { width: 48px; height: 48px; flex: 0 0 48px; border-radius: 12px; }
        .car-detail-booking > div:first-child > div:last-child { min-width: 0; display: flex; flex-direction: column; gap: 3px; }
        .car-detail-booking > div:first-child span, .car-detail-booking > div:first-child strong, .car-detail-booking > div:first-child small { display: block; line-height: 1.5; }
        .car-detail-booking > div:nth-of-type(2) { margin-bottom: 20px; }
        .car-detail-booking > div:nth-of-type(2) span { display: inline-flex; margin-bottom: 8px; }
        .car-detail-booking > div:nth-of-type(2) h1 { display: block; font-size: 28px; line-height: 1.25; color: var(--primary); }
        .car-detail-booking > div:nth-of-type(2) p { display: block; margin-top: 8px; color: var(--text-muted); line-height: 1.7; }
        .car-detail-booking > div:nth-of-type(3) { display: flex; align-items: baseline; gap: 8px; margin-bottom: 20px; padding: 16px; border: 1px solid var(--border); border-radius: var(--radius-md); background: #f8f9fa; }
        .car-detail-booking > div:nth-of-type(3) small, .car-detail-booking > div:nth-of-type(3) strong, .car-detail-booking > div:nth-of-type(3) span { display: inline-block; }
        .car-detail-booking > div:nth-of-type(3) strong { color: var(--primary); font-size: 28px; line-height: 1; }
        .car-detail-booking form { display: flex; flex-direction: column; gap: 15px; }
        .car-detail-booking form label { display: flex; flex-direction: column; gap: 7px; color: var(--text-main); font-size: 13px; font-weight: 700; }
        .car-detail-booking form label span { display: flex; align-items: center; gap: 6px; }
        .car-detail-booking form input { width: 100%; height: 46px; padding: 0 13px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: #fff; color: var(--text-main); font-size: 13px; outline: none; transition: var(--transition); }
        .car-detail-booking form input:focus { border-color: var(--primary-light); box-shadow: 0 0 0 3px rgba(0,108,228,.1); }
        .car-detail-booking form > div { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .car-detail-booking form > div:has(strong) { display: flex; align-items: center; justify-content: space-between; min-height: 54px; padding: 12px 14px; border: 1px dashed #cfd6df; border-radius: var(--radius-sm); background: #fbfcfd; }
        .car-detail-booking form > div:has(strong) span, .car-detail-booking form > div:has(strong) strong { display: block; }
        .car-detail-booking form > button { width: 100%; min-height: 50px; border: 0; border-radius: var(--radius-sm); background: var(--secondary); color: #fff; font-size: 15px; font-weight: 800; cursor: pointer; transition: var(--transition); }
        .car-detail-booking form > button:hover { background: var(--secondary-hover); transform: translateY(-2px); }
        .car-detail-booking > div:last-child { display: flex; align-items: flex-start; gap: 9px; margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border); }
        .car-detail-booking > div:last-child strong, .car-detail-booking > div:last-child small { display: block; line-height: 1.6; }
        .car-detail-specs { width: 100% !important; max-width: none !important; margin: 0 !important; padding: 18px !important; border-radius: 20px !important; }
        .car-detail-specs > div:first-child { display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-bottom: 15px; }
        .car-detail-specs > div:first-child span, .car-detail-specs > div:first-child h2 { display: block; }
        .car-detail-specs > div:first-child h2 { font-size: 19px; color: var(--primary); }
        .specs-header-badge { display: inline-flex; align-items: center; gap: 6px; flex-shrink: 0; padding: 7px 10px; border: 1px solid #dcefe5; border-radius: 999px; color: #18704b; background: #f1fbf5; font-size: 10px; font-weight: 800; }
        .car-detail-specs > div:nth-child(2) { display: grid; grid-template-columns: repeat(4, 1fr); overflow: hidden; border: 1px solid var(--border); border-radius: 14px; background: #fbfcfd; }
        .car-detail-specs > div:nth-child(2) > div { min-height: 76px; display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-inline-start: 1px solid var(--border); }
        .car-detail-specs > div:nth-child(2) > div:first-child { border-inline-start: 0; }
        .car-detail-specs > div:nth-child(2) svg { width: 19px; height: 19px; padding: 4px; box-sizing: content-box; border-radius: 9px; color: #b65042; background: #fff1ed; }
        .car-detail-specs > div:nth-child(2) span { display: flex; flex-direction: column; gap: 3px; color: var(--text-muted); font-size: 10px; }
        .car-detail-specs > div:nth-child(2) strong { display: block; color: var(--text-main); font-size: 12px; }
        .car-detail-specs > div:nth-child(3) { display: grid; grid-template-columns: repeat(3, 1fr); gap: 9px; margin-top: 10px; }
        .car-detail-specs > div:nth-child(3) > div { display: flex; align-items: flex-start; gap: 8px; min-height: 64px; padding: 11px 12px; border: 1px solid #e7ecef; border-radius: 13px; background: linear-gradient(145deg, #fbfcfd, #f5f8fa); transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease; }
        .car-detail-specs > div:nth-child(3) > div:hover { transform: translateY(-2px); border-color: #cfe3db; box-shadow: 0 8px 18px rgba(23,58,82,.08); }
        .car-detail-specs > div:nth-child(3) svg { width: 17px; height: 17px; margin-top: 1px; flex-shrink: 0; }
        .car-detail-specs > div:nth-child(3) span { display: flex; flex-direction: column; gap: 3px; }
        .car-detail-specs > div:nth-child(3) strong, .car-detail-specs > div:nth-child(3) small { display: block; line-height: 1.5; }
        .car-detail-specs > div:nth-child(3) strong { font-size: 11px; }
        .car-detail-specs > div:nth-child(3) small { font-size: 9px; }
        .car-detail-page .car-search-summary { width: calc(100% - 40px); max-width: 1200px; margin: 20px auto; }
        .detail-gallery-3d { position: relative; overflow: hidden; transform: none; box-shadow: 0 18px 50px rgba(0,0,0,.06); }
        .detail-gallery-3d:hover { transform: none; box-shadow: 0 18px 50px rgba(0,0,0,.06); }
        .detail-gallery-stage { cursor: default; isolation: isolate; contain: paint; overflow: hidden; box-shadow: inset 0 0 0 1px rgba(255,255,255,.18); }
        .detail-gallery-image-backdrop { position: absolute; z-index: 0; inset: 0; background-position: center; background-size: cover; background-repeat: no-repeat; filter: blur(18px) saturate(1.12); opacity: .34; transform: scale(1.12); clip-path: inset(0 round 20px); transition: background-image .25s ease, opacity .25s ease; }
        .detail-gallery-main-image { position: relative; z-index: 2; width: 100%; height: 100%; object-fit: contain !important; object-position: center; padding: 22px; filter: saturate(1.04) contrast(1.02) drop-shadow(0 18px 24px rgba(12,25,40,.2)); animation: detailCarouselIn .55s ease-out; }
        .detail-gallery-arrow { position: absolute; z-index: 5; top: 50%; display: grid; place-items: center; width: 44px; height: 44px; border: 1px solid rgba(255,255,255,.55); border-radius: 50%; color: #fff; background: rgba(0,53,128,.78); box-shadow: 0 8px 20px rgba(0,0,0,.22); cursor: pointer; transform: translateY(-50%); transition: transform .2s ease, background .2s ease, box-shadow .2s ease; }
        .detail-gallery-arrow-prev { right: 16px; }
        .detail-gallery-arrow-next { left: 16px; }
        .detail-gallery-arrow:hover { background: var(--secondary); box-shadow: 0 10px 24px rgba(0,0,0,.28); transform: translateY(-50%) scale(1.08); }
        .detail-gallery-arrow:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
        .detail-gallery-stage::after { position: absolute; inset: 0; z-index: 1; content: ''; pointer-events: none; background: linear-gradient(180deg, rgba(8,18,30,.22), transparent 28%, transparent 60%, rgba(8,18,30,.48)); }
        .detail-gallery-grid { position: absolute; z-index: 2; inset: 0; opacity: .15; pointer-events: none; background-image: linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px); background-size: 34px 34px; mask-image: linear-gradient(135deg, transparent, #000 35%, transparent 85%); }
        .detail-gallery-glow { position: absolute; z-index: 1; width: 220px; height: 220px; right: 16%; bottom: -70px; border-radius: 50%; pointer-events: none; background: rgba(229,151,119,.42); filter: blur(42px); clip-path: inset(0 round 20px); }
        .detail-gallery-top-badge, .detail-gallery-counter { position: absolute; z-index: 4; top: 17px; display: inline-flex; align-items: center; gap: 6px; border: 1px solid rgba(255,255,255,.26); border-radius: 999px; padding: 8px 11px; color: #fff; background: rgba(8,18,30,.55); font-size: 10px; font-weight: 900; backdrop-filter: blur(10px); }
        .detail-gallery-top-badge { right: 17px; color: #b9f0ce; }
        .detail-gallery-counter { left: 17px; direction: ltr; }
        .detail-gallery-open-hint { position: absolute; z-index: 4; bottom: 17px; left: 17px; color: rgba(255,255,255,.76); font-size: 10px; text-shadow: 0 2px 8px #000; }
        .detail-gallery-progress { height: 3px; margin: 9px 8px 0; overflow: hidden; border-radius: 99px; background: #e9eef2; }
        .detail-gallery-progress span { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #006ce4, #008009); transition: width .35s ease; }
        @keyframes detailCarouselIn { from { opacity: .45; transform: scale(1.025); } to { opacity: 1; transform: scale(1); } }
        .detail-gallery-thumb { position: relative; transition: transform .22s ease, border-color .22s ease, box-shadow .22s ease; }
        .detail-gallery-thumb:hover { transform: translateY(-4px) scale(1.03); border-color: #df9a7b; box-shadow: 0 8px 16px rgba(25,43,64,.14); }
        .detail-lightbox { position: fixed; z-index: 5000; inset: 0; display: flex; align-items: center; justify-content: center; padding: 70px 9vw; background: rgba(7,14,24,.92); backdrop-filter: blur(18px); animation: detailFadeIn .2s ease-out; }
        .detail-lightbox-image { max-width: min(1100px, 90vw); max-height: 78vh; border: 1px solid rgba(255,255,255,.16); border-radius: 20px; object-fit: contain; box-shadow: 0 30px 100px rgba(0,0,0,.5); animation: detailImageIn .25s cubic-bezier(.23,1,.32,1); }
        .detail-lightbox-close, .detail-lightbox-nav { position: absolute; z-index: 2; display: grid; place-items: center; border: 1px solid rgba(255,255,255,.22); color: #fff; background: rgba(255,255,255,.1); cursor: pointer; backdrop-filter: blur(10px); transition: transform .18s ease, background .18s ease; }
        .detail-lightbox-close { top: 24px; right: 25px; width: 44px; height: 44px; border-radius: 50%; }
        .detail-lightbox-nav { top: 50%; width: 50px; height: 50px; border-radius: 16px; transform: translateY(-50%); }
        .detail-lightbox-prev { right: 3vw; }
        .detail-lightbox-next { left: 3vw; }
        .detail-lightbox-close:hover, .detail-lightbox-nav:hover { background: rgba(198,83,69,.85); transform: translateY(-50%) scale(1.08); }
        .detail-lightbox-close:hover { transform: scale(1.08); }
        .detail-lightbox-caption { position: absolute; right: 0; bottom: 28px; left: 0; text-align: center; color: rgba(255,255,255,.78); font-size: 12px; font-weight: 800; }
        @keyframes detailFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes detailImageIn { from { opacity: 0; transform: scale(.96); } to { opacity: 1; transform: scale(1); } }
        @media (max-width: 992px) { .detail-layout { flex-direction: column; } .booking-sidebar { width: 100% !important; position: static !important; } }
        @media (max-width: 992px) { .car-detail-main { grid-template-columns: 1fr !important; grid-template-areas: 'gallery' 'booking' 'specs' !important; } .car-detail-booking { position: static; } .detail-gallery-stage { height: 300px !important; } .car-detail-specs > div:nth-child(2) { grid-template-columns: repeat(2, 1fr); } .car-detail-specs > div:nth-child(2) > div { border-bottom: 1px solid var(--border); } .car-detail-specs > div:nth-child(3) { grid-template-columns: 1fr; } }
        @media (max-width: 640px) { .car-detail-page { padding-top: 10px; } .specs-header-badge { padding: 6px 8px; font-size: 9px; } .car-detail-specs > div:first-child h2 { font-size: 17px; } .car-detail-specs > div:nth-child(2) > div { min-height: 68px; padding: 10px; } .car-detail-specs > div:nth-child(3) { grid-template-columns: 1fr; } .detail-gallery-arrow { width: 38px; height: 38px; } .detail-gallery-main-image { padding: 12px; } .detail-gallery-image-backdrop { filter: blur(14px) saturate(1.08); opacity: .3; } .car-detail-main, .car-detail-specs, .car-detail-page .car-search-summary { width: calc(100% - 24px) !important; } .car-detail-main { gap: 14px !important; } .car-detail-gallery, .car-detail-booking, .car-detail-specs { padding: 16px !important; border-radius: var(--radius-md) !important; } .detail-gallery-open-hint { display: none; } .detail-lightbox { padding: 70px 16px; } .detail-lightbox-image { max-width: 94vw; max-height: 70vh; border-radius: 14px; } .detail-lightbox-nav { width: 42px; height: 42px; } .detail-lightbox-prev { right: 10px; } .detail-lightbox-next { left: 10px; } .detail-lightbox-close { top: 16px; right: 16px; } }
        @media (prefers-reduced-motion: reduce) { .detail-gallery-3d, .detail-gallery-thumb, .detail-lightbox, .detail-lightbox-image { transition: none; animation: none; } }
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
