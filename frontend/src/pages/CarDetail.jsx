import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
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
// import SearchFilter from '../components/SearchFilter';

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
      await reservationsAPI.create({
        car_id: id,
        ...booking,
      });

      toast.success('تم إرسال طلب الحجز');
      navigate('/my-reservations');
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
      className="min-h-screen overflow-hidden bg-gradient-to-b from-[#faf9f7] via-white to-[#f7f7f5] pb-20 text-[#1d1d1f]"
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

      <main className="mx-auto grid w-[calc(100%-24px)] max-w-[1280px] items-start gap-6 sm:w-[calc(100%-40px)] lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-7">
        {/* ===================================================
            Gallery
        ==================================================== */}

        <section className="overflow-hidden rounded-[28px] border border-stone-200 bg-white p-2.5 shadow-[0_18px_50px_rgba(0,0,0,0.06)] sm:p-3.5">

          {/* Main Image */}

          <div className="group relative h-[280px] overflow-hidden rounded-[20px] bg-stone-100 sm:h-[430px] lg:h-[580px]">

            <img
              src={images[activeImage]}
              alt={`${car.make} ${car.model}`}
              className="block h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
            />

            {/* Favorite */}

            <button
              type="button"
              onClick={() => {
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
          </div>

          {/* Thumbnails */}

          <div className="flex gap-2 overflow-x-auto px-1 pb-1 pt-3 [scrollbar-width:thin]">
            {images.map((img, index) => (
              <button
                key={img + index}
                type="button"
                onClick={() => setActiveImage(index)}
                className={`h-14 w-16 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all sm:h-16 sm:w-20 ${
                  activeImage === index
                    ? 'border-[#c65345] shadow-md'
                    : 'border-transparent hover:-translate-y-0.5'
                }`}
              >
                <img
                  src={img}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        </section>

        {/* ===================================================
            Booking Sidebar
        ==================================================== */}

        <aside className="relative w-full rounded-[25px] border border-stone-200 bg-white p-5 shadow-[0_20px_55px_rgba(0,0,0,0.08)] sm:p-6 lg:sticky lg:top-[100px]">

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
      </main>

      {/* =====================================================
          Car Details
      ====================================================== */}

      <section className="mx-auto mt-6 w-[calc(100%-24px)] max-w-[1280px] rounded-[26px] border border-stone-200 bg-white p-5 shadow-[0_12px_40px_rgba(0,0,0,0.045)] sm:mt-8 sm:w-[calc(100%-40px)] sm:p-8">

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
