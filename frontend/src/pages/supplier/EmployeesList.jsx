import { useEffect, useMemo, useState } from 'react';
import { BriefcaseBusiness, Edit3, Eye, Mail, Phone, Plus, Search, Trash2, UsersRound, X, ShieldCheck, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { createEmployee, deleteEmployee, listEmployees, updateEmployee } from '../../services/employees';

const JOB_ROLES = [
  { value: 'team_manager', label: 'مدير فريق', description: 'إدارة الفريق ومتابعة الأداء والصلاحيات' },
  { value: 'advertisements', label: 'موظف إدارة الإعلانات والأداء', description: 'الإعلانات والطلبات والحملات ومراقبة الأداء' },
  { value: 'reservations', label: 'موظف إدارة الحجوزات', description: 'الحجوزات والعملاء ومتابعة دورة الحجز' },
  { value: 'finance', label: 'موظف الإدارة المالية', description: 'التقارير والعمليات المالية المسموح بها' },
  { value: 'fleet', label: 'موظف إدارة أسطول السيارات', description: 'السيارات وحالة الأسطول ومتابعة أدائه' },
  { value: 'delivery', label: 'موظف توصيل واستلام السيارات', description: 'تقارير التسليم والاسترجاع والتواصل مع العميل' },
];
const roleLabel = (value) => JOB_ROLES.find((role) => role.value === value)?.label || 'تخصص غير محدد';
const emptyForm = { full_name: '', email: '', phone_number: '', password: '', job_role: 'fleet', status: 'active' };

export default function EmployeesList() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    try {
      setLoading(true);
      const response = await listEmployees();
      setEmployees(response.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذر تحميل فريق العمل');
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!showForm) return undefined;
    const closeOnEscape = (event) => event.key === 'Escape' && setShowForm(false);
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [showForm]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((employee) => [employee.full_name, employee.email, employee.phone_number, roleLabel(employee.job_role)].filter(Boolean).some((value) => String(value).toLowerCase().includes(q)));
  }, [employees, search]);

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm }); setShowForm(true); };
  const openEdit = (employee) => { setEditing(employee); setForm({ full_name: employee.full_name || '', email: employee.email || '', phone_number: employee.phone_number || '', password: '', job_role: employee.job_role || 'fleet', status: employee.status === 'inactive' ? 'inactive' : 'active' }); setShowForm(true); };
  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await updateEmployee(editing.id, { full_name: form.full_name, phone_number: form.phone_number, job_role: form.job_role, status: form.status });
        toast.success('تم تحديث المسؤولية الوظيفية');
      } else {
        await createEmployee(form);
        toast.success('تم إنشاء عضو الفريق');
      }
      setShowForm(false);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذر حفظ بيانات الموظف');
    } finally { setSaving(false); }
  };

  const remove = async (employee) => {
    if (!window.confirm(`هل تريد حذف ${employee.full_name}؟`)) return;
    try { await deleteEmployee(employee.id); toast.success('تم حذف العضو'); await load(); }
    catch (error) { toast.error(error.response?.data?.message || 'تعذر حذف العضو'); }
  };

  return <main className="employees-page" dir="rtl" style={styles.page}>
    <style>{responsiveCss}</style>
    <div style={styles.wrap}>
      <header style={styles.header}>
        <div style={styles.heading}><div style={styles.headingIcon}><UsersRound size={25} /></div><div><span style={styles.kicker}>إدارة الفريق</span><h1 style={styles.title}>فريق العمل</h1><p style={styles.muted}>نظّم فريقك وحدد مسؤولية كل عضو وصلاحياته بسهولة.</p></div></div>
        <button style={styles.primary} onClick={openCreate}><UserPlus size={18} /> إضافة عضو</button>
      </header>

      <section style={styles.summary}>
        <div style={styles.summaryIcon}><UsersRound size={22} /></div><div style={styles.summaryText}><strong>{employees.length}</strong><span>إجمالي الأعضاء</span></div>
        <div style={styles.summaryDivider} />
        <div style={styles.summaryText}><strong>{employees.filter((e) => e.status === 'active').length}</strong><span>حسابات نشطة</span></div>
        <div className="summary-hint" style={styles.summaryHint}><ShieldCheck size={17} /> الصلاحيات مرتبطة بالدور الوظيفي</div>
      </section>

      <div style={styles.toolbar}><label style={styles.search}><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث بالاسم أو البريد أو المسؤولية" aria-label="البحث في فريق العمل" /></label><span style={styles.resultCount}>{filtered.length} نتيجة</span></div>

      <section className="employees-table" style={styles.table}>
        <div className="employees-head" style={styles.head}><span>عضو الفريق</span><span>التواصل</span><span>المسؤولية الوظيفية</span><span>الحالة</span><span>الإجراءات</span></div>
        {loading ? <div style={styles.empty}>جارٍ تحميل فريق العمل...</div> : filtered.length === 0 ? <div style={styles.empty}><UsersRound size={30} /><strong>لا يوجد أعضاء مطابقون</strong><small>أضف عضوًا جديدًا أو غيّر كلمة البحث.</small></div> : filtered.map((employee) => <div className="employees-row" key={employee.id} style={styles.row}>
          <div style={styles.person}><span style={styles.avatar}>{employee.full_name?.charAt(0) || 'م'}</span><div><strong>{employee.full_name}</strong><small style={employee.is_online ? styles.online : undefined}>{employee.is_online ? 'متصل الآن' : 'غير متصل'}</small></div></div>
          <div style={styles.contact}><span><Mail size={13} />{employee.email}</span><span><Phone size={13} />{employee.phone_number || 'غير مضاف'}</span></div>
          <span style={styles.role}><BriefcaseBusiness size={14} />{roleLabel(employee.job_role)}</span>
          <span style={employee.status === 'active' ? styles.active : styles.inactive}>{employee.status === 'active' ? 'نشط' : 'موقوف'}</span>
          <div style={styles.actions}><button type="button" style={styles.iconAction} title="التفاصيل والصلاحيات" onClick={() => navigate(`/supplier/employees/${employee.id}`)}><Eye size={16} /></button><button type="button" style={styles.iconAction} title="تعديل" onClick={() => openEdit(employee)}><Edit3 size={16} /></button><button type="button" style={{ ...styles.iconAction, color: '#b64040' }} title="حذف" onClick={() => remove(employee)}><Trash2 size={16} /></button></div>
        </div>)}
      </section>
    </div>

    {showForm && <div style={styles.backdrop} onMouseDown={(event) => event.target === event.currentTarget && setShowForm(false)}>
      <form className="employee-modal" onSubmit={submit} style={styles.modal} onMouseDown={(event) => event.stopPropagation()}>
        <div style={styles.modalHead}><div className="modal-title-group" style={styles.modalTitleGroup}><div className="modal-icon" style={styles.modalIcon}><UserPlus size={22} /></div><div><span style={styles.modalKicker}>{editing ? 'تحديث بيانات الفريق' : 'عضو جديد'}</span><h2>{editing ? 'تعديل عضو الفريق' : 'إضافة عضو إلى الفريق'}</h2><p>{editing ? 'حدّث بيانات العضو ومسؤوليته الوظيفية.' : 'أنشئ حسابًا آمنًا وحدد الدور المناسب للعضو.'}</p></div></div><button type="button" aria-label="إغلاق" onClick={() => setShowForm(false)} style={styles.close}><X size={19} /></button></div>
        <div className="employee-form-grid" style={styles.formGrid}><Field label="الاسم الكامل" name="full_name" value={form.full_name} onChange={change} required placeholder="مثال: محمد أحمد" /><Field label="رقم الهاتف" name="phone_number" value={form.phone_number} onChange={change} dir="ltr" placeholder="07xxxxxxxx" /><Field label="البريد الإلكتروني" name="email" type="email" value={form.email} onChange={change} dir="ltr" required disabled={Boolean(editing)} placeholder="name@example.com" />{!editing && <Field label="كلمة المرور" name="password" type="password" value={form.password} onChange={change} minLength={8} required placeholder="8 أحرف على الأقل" />}</div>
        <label style={styles.label}>المسؤولية الوظيفية<select name="job_role" value={form.job_role} onChange={change} style={styles.input} required>{JOB_ROLES.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}</select><span style={styles.roleHint}>{JOB_ROLES.find((item) => item.value === form.job_role)?.description}</span></label>
        <label style={styles.label}>حالة الحساب<select name="status" value={form.status} onChange={change} style={styles.input}><option value="active">نشط</option><option value="inactive">موقوف</option></select></label>
        <div style={styles.note}><ShieldCheck size={17} /><span>سيحصل العضو تلقائيًا على الصلاحيات الأساسية المناسبة لدوره، ويمكن تعديل التفاصيل من صفحة الصلاحيات.</span></div>
        <div className="form-actions" style={styles.formActions}><button type="button" style={styles.cancel} onClick={() => setShowForm(false)}>إلغاء</button><button type="submit" style={styles.save} disabled={saving}>{saving ? 'جارٍ الحفظ...' : <><Plus size={17} /> حفظ العضو</>}</button></div>
      </form>
    </div>}
  </main>;
}

