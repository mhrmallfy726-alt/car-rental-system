import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle, Clock, Image as ImageIcon, MapPin, Phone, UserRound, Mail, Car, ShieldCheck } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminAPI } from '../../services/api';
import { getImageUrl } from '../../utils/imageUtils';

const statusText = { available: 'متاحة', reserved: 'محجوزة', maintenance: 'في الصيانة' };

export default function AdminCarDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    adminAPI.getCar(id).then((response) => {
      if (!cancelled) setCar(response.data?.data || null);
    }).catch((error) => {
      toast.error(error.response?.data?.message || 'تعذر تحميل تفاصيل السيارة');
      navigate('/admin/cars', { replace: true });
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, navigate]);

  const approve = async () => {
    if (!window.confirm('هل أنت متأكد من الموافقة على هذه السيارة؟')) return;
    setApproving(true);
    try {
      const response = await adminAPI.approveCar(id);
      setCar((current) => ({ ...current, ...(response.data?.data || {}), is_approved: true, status: 'available' }));
      toast.success('تمت الموافقة على السيارة بنجاح');
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذر الموافقة على السيارة');
    } finally { setApproving(false); }
  };

  if (loading) return <main className="admin-car-detail" dir="rtl"><div className="admin-car-loading">جاري تحميل تفاصيل السيارة...</div></main>;
  if (!car) return null;
  const images = Array.isArray(car.images) ? car.images : [];

  return <main className="admin-car-detail" dir="rtl">
    <div className="admin-car-detail-wrap">
      <Link to="/admin/cars" className="admin-car-back"><ArrowRight size={18} /> العودة إلى إدارة السيارات</Link>
      <header className="admin-car-hero"><div><span className="admin-car-kicker">مراجعة سيارة جديدة</span><h1>{car.make} {car.model}</h1><p>راجع بيانات السيارة والمورد قبل اعتمادها في المنصة.</p></div><span className={car.is_approved ? 'admin-car-status approved' : 'admin-car-status pending'}>{car.is_approved ? <><CheckCircle size={16} /> مفعّلة</> : <><Clock size={16} /> بانتظار الموافقة</>}</span></header>
      <section className="admin-car-layout">
        <div className="admin-car-main-card"><div className="admin-car-gallery">{images.length ? images.map((image) => <img key={image.id} src={image.image_url?.startsWith('http') ? image.image_url : getImageUrl(image.image_url)} alt={`${car.make} ${car.model}`} />) : <div className="admin-car-no-image"><ImageIcon size={38} /> لا توجد صور للسيارة</div>}</div><div className="admin-car-info"><h2><Car size={20} /> بيانات السيارة</h2><div className="admin-car-facts"><Fact label="الشركة والموديل" value={`${car.make} ${car.model}`} /><Fact label="سنة الصنع" value={car.year} /><Fact label="الفئة" value={car.category_name || 'غير محددة'} /><Fact label="رقم اللوحة" value={car.license_plate || 'غير مضاف'} /><Fact label="السعر اليومي" value={`$${car.price_per_day}`} /><Fact label="الحالة الحالية" value={statusText[car.status] || car.status || 'غير محددة'} /></div></div></div>
        <aside className="admin-car-side"><div className="admin-car-side-card"><h2><UserRound size={19} /> بيانات المورد</h2><div className="admin-car-contact"><strong>{car.supplier_name || 'غير معروف'}</strong><span><Mail size={15} /> {car.supplier_email || 'غير مضاف'}</span><span><Phone size={15} /> {car.supplier_phone || 'غير مضاف'}</span></div></div><div className="admin-car-side-card"><h2><MapPin size={19} /> موقع السيارة</h2><p>{car.showroom_name || 'المركز الرئيسي'}</p><span>{[car.showroom_city, car.showroom_address].filter(Boolean).join(' — ') || 'لم يتم تحديد العنوان'}</span></div><div className="admin-car-approval"><ShieldCheck size={24} /><div><strong>{car.is_approved ? 'السيارة معتمدة' : 'قرار المراجعة'}</strong><p>{car.is_approved ? 'تم اعتماد هذه السيارة وإتاحتها حسب حالتها.' : 'تأكد من صحة البيانات والصور قبل الموافقة.'}</p></div>{!car.is_approved && <button type="button" onClick={approve} disabled={approving}>{approving ? 'جاري الاعتماد...' : <><CheckCircle size={17} /> الموافقة على السيارة</>}</button>}</div></aside>
      </section>
    </div>
    <style>{styles}</style>
  </main>;
}

