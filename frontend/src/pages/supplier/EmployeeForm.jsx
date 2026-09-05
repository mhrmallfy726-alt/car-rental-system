import React, { useEffect, useState } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { createEmployee, getEmployee, updateEmployee } from '../../services/employees';

const JOB_ROLES = [
  { value: 'team_manager', label: 'مدير فريق', description: 'إدارة الفريق ومتابعة الأداء والصلاحيات' },
  { value: 'advertisements', label: 'موظف إدارة الإعلانات والأداء', description: 'الإعلانات والطلبات والحملات ومراقبة الأداء' },
  { value: 'reservations', label: 'موظف إدارة الحجوزات', description: 'الحجوزات والعملاء ومتابعة دورة الحجز' },
  { value: 'finance', label: 'موظف الإدارة المالية', description: 'التقارير والعمليات المالية المسموح بها' },
  { value: 'fleet', label: 'موظف إدارة أسطول السيارات', description: 'السيارات وحالة الأسطول ومتابعة أدائه' },
  { value: 'delivery', label: 'موظف توصيل واستلام السيارات', description: 'رفع تقارير حالة السيارة قبل التسليم وبعد الاسترجاع والتواصل مع العميل' },
];

const EMPTY_FORM = {
  full_name: '',
  phone_number: '',
  email: '',
  password: '',
  job_role: 'fleet',
  status: 'active',
};

export default function EmployeeForm({ editMode = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [loadingEmployee, setLoadingEmployee] = useState(Boolean(editMode && id));

  useEffect(() => {
    if (!editMode || !id) return;
    let cancelled = false;
    const load = async () => {
      try {
        const response = await getEmployee(id);
        if (cancelled) return;
        const employee = response.data;
        setFormData({
          full_name: employee.full_name || '',
          phone_number: employee.phone_number || '',
          email: employee.email || '',
          password: '',
          job_role: JOB_ROLES.some((item) => item.value === employee.job_role) ? employee.job_role : 'fleet',
          status: String(employee.status || 'active').toLowerCase() === 'active' ? 'active' : 'inactive',
        });
      } catch (error) {
        toast.error(error.response?.data?.message || 'تعذر تحميل بيانات الموظف');
        navigate('/supplier/employees');
      } finally {
        if (!cancelled) setLoadingEmployee(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [editMode, id, navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      if (editMode) {
        await updateEmployee(id, {
          full_name: formData.full_name,
          phone_number: formData.phone_number,
          job_role: formData.job_role,
          status: formData.status,
        });
        toast.success('تم تحديث بيانات الموظف بنجاح');
      } else {
        await createEmployee(formData);
        toast.success('تم إنشاء الموظف بنجاح');
      }
      navigate('/supplier/employees');
    } catch (error) {
      toast.error(error.response?.data?.message || 'حدث خطأ أثناء حفظ بيانات الموظف');
    } finally {
      setLoading(false);
    }
  };

  if (loadingEmployee) {
    return <div dir="rtl" style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>جارٍ تحميل بيانات الموظف...</div>;
  }

  return (
    <main dir="rtl" style={{ minHeight: '100vh', background: '#f5f7fb', padding: '35px 20px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <button type="button" onClick={() => navigate('/supplier/employees')} style={styles.back}>
          <ArrowLeft size={17} /> العودة إلى فريق العمل
        </button>

        <section style={styles.card}>
          <div style={{ marginBottom: 24 }}>
            <h1 style={styles.title}>{editMode ? 'تعديل الموظف' : 'إضافة عضو جديد إلى الفريق'}</h1>
            <p style={styles.subtitle}>
              {editMode ? 'تحديث بيانات الموظف وتخصصه الوظيفي.' : 'أنشئ حساباً للفريق وحدد المسؤولية الرئيسية للموظف.'}
            </p>
          </div>

          <form onSubmit={onSubmit} style={{ display: 'grid', gap: 18 }}>
            <div style={styles.grid}>
              <Field label="الاسم الكامل" name="full_name" value={formData.full_name} onChange={handleChange} required />
              <Field label="رقم الهاتف" name="phone_number" value={formData.phone_number} onChange={handleChange} dir="ltr" />
            </div>

            <div style={styles.grid}>
              <Field label="البريد الإلكتروني" name="email" type="email" value={formData.email} onChange={handleChange} dir="ltr" required disabled={editMode} />
              {!editMode && <Field label="كلمة المرور" name="password" type="password" value={formData.password} onChange={handleChange} dir="ltr" required minLength={8} />}
            </div>

            <label style={styles.label}>
              المسؤولية الوظيفية
              <select name="job_role" value={formData.job_role} onChange={handleChange} style={styles.input} required>
                {JOB_ROLES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
              <span style={styles.roleHint}>{JOB_ROLES.find((item) => item.value === formData.job_role)?.description}</span>
            </label>

            <label style={styles.label}>
              حالة الحساب
              <select name="status" value={formData.status} onChange={handleChange} style={styles.input}>
                <option value="active">نشط</option>
                <option value="inactive">غير نشط</option>
              </select>
            </label>

            <div style={styles.note}>
              يتم منح الموظف تلقائياً الصلاحيات الأساسية المناسبة لمسؤوليته. ويمكن لمدير المورد تعديل الصلاحيات التفصيلية من ملف الموظف.
            </div>

            <div style={styles.actions}>
              <button type="button" onClick={() => navigate('/supplier/employees')} style={styles.cancel}>إلغاء</button>
              <button type="submit" disabled={loading} style={styles.save}>
                <Save size={17} /> {loading ? 'جارٍ الحفظ...' : editMode ? 'حفظ التعديلات' : 'إضافة إلى الفريق'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

function Field({ label, name, type = 'text', value, onChange, required, disabled, dir, minLength }) {
  return (
    <label style={styles.label}>
      {label}
      <input type={type} name={name} value={value} onChange={onChange} required={required} disabled={disabled} minLength={minLength} dir={dir} style={{ ...styles.input, opacity: disabled ? 0.65 : 1 }} />
    </label>
  );
}

const styles = {
  back: { display: 'inline-flex', alignItems: 'center', gap: 7, border: 0, background: 'transparent', color: '#456270', cursor: 'pointer', fontWeight: 800, marginBottom: 18 },
  card: { background: '#fff', border: '1px solid #e5edf1', borderRadius: 22, padding: 30, boxShadow: '0 12px 35px rgba(23,58,82,.07)' },
  title: { margin: 0, color: '#173a52', fontSize: 28 },
  subtitle: { margin: '8px 0 0', color: '#788993' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  label: { display: 'grid', gap: 7, color: '#526873', fontWeight: 800, fontSize: 13 },
  input: { width: '100%', boxSizing: 'border-box', padding: '12px 13px', border: '1px solid #d9e4e8', borderRadius: 11, background: '#fff', color: '#173a52', font: 'inherit', outline: 'none' },
  roleHint: { color: '#8498a1', fontSize: 11, fontWeight: 600, lineHeight: 1.6 },
  note: { padding: 14, borderRadius: 12, background: '#f3f8fa', color: '#637984', lineHeight: 1.7, fontSize: 13 },
  actions: { display: 'flex', justifyContent: 'flex-start', gap: 10, marginTop: 8 },
  cancel: { border: '1px solid #d8e2e6', background: '#fff', color: '#526873', padding: '11px 18px', borderRadius: 11, cursor: 'pointer', fontWeight: 800 },
  save: { display: 'inline-flex', alignItems: 'center', gap: 7, border: 0, background: '#173a52', color: '#fff', padding: '11px 20px', borderRadius: 11, cursor: 'pointer', fontWeight: 900 },
};
