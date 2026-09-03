import { useEffect, useMemo, useState } from 'react';
import { Activity, BarChart3, CalendarDays, Car, LogOut, RefreshCw, ShieldCheck, Users, WalletCards, Megaphone } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';

const ROLE_META = {
  team_manager: { label: 'مدير فريق', icon: ShieldCheck },
  advertisements: { label: 'موظف إدارة الإعلانات والأداء', icon: Megaphone },
  reservations: { label: 'موظف إدارة الحجوزات', icon: CalendarDays },
  finance: { label: 'موظف الإدارة المالية', icon: WalletCards },
  fleet: { label: 'موظف إدارة أسطول السيارات', icon: Car },
};

const permissionToSection = {
  view_cars: 'fleet', manage_cars: 'fleet', view_fleet_performance: 'fleet',
  view_reservations: 'reservations', manage_reservations: 'reservations', view_customers: 'customers',
  view_advertisements: 'advertisements', manage_advertisements: 'advertisements', view_ad_performance: 'advertisements',
  view_finance: 'finance', manage_finance: 'finance',
  manage_team: 'team', view_team_performance: 'team',
};

const sectionMeta = {
  fleet: { label: 'إدارة أسطول السيارات', icon: Car, endpoint: '/employee-self/me/cars' },
  reservations: { label: 'إدارة الحجوزات', icon: CalendarDays, endpoint: '/employee-self/me/reservations' },
  customers: { label: 'العملاء', icon: Users, endpoint: '/employee-self/me/customers' },
  advertisements: { label: 'الإعلانات والأداء', icon: Megaphone, endpoint: '/employee-self/me/advertisements' },
  finance: { label: 'الإدارة المالية', icon: WalletCards, endpoint: '/employee-self/me/finance' },
  team: { label: 'إدارة الفريق والأداء', icon: Users, endpoint: '/employee-self/me/team' },
};

const roleLabels = (role) => ROLE_META[role]?.label || 'موظف';

