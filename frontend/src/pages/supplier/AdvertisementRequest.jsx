import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CalendarDays, CheckCircle2, Clock3, FileText, Megaphone, Send, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { advertisementsAPI, carsAPI, paymentsAPI } from '../../services/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
const navy = '#173a52';
const gold = '#d4af37';
const muted = '#6c7a86';
const statusMap = {
  pending: { label: 'قيد المراجعة', color: '#a66a00', background: '#fff6df', icon: Clock3 },
  approved: { label: 'تم الاعتماد', color: '#18704b', background: '#e9f8f0', icon: CheckCircle2 },
  rejected: { label: 'مرفوض', color: '#a23a3a', background: '#fff0f0', icon: XCircle },
  cancelled: { label: 'ملغى', color: '#66737d', background: '#f0f2f4', icon: XCircle },
};

const initialForm = {
  car_id: '',
  title: '',
  description: '',
  ad_type: 'featured',
  placement: 'cars',
  requested_budget: '',
  duration_days: 7,
  start_date: '',
  end_date: '',
};
// const getToday = () => {
//   const date = new Date();

//   return [
//     date.getFullYear(),
//     String(date.getMonth() + 1).padStart(2, '0'),
//     String(date.getDate()).padStart(2, '0'),
//   ].join('-');
// };
// const calculateEndDate = (startDate, durationDays) => {
//   if (!startDate || !durationDays) return '';

//   const [year, month, day] = startDate
//     .split('-')
//     .map(Number);

//   const endDate = new Date(year, month - 1, day);

//   // -1 لأن تاريخ البداية محسوب ضمن عدد الأيام
//   endDate.setDate(
//     endDate.getDate() + Number(durationDays) - 1
//   );

//   const endYear = endDate.getFullYear();
//   const endMonth = String(
//     endDate.getMonth() + 1
//   ).padStart(2, '0');
//   const endDay = String(
//     endDate.getDate()
//   ).padStart(2, '0');

