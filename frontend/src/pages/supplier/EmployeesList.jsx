import { useCallback, useEffect, useMemo, useState } from 'react';
import { BriefcaseBusiness, Edit3, Eye, Mail, Phone, Plus, Search, ShieldCheck, Trash2, UserRound, UsersRound, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import { createEmployee, deleteEmployee, listEmployees, updateEmployee } from '../../services/employees';

const emptyForm = { full_name: '', email: '', phone_number: '', password: '', role: 'employee', status: 'active' };

export default function EmployeesList() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const loadEmployees = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const response = await listEmployees(user.id);
      setEmployees(response.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذر تحميل فريق العمل');
    } finally {
      setLoading(false);
    }
    }, [user]);
  useEffect(() => {
    const timer = window.setTimeout(loadEmployees, 0);
    return () => window.clearTimeout(timer);
  }, [loadEmployees]);

  const filteredEmployees = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return employees;
    return employees.filter((employee) => [employee.full_name, employee.email, employee.phone_number, employee.role].filter(Boolean).some((value) => value.toLowerCase().includes(needle)));
  }, [employees, search]);


  const handleCreate = async (event) => {
    event.preventDefault();
    if (!form.full_name || !form.email || !form.password) return toast.error('أكمل الاسم والبريد وكلمة المرور');
    setSaving(true);
    try {
      await createEmployee({ ...form, supplier_id: user.id });
      toast.success('تم إنشاء حساب الموظف');
      setForm(emptyForm);
      setShowCreate(false);
      await loadEmployees();
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذر إنشاء الموظف');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (employee) => {
    setSelectedEmployee(employee);
    setEditForm({ full_name: employee.full_name || '', email: employee.email || '', phone_number: employee.phone_number || '', password: '', role: employee.role || 'employee', status: employee.status || 'active' });
    setShowEdit(true);
  };

  const handleEdit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await updateEmployee(selectedEmployee.id, { full_name: editForm.full_name, phone_number: editForm.phone_number, role: editForm.role, status: editForm.status });
      toast.success('تم تحديث بيانات الموظف');
      setShowEdit(false);
      await loadEmployees();
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذر تحديث الموظف');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (employee) => {
    if (!window.confirm(`هل تريد حذف حساب ${employee.full_name}؟`)) return;
    try {
      await deleteEmployee(employee.id);
      toast.success('تم حذف الموظف');
      await loadEmployees();
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذر حذف الموظف');
    }
  };

  return <main className="employees-page" dir="rtl"><div className="employees-wrap"><header className="employees-header"><div><span className="employees-kicker">TEAM ACCESS / SUPPLIER SPACE</span><h1>فريق العمل</h1><p>أدر الحسابات، الأدوار، والصلاحيات من مساحة واحدة واضحة.</p></div><button type="button" className="employees-primary" onClick={() => setShowCreate(true)}><Plus size={17} /> إضافة موظف</button></header><section className="employees-overview"><div className="employees-overview-icon"><UsersRound size={22} /></div><div><strong>{employees.length}</strong><span>أعضاء في فريقك</span></div><div className="employees-overview-divider" /><div><strong>{employees.filter((employee) => employee.status === 'active').length}</strong><span>حساب نشط</span></div><div className="employees-overview-note"><ShieldCheck size={16} /> الصلاحيات قابلة للتعديل لكل حساب</div></section><div className="employees-toolbar"><div className="employees-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث بالاسم أو البريد أو الدور" /></div><span className="employees-results">{filteredEmployees.length} نتيجة</span></div><section className="employees-table-card"><div className="employees-table-head"><span>الموظف</span><span>التواصل</span><span>الدور</span><span>حالة الاتصال</span><span>استقبال الطلبات</span><span>الإجراءات</span></div>{loading ? <div className="employees-empty"><div className="employees-loader" /> جارٍ تحميل فريق العمل...</div> : filteredEmployees.length === 0 ? <div className="employees-empty"><UserRound size={27} /><strong>{search ? 'لا توجد نتائج مطابقة' : 'لم تضف موظفين بعد'}</strong><span>{search ? 'جرّب كلمة بحث مختلفة.' : 'ابدأ بإضافة أول عضو إلى فريقك.'}</span></div> : <div className="employees-table-body">{filteredEmployees.map((employee) => <div className="employees-row" key={employee.id} style={{gridTemplateColumns:'1.2fr 1.3fr .7fr .7fr .7fr 130px'}}><div className="employees-person"><span className="employees-avatar">{employee.full_name?.charAt(0) || 'م'}</span><div><strong>{employee.full_name}</strong><small>{employee.is_online ? 'متصل الآن' : 'غير متصل'}</small></div></div><div className="employees-contact"><span><Mail size={13} /> {employee.email}</span><span><Phone size={13} /> {employee.phone_number || 'غير مضاف'}</span></div><span className="employees-role"><BriefcaseBusiness size={14} />{employee.role === 'manager' ? 'مدير فريق' : 'موظف'}</span><span className={`employees-status ${employee.is_online ? 'active' : 'inactive'}`}>{employee.is_online ? 'متصل' : 'غير متصل'}</span><span className={`employees-status ${employee.is_accepting_orders ? 'active' : 'inactive'}`} style={{background: employee.is_accepting_orders ? '#e5fbf6' : '#fff1f5', color: employee.is_accepting_orders ? '#0b8a73' : '#b33b5c'}}>{employee.is_accepting_orders ? 'يستقبل طلبات' : 'متوقف'}</span><div className="employees-actions"><button type="button" onClick={() => navigate(`/supplier/employees/${employee.id}`)} title="التفاصيل والصلاحيات"><Eye size={16} /></button><button type="button" onClick={() => openEdit(employee)} title="تعديل"><Edit3 size={16} /></button><button type="button" onClick={() => handleDelete(employee)} className="danger" title="حذف"><Trash2 size={16} /></button></div></div>)}</div>}</section><div className="employees-mobile-hint"><ShieldCheck size={15} /> من الأفضل مراجعة صلاحيات كل موظف قبل تفعيل حسابه.</div></div><style>{`
.employees-page{min-height:100vh;padding:118px 20px 60px;color:#163348;background:linear-gradient(150deg,#f6fbfc,#eef5f6)}.employees-wrap{width:min(1180px,100%);margin:auto}.employees-header{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:22px}.employees-kicker{display:block;color:#0c8a70;font-size:9px;font-weight:950;letter-spacing:1.6px}.employees-header h1{margin:8px 0 5px;color:#173a52;font-size:31px;letter-spacing:-1px}.employees-header p{margin:0;color:#7e98a4;font-size:12px}.employees-primary{display:inline-flex;align-items:center;justify-content:center;gap:7px;border:0;border-radius:11px;padding:11px 15px;color:#061923;background:linear-gradient(135deg,#4df5c7,#c8ffed);font:inherit;font-size:11px;font-weight:950;cursor:pointer;box-shadow:0 8px 20px rgba(77,245,199,.15);transition:all .2s ease}.employees-primary:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 0 22px rgba(77,245,199,.34)}.employees-primary:disabled{opacity:.6;cursor:wait}.employees-overview{display:flex;align-items:center;gap:14px;margin-bottom:17px;padding:16px 18px;border:1px solid #dce9ed;border-radius:18px;background:linear-gradient(100deg,#0b2d43,#104253);color:#eaf4f6;box-shadow:0 15px 32px rgba(16,60,79,.11)}.employees-overview-icon{width:42px;height:42px;display:grid;place-items:center;border:1px solid rgba(77,245,199,.42);border-radius:13px;color:#4df5c7;background:rgba(77,245,199,.1)}.employees-overview strong{display:block;color:#fff;font-size:21px;line-height:1}.employees-overview span{display:block;margin-top:4px;color:rgba(230,243,246,.6);font-size:9px}.employees-overview-divider{height:30px;width:1px;margin:0 4px;background:rgba(255,255,255,.15)}.employees-overview-note{display:inline-flex;align-items:center;gap:6px;margin-right:auto;color:#4df5c7;font-size:10px;font-weight:850}.employees-toolbar{display:flex;align-items:center;justify-content:space-between;gap:15px;margin-bottom:12px}.employees-search{display:flex;align-items:center;gap:9px;width:min(440px,100%);padding:0 13px;border:1px solid #dce8ec;border-radius:12px;background:#fff;color:#8aa1ab;box-shadow:0 5px 15px rgba(20,59,78,.03)}.employees-search input{width:100%;border:0;outline:0;padding:12px 0;color:#284b5c;background:transparent;font:inherit;font-size:11px}.employees-search input::placeholder{color:#a8b5bb}.employees-results{color:#8da1aa;font-size:10px;font-weight:850}.employees-table-card{overflow:hidden;border:1px solid #dce8ec;border-radius:18px;background:#fff;box-shadow:0 10px 26px rgba(20,59,78,.05)}.employees-table-head,.employees-row{display:grid;grid-template-columns:1.35fr 1.45fr .8fr .65fr 140px;align-items:center;gap:14px}.employees-table-head{padding:13px 18px;color:#8da1aa;background:#f7fafb;border-bottom:1px solid #e8f0f2;font-size:9px;font-weight:950}.employees-row{min-height:76px;padding:12px 18px;border-bottom:1px solid #edf3f4;transition:background .2s ease}.employees-row:last-child{border-bottom:0}.employees-row:hover{background:#fbfefd}.employees-person{display:flex;align-items:center;gap:10px;min-width:0}.employees-avatar{width:35px;height:35px;display:grid;flex:0 0 auto;place-items:center;border-radius:12px;color:#08705f;background:linear-gradient(135deg,#dbfff6,#b9f9e9);font-size:13px;font-weight:950}.employees-person strong{display:block;overflow:hidden;color:#29495a;text-overflow:ellipsis;white-space:nowrap;font-size:11px}.employees-person small{display:block;margin-top:4px;color:#9aabb2;font-size:8px}.employees-contact{display:grid;gap:5px;min-width:0;color:#8a9da6;font-size:9px}.employees-contact span{display:flex;align-items:center;gap:5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.employees-contact svg{color:#76a69f;flex:0 0 auto}.employees-role{display:inline-flex;align-items:center;gap:5px;color:#6b5ab3;font-size:10px;font-weight:850}.employees-status{width:max-content;padding:5px 8px;border-radius:99px;font-size:9px;font-weight:950}.employees-status.active{color:#08745f;background:#e4fbf5}.employees-status.inactive{color:#ae3d60;background:#ffedf3}.employees-actions{display:flex;gap:5px}.employees-actions button{width:30px;height:30px;display:grid;place-items:center;border:1px solid #e2eaed;border-radius:9px;color:#6d8793;background:#fff;cursor:pointer;transition:all .2s ease}.employees-actions button:hover{color:#08816b;border-color:#91e5d3;background:#f0fcf9;transform:translateY(-1px)}.employees-actions button.danger:hover{color:#bc4b6b;border-color:#f1b7c6;background:#fff1f5}.employees-empty{display:grid;justify-items:center;gap:8px;padding:64px 20px;color:#9aadb4;text-align:center;font-size:11px}.employees-empty svg{color:#93daca}.employees-empty strong{color:#5b7887;font-size:13px}.employees-empty span{font-size:10px}.employees-loader{width:26px;height:26px;border:3px solid #dbefeb;border-top-color:#0c9e83;border-radius:50%;animation:employeesSpin .8s linear infinite}.employees-mobile-hint{display:flex;align-items:center;gap:6px;margin-top:12px;color:#7f969f;font-size:10px}.employees-mobile-hint svg{color:#0c8a70}.employees-modal-backdrop{position:fixed;inset:0;z-index:1100;display:grid;place-items:center;padding:20px;background:rgba(4,18,30,.68);backdrop-filter:blur(8px)}.employees-modal{width:min(600px,100%);max-height:calc(100vh - 40px);overflow:auto;padding:24px;border:1px solid rgba(77,245,199,.2);border-radius:20px;color:#173a52;background:#fff;box-shadow:0 25px 80px rgba(0,0,0,.3)}.employees-modal-head{display:flex;align-items:flex-start;justify-content:space-between;gap:15px;padding-bottom:17px;border-bottom:1px solid #eaf1f3}.employees-modal-head h2{margin:7px 0 0;color:#173a52;font-size:20px}.employees-modal-head button{width:32px;height:32px;display:grid;place-items:center;border:1px solid #e4ecee;border-radius:10px;color:#6d8793;background:#fff;cursor:pointer}.employees-modal-head button:hover{color:#bc4b6b;border-color:#f0bbc9}.employees-form{display:grid;grid-template-columns:1fr 1fr;gap:15px;padding-top:20px}.employees-field{display:grid;gap:7px}.employees-field span{color:#527183;font-size:10px;font-weight:850}.employees-field input,.employees-field select{width:100%;box-sizing:border-box;border:1px solid #d8e5e9;border-radius:10px;padding:11px 12px;outline:0;color:#294b5b;background:#fbfdfe;font:inherit;font-size:11px}.employees-field input:focus,.employees-field select:focus{border-color:#70d8c2;box-shadow:0 0 0 3px rgba(77,245,199,.12)}.employees-modal-actions{display:flex;grid-column:1/-1;justify-content:flex-start;gap:9px;margin-top:5px;padding-top:16px;border-top:1px solid #edf3f4}.employees-cancel{border:1px solid #dce6e9;border-radius:11px;padding:10px 14px;color:#65808d;background:#fff;font:inherit;font-size:11px;font-weight:850;cursor:pointer}.employees-cancel:hover{background:#f5fafb}@keyframes employeesSpin{to{transform:rotate(360deg)}}@media(max-width:900px){.employees-table-head{display:none}.employees-row{grid-template-columns:1fr auto;gap:10px;padding:15px}.employees-contact{grid-column:1/-1;grid-row:2}.employees-role{grid-column:1;grid-row:3}.employees-status{grid-column:2;grid-row:3;justify-self:end}.employees-actions{grid-column:2;grid-row:1}.employees-overview-note{display:none}}@media(max-width:600px){.employees-page{padding:97px 14px 42px}.employees-header{align-items:flex-start;flex-direction:column}.employees-primary{width:100%}.employees-overview{flex-wrap:wrap}.employees-toolbar{align-items:flex-start;flex-direction:column}.employees-search{width:100%}.employees-results{align-self:flex-start}.employees-form{grid-template-columns:1fr}.employees-modal-actions{grid-column:auto}.employees-modal-actions .employees-primary{width:auto}}
`}</style><CreateEmployeeModal open={showCreate} form={form} setForm={setForm} saving={saving} onClose={() => setShowCreate(false)} onSubmit={handleCreate} /><EditEmployeeModal open={showEdit} form={editForm} setForm={setEditForm} saving={saving} onClose={() => setShowEdit(false)} onSubmit={handleEdit} /></main>;
}

