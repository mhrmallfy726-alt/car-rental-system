import { useEffect, useState } from 'react';
import { CheckCircle, Eye, MapPin, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../services/api';

const statusLabel = (request) => {
  if (request.approval_status === 'approved') return ['مقبول', '#e8f7ef', '#177245'];
  if (request.approval_status === 'rejected') return ['مرفوض', '#fff0f0', '#a94442'];
  return ['بانتظار المراجعة', '#fff4df', '#9b6714'];
};

export default function BranchRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const response = await adminAPI.getBranchRequests();
      setRequests(response.data.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذر تحميل طلبات الفروع');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const approve = async (request) => {
    setBusy(true);
    try {
      await adminAPI.approveBranch(request.id);
      toast.success('تمت الموافقة على الفرع');
      setSelected(null);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذر الموافقة على الفرع');
    } finally {
      setBusy(false);
    }
  };

  const reject = async (request) => {
    const reason = window.prompt('اكتب سبب رفض الفرع:');
    if (!reason?.trim()) return;
    setBusy(true);
    try {
      await adminAPI.rejectBranch(request.id, reason.trim());
      toast.success('تم رفض طلب الفرع');
      setSelected(null);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذر رفض الفرع');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main dir="rtl" style={{ minHeight: '100vh', background: '#f5f8fa', padding: '34px', color: '#173a52' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <span style={{ color: '#178263', fontWeight: 900, fontSize: 13 }}>إدارة الموردين</span>
          <h1 style={{ margin: '6px 0', fontSize: 30 }}>طلبات الفروع</h1>
          <p style={{ margin: 0, color: '#70818a' }}>راجع تفاصيل الفرع وموقعه وبيانات المورد قبل الموافقة.</p>
        </div>
        {loading ? <p>جاري التحميل...</p> : requests.length === 0 ? <section style={panel}>لا توجد طلبات فروع.</section> : (
          <div style={{ display: 'grid', gap: 14 }}>
            {requests.map((request) => {
              const [label, background, color] = statusLabel(request);
              return <article key={request.id} style={{ ...panel, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 18, alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', gap: 9, alignItems: 'center', flexWrap: 'wrap' }}>
                    <h2 style={{ margin: 0, fontSize: 19 }}>{request.branch_name || 'فرع بدون اسم'}</h2>
                    <span style={{ background, color, borderRadius: 999, padding: '5px 10px', fontSize: 12, fontWeight: 900 }}>{label}</span>
                  </div>
                  <p style={{ margin: '8px 0 0', color: '#667984' }}><MapPin size={14} style={{ verticalAlign: 'middle' }} /> {request.city} · المورد: {request.supplier_name || request.supplier_email}</p>
                  <small style={{ color: '#82919a' }}>{request.address || 'لا يوجد عنوان تفصيلي'} · الاشتراك: {request.status === 'paid' ? 'مدفوع' : 'بانتظار الدفع'}</small>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'end' }}>
                  <button type="button" onClick={() => setSelected(request)} style={button('#edf7f5', '#146f57')}><Eye size={16} /> التفاصيل</button>
                  {request.approval_status === 'pending' && <><button type="button" disabled={busy} onClick={() => approve(request)} style={button('#178263', '#fff')}><CheckCircle size={16} /> موافقة</button><button type="button" disabled={busy} onClick={() => reject(request)} style={button('#fff0f0', '#a94442')}><XCircle size={16} /> رفض</button></>}
                </div>
              </article>;
            })}
          </div>
        )}
      </div>
      {selected && <div style={overlay} onClick={() => setSelected(null)}><section style={modal} onClick={(event) => event.stopPropagation()}>
        <h2 style={{ marginTop: 0 }}>تفاصيل الفرع</h2>
        <div style={{ display: 'grid', gap: 10, color: '#52656e' }}>
          <strong style={{ color: '#173a52' }}>{selected.branch_name}</strong>
          <span>المدينة: {selected.city}</span><span>العنوان: {selected.address || 'غير محدد'}</span>
          <span>المورد: {selected.supplier_name || 'غير محدد'}</span><span>البريد: {selected.supplier_email || 'غير محدد'}</span><span>الهاتف: {selected.supplier_phone || 'غير محدد'}</span>
          <span>الإحداثيات: {selected.latitude}, {selected.longitude}</span><span>حالة الدفع: {selected.status === 'paid' ? 'مدفوع' : 'غير مدفوع'}</span>
          {selected.rejection_reason && <span style={{ color: '#a94442' }}>سبب الرفض: {selected.rejection_reason}</span>}
        </div>
        <div style={{ display: 'flex', gap: 9, justifyContent: 'end', marginTop: 22 }}><button type="button" onClick={() => setSelected(null)} style={button('#f1f4f5', '#52656e')}>إغلاق</button>{selected.approval_status === 'pending' && <><button type="button" disabled={busy} onClick={() => approve(selected)} style={button('#178263', '#fff')}>موافقة</button><button type="button" disabled={busy} onClick={() => reject(selected)} style={button('#fff0f0', '#a94442')}>رفض</button></>}</div>
      </section></div>}
    </main>
  );
}

const panel = { background: '#fff', border: '1px solid #e5ecef', borderRadius: 16, padding: 18, boxShadow: '0 8px 28px rgba(23,58,82,.06)' };
const button = (background, color) => ({ border: 0, background, color, borderRadius: 10, padding: '9px 12px', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 900, cursor: 'pointer' });
const overlay = { position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(10,25,35,.58)', display: 'grid', placeItems: 'center', padding: 18 };
const modal = { ...panel, width: 'min(540px, 100%)', boxSizing: 'border-box' };