export default function EmployeeWorkspace() {
  const { logout } = useAuthStore();
  const [employee, setEmployee] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [overview, setOverview] = useState(null);
  const [activeSection, setActiveSection] = useState('overview');
  const [sectionData, setSectionData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sectionLoading, setSectionLoading] = useState(false);

  const permissionNames = useMemo(() => new Set(permissions.map((p) => p.name)), [permissions]);
  const sections = useMemo(() => {
    const names = [...permissionNames];
    const available = new Set(names.map((name) => permissionToSection[name]).filter(Boolean));
    return [...available];
  }, [permissionNames]);

  const load = async () => {
    try {
      setLoading(true);
      const [employeeRes, permissionsRes, overviewRes] = await Promise.all([
        api.get('/employee-self/me'), api.get('/employee-self/me/permissions'), api.get('/employee-self/me/overview'),
      ]);
      setEmployee(employeeRes.data.data);
      setPermissions(permissionsRes.data.data || []);
      setOverview(overviewRes.data.data || {});
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذر تحميل مساحة عمل الموظف');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (activeSection === 'overview' || !sectionMeta[activeSection]) return;
    const meta = sectionMeta[activeSection];
    setSectionLoading(true);
    api.get(meta.endpoint)
      .then((response) => setSectionData(response.data.data || []))
      .catch((error) => toast.error(error.response?.data?.message || 'تعذر تحميل القسم'))
      .finally(() => setSectionLoading(false));
  }, [activeSection]);

  if (loading) return <div dir="rtl" style={styles.loading}>جارٍ تجهيز مساحة العمل...</div>;

  const role = employee?.job_role || 'fleet';
  const RoleIcon = ROLE_META[role]?.icon || Activity;
  const cards = [
    { key: 'fleet', icon: Car, title: 'أسطول السيارات', value: overview?.cars?.total, visible: sections.includes('fleet') },
    { key: 'reservations', icon: CalendarDays, title: 'الحجوزات', value: overview?.reservations?.total, visible: sections.includes('reservations') },
    { key: 'advertisements', icon: Megaphone, title: 'طلبات الإعلانات', value: overview?.advertisements?.requests_total, visible: sections.includes('advertisements') },
    { key: 'finance', icon: WalletCards, title: 'قيمة الحجوزات', value: overview?.finance?.reservation_revenue, visible: sections.includes('finance') },
    { key: 'team', icon: Users, title: 'أعضاء الفريق', value: overview?.team?.total, visible: sections.includes('team') },
  ].filter((item) => item.visible);

  return (
    <main dir="rtl" style={styles.page}>
      <div style={styles.wrap}>
        <header style={styles.header}>
          <div style={styles.identity}>
            <div style={styles.avatar}><RoleIcon size={26} /></div>
            <div><small style={styles.kicker}>EMPLOYEE WORKSPACE</small><h1 style={styles.title}>{employee?.full_name || 'موظف'}</h1><p style={styles.subtitle}>{roleLabels(role)} · {employee?.supplier_name || 'المورد'}</p></div>
          </div>
          <div style={styles.headerActions}><button style={styles.iconButton} onClick={load}><RefreshCw size={17} /> تحديث</button><button style={styles.logout} onClick={logout}><LogOut size={17} /> خروج</button></div>
        </header>

        <div style={styles.layout}>
          <aside style={styles.sidebar}>
            <button style={{ ...styles.navButton, ...(activeSection === 'overview' ? styles.navActive : {}) }} onClick={() => setActiveSection('overview')}><BarChart3 size={18} /> لوحة القسم</button>
            {sections.map((key) => { const Meta = sectionMeta[key]; const Icon = Meta.icon; return <button key={key} style={{ ...styles.navButton, ...(activeSection === key ? styles.navActive : {}) }} onClick={() => setActiveSection(key)}><Icon size={18} /> {Meta.label}</button>; })}
            <div style={styles.permissionBox}><strong>صلاحيات الحساب</strong><span>{permissions.length} صلاحية مفعلة</span></div>
          </aside>

          <section style={styles.content}>
            {activeSection === 'overview' ? <>
              <div style={styles.hero}><div><span style={styles.heroTag}>المسؤولية الحالية</span><h2>{roleLabels(role)}</h2><p>هذه المساحة تعرض لك فقط الأقسام والبيانات التي تسمح بها صلاحيات حسابك.</p></div><RoleIcon size={50} /></div>
              <div style={styles.cards}>{cards.map(({ key, icon: Icon, title, value }) => <button key={key} style={styles.card} onClick={() => setActiveSection(key)}><Icon size={22} /><span>{title}</span><strong>{value ?? '—'}</strong><small>فتح القسم ←</small></button>)}</div>
              {sections.includes('advertisements') && overview?.advertisements?.performance && <div style={styles.panel}><h3>أداء الإعلانات</h3><div style={styles.metrics}><Metric label="الإعلانات النشطة" value={overview.advertisements.performance.active_ads} /><Metric label="الظهور" value={overview.advertisements.performance.impressions} /><Metric label="النقرات" value={overview.advertisements.performance.clicks} /></div></div>}
              {sections.includes('fleet') && overview?.cars?.performance && <div style={styles.panel}><h3>أداء الأسطول</h3><div style={styles.metrics}><Metric label="إجمالي السيارات" value={overview.cars.performance.total} /><Metric label="المعتمدة" value={overview.cars.performance.approved} /><Metric label="المتاحة" value={overview.cars.performance.available} /></div></div>}
            </> : <DepartmentView section={activeSection} data={sectionData} loading={sectionLoading} permissionNames={permissionNames} />}
          </section>
        </div>
      </div>
    </main>
  );
}

function Metric({ label, value }) { return <div style={styles.metric}><span>{label}</span><strong>{value ?? 0}</strong></div>; }

function DepartmentView({ section, data, loading, permissionNames }) {
  const meta = sectionMeta[section];
  const Icon = meta.icon;
  const canManage = permissionNames.has(section === 'fleet' ? 'manage_cars' : section === 'reservations' ? 'manage_reservations' : section === 'advertisements' ? 'manage_advertisements' : section === 'finance' ? 'manage_finance' : section === 'team' ? 'manage_team' : 'view_customers');
  return <>
    <div style={styles.sectionHead}><div><span style={styles.kicker}>DEPARTMENT</span><h2 style={styles.sectionTitle}><Icon size={24} /> {meta.label}</h2><p>{canManage ? 'لديك صلاحية الإدارة في هذا القسم.' : 'لديك صلاحية العرض في هذا القسم.'}</p></div></div>
    <div style={styles.panel}>
      {loading ? <div style={styles.empty}>جارٍ تحميل البيانات...</div> : Array.isArray(data) && data.length ? <div style={styles.table}>{data.map((row, index) => <div key={row.id || index} style={styles.row}><div><strong>{row.title || row.make && `${row.make} ${row.model}` || row.full_name || row.name || `سجل ${index + 1}`}</strong><small>{row.status || row.email || row.customer_name || row.placement || ''}</small></div><span>{row.price_per_day ?? row.total_price ?? row.requested_budget ?? row.completed_revenue ?? ''}</span></div>)}</div> : <div style={styles.empty}>لا توجد بيانات متاحة حالياً.</div>}
      {canManage && <div style={styles.manageHint}>صلاحية الإدارة مفعلة. ربط أزرار الإضافة والتعديل والاعتماد بعمليات القسم يتم عبر واجهات الـAPI المحمية.</div>}
    </div>
  </>;
}

