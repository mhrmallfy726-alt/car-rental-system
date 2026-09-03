import { useEffect, useMemo, useState } from 'react';
import { BriefcaseBusiness, Edit3, Eye, Mail, Phone, Plus, Search, Trash2, UsersRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { createEmployee, deleteEmployee, listEmployees, updateEmployee } from '../../services/employees';

const JOB_ROLES = [
  { value: 'team_manager', label: 'مدير فريق' },
  { value: 'advertisements', label: 'موظف إدارة الإعلانات والأداء' },
  { value: 'reservations', label: 'موظف إدارة الحجوزات' },
  { value: 'finance', label: 'موظف الإدارة المالية' },
  { value: 'fleet', label: 'موظف إدارة أسطول السيارات' },
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((employee) => [employee.full_name, employee.email, employee.phone_number, roleLabel(employee.job_role)].filter(Boolean).some((value) => String(value).toLowerCase().includes(q)));
  }, [employees, search]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowForm(true); };
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

  return <main dir="rtl" style={styles.page}><div style={styles.wrap}>
    <header style={styles.header}><div><span style={styles.kicker}>TEAM MANAGEMENT</span><h1 style={styles.title}>فريق العمل</h1><p style={styles.muted}>أضف أعضاء الفريق وحدد مسؤوليتهم الوظيفية بوضوح.</p></div><button style={styles.primary} onClick={openCreate}><Plus size={17} /> إضافة عضو</button></header>
    <section style={styles.summary}><UsersRound size={22} /><div><strong>{employees.length}</strong><span>أعضاء الفريق</span></div><div><strong>{employees.filter((e) => e.status === 'active').length}</strong><span>حسابات نشطة</span></div></section>
    <div style={styles.toolbar}><div style={styles.search}><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث بالاسم أو البريد أو المسؤولية" /></div><span>{filtered.length} نتيجة</span></div>
    <section style={styles.table}>
      <div style={styles.head}><span>عضو الفريق</span><span>التواصل</span><span>المسؤولية الوظيفية</span><span>الحالة</span><span>الإجراءات</span></div>
      {loading ? <div style={styles.empty}>جارٍ تحميل الفريق...</div> : filtered.length === 0 ? <div style={styles.empty}>لا يوجد أعضاء مطابقون.</div> : filtered.map((employee) => <div key={employee.id} style={styles.row}><div style={styles.person}><span style={styles.avatar}>{employee.full_name?.charAt(0) || 'م'}</span><div><strong>{employee.full_name}</strong><small>{employee.is_online ? 'متصل الآن' : 'غير متصل'}</small></div></div><div style={styles.contact}><span><Mail size={13} />{employee.email}</span><span><Phone size={13} />{employee.phone_number || 'غير مضاف'}</span></div><span style={styles.role}><BriefcaseBusiness size={14} />{roleLabel(employee.job_role)}</span><span style={employee.status === 'active' ? styles.active : styles.inactive}>{employee.status === 'active' ? 'نشط' : 'موقوف'}</span><div style={styles.actions}><button title="التفاصيل والصلاحيات" onClick={() => navigate(`/supplier/employees/${employee.id}`)}><Eye size={16} /></button><button title="تعديل" onClick={() => openEdit(employee)}><Edit3 size={16} /></button><button title="حذف" onClick={() => remove(employee)}><Trash2 size={16} /></button></div></div>)}
    </section>
    {showForm && <div style={styles.backdrop}><form onSubmit={submit} style={styles.modal}><div style={styles.modalHead}><h2>{editing ? 'تعديل عضو الفريق' : 'إضافة عضو إلى الفريق'}</h2><button type="button" onClick={() => setShowForm(false)}>×</button></div><label>الاسم<input name="full_name" value={form.full_name} onChange={change} required /></label><label>البريد الإلكتروني<input name="email" type="email" value={form.email} onChange={change} required disabled={Boolean(editing)} /></label><label>رقم الهاتف<input name="phone_number" value={form.phone_number} onChange={change} /></label>{!editing && <label>كلمة المرور<input name="password" type="password" value={form.password} onChange={change} minLength={8} required /></label>}<label>المسؤولية الوظيفية<select name="job_role" value={form.job_role} onChange={change}>{JOB_ROLES.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}</select></label><label>حالة الحساب<select name="status" value={form.status} onChange={change}><option value="active">نشط</option><option value="inactive">موقوف</option></select></label><div style={styles.formActions}><button type="button" style={styles.cancel} onClick={() => setShowForm(false)}>إلغاء</button><button type="submit" style={styles.primary} disabled={saving}>{saving ? 'جارٍ الحفظ...' : 'حفظ'}</button></div></form></div>}
  </div></main>;
}

