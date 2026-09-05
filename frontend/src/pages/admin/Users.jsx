import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import AdminSidebar from '../../components/AdminSidebar';
import toast from 'react-hot-toast';
import { UserCheck, UserX, ShieldAlert, X, Mail, CalendarDays } from 'lucide-react';
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

  const openViolation = (user) => {
    setSelectedUser(user);
    setReason('');
    setDescription('');
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
    return <span className="role-badge" style={{ background: colors[role] || colors.customer }}>{labels[role] || role}</span>;
  };

  const getStatusBadge = (active) => <span className={`status-badge ${active ? 'status-active' : 'status-blocked'}`}>{active ? 'نشط' : 'محظور/معطل'}</span>;

  const renderActions = (user) => user.role !== 'admin' && <div className="user-actions">
    {user.is_active && <button className="action-button violation-button" onClick={() => openViolation(user)}><ShieldAlert size={15} /> تسجيل مخالفة</button>}
    <button className={`action-button ${user.is_active ? 'disable-button' : 'enable-button'}`} onClick={() => handleToggleActive(user.id, user.is_active, user.name)} disabled={togglingId === user.id}>
      {user.is_active ? <><UserX size={15} /> تعطيل</> : <><UserCheck size={15} /> تفعيل</>}
    </button>
  </div>;

  if (loading) return <div className="users-loading"><div className="spinner" /></div>;

  return <div dir="rtl" className="admin-users-page">
    <AdminSidebar />
    <main className="admin-users-content">
      <header className="users-header">
        <div><h1>إدارة المستخدمين</h1><p>المخالفة الأولى ترسل تحذيراً، وتكرارها للمرة الثانية يحظر الحساب تلقائياً.</p></div>
        <div className="users-summary"><strong>{users.length}</strong><span>مستخدم</span></div>
      </header>

      {users.length === 0 ? <div className="empty-users">لا يوجد مستخدمون مسجلون.</div> : <>
        <div className="desktop-users-table">
          <table className="users-table"><thead><tr>{['الاسم','البريد الإلكتروني','الدور','المخالفات','التسجيل','الحالة','إجراءات'].map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>{users.map(user => <tr key={user.id}>
              <td className="user-name-cell">{user.name}</td><td className="email-cell">{user.email}</td><td>{getRoleBadge(user.role)}</td>
              <td><span className={`violation-count ${(user.violation_count || 0) > 0 ? 'has-violations' : ''}`}>{user.violation_count || 0}</span></td>
              <td>{format(new Date(user.created_at), 'yyyy-MM-dd')}</td><td>{getStatusBadge(user.is_active)}</td><td>{renderActions(user)}</td>
            </tr>)}</tbody>
          </table>
        </div>
        <div className="mobile-users-list">{users.map(user => <article className="user-card" key={user.id}>
          <div className="user-card-top"><div><h2>{user.name}</h2><p><Mail size={14} /> {user.email}</p></div>{getStatusBadge(user.is_active)}</div>
          <div className="user-card-meta"><span>{getRoleBadge(user.role)}</span><span><ShieldAlert size={14} /> <b className={(user.violation_count || 0) > 0 ? 'has-violations' : ''}>{user.violation_count || 0}</b> مخالفة</span><span><CalendarDays size={14} /> {format(new Date(user.created_at), 'yyyy-MM-dd')}</span></div>
          {renderActions(user)}
        </article>)}</div>
      </>}
    </main>

    {selectedUser && <div className="violation-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setSelectedUser(null)}>
      <form className="violation-modal" onSubmit={submitViolation}>
        <button type="button" className="close-modal-button" onClick={() => setSelectedUser(null)} aria-label="إغلاق"><X size={20} /></button>
        <h2>تسجيل مخالفة</h2><p className="modal-user-label">المستخدم: <strong>{selectedUser.name}</strong> ({selectedUser.role === 'supplier' ? 'مورد' : 'عميل'})</p>
        <label htmlFor="violation-reason">سبب المخالفة *</label><input id="violation-reason" value={reason} onChange={e => setReason(e.target.value)} placeholder="مثال: إعادة السيارة متضررة" autoFocus />
        <label htmlFor="violation-description">تفاصيل إضافية</label><textarea id="violation-description" value={description} onChange={e => setDescription(e.target.value)} rows={4} />
        <div className="warning-note">سيصل إشعار للمستخدم. إذا كان لديه مخالفة سابقة فسيتم حظر حسابه تلقائياً.</div>
        <button className="submit-violation-button" disabled={saving}>{saving ? 'جاري التسجيل...' : 'تسجيل المخالفة وإرسال الإشعار'}</button>
      </form>
    </div>}

    <style>{`
      .admin-users-page{display:flex;min-height:100vh;background:#f8f9fa;color:#18212b}
      .admin-users-content{flex:1;min-width:0;padding:clamp(18px,3vw,36px) clamp(14px,3vw,32px);overflow:hidden}
      .users-header{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin-bottom:26px}
      .users-header h1{font-size:clamp(1.35rem,2.5vw,1.9rem);margin:0 0 8px}.users-header p{color:#6c757d;margin:0;line-height:1.7;font-size:clamp(.85rem,1.5vw,.98rem)}
      .users-summary{background:#fff;border:1px solid #e7ebef;border-radius:12px;padding:10px 16px;text-align:center;min-width:72px;box-shadow:0 2px 8px #18212b0b}.users-summary strong{display:block;color:#0a58ca;font-size:1.3rem}.users-summary span{font-size:.75rem;color:#6c757d}
      .desktop-users-table{width:100%;overflow-x:auto;border-radius:14px;box-shadow:0 2px 12px #18212b0b;background:#fff}.users-table{width:100%;min-width:780px;border-collapse:collapse}.users-table th{background:#f5f7f9;color:#53606c;font-size:.82rem;font-weight:700;white-space:nowrap}.users-table th,.users-table td{padding:14px 16px;text-align:right;border-bottom:1px solid #edf0f2;vertical-align:middle}.users-table tr:last-child td{border-bottom:0}.user-name-cell{font-weight:700}.email-cell{direction:ltr;text-align:right;color:#5e6973;font-size:.88rem}.role-badge,.status-badge{display:inline-flex;align-items:center;justify-content:center;white-space:nowrap;padding:4px 9px;border-radius:999px;color:#fff;font-size:.72rem;font-weight:700}.status-active{background:#198754}.status-blocked{background:#dc3545}.violation-count{color:#6c757d;font-weight:800}.has-violations{color:#dc3545}.user-actions{display:flex;gap:7px;flex-wrap:wrap}.action-button{border:0;border-radius:7px;padding:8px 10px;display:inline-flex;align-items:center;justify-content:center;gap:5px;font-size:.76rem;font-weight:700;cursor:pointer;white-space:nowrap}.action-button:disabled{opacity:.6;cursor:not-allowed}.violation-button{background:#ffc107;color:#212529}.disable-button{background:#dc3545;color:#fff}.enable-button{background:#198754;color:#fff}.mobile-users-list{display:none}.empty-users{background:#fff;border-radius:14px;padding:42px;text-align:center;color:#6c757d;box-shadow:0 2px 12px #18212b0b}
      .violation-modal-backdrop{position:fixed;inset:0;background:#10182099;display:grid;place-items:center;z-index:20;padding:clamp(12px,4vw,28px);overflow-y:auto}.violation-modal{background:#fff;border-radius:16px;padding:clamp(20px,4vw,30px);width:min(520px,100%);position:relative;box-shadow:0 18px 60px #0004}.violation-modal h2{margin:0 0 8px;font-size:1.35rem}.modal-user-label{color:#5e6973;margin:0 0 22px;font-size:.9rem}.close-modal-button{position:absolute;left:16px;top:16px;border:0;background:#f1f3f5;color:#495057;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;cursor:pointer}.violation-modal label{display:block;font-weight:700;font-size:.85rem;margin:14px 0 7px}.violation-modal input,.violation-modal textarea{display:block;width:100%;box-sizing:border-box;border:1px solid #d8dee4;border-radius:8px;padding:11px;font:inherit;outline:none}.violation-modal input:focus,.violation-modal textarea:focus{border-color:#0a58ca;box-shadow:0 0 0 3px #0a58ca1c}.violation-modal textarea{resize:vertical;min-height:100px}.warning-note{background:#fff3cd;color:#856404;border-radius:9px;padding:11px;margin:18px 0;font-size:.83rem;line-height:1.7}.submit-violation-button{width:100%;border:0;border-radius:8px;background:#0a58ca;color:#fff;padding:12px;font-weight:700;cursor:pointer}.submit-violation-button:disabled{opacity:.6;cursor:not-allowed}.users-loading{display:grid;place-items:center;min-height:300px}.spinner{width:40px;height:40px;border:4px solid #e9ecef;border-top-color:#0a58ca;border-radius:50%;animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
      @media (max-width:900px){.admin-users-page{display:block}.admin-users-content{padding-top:22px}.users-table th,.users-table td{padding:12px 11px}.action-button{padding:7px 8px}}
      @media (max-width:640px){.users-header{align-items:center;margin-bottom:18px}.users-header p{max-width:260px}.users-summary{padding:8px 12px;min-width:58px}.desktop-users-table{display:none}.mobile-users-list{display:grid;gap:12px}.user-card{background:#fff;border:1px solid #e7ebef;border-radius:14px;padding:15px;box-shadow:0 2px 9px #18212b0b}.user-card-top{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}.user-card h2{font-size:1rem;margin:0 0 6px}.user-card p{display:flex;align-items:center;gap:5px;color:#697681;font-size:.78rem;margin:0;word-break:break-all;direction:ltr;text-align:right}.user-card-meta{display:flex;align-items:center;gap:12px;flex-wrap:wrap;border-top:1px solid #edf0f2;border-bottom:1px solid #edf0f2;padding:11px 0;margin:13px 0;color:#687581;font-size:.76rem}.user-card-meta span{display:inline-flex;align-items:center;gap:4px}.user-card .user-actions{display:grid;grid-template-columns:1fr 1fr}.user-card .action-button{width:100%;min-height:38px}.violation-modal-backdrop{align-items:end;padding:0}.violation-modal{border-radius:18px 18px 0 0;max-height:92vh;overflow-y:auto}.violation-modal h2{padding-left:35px}}
      @media (max-width:380px){.user-card .user-actions{grid-template-columns:1fr}.users-header{align-items:flex-start}.users-header p{font-size:.78rem}.users-summary{display:none}}
    `}</style>
  </div>;
}
