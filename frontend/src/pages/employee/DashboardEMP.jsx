import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity, ArrowLeft, Bell, CalendarDays, Car, CheckCircle2, Clock3,
  KeyRound, LayoutDashboard, LogOut, RefreshCw, ShieldCheck, UserRound,
  Users, WalletCards, XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';

const permissionMeta = {
  view_cars: { label: 'عرض السيارات', description: 'مشاهدة سيارات المورد وحالتها وأسعارها.', icon: Car },
  manage_cars: { label: 'إدارة السيارات', description: 'تحديث بيانات السيارات وإدارتها ضمن نطاق المورد.', icon: Car },
  view_reservations: { label: 'عرض الحجوزات', description: 'مشاهدة حجوزات سيارات المورد وبيانات العملاء الأساسية.', icon: CalendarDays },
  manage_reservations: { label: 'إدارة الحجوزات', description: 'متابعة إجراءات الحجوزات المسموح بها من قبل المورد.', icon: CheckCircle2 },
  view_customers: { label: 'عرض العملاء', description: 'الوصول إلى معلومات العملاء المرتبطة بعمليات المورد.', icon: Users },
  manage_advertisements: { label: 'إدارة الإعلانات', description: 'إدارة طلبات وإعلانات المورد.', icon: Activity },
  view_finance: { label: 'عرض المالية', description: 'مشاهدة التقارير المالية المسموح بها للمورد.', icon: WalletCards },
  manage_team: { label: 'إدارة فريق العمل', description: 'إدارة موظفي المورد وصلاحياتهم.', icon: Users },
};

const statusLabels = {
  pending: 'قيد المراجعة', confirmed: 'مؤكد', active: 'نشط',
  completed: 'مكتمل', cancelled: 'ملغي', rejected: 'مرفوض',
};

const formatMoney = (value) => `${Number(value || 0).toLocaleString('ar-YE')} ر.ي`;
const formatDate = (value) => value ? new Date(value).toLocaleDateString('ar-YE') : '—';

