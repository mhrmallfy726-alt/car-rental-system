import { useCallback, useEffect, useState } from 'react';
import { Car, CheckCircle, Clock, Eye, Image as ImageIcon, Percent, RefreshCw, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminAPI } from '../../services/api';
import AdminSidebar from '../../components/AdminSidebar';
import { getImageUrl } from '../../utils/imageUtils';

export default function AdminCars() {
  const navigate = useNavigate();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [filter, setFilter] = useState('all');
  const [approvingId, setApprovingId] = useState(null);

  const fetchCars = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await adminAPI.getCars();
      setCars(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (error) {
      const message = error.response?.data?.message || 'تعذر الاتصال بخدمة السيارات';
      setErrorMessage(message);
      toast.error(message);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCars(); }, [fetchCars]);

  const handleApprove = async (id) => {
    if (!window.confirm('هل أنت متأكد من الموافقة على هذه السيارة؟')) return;
    setApprovingId(id);
    try {
      const response = await adminAPI.approveCar(id);
      setCars((current) => current.map((car) => car.id === id ? { ...car, ...(response.data?.data || {}), is_approved: true, status: 'available' } : car));
      toast.success('تمت الموافقة على السيارة بنجاح');
    } catch (error) {
      toast.error(error.response?.data?.message || 'فشل تنفيذ الموافقة');
    } finally { setApprovingId(null); }
  };

  const filtered = filter === 'all' ? cars : filter === 'pending' ? cars.filter((car) => !car.is_approved) : cars.filter((car) => car.is_approved);
  const pendingCount = cars.filter((car) => !car.is_approved).length;

  return <main className="admin-cars-page" dir="rtl">
    <div className="admin-cars-shell"><AdminSidebar /><section className="admin-cars-content">
      <header className="admin-cars-header"><div><span className="admin-cars-kicker">إدارة الأسطول</span><h1>إدارة السيارات</h1><p>راجع السيارات المضافة واعتمدها قبل ظهورها في المنصة.</p></div><div className="admin-cars-header-actions"><span className="admin-pending-count">{pendingCount} بانتظار الموافقة</span><button type="button" onClick={fetchCars} disabled={loading}><RefreshCw size={15} className={loading ? 'spin' : ''} /> تحديث</button></div></header>
      <nav className="admin-cars-filters" aria-label="تصفية السيارات">{[['all', 'الكل'], ['pending', 'بانتظار الموافقة'], ['approved', 'مفعّلة']].map(([value, label]) => <button type="button" key={value} onClick={() => setFilter(value)} className={filter === value ? 'active' : ''}>{label}{value === 'pending' && ` (${pendingCount})`}</button>)}</nav>
      {loading ? <div className="admin-cars-state"><span className="admin-loader" /> جاري تحميل السيارات...</div> : errorMessage ? <div className="admin-cars-state error"><Car size={38} /><h2>تعذر تحميل السيارات</h2><p>{errorMessage}</p><button type="button" onClick={fetchCars}><RefreshCw size={16} /> إعادة المحاولة</button></div> : filtered.length === 0 ? <div className="admin-cars-state"><Car size={38} /><h2>لا توجد سيارات</h2><p>لا توجد سيارات ضمن التصنيف المحدد.</p></div> : <>
        <section className="admin-mobile-car-cards">{filtered.map((car) => <CarCard key={car.id} car={car} approving={approvingId === car.id} onApprove={handleApprove} onDetails={() => navigate(`/admin/cars/${car.id}`, { state: { car } })} />)}</section>
        <section className="admin-cars-table-wrap"><table className="admin-cars-table"><thead><tr><th>الصورة</th><th>السيارة</th><th>المورد</th><th>السعر/يوم</th><th>الحالة</th><th>التفاصيل والإجراء</th></tr></thead><tbody>{filtered.map((car) => <tr key={car.id}><td><CarImage car={car} /></td><td className="car-name">{car.make} {car.model}<small>{car.year || '—'}</small></td><td>{car.supplier_name || 'غير معروف'}</td><td className="price">${car.price_per_day}</td><td><Status approved={car.is_approved} /></td><td><Link className="details-link" to={`/admin/cars/${car.id}`} state={{ car }}><Eye size={14} /> التفاصيل</Link>{!car.is_approved && <ApproveButton approving={approvingId === car.id} onClick={() => handleApprove(car.id)} />}</td></tr>)}</tbody></table></section>
      </>}
    </section></div>
    <style>{styles}</style>
  </main>;
}

