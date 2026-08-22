import { useEffect, useState } from 'react';
import { ArrowRight, Check, CheckCircle2, LockKeyhole, Mail, Phone, Save, Shield, UserRound } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getEmployee, getEmployeePermissions, listPermissions, updateEmployeePermissions } from '../../services/employees';

export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);


  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [employeeResponse, currentResponse, allResponse] = await Promise.all([getEmployee(id), getEmployeePermissions(id), listPermissions()]);
        if (cancelled) return;
        setEmployee(employeeResponse.data);
        setSelected(new Set((currentResponse.data || []).map((permission) => permission.id)));
        setPermissions(allResponse.data || []);
      } catch (error) {
        toast.error(error.response?.data?.message || 'تعذر تحميل تفاصيل الموظف');
        navigate('/supplier/employees');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [id, navigate]);

  const toggle = (permissionId) => setSelected((current) => {
    const next = new Set(current);
    if (next.has(permissionId)) next.delete(permissionId);
    else next.add(permissionId);
    return next;
  });

  const save = async () => {
    setSaving(true);
    try {
      await updateEmployeePermissions(id, Array.from(selected));
      toast.success('تم تحديث صلاحيات الموظف');
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذر تحديث الصلاحيات');
    } finally {
      setSaving(false);
    }
  };



  if (loading) return <div className="employee-detail-loading" dir="rtl">جارٍ تحميل ملف الموظف...</div>;
  if (!employee) return null;

  return <main className="employee-detail-page" dir="rtl"><div className="employee-detail-wrap"><Link to="/supplier/employees" className="employee-back"><ArrowRight size={16} /> العودة إلى فريق العمل</Link><header className="employee-detail-hero"><div className="employee-profile-mark"><UserRound size={30} /></div><div><span className="employee-detail-kicker">STAFF PROFILE / ACCESS CONTROL</span><h1>{employee.full_name}</h1><p>مراجعة هوية الموظف وصلاحياته داخل مساحة المورد.</p></div><span className={`employee-detail-status ${employee.status === 'active' ? 'active' : 'inactive'}`}>{employee.status === 'active' ? 'حساب نشط' : 'حساب موقوف'}</span></header><section className="employee-detail-grid"><div className="employee-detail-card"><div className="employee-detail-card-head"><h2>بيانات الموظف</h2><CheckCircle2 size={18} /></div><div className="employee-facts"><Fact icon={Mail} label="البريد الإلكتروني" value={employee.email} /><Fact icon={Phone} label="رقم الهاتف" value={employee.phone_number || 'غير مضاف'} /><Fact icon={UserRound} label="الدور الوظيفي" value={employee.role === 'manager' ? 'مدير فريق' : 'موظف'} /><Fact icon={Shield} label="الحالة" value={employee.status === 'active' ? 'نشط' : 'موقوف'} /></div></div><div className="employee-detail-card employee-permissions-card"><div className="employee-detail-card-head"><div><h2>صلاحيات الوصول</h2><p>حدد الصفحات والعمليات المتاحة لهذا الموظف.</p></div><LockKeyhole size={20} /></div><div className="employee-permission-grid">{permissions.length === 0 ? <div className="employee-empty-permissions">لم يتم تعريف صلاحيات في قاعدة البيانات بعد.</div> : permissions.map((permission) => <label key={permission.id} className={`employee-permission ${selected.has(permission.id) ? 'selected' : ''}`}><input type="checkbox" checked={selected.has(permission.id)} onChange={() => toggle(permission.id)} /><span className="employee-permission-check">{selected.has(permission.id) && <Check size={14} />}</span><span><strong>{permission.name}</strong><small>{permission.description || 'صلاحية مخصصة لمساحة المورد'}</small></span></label>)}</div><div className="employee-detail-actions"><button type="button" className="employee-save" onClick={save} disabled={saving}><Save size={16} />{saving ? 'جارٍ الحفظ...' : 'حفظ الصلاحيات'}</button></div></div></section></div><style>{`
.employee-detail-page{min-height:100vh;padding:120px 20px 60px;color:#163348;background:linear-gradient(150deg,#f6fbfc,#eef5f6)}.employee-detail-wrap{width:min(980px,100%);margin:auto}.employee-detail-loading{min-height:70vh;display:grid;place-items:center;color:#547383;background:#f4f8fa}.employee-back{display:inline-flex;align-items:center;gap:7px;color:#4d7183;text-decoration:none;font-size:12px;font-weight:850}.employee-back:hover{color:#087f68;transform:translateX(3px)}.employee-detail-hero{display:flex;align-items:center;gap:16px;position:relative;margin:22px 0;padding:26px 28px;border:1px solid #dce9ed;border-radius:24px;color:#eaf4f6;background:radial-gradient(circle at 90% 10%,rgba(172,124,255,.35),transparent 28%),linear-gradient(120deg,#09263a,#124253);box-shadow:0 18px 35px rgba(16,60,79,.12)}.employee-profile-mark{width:62px;height:62px;display:grid;place-items:center;border:1px solid rgba(77,245,199,.5);border-radius:20px;color:#071622;background:linear-gradient(135deg,#4df5c7,#c8ffed)}.employee-detail-kicker{color:#4df5c7;font-size:9px;font-weight:950;letter-spacing:1.6px}.employee-detail-hero h1{margin:7px 0 4px;color:#fff;font-size:26px}.employee-detail-hero p{margin:0;color:rgba(233,245,247,.62);font-size:12px}.employee-detail-status{margin-right:auto;padding:7px 11px;border-radius:99px;font-size:10px;font-weight:900}.employee-detail-status.active{color:#073e35;background:#b9f9e9}.employee-detail-status.inactive{color:#7e2745;background:#ffd4e1}.employee-detail-grid{display:grid;grid-template-columns:.85fr 1.15fr;gap:18px}.employee-detail-card{padding:22px;border:1px solid #dce9ed;border-radius:20px;background:#fff;box-shadow:0 10px 26px rgba(19,61,80,.06)}.employee-detail-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:15px;padding-bottom:16px;border-bottom:1px solid #edf3f4}.employee-detail-card-head h2{margin:0;color:#173a52;font-size:16px}.employee-detail-card-head p{margin:6px 0 0;color:#8aa0aa;font-size:11px}.employee-detail-card-head>svg{color:#4dbca6}.employee-facts{display:grid;gap:4px;margin-top:13px}.employee-fact{display:flex;align-items:center;gap:10px;padding:12px 8px;border-radius:12px}.employee-fact:hover{background:#f5faf9}.employee-fact-icon{width:32px;height:32px;display:grid;place-items:center;border-radius:10px;color:#0b8a73;background:#e5fbf6}.employee-fact span{display:block;color:#8ba0a9;font-size:9px}.employee-fact strong{display:block;margin-top:3px;color:#2c4c5d;font-size:11px}.employee-permission-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:17px}.employee-permission{display:flex;align-items:flex-start;gap:9px;padding:12px;border:1px solid #e1eaed;border-radius:13px;cursor:pointer;transition:all .2s ease}.employee-permission:hover,.employee-permission.selected{border-color:#8fe5d2;background:#f1fcf9;transform:translateY(-1px)}.employee-permission input{position:absolute;opacity:0;pointer-events:none}.employee-permission-check{width:22px;height:22px;display:grid;flex:0 0 auto;place-items:center;border:1px solid #cbdce1;border-radius:7px;color:#06362e;background:#fff}.employee-permission.selected .employee-permission-check{border-color:#4df5c7;background:#4df5c7}.employee-permission strong{display:block;color:#2e4b5d;font-size:11px}.employee-permission small{display:block;margin-top:4px;color:#91a2aa;font-size:9px;line-height:1.5}.employee-empty-permissions{grid-column:1/-1;padding:25px;color:#9babb2;text-align:center;font-size:11px}.employee-detail-actions{display:flex;justify-content:flex-start;margin-top:20px;padding-top:16px;border-top:1px solid #edf3f4}.employee-save{display:inline-flex;align-items:center;gap:7px;border:0;border-radius:11px;padding:11px 15px;color:#061923;background:linear-gradient(135deg,#4df5c7,#c8ffed);font:inherit;font-size:11px;font-weight:950;cursor:pointer;box-shadow:0 8px 18px rgba(77,245,199,.16);transition:all .2s ease}.employee-save:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 0 20px rgba(77,245,199,.35)}.employee-save:disabled{opacity:.6;cursor:wait}@media(max-width:760px){.employee-detail-page{padding:98px 14px 40px}.employee-detail-hero{align-items:flex-start;flex-wrap:wrap;padding:20px}.employee-detail-status{margin-right:0}.employee-detail-grid{grid-template-columns:1fr}.employee-permission-grid{grid-template-columns:1fr}.employee-detail-hero h1{font-size:22px}}
`}</style></main>;
}

function Fact({ icon: Icon, label, value }) {
  return <div className="employee-fact"><span className="employee-fact-icon"><Icon size={16} /></span><div><span>{label}</span><strong>{value}</strong></div></div>;
}