function Fact({ label, value }) { return <div><span>{label}</span><strong>{value || '—'}</strong></div>; }

const styles = `
.admin-car-detail{min-height:100vh;background:#f4f8f9;color:#173a52;padding:34px 22px 70px}.admin-car-detail-wrap{max-width:1180px;margin:0 auto}.admin-car-back{display:inline-flex;align-items:center;gap:7px;color:#526873;text-decoration:none;font-weight:850;font-size:13px;margin-bottom:18px}.admin-car-hero{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;padding:25px 27px;border-radius:22px;background:linear-gradient(120deg,#09263a,#124253);color:#fff;box-shadow:0 14px 32px rgba(16,60,79,.15)}.admin-car-kicker{color:#4df5c7;font-size:10px;font-weight:950}.admin-car-hero h1{margin:7px 0 5px;font-size:28px}.admin-car-hero p{margin:0;color:rgba(233,245,247,.68);font-size:12px}.admin-car-status{display:inline-flex;align-items:center;gap:6px;padding:8px 12px;border-radius:999px;font-size:11px;font-weight:900;white-space:nowrap}.admin-car-status.pending{background:#fff0bd;color:#745516}.admin-car-status.approved{background:#b9f9e9;color:#073e35}.admin-car-layout{display:grid;grid-template-columns:1.25fr .75fr;gap:18px;margin-top:18px}.admin-car-main-card,.admin-car-side-card,.admin-car-approval{background:#fff;border:1px solid #dce9ed;border-radius:20px;box-shadow:0 10px 26px rgba(19,61,80,.06)}.admin-car-gallery{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;padding:14px}.admin-car-gallery img{width:100%;height:190px;object-fit:cover;border-radius:14px;background:#edf3f5}.admin-car-no-image{grid-column:1/-1;height:190px;display:grid;place-items:center;align-content:center;gap:8px;color:#91a2aa;background:#f2f6f7;border-radius:14px}.admin-car-info{padding:6px 22px 23px}.admin-car-info h2,.admin-car-side-card h2{display:flex;align-items:center;gap:8px;color:#173a52;font-size:16px;margin:12px 0 16px}.admin-car-info h2 svg,.admin-car-side-card h2 svg{color:#0b8a73}.admin-car-facts{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.admin-car-facts div{padding:12px;border-radius:12px;background:#f6fafb}.admin-car-facts span,.admin-car-contact span,.admin-car-side-card>span{display:block;color:#8a9ca4;font-size:10px}.admin-car-facts strong{display:block;margin-top:5px;color:#2d4c5c;font-size:12px}.admin-car-side{display:grid;align-content:start;gap:18px}.admin-car-side-card{padding:20px}.admin-car-side-card p{margin:0 0 5px;color:#2d4c5c;font-weight:900}.admin-car-contact{display:grid;gap:10px}.admin-car-contact strong{color:#2d4c5c}.admin-car-contact span{display:flex;align-items:center;gap:7px}.admin-car-approval{display:flex;align-items:flex-start;flex-wrap:wrap;gap:10px;padding:20px;color:#08745f;background:#effbf8}.admin-car-approval>svg{flex:0 0 auto}.admin-car-approval strong{display:block;color:#08745f}.admin-car-approval p{margin:5px 0 0;color:#65827e;font-size:11px;line-height:1.6}.admin-car-approval button{width:100%;display:flex;align-items:center;justify-content:center;gap:7px;border:0;border-radius:11px;padding:12px;background:#087f68;color:#fff;font:inherit;font-size:12px;font-weight:900;cursor:pointer}.admin-car-approval button:disabled{opacity:.6;cursor:wait}.admin-car-loading{display:grid;place-items:center;min-height:60vh;color:#78909b}@media(max-width:800px){.admin-car-detail{padding:20px 12px 50px}.admin-car-hero{padding:20px;flex-direction:column}.admin-car-hero h1{font-size:23px}.admin-car-layout{grid-template-columns:1fr}.admin-car-gallery img{height:150px}.admin-car-facts{grid-template-columns:repeat(2,1fr)}}@media(max-width:460px){.admin-car-gallery{grid-template-columns:1fr}.admin-car-gallery img{height:190px}.admin-car-facts{grid-template-columns:1fr 1fr}.admin-car-detail h1{font-size:21px}}
`;