const styles = {
  page: { minHeight: '100vh', background: '#f4f7f9', padding: '28px 20px 60px', color: '#173a52' },
  wrap: { maxWidth: 1450, margin: '0 auto' }, header: { background: '#fff', border: '1px solid #e5edf1', borderRadius: 24, padding: 22, display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'center', flexWrap: 'wrap', boxShadow: '0 12px 35px rgba(23,58,82,.06)' },
  identity: { display: 'flex', alignItems: 'center', gap: 14 }, avatar: { width: 58, height: 58, borderRadius: 18, display: 'grid', placeItems: 'center', background: '#e6f7f3', color: '#087f68' }, kicker: { color: '#0b8a73', fontSize: 10, fontWeight: 900, letterSpacing: 1.2 }, title: { margin: '4px 0', fontSize: 26 }, subtitle: { margin: 0, color: '#748692' }, headerActions: { display: 'flex', gap: 8 }, iconButton: { display: 'inline-flex', alignItems: 'center', gap: 7, border: '1px solid #dce6ea', background: '#fff', color: '#173a52', padding: '10px 13px', borderRadius: 11, fontWeight: 800, cursor: 'pointer' }, logout: { display: 'inline-flex', alignItems: 'center', gap: 7, border: '1px solid #f0dada', background: '#fff7f7', color: '#b64040', padding: '10px 13px', borderRadius: 11, fontWeight: 800, cursor: 'pointer' },
  layout: { display: 'grid', gridTemplateColumns: '250px minmax(0,1fr)', gap: 18, marginTop: 18 }, sidebar: { background: '#fff', border: '1px solid #e5edf1', borderRadius: 20, padding: 14, height: 'max-content', position: 'sticky', top: 20, boxShadow: '0 10px 28px rgba(23,58,82,.05)' }, navButton: { width: '100%', border: 0, background: 'transparent', color: '#566b77', padding: '12px 13px', borderRadius: 11, display: 'flex', alignItems: 'center', gap: 9, textAlign: 'right', font: 'inherit', fontWeight: 800, cursor: 'pointer', marginBottom: 5 }, navActive: { background: '#eaf7f4', color: '#087f68' }, permissionBox: { marginTop: 15, padding: 13, borderRadius: 12, background: '#f5f8fa', color: '#627783', display: 'grid', gap: 5, fontSize: 12 }, content: { minWidth: 0 }, hero: { background: 'linear-gradient(135deg,#173a52,#24647d)', color: '#fff', borderRadius: 22, padding: 26, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20 }, heroTag: { color: '#7ef5d3', fontSize: 10, fontWeight: 900 }, hero h2: { margin: '8px 0', fontSize: 26 }, hero p: { margin: 0, color: '#d7e9ef' }, cards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 13, marginTop: 16 }, card: { border: '1px solid #e5edf1', background: '#fff', borderRadius: 18, padding: 18, textAlign: 'right', display: 'grid', gap: 8, color: '#173a52', cursor: 'pointer', boxShadow: '0 9px 25px rgba(23,58,82,.05)' }, panel: { marginTop: 16, background: '#fff', border: '1px solid #e5edf1', borderRadius: 18, padding: 20, boxShadow: '0 9px 25px rgba(23,58,82,.04)' }, panel h3: { margin: '0 0 15px' }, metrics: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }, metric: { padding: 15, borderRadius: 13, background: '#f6f9fa', display: 'grid', gap: 6 }, metric span: { color: '#7a8b94', fontSize: 12 }, metric strong: { fontSize: 23 }, sectionHead: { background: '#fff', border: '1px solid #e5edf1', borderRadius: 18, padding: 20 }, sectionTitle: { margin: '7px 0', display: 'flex', alignItems: 'center', gap: 8 }, sectionHead p: { margin: 0, color: '#758691' }, table: { display: 'grid', gap: 8 }, row: { border: '1px solid #edf1f3', borderRadius: 13, padding: 13, display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }, row strong: { display: 'block' }, row small: { display: 'block', color: '#7d8c94', marginTop: 4 }, empty: { padding: 35, textAlign: 'center', color: '#7d8d95' }, manageHint: { marginTop: 15, padding: 12, background: '#fff9e8', borderRadius: 11, color: '#806a28', fontSize: 12, lineHeight: 1.7 }, loading: { minHeight: '70vh', display: 'grid', placeItems: 'center', color: '#657984' },
};