function CarCard({ car, approving, onApprove, onDetails }) {
  return <article className="admin-mobile-car-card"><div className="admin-mobile-car-image"><CarImage car={car} large />{!car.is_approved && <span className="pending-badge"><Clock size={13} /> بانتظار الموافقة</span>}</div><div className="admin-mobile-car-body"><div className="admin-mobile-car-title"><div><h2>{car.make} {car.model}</h2><small>{car.year || 'سنة غير محددة'} · {car.supplier_name || 'مورد غير معروف'}</small></div><Status approved={car.is_approved} /></div><div className="admin-mobile-car-facts"><span><b>السعر اليومي</b>${car.price_per_day || 0}</span><span><b>الفئة</b>{car.category_name || 'غير محددة'}</span><span><b>اللوحة</b>{car.license_plate || 'غير مضافة'}</span></div><div className="admin-mobile-car-actions"><button type="button" onClick={onDetails}><Eye size={15} /> التفاصيل</button>{!car.is_approved && <button type="button" className="approve" disabled={approving} onClick={() => onApprove(car.id)}>{approving ? 'جاري...' : <><CheckCircle size={15} /> موافقة</>}</button>}</div></div></article>;
}

function CarImage({ car, large = false }) {
  const src = car.primary_image ? (car.primary_image.startsWith('http') ? car.primary_image : getImageUrl(car.primary_image)) : '';
  return src ? <img className={large ? 'large-car-img' : 'table-car-img'} src={src} alt={`${car.make} ${car.model}`} onError={(event) => { event.currentTarget.style.display = 'none'; event.currentTarget.nextElementSibling.style.display = 'grid'; }} /> : <span className={large ? 'large-car-placeholder' : 'table-car-placeholder'}><ImageIcon size={large ? 34 : 18} /></span>;
}
function Status({ approved }) { return approved ? <span className="status approved"><CheckCircle size={13} /> مفعّلة</span> : <span className="status pending"><Clock size={13} /> بانتظار الموافقة</span>; }
function ApproveButton({ approving, onClick }) { return <button type="button" className="approve-table" disabled={approving} onClick={onClick}>{approving ? 'جاري...' : <><CheckCircle size={14} /> موافقة</>}</button>; }