function Field({ label, name, type = 'text', value, onChange, required, disabled, dir, minLength, placeholder }) {
  return <label style={styles.label}>{label}<input type={type} name={name} value={value} onChange={onChange} required={required} disabled={disabled} minLength={minLength} dir={dir} placeholder={placeholder} style={{ ...styles.input, opacity: disabled ? 0.62 : 1 }} /></label>;
}

const styles = {
  page: { minHeight: '100vh', padding: '34px 22px 70px', background: '#f4f8f9', color: '#173a52' }, wrap: { maxWidth: 1240, margin: '0 auto' }, header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, marginBottom: 22, flexWrap: 'wrap' }, heading: { display: 'flex', alignItems: 'center', gap: 13 }, headingIcon: { width: 52, height: 52, display: 'grid', placeItems: 'center', borderRadius: 16, background: '#dff9f2', color: '#087f68' }, kicker: { color: '#0b8a73', fontSize: 11, fontWeight: 950 }, title: { margin: '5px 0', fontSize: 30 }, muted: { margin: 0, color: '#78909b', fontSize: 13 }, primary: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: 0, borderRadius: 12, padding: '12px 17px', background: '#173a52', color: '#fff', fontWeight: 900, cursor: 'pointer', boxShadow: '0 8px 18px rgba(23,58,82,.15)' }, summary: { display: 'flex', alignItems: 'center', gap: 14, padding: 18, borderRadius: 18, background: '#fff', border: '1px solid #e1eaed', marginBottom: 18, boxShadow: '0 8px 24px rgba(23,58,82,.04)' }, summaryIcon: { width: 42, height: 42, display: 'grid', placeItems: 'center', borderRadius: 13, background: '#edf7f5', color: '#087f68' }, summaryText: { display: 'grid', gap: 3, minWidth: 100 }, summaryTextStrong: {}, summaryTextSpan: {}, summaryDivider: { width: 1, height: 34, background: '#e6eef0' }, summaryHint: { display: 'flex', alignItems: 'center', gap: 7, marginRight: 'auto', color: '#748992', fontSize: 12 }, toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 12, color: '#81949d', fontSize: 12 }, search: { display: 'flex', alignItems: 'center', gap: 8, width: 'min(500px,100%)', padding: '0 13px', border: '1px solid #dce7eb', borderRadius: 12, background: '#fff', color: '#78909b' }, table: { background: '#fff', border: '1px solid #dce7eb', borderRadius: 18, overflow: 'hidden', boxShadow: '0 8px 25px rgba(23,58,82,.04)' }, head: { display: 'grid', gridTemplateColumns: '1.2fr 1.35fr 1.35fr .6fr 130px', gap: 12, padding: '14px 17px', background: '#f7fafb', color: '#8498a1', fontSize: 10, fontWeight: 900 }, row: { display: 'grid', gridTemplateColumns: '1.2fr 1.35fr 1.35fr .6fr 130px', alignItems: 'center', gap: 12, padding: '14px 17px', borderTop: '1px solid #edf2f4' }, person: { display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }, avatar: { width: 38, height: 38, flex: '0 0 auto', display: 'grid', placeItems: 'center', borderRadius: 12, background: '#dff9f2', color: '#087f68', fontWeight: 950 }, contact: { display: 'grid', gap: 5, color: '#8397a0', fontSize: 10 }, role: { display: 'flex', alignItems: 'center', gap: 6, color: '#6656a5', fontSize: 10, fontWeight: 800 }, active: { width: 'max-content', padding: '5px 9px', borderRadius: 99, background: '#e4fbf5', color: '#08745f', fontSize: 9, fontWeight: 900 }, inactive: { width: 'max-content', padding: '5px 9px', borderRadius: 99, background: '#ffedf3', color: '#ae3d60', fontSize: 9, fontWeight: 900 }, online: { color: '#087f68', fontWeight: 800 }, actions: { display: 'flex', gap: 6 }, iconAction: { border: '1px solid #dce7eb', background: '#fff', color: '#526873', width: 31, height: 31, display: 'grid', placeItems: 'center', borderRadius: 9, cursor: 'pointer' }, empty: { display: 'grid', justifyItems: 'center', gap: 8, padding: 55, color: '#8da0a8' }, resultCount: { whiteSpace: 'nowrap' }, backdrop: { position: 'fixed', inset: 0, zIndex: 1200, display: 'grid', placeItems: 'center', padding: 18, background: 'rgba(5,22,34,.68)', backdropFilter: 'blur(5px)' }, modal: { width: 'min(650px,100%)', maxHeight: 'calc(100vh - 34px)', overflowY: 'auto', display: 'grid', gap: 17, padding: 26, borderRadius: 24, background: '#fff', border: '1px solid rgba(255,255,255,.75)', boxShadow: '0 24px 70px rgba(5,22,34,.3)' }, modalHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 15, paddingBottom: 5 }, modalTitleGroup: { display: 'flex', alignItems: 'flex-start', gap: 12 }, modalIcon: { width: 44, height: 44, flex: '0 0 auto', display: 'grid', placeItems: 'center', borderRadius: 13, color: '#087f68', background: '#dff9f2' }, modalKicker: { color: '#0b8a73', fontSize: 10, fontWeight: 950 }, close: { width: 35, height: 35, display: 'grid', placeItems: 'center', border: 0, borderRadius: 10, background: '#f3f7f8', color: '#526873', cursor: 'pointer' }, label: { display: 'grid', gap: 7, color: '#315364', fontWeight: 850, fontSize: 13 }, input: { width: '100%', boxSizing: 'border-box', padding: '12px 13px', border: '1px solid #d6e3e7', borderRadius: 11, background: '#fbfdfe', color: '#173a52', font: 'inherit', outline: 'none' }, formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }, roleHint: { color: '#8498a1', fontSize: 11, fontWeight: 600, lineHeight: 1.55 }, note: { display: 'flex', alignItems: 'flex-start', gap: 8, padding: 13, borderRadius: 12, background: '#f0faf7', color: '#4b716e', lineHeight: 1.65, fontSize: 12 }, formActions: { display: 'flex', justifyContent: 'flex-start', gap: 9, paddingTop: 4 }, cancel: { border: '1px solid #d9e4e8', background: '#fff', color: '#526873', padding: '11px 20px', borderRadius: 11, cursor: 'pointer', fontWeight: 850 }, save: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, border: 0, background: '#173a52', color: '#fff', padding: '11px 22px', borderRadius: 11, cursor: 'pointer', fontWeight: 900 },
};