function Field({ label, name, value, onChange, type = 'text', placeholder }) {
  return <label className="employees-field"><span>{label}</span><input name={name} type={type} value={value} onChange={onChange} placeholder={placeholder} required={['full_name', 'email'].includes(name)} /></label>;
}

function CreateEmployeeModal({ open, form, setForm, saving, onClose, onSubmit }) {
  if (!open) return null;
  return <div className="employees-modal-backdrop"><div className="employees-modal" dir="rtl"><div className="employees-modal-head"><div><span className="employees-kicker">NEW MEMBER</span><h2>إضافة موظف</h2></div><button type="button" onClick={onClose}><X size={19} /></button></div><form onSubmit={onSubmit} className="employees-form"><Field label="الاسم الكامل" name="full_name" value={form.full_name} onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))} placeholder="مثال: أحمد محمد" /><Field label="البريد الإلكتروني" name="email" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="name@example.com" /><Field label="رقم الهاتف" name="phone_number" value={form.phone_number} onChange={(event) => setForm((current) => ({ ...current, phone_number: event.target.value }))} placeholder="اختياري" /><Field label="كلمة المرور المؤقتة" name="password" type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} placeholder="8 أحرف على الأقل" /><SelectField label="الدور" name="role" value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))} options={[['employee', 'موظف'], ['manager', 'مدير فريق']]} /><div className="employees-modal-actions"><button type="button" className="employees-cancel" onClick={onClose}>إلغاء</button><button type="submit" className="employees-primary" disabled={saving}>{saving ? 'جارٍ الإنشاء...' : 'إنشاء الحساب'}</button></div></form></div></div>;
}

