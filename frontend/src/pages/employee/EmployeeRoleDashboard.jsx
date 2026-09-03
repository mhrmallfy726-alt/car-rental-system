import { useEffect, useMemo, useState } from 'react';
import { Activity, BarChart3, CalendarDays, Car, LogOut, Megaphone, RefreshCw, ShieldCheck, Users, WalletCards } from 'lucide-react';
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

const SECTION_META = {
  fleet: { label: 'أسطول السيارات', icon: Car, endpoint: '/employee-self/me/cars' },
  reservations: { label: 'الحجوزات', icon: CalendarDays, endpoint: '/employee-self/me/reservations' },
  customers: { label: 'العملاء', icon: Users, endpoint: '/employee-self/me/customers' },
  advertisements: { label: 'الإعلانات والأداء', icon: Megaphone, endpoint: '/employee-self/me/advertisements' },
  finance: { label: 'الإدارة المالية', icon: WalletCards, endpoint: '/employee-self/me/finance' },
  team: { label: 'الفريق والأداء', icon: Users, endpoint: '/employee-self/me/team' },
};

const PERMISSION_SECTION = {
  view_cars: 'fleet', manage_cars: 'fleet', view_fleet_performance: 'fleet',
  view_reservations: 'reservations', manage_reservations: 'reservations', view_customers: 'customers',
  view_advertisements: 'advertisements', manage_advertisements: 'advertisements', view_ad_performance: 'advertisements',
  view_finance: 'finance', manage_finance: 'finance', manage_team: 'team', view_team_performance: 'team',
};

const roleLabel = (role) => ROLE_META[role]?.label || 'موظف';