const styles = `
.admin-cars-page{min-height:100vh;padding:34px 22px 70px;background:#f4f8f9;color:#173a52}.admin-cars-shell{display:flex;min-height:calc(100vh - 104px)}.admin-cars-content{flex:1;min-width:0;padding:0 22px 0 0}.admin-cars-header{display:flex;justify-content:space-between;align-items:flex-end;gap:18px;max-width:1200px;margin:0 auto 22px}.admin-cars-kicker{color:#0b8a73;font-size:10px;font-weight:950}.admin-cars-header h1{margin:6px 0;color:#173a52;font-size:30px}.admin-cars-header p{margin:0;color:#78909b;font-size:13px}.admin-cars-header-actions{display:flex;align-items:center;gap:9px}.admin-pending-count{padding:7px 11px;border-radius:999px;background:#fff0bd;color:#745516;font-size:11px;font-weight:900}.admin-cars-header-actions button,.admin-cars-state button{display:inline-flex;align-items:center;gap:6px;border:1px solid #d3e1e4;border-radius:10px;padding:9px 12px;background:#fff;color:#526873;font:inherit;font-size:11px;font-weight:850;cursor:pointer}.admin-cars-header-actions button:disabled{opacity:.6}.admin-cars-filters{display:flex;gap:8px;max-width:1200px;margin:0 auto 14px}.admin-cars-filters button{border:1px solid #dce7eb;border-radius:10px;padding:9px 13px;background:#fff;color:#526873;font:inherit;font-size:11px;font-weight:850;cursor:pointer}.admin-cars-filters button.active{border-color:#173a52;background:#173a52;color:#fff}.admin-cars-table-wrap{max-width:1200px;margin:0 auto;overflow-x:auto;border:1px solid #dce7eb;border-radius:18px;background:#fff;box-shadow:0 9px 24px rgba(23,58,82,.05)}.admin-cars-table{width:100%;border-collapse:collapse;min-width:760px;font-size:12px}.admin-cars-table th{padding:14px 16px;background:#f7fafb;color:#8498a1;text-align:right;font-size:10px}.admin-cars-table td{padding:13px 16px;border-top:1px solid #edf2f4;color:#526873}.admin-cars-table .car-name{color:#173a52;font-weight:900}.car-name small{display:block;margin-top:3px;color:#91a0a7;font-weight:600}.price{color:#0a58ca!important;font-weight:900}.table-car-img,.table-car-placeholder{width:65px;height:46px;display:grid;place-items:center;object-fit:cover;border-radius:8px;background:#edf3f5;color:#91a2aa}.status{display:inline-flex;align-items:center;gap:5px;padding:6px 9px;border-radius:999px;font-size:10px;font-weight:900;white-space:nowrap}.status.approved{background:#e4fbf5;color:#08745f}.status.pending{background:#fff0bd;color:#745516}.details-link,.approve-table{display:inline-flex;align-items:center;gap:5px;margin-left:7px;border:0;border-radius:8px;padding:7px 9px;text-decoration:none;font:inherit;font-size:10px;font-weight:900;cursor:pointer}.details-link{background:#eef5ff;color:#0a58ca}.approve-table{background:#e4fbf5;color:#08745f}.approve-table:disabled{opacity:.6}.admin-mobile-car-cards{display:none}.admin-cars-state{display:grid;place-items:center;align-content:center;gap:10px;min-height:360px;max-width:1200px;margin:auto;color:#91a0a7;text-align:center}.admin-cars-state h2{margin:0;color:#173a52;font-size:18px}.admin-cars-state p{margin:0;font-size:12px}.admin-cars-state.error{padding:30px}.admin-cars-state.error svg{color:#b64040}.spin{animation:admin-spin .8s linear infinite}@keyframes admin-spin{to{transform:rotate(360deg)}}.admin-loader{width:36px;height:36px;border:4px solid #dfeaec;border-top-color:#0b8a73;border-radius:50%;animation:admin-spin .8s linear infinite}
@media(max-width:900px){.admin-cars-page{padding:132px 12px 50px}.admin-cars-shell{display:block;min-height:auto}.admin-cars-content{padding:0}.admin-cars-header{align-items:stretch;flex-direction:column;margin-bottom:15px}.admin-cars-header h1{font-size:25px}.admin-cars-header-actions{justify-content:space-between}.admin-cars-header-actions button{padding-inline:14px}.admin-cars-filters{overflow-x:auto;margin-bottom:14px}.admin-cars-filters button{flex:0 0 auto}.admin-cars-table-wrap{display:none}.admin-mobile-car-cards{display:grid;grid-template-columns:1fr;gap:14px}.admin-mobile-car-card{overflow:hidden;border:1px solid #dce9ed;border-radius:18px;background:#fff;box-shadow:0 9px 24px rgba(23,58,82,.07)}.admin-mobile-car-image{position:relative;height:180px;background:#edf3f5}.large-car-img{width:100%;height:100%;display:block;object-fit:cover}.large-car-placeholder{width:100%;height:100%;display:grid;place-items:center;color:#91a2aa}.pending-badge{position:absolute;top:12px;right:12px;display:inline-flex;align-items:center;gap:5px;padding:7px 10px;border-radius:999px;background:#fff0bd;color:#745516;font-size:10px;font-weight:900}.admin-mobile-car-body{padding:15px}.admin-mobile-car-title{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}.admin-mobile-car-title h2{margin:0 0 5px;color:#173a52;font-size:18px}.admin-mobile-car-title small{color:#83959d;font-size:11px}.admin-mobile-car-facts{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin:15px 0 12px;padding:12px 0;border-top:1px solid #edf2f4;border-bottom:1px solid #edf2f4}.admin-mobile-car-facts span{display:grid;gap:4px;color:#526873;font-size:11px}.admin-mobile-car-facts b{color:#93a1a7;font-size:9px}.admin-mobile-car-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}.admin-mobile-car-actions button{display:inline-flex;justify-content:center;align-items:center;gap:6px;border:1px solid #dce7eb;border-radius:10px;padding:10px;background:#fff;color:#173a52;font:inherit;font-size:11px;font-weight:900;cursor:pointer}.admin-mobile-car-actions button.approve{border-color:#bfe9dc;background:#e4fbf5;color:#08745f}.admin-mobile-car-actions button:disabled{opacity:.6}}@media(max-width:460px){.admin-mobile-car-image{height:165px}.admin-mobile-car-facts{grid-template-columns:repeat(3,1fr)}.admin-mobile-car-title{display:block}.admin-mobile-car-title .status{margin-top:10px}}
`;