//   return `${endYear}-${endMonth}-${endDay}`;
// };
const parseDate = (value) => {
  if (!value) return null;

  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const formatDate = (date) => {
  if (!date) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const getToday = () => {
  const date = new Date();

  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
};

const calculateEndDate = (startDate, durationDays) => {
  if (!startDate || !durationDays) return '';

  const date = parseDate(startDate);
  date.setDate(date.getDate() + Number(durationDays) - 1);

  return formatDate(date);
};
export default function AdvertisementRequest() {
  const [cars, setCars] = useState([]);
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [pricing, setPricing] = useState(null);
  const [payingId, setPayingId] = useState(null);
  const today = getToday();
const startDateObject = parseDate(form.start_date);
const endDateObject = parseDate(form.end_date);

  const selectedCar = useMemo(() => cars.find((car) => String(car.id) === String(form.car_id)), [cars, form.car_id]);

  const loadData = async () => {
    setLoading(true);
  
    try {
      const [carsResponse, requestsResponse, pricingResponse] = await Promise.all([
        carsAPI.getMyCars(),
        advertisementsAPI.getMyRequests(),
        advertisementsAPI.getPricing(),
      ]);
  
      setCars(carsResponse.data?.data || []);
      setRequests(requestsResponse.data?.data || []);
      setPricing(pricingResponse.data?.data || null);
    } catch (error) {
      console.error('Advertisement load error:', error);
  
      toast.error(
        error.response?.data?.message ||
        'تعذر تحميل بيانات الإعلانات'
      );
    } finally {
      setLoading(false);
    }
  };
  // const loadData = async () => {
  //   setLoading(true);
  
  //   try {
  //     const carsResponse = await carsAPI.getMyCars();
  
  //     console.log('Cars response:', carsResponse);
  //     console.log('Cars data:', carsResponse.data);
  //     console.log('Cars array:', carsResponse.data?.data);
  
  //     const carsList = Array.isArray(carsResponse.data?.data)
  //       ? carsResponse.data.data
  //       : Array.isArray(carsResponse.data)
  //         ? carsResponse.data
  //         : Array.isArray(carsResponse.data?.cars)
  //           ? carsResponse.data.cars
  //           : [];
  
  //     setCars(carsList);
  
  //     // اجلب الطلبات بشكل منفصل مؤقتًا
  //     try {
  //       const requestsResponse =
  //         await advertisementsAPI.getMyRequests();
  
  //       setRequests(requestsResponse.data?.data || []);
      setPricing(pricingResponse.data?.data || null);
  //     } catch (requestsError) {
  //       console.error('Requests error:', requestsError);
  //       setRequests([]);
  //     }
  //   } catch (error) {
  //     console.error('Cars error:', error);
  
  //     toast.error(
  //       error.response?.data?.message ||
  //       'تعذر تحميل سيارات المورد'
  //     );
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  

  useEffect(() => {
    const timer = window.setTimeout(() => { loadData(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const updateField = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('اختر صورة JPG أو PNG أو WEBP');
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم الصورة يجب ألا يتجاوز 5 ميجابايت');
      event.target.value = '';
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const submitRequest = async (event) => {
    event.preventDefault();
    if (!form.car_id || !form.title.trim()) return toast.error('اختر السيارة وأدخل عنوان الإعلان أولاً');
    if (!form.start_date) {
      toast.error('اختر تاريخ البداية');
      return;
    }
    
    if (!form.duration_days || Number(form.duration_days) < 1) {
      toast.error('المدة يجب أن تكون يومًا واحدًا على الأقل');
      return;
    }
    
    const calculatedEndDate = calculateEndDate(
      form.start_date,
      form.duration_days
    );
    
    if (form.end_date !== calculatedEndDate) {
      toast.error('تاريخ النهاية لا يطابق المدة المحددة');
      return;
    }
    
    if (parseDate(form.start_date) < today) {
      toast.error('لا يمكن اختيار تاريخ بداية قديم');
      return;
    }
    
    if (parseDate(form.end_date) < parseDate(form.start_date)) {
      toast.error('تاريخ النهاية غير صحيح');
      return;
    }
    if (!pricing?.advertisement_price_per_day) return toast.error('تعذر تحميل سعر الإعلان من الإدارة');
    setSubmitting(true);
    try {
      const formData = new FormData();

      Object.entries({
        ...form,
        requested_budget: Number(pricing?.advertisement_price_per_day || 0),
        price_per_day: Number(pricing?.advertisement_price_per_day || 0),
        start_time: pricing?.advertisement_start_time || '',
        end_time: pricing?.advertisement_end_time || '',
        duration_days: Number(form.duration_days),
        start_date: form.start_date,
        end_date: form.end_date,
      }).forEach(([key, value]) => {
        formData.append(key, value ?? '');
      });

      if (imageFile) {
        formData.append('image', imageFile);
      }

      await advertisementsAPI.createRequest(formData);
      toast.success('تم إرسال طلب الإعلان للمراجعة');
      setForm(initialForm);
      setImageFile(null);
      setImagePreview('');
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذر إرسال الطلب');
    } finally {
      setSubmitting(false);
    }
  };

  const payForAdvertisement = async (request) => {
    if (!request.advertisement_id) return toast.error('الإعلان غير جاهز للدفع، يرجى تحديث الصفحة');
    setPayingId(request.id);
    try {
      await paymentsAPI.advertisementCheckout({ advertisement_id: request.advertisement_id, currency: pricing?.currency || 'YER', payment_method: 'card' });
      toast.success('تم الدفع وبدأ نشر الإعلان');
      await loadData();
    } catch (error) { toast.error(error.response?.data?.message || 'تعذر دفع الإعلان'); }
    finally { setPayingId(null); }
  };

  return (
    <main dir="rtl" style={{ minHeight: '100vh', background: '#f7f8fa', padding: '32px 24px 64px' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 26 }}>
          <div><Link to="/supplier/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: muted, textDecoration: 'none', fontSize: 13, fontWeight: 700 }}><ArrowRight size={15} /> العودة للوحة المورد</Link><h1 style={{ margin: '14px 0 6px', color: navy, fontSize: 32, fontWeight: 900 }}>طلب إعلان جديد</h1><p style={{ margin: 0, color: muted, lineHeight: 1.7 }}>قدّم طلبك، وسيتولى فريق الإدارة مراجعة التفاصيل قبل النشر.</p></div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 14, background: '#fff', border: '1px solid #e7eaee', color: navy, fontWeight: 800 }}><Megaphone size={20} color={gold} /> مساحة ظهور تساعد العميل على اكتشاف عرضك</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(280px, 0.8fr)', gap: 22, alignItems: 'start' }}>
          <form onSubmit={submitRequest} style={{ background: '#fff', borderRadius: 20, border: '1px solid #e7eaee', boxShadow: '0 14px 36px rgba(23,58,82,0.07)', padding: 26 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}><div style={{ width: 42, height: 42, display: 'grid', placeItems: 'center', borderRadius: 13, color: '#fff', background: navy }}><FileText size={21} /></div><div><h2 style={{ margin: 0, color: navy, fontSize: 21 }}>تفاصيل الطلب</h2><span style={{ color: muted, fontSize: 13 }}>أكمل الحقول الأساسية ليصل الطلب بوضوح.</span></div></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
              <label style={{ gridColumn: '1 / -1', color: navy, fontWeight: 800, fontSize: 14 }}>السيارة المعنية
                <select name="car_id" value={form.car_id} onChange={updateField} style={fieldStyle} required><option value="">اختر سيارة من أسطولك</option>{cars.map((car) => <option value={car.id} key={car.id}>{car.make} {car.model} — {car.year}</option>)}</select>
              </label>
              <label style={{ gridColumn: '1 / -1', color: navy, fontWeight: 800, fontSize: 14 }}>عنوان الإعلان
                <input name="title" value={form.title} onChange={updateField} placeholder="مثال: عرض نهاية الأسبوع على تويوتا كامري" style={fieldStyle} required />
              </label>
              <label style={{ gridColumn: '1 / -1', color: navy, fontWeight: 800, fontSize: 14 }}>وصف مختصر
                <textarea name="description" value={form.description} onChange={updateField} placeholder="وضح ما سيجده العميل في العرض" style={{ ...fieldStyle, minHeight: 100, resize: 'vertical' }} />
              </label>
              <label style={{ gridColumn: '1 / -1', color: navy, fontWeight: 800, fontSize: 14 }}>صورة الإعلان
                <input
                  name="image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  style={fieldStyle}
                />
                <span style={{ display: 'block', marginTop: 7, color: muted, fontSize: 12 }}>اختر صورة من الهاتف أو الكمبيوتر، بحد أقصى 5 ميجابايت.</span>
                {imagePreview && <img src={imagePreview} alt="معاينة صورة الإعلان" style={{ display: 'block', width: '100%', maxHeight: 190, objectFit: 'cover', marginTop: 10, borderRadius: 13 }} />}
              </label>
              <label style={{ color: navy, fontWeight: 800, fontSize: 14 }}>نوع الإعلان
                <select name="ad_type" value={form.ad_type} onChange={updateField} style={fieldStyle}><option value="featured">إعلان مميز</option><option value="urgent">إعلان عاجل</option><option value="main">إعلان رئيسي</option></select>
              </label>
              <label style={{ color: navy, fontWeight: 800, fontSize: 14 }}>مكان الظهور
                <select name="placement" value={form.placement} onChange={updateField} style={fieldStyle}><option value="cars">قائمة السيارات</option><option value="home">الصفحة الرئيسية</option><option value="car_detail">تفاصيل السيارة</option><option value="all_public">كل الصفحات العامة</option></select>
              </label>
              <label style={{ color: navy, fontWeight: 800, fontSize: 14 }}>سعر الإعلان اليومي
                <input value={pricing?.advertisement_price_per_day || 'جاري التحميل...'} readOnly type="text" style={{ ...fieldStyle, background: '#f4f7f9' }} />
              </label>
              <div style={{ color: navy, fontWeight: 800, fontSize: 14, paddingTop: 8 }}>إجمالي الطلب
                <div style={{ ...fieldStyle, marginTop: 8, background: '#fbf7ec' }}>{pricing ? `${(Number(pricing.advertisement_price_per_day || 0) * Number(form.duration_days || 0)).toLocaleString()} ${pricing.currency || 'YER'}` : 'جاري الحساب...'}</div>
              </div>
              <div style={{ gridColumn: '1 / -1', padding: 12, borderRadius: 11, background: '#eef7fb', color: navy, fontSize: 13 }}>وقت الظهور اليومي: <strong>{pricing?.advertisement_start_time || '--:--'} - {pricing?.advertisement_end_time || '--:--'}</strong></div>
              <label style={{ color: navy, fontWeight: 800, fontSize: 14 }}>المدة بالأيام 
              <input name="duration_days" type="number" min="1" max="365" value={form.duration_days} onChange={(event) => { const durationDays = Number(event.target.value); const endDate = calculateEndDate(form.start_date, durationDays); setForm((current) => ({ ...current, duration_days: durationDays, end_date: endDate })); }} style={fieldStyle} required />
              </label>
              <label style={{ color: navy, fontWeight: 800, fontSize: 14 }}>تاريخ البداية 
              <DatePicker selected={startDateObject} onChange={(date) => { const startDate = formatDate(date); const endDate = calculateEndDate(startDate, form.duration_days); setForm((current) => ({ ...current, start_date: startDate, end_date: endDate })); }} minDate={today} dateFormat="dd/MM/yyyy" placeholderText="اختر تاريخ البداية" className="modern-date-input" calendarClassName="modern-calendar" wrapperClassName="date-picker-full-width" showPopperArrow={false} isClearable />              </label>
              <label style={{ color: navy, fontWeight: 800, fontSize: 14 }}>تاريخ النهاية 
              <DatePicker selected={endDateObject} onChange={(date) => { if (startDateObject && date && date < startDateObject) { toast.error('تاريخ النهاية يجب أن يكون بعد تاريخ البداية'); return; } setForm((current) => ({ ...current, end_date: formatDate(date) })); }} minDate={startDateObject || today} dateFormat="dd/MM/yyyy" placeholderText="اختر تاريخ النهاية" className="modern-date-input" calendarClassName="modern-calendar" wrapperClassName="date-picker-full-width" showPopperArrow={false} isClearable />              </label>
            </div>
            {selectedCar && <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 18, padding: 12, borderRadius: 12, background: '#fbf7ec', color: navy, fontSize: 13 }}><CalendarDays size={17} color={gold} /> سيتم ربط الطلب بـ {selectedCar.make} {selectedCar.model} بسعر {selectedCar.price_per_day} لليوم.</div>}
            <button type="submit" disabled={submitting || loading} style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 22, border: 0, borderRadius: 13, padding: '14px 20px', background: navy, color: '#fff', fontWeight: 900, cursor: submitting ? 'wait' : 'pointer' }}>{submitting ? 'جاري إرسال الطلب...' : 'إرسال طلب الإعلان'} <Send size={17} /></button>
          </form>
          <section style={{ background: '#fff', borderRadius: 20, border: '1px solid #e7eaee', boxShadow: '0 14px 36px rgba(23,58,82,0.07)', padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}><h2 style={{ margin: 0, color: navy, fontSize: 20 }}>طلباتك السابقة</h2><span style={{ color: gold, fontWeight: 900 }}>{requests.length}</span></div>
            {loading ? <p style={{ color: muted }}>جاري التحميل...</p> : requests.length === 0 ? <div style={{ padding: '34px 10px', color: muted, textAlign: 'center', lineHeight: 1.8 }}>لا توجد طلبات إعلانية حتى الآن.<br />ابدأ من النموذج المجاور.</div> : <div style={{ display: 'grid', gap: 12 }}>{requests.map((request) => { const status = statusMap[request.status] || statusMap.pending; const Icon = status.icon; return <article key={request.id} style={{ padding: 14, borderRadius: 14, border: '1px solid #edf0f2', background: '#fcfcfd' }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'start' }}><div><h3 style={{ margin: 0, color: navy, fontSize: 15 }}>{request.title}</h3><p style={{ margin: '5px 0 0', color: muted, fontSize: 12 }}>{request.car_make} {request.car_model}</p></div><span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 8px', borderRadius: 999, color: status.color, background: status.background, fontSize: 11, fontWeight: 900 }}><Icon size={13} />{status.label}</span></div>{request.reviewer_note && <p style={{ margin: '10px 0 0', color: muted, lineHeight: 1.6, fontSize: 12 }}>ملاحظة الإدارة: {request.reviewer_note}</p>}{request.status === 'approved' && request.payment_status !== 'paid' && request.advertisement_id && <button type="button" onClick={() => payForAdvertisement(request)} disabled={payingId === request.id} style={{ marginTop: 12, border: 0, borderRadius: 10, padding: '10px 14px', background: navy, color: '#fff', fontWeight: 800 }}>{payingId === request.id ? 'جاري الدفع...' : `دفع ${Number(request.total_price || 0).toLocaleString()} ${pricing?.currency || 'YER'}`}</button>}</article>; })}</div>}
          </section>
        </div>
      </div>
    </main>
  );
}
const fieldStyle = {
  display: 'block',
  width: '100%',
  boxSizing: 'border-box',
  marginTop: 8,
  padding: '12px 13px',
  borderRadius: 11,
  border: '1px solid #dfe5e9',
  background: '#fff',
  color: '#243746',
  font: 'inherit',
  outline: 'none',
};
