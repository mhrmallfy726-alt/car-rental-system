import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import AdminSidebar from '../../components/AdminSidebar';
import toast from 'react-hot-toast';
import { UserCheck, UserX, ShieldAlert, X } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try { const res = await adminAPI.getUsers(); setUsers(res.data.data); }
    catch { toast.error('فشل جلب المستخدمين'); }
    finally { setLoading(false); }
  };

  const handleToggleActive = async (id, currentStatus, userName) => {
    const action = currentStatus ? 'تعطيل' : 'تفعيل';
    if (!window.confirm(`هل أنت متأكد من ${action} حساب المستخدم "${userName}"؟`)) return;
    setTogglingId(id);
    try { await adminAPI.toggleUser(id); toast.success(`تم ${action} حساب المستخدم بنجاح`); fetchUsers(); }
    catch { toast.error('فشل التحديث'); }
    finally { setTogglingId(null); }
  };

  const submitViolation = async (event) => {
    event.preventDefault();
    if (!reason.trim()) return toast.error('اكتب سبب المخالفة');
    setSaving(true);
    try {
      const response = await adminAPI.addViolation(selectedUser.id, { reason, description, severity: 'warning' });
      toast.success(response.data.message);
      setSelectedUser(null); setReason(''); setDescription(''); fetchUsers();
    } catch (error) { toast.error(error.response?.data?.message || 'فشل تسجيل المخالفة'); }
    finally { setSaving(false); }
  };

  const getRoleBadge = (role) => {
    const labels = { admin: 'مدير', supplier: 'مورد', customer: 'عميل' };
    const colors = { admin: '#0a58ca', supplier: '#17a2b8', customer: '#6c757d' };
    return <span style={{ background: colors[role] || colors.customer, color: 'white', padding: '2px 8px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold' }}>{labels[role] || role}</span>;
  };
  const getStatusBadge = (active) => <span style={{ background: active ? '#28a745' : '#dc3545', color: 'white', padding: '2px 8px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold' }}>{active ? 'نشط' : 'محظور/معطل'}</span>;

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>;

  return <div dir="rtl" style={{ display: 'flex', minHeight: '100vh', background: '#f8f9fa' }}>
    <AdminSidebar />
    <div style={{ flex: 1, padding: '30px 24px' }}>
      <h1 style={{ fontSize: '1.8rem', marginBottom: 8 }}>إدارة المستخدمين</h1>
      <p style={{ color: '#6c757d', marginBottom: 28 }}>المخالفة الأولى ترسل تحذيراً، وتكرارها للمرة الثانية يحظر الحساب تلقائياً.</p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', minWidth: 760 }}>
          <thead style={{ background: '#f8f9fa' }}><tr>{['الاسم','البريد الإلكتروني','الدور','المخالفات','التسجيل','الحالة','إجراءات'].map(h => <th key={h} style={{ padding: '12px 16px', textAlign: 'right', borderBottom: '1px solid #e9ecef' }}>{h}</th>)}</tr></thead>
          <tbody>{users.map(u => <tr key={u.id} style={{ borderBottom: '1px solid #e9ecef' }}>
            <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>{u.name}</td><td style={{ padding: '12px 16px' }}>{u.email}</td><td style={{ padding: '12px 16px' }}>{getRoleBadge(u.role)}</td>
            <td style={{ padding: '12px 16px', color: u.violation_count > 0 ? '#dc3545' : '#6c757d', fontWeight: 'bold' }}>{u.violation_count || 0}</td>
            <td style={{ padding: '12px 16px' }}>{format(new Date(u.created_at), 'yyyy-MM-dd')}</td><td style={{ padding: '12px 16px' }}>{getStatusBadge(u.is_active)}</td>
            <td style={{ padding: '12px 16px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>{u.role !== 'admin' && <>
              {u.is_active && <button onClick={() => setSelectedUser(u)} style={{ background: '#ffc107', color: '#212529', border: 0, padding: '6px 10px', borderRadius: 6, cursor: 'pointer', display: 'inline-flex', gap: 5, alignItems: 'center', fontWeight: 'bold' }}><ShieldAlert size={14} /> تسجيل مخالفة</button>}
              <button onClick={() => handleToggleActive(u.id, u.is_active, u.name)} disabled={togglingId === u.id} style={{ background: u.is_active ? '#dc3545' : '#28a745', color: 'white', border: 0, padding: '6px 10px', borderRadius: 6, cursor: 'pointer', display: 'inline-flex', gap: 5, alignItems: 'center' }}>{u.is_active ? <><UserX size={14} /> تعطيل</> : <><UserCheck size={14} /> تفعيل</>}</button>
            </>}</td>
          </tr>)}</tbody>
        </table>
      </div>
    </div>
    {selectedUser && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'grid', placeItems: 'center', zIndex: 20, padding: 20 }}>
      <form onSubmit={submitViolation} style={{ background: 'white', borderRadius: 14, padding: 24, width: 'min(520px, 100%)', position: 'relative' }}>
        <button type="button" onClick={() => setSelectedUser(null)} style={{ position: 'absolute', left: 16, top: 16, border: 0, background: 'transparent', cursor: 'pointer' }}><X /></button>
        <h2 style={{ marginTop: 0 }}>تسجيل مخالفة</h2><p>المستخدم: <strong>{selectedUser.name}</strong> ({selectedUser.role === 'supplier' ? 'مورد' : 'عميل'})</p>
        <label>سبب المخالفة *</label><input value={reason} onChange={e => setReason(e.target.value)} placeholder="مثال: إعادة السيارة متضررة" style={{ width: '100%', padding: 10, margin: '8px 0 16px', boxSizing: 'border-box' }} />
        <label>تفاصيل إضافية</label><textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} style={{ width: '100%', padding: 10, margin: '8px 0 16px', boxSizing: 'border-box' }} />
        <div style={{ background: '#fff3cd', padding: 12, borderRadius: 8, marginBottom: 16, color: '#856404' }}>سيصل إشعار للمستخدم. إذا كان لديه مخالفة سابقة فسيتم حظر حسابه تلقائياً.</div>
        <button disabled={saving} style={{ width: '100%', padding: 12, border: 0, borderRadius: 8, background: '#0a58ca', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>{saving ? 'جاري التسجيل...' : 'تسجيل المخالفة وإرسال الإشعار'}</button>
      </form>
    </div>}
    <style>{`.spinner{width:40px;height:40px;border:4px solid #e9ecef;border-top-color:#0a58ca;border-radius:50%;animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>;
}