const responsiveCss = `
  input::placeholder { color: #a1afb5; }
  input:focus, select:focus { border-color: #0b8a73 !important; box-shadow: 0 0 0 3px rgba(11,138,115,.12); background: #fff !important; }
  select { appearance: auto; }
  .employee-table-action { border: 1px solid #dce7eb; background: #fff; color: #526873; width: 31px; height: 31px; display: grid; place-items: center; border-radius: 9px; cursor: pointer; }
  .employee-table-action:hover { color: #087f68; border-color: #8fe5d2; background: #f0faf7; }
  @media (max-width: 800px) {
    .employees-head { display: none !important; }
    .employees-row { display: grid !important; grid-template-columns: 1fr auto !important; gap: 12px !important; padding: 16px !important; }
    .employees-row > :nth-child(1) { grid-column: 1 / -1; }
    .employees-row > :nth-child(2), .employees-row > :nth-child(3), .employees-row > :nth-child(4) { grid-column: 1; }
    .employees-row > :nth-child(5) { grid-column: 2; grid-row: 2 / span 3; align-self: center; }
    .employees-page { padding: 20px 12px 50px !important; }
    .employee-form-grid { grid-template-columns: 1fr !important; }
    .summary-hint { display: none; }
  }
  @media (max-width: 520px) {
    .employees-page h1 { font-size: 25px !important; }
    .employees-page .summary { flex-wrap: wrap; }
    .employees-page .summary-divider { display: none; }
    .employees-page .toolbar { align-items: stretch !important; flex-direction: column; }
    .employees-page .search { width: 100% !important; box-sizing: border-box; min-height: 44px; }
    .employees-page .primary { width: 100%; }
    .employees-page .modal { padding: 19px !important; border-radius: 20px !important; }
    .employees-page .modal h2 { font-size: 19px; }
    .employees-page .modal-title-group { gap: 9px !important; }
    .employees-page .modal-icon { width: 38px !important; height: 38px !important; }
    .employees-page .form-actions { flex-direction: column-reverse; }
    .employees-page .form-actions button { width: 100%; }
  }
`;