const styles = {
  page:{minHeight:'100vh',padding:'115px 20px 60px',background:'#f4f8f9',color:'#173a52'},wrap:{maxWidth:1180,margin:'0 auto'},header:{display:'flex',justifyContent:'space-between',alignItems:'flex-end',gap:20,marginBottom:18},kicker:{color:'#0b8a73',fontSize:10,fontWeight:900},title:{margin:'7px 0',fontSize:31},muted:{margin:0,color:'#78909b'},primary:{display:'inline-flex',alignItems:'center',gap:7,border:0,borderRadius:11,padding:'11px 16px',background:'#173a52',color:'#fff',fontWeight:900,cursor:'pointer'},summary:{display:'flex',alignItems:'center',gap:18,padding:18,borderRadius:18,background:'#fff',border:'1px solid #e1eaed',marginBottom:15},summaryIcon:{},summaryDiv:{},toolbar:{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,marginBottom:12,color:'#81949d',fontSize:12},search:{display:'flex',alignItems:'center',gap:8,width:'min(480px,100%)',padding:'0 12px',border:'1px solid #dce7eb',borderRadius:12,background:'#fff'},table:{background:'#fff',border:'1px solid #dce7eb',borderRadius:18,overflow:'hidden'},head:{display:'grid',gridTemplateColumns:'1.2fr 1.35fr 1.35fr .6fr 130px',gap:12,padding:'13px 17px',background:'#f7fafb',color:'#8498a1',fontSize:10,fontWeight:900},row:{display:'grid',gridTemplateColumns:'1.2fr 1.35fr 1.35fr .6fr 130px',alignItems:'center',gap:12,padding:'13px 17px',borderTop:'1px solid #edf2f4'},person:{display:'flex',alignItems:'center',gap:9},avatar:{width:36,height:36,display:'grid',placeItems:'center',borderRadius:11,background:'#dff9f2',color:'#087f68',fontWeight:900},personSmall:{},contact:{display:'grid',gap:4,color:'#8397a0',fontSize:10},contactSpan:{},role:{display:'flex',alignItems:'center',gap:6,color:'#6656a5',fontSize:10,fontWeight:800},active:{width:'max-content',padding:'5px 9px',borderRadius:99,background:'#e4fbf5',color:'#08745f',fontSize:9,fontWeight:900},inactive:{width:'max-content',padding:'5px 9px',borderRadius:99,background:'#ffedf3',color:'#ae3d60',fontSize:9,fontWeight:900},actions:{display:'flex',gap:5},empty:{padding:55,textAlign:'center',color:'#8da0a8'},backdrop:{position:'fixed',inset:0,zIndex:1200,display:'grid',placeItems:'center',padding:20,background:'rgba(5,22,34,.65)'},modal:{width:'min(560px,100%)',maxHeight:'calc(100vh - 40px)',overflow:'auto',display:'grid',gap:14,padding:24,borderRadius:20,background:'#fff'},modalHead:{display:'flex',justifyContent:'space-between',alignItems:'center'},formActions:{display:'flex',gap:9,justifyContent:'flex-start'},cancel:{border:'1px solid #d9e4e8',background:'#fff',padding:'11px 16px',borderRadius:11,cursor:'pointer'},
};