export default function EmployeeDashboard() {
  const { user, logout } = useAuthStore();
  const [employee, setEmployee] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [overview, setOverview] = useState(null);
  const [cars, setCars] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [passwords, setPasswords] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [changingPassword, setChangingPassword] = useState(false);

  const permissionNames = useMemo(() => new Set(permissions.map((permission) => permission.name)), [permissions]);
  const canViewCars = permissionNames.has('view_cars') || permissionNames.has('manage_cars');
  const canViewReservations = permissionNames.has('view_reservations') || permissionNames.has('manage_reservations');

  const loadDashboard = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true); else setLoading(true);
      const [employeeRes, permissionsRes, overviewRes] = await Promise.all([
        api.get('/employee-self/me'),
        api.get('/employee-self/me/permissions'),
        api.get('/employee-self/me/overview'),
      ]);
      setEmployee(employeeRes.data.data);
      setPermissions(permissionsRes.data.data || []);
      setOverview(overviewRes.data.data || null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذر تحميل لوحة الموظف');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const loadTabData = useCallback(async (tab) => {
    try {
      if (tab === 'cars' && canViewCars) {
        const response = await api.get('/employee-self/me/cars');
        setCars(response.data.data || []);
      }
      if (tab === 'reservations' && canViewReservations) {
        const response = await api.get('/employee-self/me/reservations');
        setReservations(response.data.data || []);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذر تحميل بيانات القسم');
    }
  }, [canViewCars, canViewReservations]);

  useEffect(() => { loadTabData(activeTab); }, [activeTab, loadTabData]);

  const setAvailability = async () => {
    try {
      setSavingStatus(true);
      const response = await api.put('/employee-self/status', { is_accepting_orders: !employee?.is_accepting_orders });
      setEmployee((current) => ({ ...current, ...response.data.data }));
      toast.success(response.data.data.is_accepting_orders ? 'تم تفعيل استقبال المهام' : 'تم إيقاف استقبال المهام');
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذر تحديث حالة الموظف');
    } finally { setSavingStatus(false); }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    if (passwords.new_password.length < 8) return toast.error('كلمة المرور الجديدة يجب ألا تقل عن 8 أحرف');
    if (passwords.new_password !== passwords.confirm_password) return toast.error('تأكيد كلمة المرور غير متطابق');
    try {
      setChangingPassword(true);
      await api.put('/employees/change-password', passwords);
      setPasswords({ current_password: '', new_password: '', confirm_password: '' });
      setEmployee((current) => ({ ...current, must_change_password: false }));
      toast.success('تم تغيير كلمة المرور بنجاح');
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذر تغيير كلمة المرور');
    } finally { setChangingPassword(false); }
  };

  if (loading) return <div className="employee-loading" dir="rtl"><div className="employee-spinner" /><p>جاري تجهيز مساحة عملك...</p></div>;

  const stats = overview || { cars: {}, reservations: {}, recentReservations: [] };
  const navItems = [
    { id: 'overview', label: 'نظرة عامة', icon: LayoutDashboard, visible: true },
    { id: 'cars', label: 'سيارات المورد', icon: Car, visible: canViewCars },
    { id: 'reservations', label: 'الحجوزات', icon: CalendarDays, visible: canViewReservations },
    { id: 'security', label: 'الأمان وكلمة المرور', icon: KeyRound, visible: true },
  ].filter((item) => item.visible);

  return (
    <main className="employee-shell" dir="rtl">
      <style>{`
        .employee-shell{min-height:100vh;background:#f5f7fb;color:#173a52;padding:28px}
        .employee-wrap{max-width:1440px;margin:auto;display:grid;grid-template-columns:250px minmax(0,1fr);gap:22px;}
        .employee-sidebar,.employee-card{background:#fff;border:1px solid #e7edf2;border-radius:22px;box-shadow:0 12px 35px rgba(23,58,82,.06)}
        .employee-sidebar{padding:20px;height:max-content;position:sticky;top:20px}.employee-brand{padding:10px 8px 22px;border-bottom:1px solid #eef2f5;margin-bottom:16px}.employee-brand strong{display:block;font-size:18px}.employee-brand small{color:#758693;display:block;margin-top:6px}.employee-nav{display:grid;gap:7px}.employee-nav button{border:0;background:transparent;color:#50616d;padding:13px 14px;border-radius:13px;display:flex;align-items:center;gap:10px;font:inherit;font-weight:700;cursor:pointer;text-align:right}.employee-nav button:hover,.employee-nav button.active{background:#eaf3f7;color:#0d6686}.employee-logout{margin-top:20px;width:100%;padding:12px;border:1px solid #f0d8d8;background:#fff7f7;color:#b64040;border-radius:13px;font:inherit;font-weight:800;cursor:pointer;display:flex;justify-content:center;gap:8px}.employee-content{min-width:0}.employee-top{display:flex;align-items:center;justify-content:space-between;gap:15px;flex-wrap:wrap;margin-bottom:20px}.employee-top h1{margin:0;font-size:30px}.employee-top p{margin:8px 0 0;color:#71818c}.employee-actions{display:flex;gap:9px;align-items:center}.employee-action{border:1px solid #dfe8ed;background:#fff;color:#173a52;padding:10px 13px;border-radius:12px;font:inherit;font-weight:800;cursor:pointer}.employee-action.primary{background:#173a52;border-color:#173a52;color:#fff}.employee-hero{background:linear-gradient(135deg,#173a52,#24647d);color:#fff;border-radius:22px;padding:24px;display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap;margin-bottom:18px;box-shadow:0 14px 32px rgba(23,58,82,.18)}.employee-hero h2{margin:0 0 8px;font-size:24px}.employee-hero p{margin:0;color:#d8e9ef}.employee-status{border:0;border-radius:13px;padding:12px 16px;background:#d4af37;color:#173a52;font:inherit;font-weight:900;cursor:pointer}.employee-status.off{background:#fff;color:#173a52}.employee-status:disabled{opacity:.65;cursor:wait}.employee-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:18px}.employee-stat{padding:18px}.employee-stat-top{display:flex;justify-content:space-between;align-items:center;color:#758693}.employee-stat strong{display:block;font-size:24px;margin-top:13px}.employee-stat small{color:#758693}.employee-two{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(280px,1fr);gap:18px}.employee-card{padding:20px}.employee-card h3{margin:0 0 16px;font-size:18px}.employee-card-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:16px}.employee-link{border:0;background:transparent;color:#0d6686;font:inherit;font-weight:900;cursor:pointer}.employee-list{display:grid;gap:10px}.employee-row{border:1px solid #edf1f3;border-radius:14px;padding:13px;display:flex;justify-content:space-between;gap:12px;align-items:center}.employee-row strong{display:block}.employee-row small{display:block;color:#7c8a93;margin-top:5px}.employee-badge{display:inline-flex;align-items:center;gap:5px;border-radius:999px;padding:5px 9px;font-size:12px;font-weight:900;background:#eef5f0;color:#197045}.employee-badge.pending{background:#fff5df;color:#9a6a16}.employee-badge.cancelled,.employee-badge.rejected{background:#fff0f0;color:#b64040}.employee-permissions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.employee-permission{border:1px solid #e8eef1;border-radius:14px;padding:13px;display:flex;gap:10px;align-items:flex-start}.employee-permission svg{color:#0d6686;flex:none}.employee-permission strong{font-size:13px;display:block}.employee-permission small{color:#7a8992;display:block;line-height:1.6;margin-top:3px}.employee-table{overflow:auto}.employee-table table{width:100%;border-collapse:collapse;min-width:650px}.employee-table th,.employee-table td{text-align:right;padding:13px;border-bottom:1px solid #edf1f3;white-space:nowrap}.employee-table th{color:#71818c;font-size:13px}.employee-security{max-width:650px}.employee-form{display:grid;gap:12px}.employee-form label{display:grid;gap:6px;color:#566873;font-weight:800;font-size:13px}.employee-form input{border:1px solid #dfe7eb;border-radius:11px;padding:12px;font:inherit;outline:none}.employee-form input:focus{border-color:#d4af37;box-shadow:0 0 0 3px rgba(212,175,55,.16)}.employee-empty{text-align:center;color:#7b8991;padding:30px 10px}.employee-loading{min-height:60vh;display:grid;place-content:center;justify-items:center;gap:12px;color:#60727e}.employee-spinner{width:38px;height:38px;border:4px solid #e1eaee;border-top-color:#d4af37;border-radius:50%;animation:employee-spin .8s linear infinite}@keyframes employee-spin{to{transform:rotate(360deg)}}@media(max-width:1050px){.employee-wrap{grid-template-columns:1fr}.employee-sidebar{position:static}.employee-nav{display:flex;overflow:auto}.employee-nav button{white-space:nowrap}.employee-logout{width:auto;margin-top:14px}.employee-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:650px){.employee-shell{padding:14px}.employee-top h1{font-size:24px}.employee-grid,.employee-two{grid-template-columns:1fr}.employee-permissions{grid-template-columns:1fr}.employee-hero{padding:18px}}
      `}</style>
      <div className="employee-wrap">
        <aside className="employee-sidebar">
          <div className="employee-brand"><strong>مساحة عمل الموظف</strong><small>{employee?.supplier_name || 'حساب تابع للمورد'}</small></div>
          <nav className="employee-nav" aria-label="تنقل الموظف">
            {navItems.map(({ id, label, icon: Icon }) => <button key={id} className={activeTab === id ? 'active' : ''} onClick={() => setActiveTab(id)}><Icon size={18} />{label}</button>)}
          </nav>
          <button className="employee-logout" onClick={logout}><LogOut size={17} /> تسجيل الخروج</button>
        </aside>

        <section className="employee-content">
          <header className="employee-top">
            <div><h1>مرحباً، {employee?.full_name || user?.name || 'موظف'}</h1><p>لوحة تشغيل موحدة بصلاحيات محددة للمورد: {employee?.supplier_name || '—'}</p></div>
            <div className="employee-actions"><button className="employee-action" onClick={() => loadDashboard(true)} disabled={refreshing}><RefreshCw size={16} /> {refreshing ? 'جاري التحديث' : 'تحديث'}</button><button className="employee-action primary" onClick={() => setActiveTab('security')}><KeyRound size={16} /> الأمان</button></div>
          </header>

          {activeTab !== 'security' && <>
            <div className="employee-hero"><div><h2>مساحة عمل آمنة ومحددة النطاق</h2><p><ShieldCheck size={16} style={{verticalAlign:'middle'}} /> بياناتك التشغيلية مرتبطة بالمورد المسجل في حسابك فقط.</p></div><button className={`employee-status ${employee?.is_accepting_orders ? '' : 'off'}`} onClick={setAvailability} disabled={savingStatus}>{employee?.is_accepting_orders ? 'متاح لاستقبال المهام' : 'غير متاح حالياً'}</button></div>
            {activeTab === 'overview' && <>
              <div className="employee-grid"><div className="employee-card employee-stat"><div className="employee-stat-top"><span>إجمالي السيارات</span><Car size={19}/></div><strong>{stats.cars?.total ?? 0}</strong><small>{stats.cars?.available ?? 0} متاحة للتأجير</small></div><div className="employee-card employee-stat"><div className="employee-stat-top"><span>الحجوزات المفتوحة</span><CalendarDays size={19}/></div><strong>{stats.reservations?.open ?? 0}</strong><small>من أصل {stats.reservations?.total ?? 0}</small></div><div className="employee-card employee-stat"><div className="employee-stat-top"><span>الحجوزات المكتملة</span><CheckCircle2 size={19}/></div><strong>{stats.reservations?.completed ?? 0}</strong><small>حجوزات منتهية</small></div><div className="employee-card employee-stat"><div className="employee-stat-top"><span>إيرادات المورد</span><WalletCards size={19}/></div><strong>{formatMoney(stats.reservations?.revenue)}</strong><small>ملخص تشغيلي</small></div></div>
              <div className="employee-two"><div className="employee-card"><div className="employee-card-head"><h3>آخر الحجوزات</h3>{canViewReservations && <button className="employee-link" onClick={() => setActiveTab('reservations')}>عرض الكل <ArrowLeft size={14} style={{verticalAlign:'middle'}}/></button>}</div>{canViewReservations && stats.recentReservations?.length ? <div className="employee-list">{stats.recentReservations.slice(0,6).map((reservation) => <div className="employee-row" key={reservation.id}><div><strong>{reservation.make} {reservation.model}</strong><small>{reservation.customer_name || 'عميل'} · {formatDate(reservation.start_date)} — {formatDate(reservation.end_date)}</small></div><span className={`employee-badge ${reservation.status}`}>{statusLabels[reservation.status] || reservation.status}</span></div>)}</div> : <div className="employee-empty">لا توجد حجوزات ضمن صلاحيتك حالياً.</div>}</div><div className="employee-card"><h3>بيانات الحساب</h3><div className="employee-list"><div className="employee-row"><span><UserRound size={16}/> الاسم</span><strong>{employee?.full_name || '—'}</strong></div><div className="employee-row"><span><ShieldCheck size={16}/> الدور</span><strong>{employee?.role || 'موظف'}</strong></div><div className="employee-row"><span><Clock3 size={16}/> آخر نشاط</span><strong>{formatDate(employee?.last_active_at)}</strong></div></div></div></div>
              <div className="employee-card" style={{marginTop:18}}><div className="employee-card-head"><h3>صلاحياتك الحالية</h3><span className="employee-badge"><ShieldCheck size={14}/> {permissions.length} صلاحية</span></div>{permissions.length ? <div className="employee-permissions">{permissions.map((permission) => {const meta = permissionMeta[permission.name] || {label: permission.name, description: permission.description || 'صلاحية مخصصة', icon: ShieldCheck};const Icon = meta.icon;return <div className="employee-permission" key={permission.id}><Icon size={18}/><div><strong>{meta.label}</strong><small>{meta.description}</small></div></div>})}</div> : <div className="employee-empty">لم يعيّن المورد صلاحيات تشغيلية لهذا الحساب بعد.</div>}</div>
            </>}
            {activeTab === 'cars' && <div className="employee-card"><div className="employee-card-head"><h3>سيارات المورد</h3><span className="employee-badge"><Car size={14}/> {cars.length} سيارة</span></div>{cars.length ? <div className="employee-table"><table><thead><tr><th>السيارة</th><th>السنة</th><th>السعر اليومي</th><th>الحالة</th><th>الاعتماد</th></tr></thead><tbody>{cars.map((car) => <tr key={car.id}><td><strong>{car.make} {car.model}</strong></td><td>{car.year || '—'}</td><td>{formatMoney(car.price_per_day)}</td><td><span className={`employee-badge ${car.status !== 'available' ? 'pending' : ''}`}>{car.status === 'available' ? 'متاحة' : car.status}</span></td><td>{car.is_approved ? <CheckCircle2 color="#197045" size={18}/> : <Clock3 color="#9a6a16" size={18}/>}</td></tr>)}</tbody></table></div> : <div className="employee-empty">لا توجد سيارات متاحة ضمن صلاحيتك.</div>}</div>}
            {activeTab === 'reservations' && <div className="employee-card"><div className="employee-card-head"><h3>حجوزات المورد</h3><span className="employee-badge"><CalendarDays size={14}/> {reservations.length} حجز</span></div>{reservations.length ? <div className="employee-table"><table><thead><tr><th>السيارة</th><th>العميل</th><th>الفترة</th><th>القيمة</th><th>الحالة</th></tr></thead><tbody>{reservations.map((reservation) => <tr key={reservation.id}><td>{reservation.make} {reservation.model}</td><td>{reservation.customer_name || '—'}</td><td>{formatDate(reservation.start_date)} — {formatDate(reservation.end_date)}</td><td>{formatMoney(reservation.total_price)}</td><td><span className={`employee-badge ${reservation.status}`}>{statusLabels[reservation.status] || reservation.status}</span></td></tr>)}</tbody></table></div> : <div className="employee-empty">لا توجد حجوزات ضمن صلاحيتك.</div>}</div>}
          </>}

          {activeTab === 'security' && <div className="employee-card employee-security"><div className="employee-card-head"><h3><KeyRound size={19} style={{verticalAlign:'middle'}}/> إعدادات الأمان</h3><span className="employee-badge"><ShieldCheck size={14}/> حساب محمي</span></div><p style={{color:'#71818c',lineHeight:1.8}}>غيّر كلمة المرور دورياً. لا تشارك بيانات الدخول، وسيظل وصولك محصوراً في المورد المرتبط بحسابك.</p><form className="employee-form" onSubmit={changePassword}><label>كلمة المرور الحالية<input type="password" value={passwords.current_password} onChange={(e)=>setPasswords({...passwords,current_password:e.target.value})} autoComplete="current-password" required={!employee?.must_change_password}/></label><label>كلمة المرور الجديدة<input type="password" value={passwords.new_password} onChange={(e)=>setPasswords({...passwords,new_password:e.target.value})} minLength="8" autoComplete="new-password" required/></label><label>تأكيد كلمة المرور<input type="password" value={passwords.confirm_password} onChange={(e)=>setPasswords({...passwords,confirm_password:e.target.value})} minLength="8" autoComplete="new-password" required/></label><button className="employee-action primary" type="submit" disabled={changingPassword}>{changingPassword ? 'جاري الحفظ...' : 'حفظ كلمة المرور'}</button></form></div>}
        </section>
      </div>
    </main>
  );
}
