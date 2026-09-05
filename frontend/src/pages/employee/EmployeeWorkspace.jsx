import { useEffect, useMemo, useState } from 'react';
import { Activity, BarChart3, CalendarDays, Car, Check, LogOut, Megaphone, RefreshCw, ShieldCheck, Trash2, Users, WalletCards, X } from 'lucide-react';
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

const SECTIONS = {
  fleet: { label: 'إدارة أسطول السيارات', icon: Car, endpoint: '/employee-self/me/cars', manage: 'manage_cars' },
  reservations: { label: 'إدارة الحجوزات', icon: CalendarDays, endpoint: '/employee-self/me/reservations', manage: 'manage_reservations' },
  customers: { label: 'العملاء', icon: Users, endpoint: '/employee-self/me/customers', manage: 'view_customers' },
  advertisements: { label: 'الإعلانات والأداء', icon: Megaphone, endpoint: '/employee-self/me/advertisements', manage: 'manage_advertisements' },
  finance: { label: 'الإدارة المالية', icon: WalletCards, endpoint: '/employee-self/me/finance', manage: 'manage_finance' },
  team: { label: 'إدارة الفريق والأداء', icon: Users, endpoint: '/employee-self/me/team', manage: 'manage_team' },
};

const PERMISSION_SECTION = {
  view_cars: 'fleet', manage_cars: 'fleet', view_fleet_performance: 'fleet',
  view_reservations: 'reservations', manage_reservations: 'reservations', view_customers: 'customers',
  view_advertisements: 'advertisements', manage_advertisements: 'advertisements', view_ad_performance: 'advertisements',
  view_finance: 'finance', manage_finance: 'finance', manage_team: 'team', view_team_performance: 'team',
};

const roleLabel = (role) => ROLE_META[role]?.label || 'تخصص غير محدد';

