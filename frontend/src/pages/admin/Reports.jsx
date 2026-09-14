import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, FileBarChart2, RefreshCw, TrendingUp, Users, Car, CalendarDays, CircleDollarSign, AlertTriangle, Star } from 'lucide-react';
import AdminSidebar from '../../components/AdminSidebar';
import { reportsAPI } from '../../services/api';
import toast from 'react-hot-toast';

const periods = [{ value: 7, label: 'آخر 7 أيام' }, { value: 30, label: 'آخر 30 يومًا' }, { value: 90, label: 'آخر 90 يومًا' }, { value: 365, label: 'آخر سنة' }];
const money = (value) => `${Number(value || 0).toLocaleString('ar-SA', { maximumFractionDigits: 2 })}`;
const count = (value) => Number(value || 0).toLocaleString('ar-SA');
const csvCell = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;

function downloadCsv(data) {
  const rows = [
    ['القسم', 'الاسم', 'العدد', 'القيمة'],
    ...data.reservationStatuses.map((x) => ['حجوزات حسب الحالة', x.status, x.count, x.value]),
    ...data.paymentMethods.map((x) => ['طرق الدفع', x.payment_method, x.count, x.amount]),
    ...data.topCars.map((x) => ['السيارات الأكثر حجزًا', `${x.make} ${x.model}`, x.reservations, x.booking_value]),
    ...data.topSuppliers.map((x) => ['الموردون الأعلى إيرادًا', x.name, x.reservations, x.booking_value]),
  ];
  const blob = new Blob([`\ufeff${rows.map((row) => row.map(csvCell).join(',')).join('\n')}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `rental-report-${data.range.days}-days.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function Kpi({ icon: Icon, label, value, accent }) {
  return <div className="reports-kpi" style={{ '--accent': accent }}><span className="reports-kpi-icon"><Icon size={20} /></span><span><small>{label}</small><strong>{value}</strong></span></div>;
}

function DataTable({ title, headers, rows, empty = 'لا توجد بيانات في الفترة المحددة' }) {
  return <section className="reports-panel"><div className="reports-panel-heading"><h2>{title}</h2><span>{rows.length} سجلات</span></div>{rows.length ? <div className="reports-table-wrap"><table><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={`${title}-${index}`}>{row.map((cell, cellIndex) => <td key={`${index}-${cellIndex}`}>{cell}</td>)}</tr>)}</tbody></table></div> : <p className="reports-empty">{empty}</p>}</section>;
}

export default function Reports() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const response = await reportsAPI.getOverview(days);
      setData(response.data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذر تحميل التقارير');
    } finally {
      setLoading(false);
    }
  }, [days]);
  useEffect(() => { fetchReport(); }, [fetchReport]);
  const maxMonthly = useMemo(() => Math.max(...(data?.monthly || []).map((item) => Number(item.booking_value || 0)), 1), [data]);

  return <div className="reports-page" dir="rtl"><AdminSidebar /><main className="reports-content"><header className="reports-header"><div><span className="reports-kicker"><FileBarChart2 size={15} /> مركز التقارير</span><h1>التقارير والتحليلات</h1><p>صورة موحدة لأداء المنصة المالي والتشغيلي.</p></div><div className="reports-actions"><select value={days} onChange={(event) => setDays(Number(event.target.value))} aria-label="الفترة الزمنية">{periods.map((period) => <option key={period.value} value={period.value}>{period.label}</option>)}</select><button type="button" onClick={() => downloadCsv(data)} disabled={!data} className="reports-button reports-button-gold"><Download size={16} /> تصدير CSV</button><button type="button" onClick={fetchReport} className="reports-button" disabled={loading}><RefreshCw size={16} className={loading ? 'reports-spin' : ''} /> تحديث</button></div></header>
      {loading && !data ? <div className="reports-loading">جاري تجهيز التقرير...</div> : data && <>
        <div className="reports-range">الفترة: {new Date(data.range.start).toLocaleDateString('ar-SA')} — {new Date(data.range.end).toLocaleDateString('ar-SA')}</div>
        <section className="reports-kpis"><Kpi icon={CircleDollarSign} label="المدفوعات المحصلة" value={money(data.kpis.paid_amount)} accent="#b78a22" /><Kpi icon={CalendarDays} label="الحجوزات" value={count(data.kpis.reservations)} accent="#287d72" /><Kpi icon={TrendingUp} label="قيمة الحجوزات" value={money(data.kpis.booking_value)} accent="#3566a8" /><Kpi icon={Users} label="مستخدمون جدد" value={count(data.kpis.new_users)} accent="#7d58a5" /><Kpi icon={Car} label="سيارات مضافة" value={count(data.kpis.new_cars)} accent="#c16a42" /><Kpi icon={AlertTriangle} label="شكاوى مفتوحة" value={count(data.kpis.open_complaints)} accent="#bd4d51" /></section>
        <section className="reports-panel"><div className="reports-panel-heading"><h2>اتجاه قيمة الحجوزات</h2><span>شهري</span></div><div className="reports-chart">{data.monthly.length ? data.monthly.map((item) => <div className="reports-bar-item" key={item.month}><span>{money(item.booking_value)}</span><div className="reports-bar"><i style={{ height: `${Math.max(5, (Number(item.booking_value) / maxMonthly) * 100)}%` }} /></div><small>{item.month}</small></div>) : <p className="reports-empty">لا توجد بيانات زمنية</p>}</div></section>
        <div className="reports-grid"><DataTable title="الحجوزات حسب الحالة" headers={['الحالة', 'العدد', 'القيمة']} rows={data.reservationStatuses.map((x) => [x.status, count(x.count), money(x.value)])} /><DataTable title="المدفوعات وطرق الدفع" headers={['الطريقة', 'العدد', 'المبلغ']} rows={data.paymentMethods.map((x) => [x.payment_method || 'غير محدد', count(x.count), money(x.amount)])} /><DataTable title="السيارات الأكثر حجزًا" headers={['السيارة', 'المورد', 'الحجوزات', 'القيمة']} rows={data.topCars.map((x) => [`${x.make} ${x.model}`, x.supplier_name || '—', count(x.reservations), money(x.booking_value)])} /><DataTable title="أفضل الموردين" headers={['المورد', 'البريد', 'الحجوزات', 'القيمة']} rows={data.topSuppliers.map((x) => [x.name, x.email, count(x.reservations), money(x.booking_value)])} /></div>
        <div className="reports-grid"><DataTable title="الشكاوى حسب الحالة والأولوية" headers={['الحالة', 'الأولوية', 'العدد']} rows={data.complaints.map((x) => [x.status, x.priority, count(x.count)])} /><section className="reports-panel reports-rating"><div className="reports-panel-heading"><h2>مؤشرات الجودة</h2><Star size={19} /></div><div className="reports-rating-value">{data.ratings.car_rating || '—'} <small>/ 5</small></div><p>متوسط تقييم السيارات من {count(data.ratings.reviews)} تقييمات</p><div className="reports-rating-line"><span>متوسط تقييم الموردين</span><strong>{data.ratings.supplier_rating || '—'} / 5</strong></div></section></div>
      </>}
    </main><style>{`.reports-page{display:flex;min-height:100vh;background:#f5f8f8;color:#173a52}.reports-content{flex:1;min-width:0;padding:38px 34px}.reports-header{display:flex;justify-content:space-between;gap:22px;align-items:flex-start;margin-bottom:18px}.reports-kicker{display:inline-flex;align-items:center;gap:6px;color:#b78a22;font-size:12px;font-weight:900}.reports-header h1{margin:8px 0 5px;font-size:30px}.reports-header p{margin:0;color:#71828b}.reports-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.reports-actions select,.reports-button{border:1px solid #d8e4e4;border-radius:10px;background:#fff;color:#173a52;padding:10px 13px;font:inherit;font-size:12px;font-weight:800}.reports-button{display:inline-flex;align-items:center;gap:6px;cursor:pointer}.reports-button:disabled{opacity:.55;cursor:not-allowed}.reports-button-gold{background:#b78a22;color:#fff;border-color:#b78a22}.reports-range{margin-bottom:16px;color:#71828b;font-size:12px}.reports-kpis{display:grid;grid-template-columns:repeat(6,minmax(130px,1fr));gap:12px;margin-bottom:16px}.reports-kpi{display:flex;align-items:center;gap:10px;padding:16px;background:#fff;border:1px solid #e4eeee;border-radius:14px;box-shadow:0 7px 18px rgba(23,58,82,.05)}.reports-kpi-icon{display:grid;place-items:center;width:38px;height:38px;border-radius:11px;background:color-mix(in srgb,var(--accent) 12%,white);color:var(--accent)}.reports-kpi small,.reports-kpi strong{display:block}.reports-kpi small{font-size:10px;color:#71828b}.reports-kpi strong{margin-top:5px;font-size:18px}.reports-panel{background:#fff;border:1px solid #e4eeee;border-radius:15px;padding:18px;box-shadow:0 7px 18px rgba(23,58,82,.04);margin-bottom:16px}.reports-panel-heading{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}.reports-panel-heading h2{font-size:16px;margin:0}.reports-panel-heading span{font-size:11px;color:#8a9aa0}.reports-chart{height:220px;display:flex;align-items:end;gap:clamp(10px,3vw,30px);padding:12px 8px 0;border-bottom:1px solid #e8efef}.reports-bar-item{display:flex;flex:1;height:100%;min-width:42px;align-items:center;flex-direction:column;justify-content:end;gap:5px}.reports-bar-item>span{font-size:10px;color:#71828b}.reports-bar{height:150px;width:min(42px,80%);display:flex;align-items:end;background:#f0f5f5;border-radius:8px 8px 0 0;overflow:hidden}.reports-bar i{display:block;width:100%;background:linear-gradient(#b78a22,#d5b65b);border-radius:8px 8px 0 0}.reports-bar-item small{font-size:10px;color:#71828b}.reports-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 16px}.reports-table-wrap{overflow:auto}.reports-panel table{width:100%;border-collapse:collapse;font-size:12px}.reports-panel th{color:#7a8b92;text-align:right;font-weight:800;background:#f7faf9}.reports-panel th,.reports-panel td{padding:10px 8px;border-bottom:1px solid #edf2f1;white-space:nowrap}.reports-empty{color:#8a9aa0;text-align:center;padding:22px}.reports-rating-value{font-size:42px;font-weight:950;color:#b78a22}.reports-rating-value small{font-size:16px;color:#8a9aa0}.reports-rating p{color:#71828b;margin:2px 0 20px}.reports-rating-line{display:flex;justify-content:space-between;border-top:1px solid #edf2f1;padding-top:14px;font-size:12px}.reports-loading{background:#fff;border-radius:15px;padding:60px;text-align:center;color:#71828b}.reports-spin{animation:reports-spin 1s linear infinite}@keyframes reports-spin{to{transform:rotate(360deg)}}@media(max-width:1100px){.reports-kpis{grid-template-columns:repeat(3,1fr)}}@media(max-width:760px){.reports-content{padding:86px 14px 24px}.reports-header{display:block}.reports-actions{margin-top:18px}.reports-grid{grid-template-columns:1fr}.reports-kpis{grid-template-columns:repeat(2,1fr)}.reports-kpi strong{font-size:15px}}`}</style></div>;
}