function EditEmployeeModal({ open, form, setForm, saving, onClose, onSubmit }) {
  if (!open) return null;
  return <div className="employees-modal-backdrop"><div className="employees-modal" dir="rtl"><div className="employees-modal-head"><div><span className="employees-kicker">UPDATE MEMBER</span><h2>تعديل بيانات الموظف</h2></div><button type="button" onClick={onClose}><X size={19} /></button></div><form onSubmit={onSubmit} className="employees-form"><Field label="الاسم الكامل" name="full_name" value={form.full_name} onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))} /><Field label="البريد الإلكتروني" name="email" type="email" value={form.email} onChange={() => {}} /><Field label="رقم الهاتف" name="phone_number" value={form.phone_number} onChange={(event) => setForm((current) => ({ ...current, phone_number: event.target.value }))} /><SelectField label="الدور" name="role" value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))} options={[['employee', 'موظف'], ['manager', 'مدير فريق']]} /><SelectField label="الحالة" name="status" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} options={[['active', 'نشط'], ['inactive', 'موقوف']]} /><div className="employees-modal-actions"><button type="button" className="employees-cancel" onClick={onClose}>إلغاء</button><button type="submit" className="employees-primary" disabled={saving}>{saving ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}</button></div></form></div></div>;
}

function SelectField({ label, name, value, onChange, options }) {
  return <label className="employees-field"><span>{label}</span><select name={name} value={value} onChange={onChange}>{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></label>;
}