export default function EmployeeWorkspace() {
  const { logout } = useAuthStore();
  const [employee, setEmployee] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [overview, setOverview] = useState({});
  const [active, setActive] = useState('overview');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const permissionNames = useMemo(() => new Set(permissions.map((p) => p.name)), [permissions]);
  const sections = useMemo(() => [...new Set(permissions.map((p) => PERMISSION_SECTION[p.name]).filter(Boolean))], [permissions]);

  const loadWorkspace = async () => {
    try {
      setLoading(true);
      const [me, perms, summary] = await Promise.all([
        api.get('/employee-self/me'),
        api.get('/employee-self/me/permissions'),
        api.get('/employee-self/me/overview'),
      ]);
      setEmployee(me.data.data || {});
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
    const section = SECTIONS[active];
    if (!section) return;
    setSectionLoading(true);
    api.get(section.endpoint)
      .then((response) => setRows(Array.isArray(response.data.data) ? response.data.data : []))
      .catch((error) => { setRows([]); toast.error(error.response?.data?.message || 'تعذر تحميل القسم'); })
      .finally(() => setSectionLoading(false));
  }, [active]);

  const runManagementAction = async (section, row, action) => {
    setActionLoading(`${section}-${row.id}-${action}`);
    try {
      if (section === 'reservations') {
        const status = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'completed';
        await api.put(`/employee-self/me/reservations/${row.id}`, { status });
      } else if (section === 'fleet' && action === 'delete') {
        await api.delete(`/employee-self/me/cars/${row.id}`);
      }
      toast.success('تم تنفيذ العملية بنجاح');
      const sectionConfig = SECTIONS[section];
      const response = await api.get(sectionConfig.endpoint);
      setRows(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذر تنفيذ العملية');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <main dir="rtl" style={styles.loading}>جارٍ تجهيز مساحة العمل...</main>;

  const role = employee?.job_role || 'fleet';
  const RoleIcon = ROLE_META[role]?.icon || Activity;
  const cards = [
    ['fleet', 'أسطول السيارات', Car, overview.cars?.total],
    ['reservations', 'الحجوزات', CalendarDays, overview.reservations?.total],
    ['advertisements', 'طلبات الإعلانات', Megaphone, overview.advertisements?.requests_total],
    ['finance', 'قيمة الحجوزات', WalletCards, overview.finance?.reservation_revenue],
    ['team', 'أعضاء الفريق', Users, overview.team?.total],
  ].filter(([key]) => sections.includes(key));

  return <main dir="rtl" style={styles.page}><div style={styles.wrap}>
    <header style={styles.header}>
      <div style={styles.identity}><div style={styles.avatar}><RoleIcon size={27} /></div><div><span style={styles.kicker}>مساحة عمل الموظف</span><h1 style={styles.title}>{employee?.full_name || 'عضو الفريق'}</h1><p style={styles.muted}>{roleLabel(role)} · {employee?.supplier_name || 'المورد'}</p></div></div>
      <div style={styles.actions}><button style={styles.secondary} onClick={loadWorkspace}><RefreshCw size={16} /> تحديث</button><button style={styles.danger} onClick={logout}><LogOut size={16} /> خروج</button></div>
    </header>

    <div style={styles.layout}>
      <aside style={styles.sidebar}>
        <Nav active={active} value="overview" label="لوحة القسم" icon={BarChart3} onClick={setActive} />
        {sections.map((key) => { const item = SECTIONS[key]; return <Nav key={key} active={active} value={key} label={item.label} icon={item.icon} onClick={setActive} />; })}
        <div style={styles.permissionBox}><strong>صلاحيات الحساب</strong><span>{permissions.length} صلاحية مفعلة</span></div>
      </aside>

      <section style={styles.content}>
          {active === 'overview' ? <Overview role={role} RoleIcon={RoleIcon} cards={cards} overview={overview} setActive={setActive} sections={sections} /> : <Department section={active} rows={rows} loading={sectionLoading} permissions={permissionNames} actionLoading={actionLoading} onAction={runManagementAction} />}
      </section>
    </div>
  </div></main>;
}

function Overview({ role, RoleIcon, cards, overview, setActive, sections }) {
  return <>
    <section style={styles.hero}><div><span style={styles.heroTag}>المسؤولية الوظيفية</span><h2 style={styles.heroTitle}>{roleLabel(role)}</h2><p style={styles.heroText}>تظهر هنا الأقسام والبيانات المسموح بها فقط حسب صلاحيات الحساب.</p></div><RoleIcon size={52} /></section>
    <div style={styles.cards}>{cards.map(([key, title, Icon, value]) => <button key={key} style={styles.card} onClick={() => setActive(key)}><Icon size={22} /><span>{title}</span><strong>{value ?? '—'}</strong><small>فتح القسم ←</small></button>)}</div>
    {sections.includes('advertisements') && overview.advertisements?.performance && <Performance title="أداء الإعلانات" values={overview.advertisements.performance} labels={{ active_ads: 'الإعلانات النشطة', impressions: 'الظهور', clicks: 'النقرات' }} />}
    {sections.includes('fleet') && overview.cars?.performance && <Performance title="أداء الأسطول" values={overview.cars.performance} labels={{ total: 'إجمالي السيارات', approved: 'المعتمدة', available: 'المتاحة' }} />}
  </>;
}

function Performance({ title, values, labels }) {
  return <section style={styles.panel}><h3 style={styles.panelTitle}>{title}</h3><div style={styles.metrics}>{Object.entries(values).map(([key, value]) => <div key={key} style={styles.metric}><span>{labels[key] || key}</span><strong>{value ?? 0}</strong></div>)}</div></section>;
}

function Department({ section, rows, loading, permissions, actionLoading, onAction }) {
  const meta = SECTIONS[section];
  if (!meta) return null;
  const Icon = meta.icon;
  const canManage = permissions.has(meta.manage);
  const actionsFor = (row) => {
    if (!canManage) return null;
    if (section === 'reservations') return <div style={styles.rowActions}>
      {row.status === 'pending' && <><button style={styles.approveButton} disabled={actionLoading} onClick={() => onAction(section, row, 'approve')}><Check size={14} /> قبول</button><button style={styles.rejectButton} disabled={actionLoading} onClick={() => onAction(section, row, 'reject')}><X size={14} /> رفض</button></>}
      {row.status === 'active' && <button style={styles.approveButton} disabled={actionLoading} onClick={() => onAction(section, row, 'complete')}><Check size={14} /> إكمال</button>}
    </div>;
    if (section === 'fleet') return <button style={styles.rejectButton} disabled={actionLoading} onClick={() => window.confirm('هل تريد حذف هذه السيارة؟') && onAction(section, row, 'delete')}><Trash2 size={14} /> حذف</button>;
    return null;
  };
  return <><section style={styles.sectionHead}><span style={styles.kicker}>القسم</span><h2 style={styles.sectionTitle}><Icon size={24} /> {meta.label}</h2><p>{canManage ? 'لديك صلاحية الإدارة في هذا القسم.' : 'لديك صلاحية العرض في هذا القسم.'}</p></section><section style={styles.panel}>{loading ? <div style={styles.empty}>جارٍ تحميل البيانات...</div> : rows.length ? <div style={styles.rows}>{rows.map((row, index) => <div key={row.id || index} style={styles.row}><div><strong>{row.title || (row.make && `${row.make} ${row.model}`) || row.full_name || row.name || `سجل ${index + 1}`}</strong><small>{row.status || row.email || row.customer_name || row.placement || ''}</small></div><span>{row.price_per_day ?? row.total_price ?? row.requested_budget ?? row.completed_revenue ?? ''}</span>{actionsFor(row)}</div>)}</div> : <div style={styles.empty}>لا توجد بيانات متاحة حالياً.</div>}{canManage && <div style={styles.manageHint}>صلاحية الإدارة مفعلة: يمكنك تنفيذ الإجراءات المتاحة بجانب كل سجل.</div>}</section></>;
}

function Nav({ active, value, label, icon: Icon, onClick }) { return <button type="button" onClick={() => onClick(value)} style={{ ...styles.nav, ...(active === value ? styles.navActive : {}) }}><Icon size={18} />{label}</button>; }

const styles = {
  page: { minHeight: '100vh', background: '#f4f7f9', padding: '28px 20px 60px', color: '#173a52' }, wrap: { maxWidth: 1450, margin: '0 auto' },
  header: { background: '#fff', border: '1px solid #e5edf1', borderRadius: 22, padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 15, flexWrap: 'wrap' }, identity: { display: 'flex', alignItems: 'center', gap: 13 }, avatar: { width: 58, height: 58, borderRadius: 17, display: 'grid', placeItems: 'center', background: '#e6f7f3', color: '#087f68' }, kicker: { color: '#0b8a73', fontSize: 10, fontWeight: 900 }, title: { margin: '4px 0', fontSize: 26 }, muted: { margin: 0, color: '#748692' }, actions: { display: 'flex', gap: 8 }, secondary: { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 13px', border: '1px solid #dce6ea', background: '#fff', borderRadius: 11, cursor: 'pointer', fontWeight: 800, color: '#173a52' }, danger: { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 13px', border: '1px solid #f0dada', background: '#fff7f7', borderRadius: 11, cursor: 'pointer', fontWeight: 800, color: '#b64040' },
  layout: { display: 'grid', gridTemplateColumns: '250px minmax(0,1fr)', gap: 18, marginTop: 18 }, sidebar: { background: '#fff', border: '1px solid #e5edf1', borderRadius: 20, padding: 14, height: 'max-content', position: 'sticky', top: 20 }, nav: { width: '100%', display: 'flex', alignItems: 'center', gap: 9, border: 0, background: 'transparent', color: '#566b77', padding: '12px 13px', borderRadius: 11, cursor: 'pointer', font: 'inherit', fontWeight: 800, textAlign: 'right', marginBottom: 5 }, navActive: { background: '#eaf7f4', color: '#087f68' }, permissionBox: { marginTop: 15, padding: 13, borderRadius: 12, background: '#f5f8fa', display: 'grid', gap: 5, color: '#627783', fontSize: 12 }, content: { minWidth: 0 }, hero: { background: 'linear-gradient(135deg,#173a52,#24647d)', color: '#fff', borderRadius: 22, padding: 26, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20 }, heroTag: { color: '#7ef5d3', fontSize: 10, fontWeight: 900 }, heroTitle: { margin: '8px 0', fontSize: 26 }, heroText: { margin: 0, color: '#d7e9ef' }, cards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 13, marginTop: 16 }, card: { border: '1px solid #e5edf1', background: '#fff', borderRadius: 18, padding: 18, textAlign: 'right', display: 'grid', gap: 8, color: '#173a52', cursor: 'pointer' }, panel: { marginTop: 16, background: '#fff', border: '1px solid #e5edf1', borderRadius: 18, padding: 20 }, panelTitle: { margin: '0 0 15px' }, metrics: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }, metric: { padding: 14, borderRadius: 12, background: '#f6f9fa', display: 'grid', gap: 5 }, sectionHead: { background: '#fff', border: '1px solid #e5edf1', borderRadius: 18, padding: 20 }, sectionTitle: { display: 'flex', alignItems: 'center', gap: 8, margin: '6px 0' }, rows: { display: 'grid', gap: 8 }, row: { border: '1px solid #edf1f3', borderRadius: 12, padding: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }, rowActions: { display: 'flex', gap: 6, flexWrap: 'wrap' }, approveButton: { display: 'inline-flex', alignItems: 'center', gap: 4, border: 0, borderRadius: 8, padding: '7px 9px', color: '#fff', background: '#198754', cursor: 'pointer', fontWeight: 800, fontSize: 11 }, rejectButton: { display: 'inline-flex', alignItems: 'center', gap: 4, border: 0, borderRadius: 8, padding: '7px 9px', color: '#fff', background: '#dc3545', cursor: 'pointer', fontWeight: 800, fontSize: 11 }, empty: { textAlign: 'center', padding: 35, color: '#7d8d95' }, manageHint: { marginTop: 14, padding: 12, borderRadius: 11, background: '#fff8e8', color: '#806a28', fontSize: 12 }, loading: { minHeight: '70vh', display: 'grid', placeItems: 'center', color: '#667984' },
};