export default function EmployeeRoleDashboard() {
  const { logout } = useAuthStore();
  const [employee, setEmployee] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [overview, setOverview] = useState({});
  const [active, setActive] = useState('overview');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSection, setLoadingSection] = useState(false);

  const permissionNames = useMemo(() => new Set(permissions.map((p) => p.name)), [permissions]);
  const sections = useMemo(() => [...new Set([...permissionNames].map((p) => PERMISSION_SECTION[p]).filter(Boolean))], [permissionNames]);

  const loadWorkspace = async () => {
    try {
      setLoading(true);
      const [me, perms, summary] = await Promise.all([
        api.get('/employee-self/me'),
        api.get('/employee-self/me/permissions'),
        api.get('/employee-self/me/overview'),
      ]);
      setEmployee(me.data.data);
      setPermissions(perms.data.data || []);
      setOverview(summary.data.data || {});
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذر تحميل مساحة العمل');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadWorkspace(); }, []);

  useEffect(() => {
    if (active === 'overview') return;
    const meta = SECTION_META[active];
    if (!meta) return;
    setLoadingSection(true);
    api.get(meta.endpoint)
      .then((response) => setData(response.data.data || []))
      .catch((error) => toast.error(error.response?.data?.message || 'تعذر تحميل القسم'))
      .finally(() => setLoadingSection(false));
  }, [active]);

  if (loading) return <main dir="rtl" style={styles.loading}>جارٍ تجهيز مساحة العمل...</main>;

  const role = employee?.job_role || 'fleet';
  const RoleIcon = ROLE_META[role]?.icon || Activity;
  const cards = [
    { key: 'fleet', title: 'أسطول السيارات', icon: Car, value: overview.cars?.total },
    { key: 'reservations', title: 'الحجوزات', icon: CalendarDays, value: overview.reservations?.total },
    { key: 'advertisements', title: 'طلبات الإعلانات', icon: Megaphone, value: overview.advertisements?.requests_total },
    { key: 'finance', title: 'إيرادات الحجوزات', icon: WalletCards, value: overview.finance?.reservation_revenue },
    { key: 'team', title: 'أعضاء الفريق', icon: Users, value: overview.team?.total },
  ].filter((card) => sections.includes(card.key));

  return <main dir="rtl" style={styles.page}>
    <div style={styles.wrap}>
      <header style={styles.header}>
        <div style={styles.identity}>
          <div style={styles.avatar}><RoleIcon size={27} /></div>
          <div><span style={styles.kicker}>مساحة عمل الموظف</span><h1 style={styles.title}>{employee?.full_name || 'موظف'}</h1><p style={styles.muted}>{roleLabel(role)} · {employee?.supplier_name || 'المورد'}</p></div>
        </div>
        <div style={styles.actions}><button style={styles.secondary} onClick={loadWorkspace}><RefreshCw size={16} /> تحديث</button><button style={styles.danger} onClick={logout}><LogOut size={16} /> خروج</button></div>
      </header>

      <div style={styles.layout}>
        <aside style={styles.sidebar}>
          <Nav active={active} value="overview" label="لوحة القسم" icon={BarChart3} onClick={setActive} />
          {sections.map((key) => { const item = SECTION_META[key]; return <Nav key={key} active={active} value={key} label={item.label} icon={item.icon} onClick={setActive} />; })}
          <div style={styles.permissionBox}><strong>الصلاحيات</strong><span>{permissions.length} صلاحية مفعلة</span></div>
        </aside>

        <section style={styles.content}>
          {active === 'overview' ? <>
            <section style={styles.hero}><div><span style={styles.heroTag}>المسؤولية الوظيفية</span><h2>{roleLabel(role)}</h2><p>تظهر هنا الأقسام والبيانات المسموح بها فقط حسب صلاحيات الحساب.</p></div><RoleIcon size={52} /></section>
            <div style={styles.cards}>{cards.map((card) => <button key={card.key} style={styles.card} onClick={() => setActive(card.key)}><card.icon size={23} /><span>{card.title}</span><strong>{card.value ?? '—'}</strong><small>فتح القسم ←</small></button>)}</div>
            <Performance overview={overview} sections={sections} />
          </> : <Department section={active} data={data} loading={loadingSection} permissions={permissionNames} />}
        </section>
      </div>
    </div>
  </main>;
}

function Nav({ active, value, label, icon: Icon, onClick }) {
  return <button onClick={() => onClick(value)} style={{ ...styles.nav, ...(active === value ? styles.navActive : {}) }}><Icon size={18} />{label}</button>;
}

function Performance({ overview, sections }) {
  const blocks = [];
  if (sections.includes('advertisements') && overview.advertisements?.performance) blocks.push(['أداء الإعلانات', overview.advertisements.performance]);
  if (sections.includes('fleet') && overview.cars?.performance) blocks.push(['أداء الأسطول', overview.cars.performance]);
  if (!blocks.length) return null;
  return <>{blocks.map(([title, values]) => <section key={title} style={styles.panel}><h3>{title}</h3><div style={styles.metrics}>{Object.entries(values).map(([key, value]) => <div key={key} style={styles.metric}><span>{metricLabel(key)}</span><strong>{value ?? 0}</strong></div>)}</div></section>)}</>;
}

function Department({ section, data, loading, permissions }) {
  const meta = SECTION_META[section];
  const Icon = meta.icon;
  const managePermission = { fleet: 'manage_cars', reservations: 'manage_reservations', advertisements: 'manage_advertisements', finance: 'manage_finance', team: 'manage_team', customers: 'view_customers' }[section];
  const canManage = permissions.has(managePermission);
  return <>
    <section style={styles.sectionHead}><span style={styles.kicker}>القسم</span><h2 style={styles.sectionTitle}><Icon size={24} /> {meta.label}</h2><p>{canManage ? 'لديك صلاحية الإدارة في هذا القسم.' : 'لديك صلاحية العرض في هذا القسم.'}</p></section>
    <section style={styles.panel}>{loading ? <div style={styles.empty}>جارٍ تحميل البيانات...</div> : Array.isArray(data) && data.length ? <div style={styles.rows}>{data.map((row, index) => <div key={row.id || index} style={styles.row}><div><strong>{row.title || (row.make && `${row.make} ${row.model}`) || row.full_name || row.name || `سجل ${index + 1}`}</strong><small>{row.status || row.email || row.customer_name || row.placement || ''}</small></div><span>{row.price_per_day ?? row.total_price ?? row.requested_budget ?? row.completed_revenue ?? ''}</span></div>)}</div> : <div style={styles.empty}>لا توجد بيانات متاحة حالياً.</div>}{canManage && <div style={styles.notice}>صلاحية الإدارة مفعلة لهذا القسم. العمليات التنفيذية ستُحمى من الـBackend ولا تعتمد على إخفاء الأزرار فقط.</div>}</section>
  </>;
}

function metricLabel(key) {
  const labels = { active_ads: 'إعلانات نشطة', impressions: 'الظهور', clicks: 'النقرات', total: 'الإجمالي', approved: 'المعتمد', available: 'المتاح' };
  return labels[key] || key;
}

const styles = {
  page: { minHeight: '100vh', background: '#f4f7f9', padding: '28px 20px 60px', color: '#173a52' }, wrap: { maxWidth: 1450, margin: '0 auto' },
  header: { background: '#fff', border: '1px solid #e5edf1', borderRadius: 22, padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 15, flexWrap: 'wrap', boxShadow: '0 10px 30px rgba(23,58,82,.05)' },
  identity: { display: 'flex', alignItems: 'center', gap: 13 }, avatar: { width: 58, height: 58, borderRadius: 17, display: 'grid', placeItems: 'center', background: '#e6f7f3', color: '#087f68' }, kicker: { color: '#0b8a73', fontSize: 10, fontWeight: 900 }, title: { margin: '4px 0', fontSize: 26 }, muted: { margin: 0, color: '#748692' }, actions: { display: 'flex', gap: 8 }, secondary: { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 13px', border: '1px solid #dce6ea', background: '#fff', borderRadius: 11, cursor: 'pointer', fontWeight: 800, color: '#173a52' }, danger: { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 13px', border: '1px solid #f0dada', background: '#fff7f7', borderRadius: 11, cursor: 'pointer', fontWeight: 800, color: '#b64040' },
  layout: { display: 'grid', gridTemplateColumns: '250px minmax(0,1fr)', gap: 18, marginTop: 18 }, sidebar: { background: '#fff', border: '1px solid #e5edf1', borderRadius: 20, padding: 14, height: 'max-content', position: 'sticky', top: 20 }, nav: { width: '100%', display: 'flex', alignItems: 'center', gap: 9, border: 0, background: 'transparent', color: '#566b77', padding: '12px 13px', borderRadius: 11, cursor: 'pointer', font: 'inherit', fontWeight: 800, textAlign: 'right', marginBottom: 5 }, navActive: { background: '#eaf7f4', color: '#087f68' }, permissionBox: { marginTop: 15, padding: 13, borderRadius: 12, background: '#f5f8fa', display: 'grid', gap: 5, color: '#627783', fontSize: 12 },
  content: { minWidth: 0 }, hero: { background: 'linear-gradient(135deg,#173a52,#24647d)', color: '#fff', borderRadius: 22, padding: 26, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20 }, heroTag: { color: '#7ef5d3', fontSize: 10, fontWeight: 900 }, cards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 13, marginTop: 16 }, card: { border: '1px solid #e5edf1', background: '#fff', borderRadius: 18, padding: 18, textAlign: 'right', display: 'grid', gap: 8, color: '#173a52', cursor: 'pointer', boxShadow: '0 9px 25px rgba(23,58,82,.05)' }, panel: { marginTop: 16, background: '#fff', border: '1px solid #e5edf1', borderRadius: 18, padding: 20 }, metrics: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }, metric: { padding: 14, borderRadius: 12, background: '#f6f9fa', display: 'grid', gap: 5 }, sectionHead: { background: '#fff', border: '1px solid #e5edf1', borderRadius: 18, padding: 20 }, sectionTitle: { display: 'flex', alignItems: 'center', gap: 8, margin: '6px 0' }, rows: { display: 'grid', gap: 8 }, row: { border: '1px solid #edf1f3', borderRadius: 12, padding: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }, empty: { textAlign: 'center', padding: 35, color: '#7d8d95' }, notice: { marginTop: 14, padding: 12, borderRadius: 11, background: '#fff8e8', color: '#806a28', fontSize: 12, lineHeight: 1.7 }, loading: { minHeight: '70vh', display: 'grid', placeItems: 'center', color: '#667984' },
};
