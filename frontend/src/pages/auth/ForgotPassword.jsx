import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, Mail, ShieldCheck, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../../services/api';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', otp: '', password: '', confirmPassword: '' });
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  const requestCode = async (event) => {
    event.preventDefault();
    if (!form.email.trim()) return toast.error('أدخل البريد الإلكتروني');
    setLoading(true);
    try {
      await authAPI.requestPasswordReset({ email: form.email.trim() });
      toast.success('إذا كان البريد مسجلاً فسيصلك رمز الاستعادة');
      setStep(2);
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذر إرسال رمز الاستعادة');
    } finally { setLoading(false); }
  };

  const verifyCode = async (event) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(form.otp)) return toast.error('أدخل رمزاً مكوناً من 6 أرقام');
    setLoading(true);
    try {
      await authAPI.verifyPasswordReset({ email: form.email.trim(), otp: form.otp });
      toast.success('الرمز صحيح');
      setStep(3);
    } catch (error) {
      toast.error(error.response?.data?.message || 'الرمز غير صحيح أو منتهي الصلاحية');
    } finally { setLoading(false); }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    if (form.password.length < 8) return toast.error('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
    if (form.password !== form.confirmPassword) return toast.error('كلمتا المرور غير متطابقتين');
    setLoading(true);
    try {
      await authAPI.resetPassword({ email: form.email.trim(), otp: form.otp, password: form.password });
      toast.success('تم تغيير كلمة المرور، يمكنك تسجيل الدخول الآن');
      navigate('/login', { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذر تغيير كلمة المرور');
    } finally { setLoading(false); }
  };

  const inputStyle = { width: '100%', padding: '13px 42px 13px 14px', border: '1px solid #dbe5ea', borderRadius: 12, fontSize: '1rem', outline: 'none', boxSizing: 'border-box' };
  return (
    <main dir="rtl" style={{ minHeight: 'calc(100vh - 80px)', display: 'grid', placeItems: 'center', padding: 24, background: 'linear-gradient(135deg,#f2f8fa,#eaf1f5)' }}>
      <section style={{ width: '100%', maxWidth: 470, background: '#fff', borderRadius: 24, padding: '32px 28px', boxShadow: '0 22px 70px rgba(23,58,82,.14)' }}>
        <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#527084', textDecoration: 'none', fontSize: '.9rem' }}><ArrowRight size={17} /> العودة لتسجيل الدخول</Link>
        <div style={{ textAlign: 'center', margin: '22px 0 28px' }}><div style={{ width: 64, height: 64, margin: '0 auto 14px', borderRadius: 18, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,#173a52,#2c7895)', color: '#fff' }}><KeyRound size={30} /></div><h1 style={{ margin: 0, color: '#173a52', fontSize: '1.55rem' }}>استعادة كلمة المرور</h1><p style={{ color: '#6b7f8c', lineHeight: 1.7 }}>استعد الوصول إلى حسابك بأمان عبر بريدك الإلكتروني.</p></div>
        <div style={{ display: 'flex', gap: 7, marginBottom: 28 }}>{[1,2,3].map((item) => <div key={item} style={{ height: 5, flex: 1, borderRadius: 9, background: item <= step ? '#e0a82e' : '#e5edf0' }} />)}</div>
        {step === 1 && <form onSubmit={requestCode}><label style={{ display: 'block', marginBottom: 8, fontWeight: 700, color: '#173a52' }}>البريد الإلكتروني</label><div style={{ position: 'relative', marginBottom: 20 }}><Mail size={18} style={{ position: 'absolute', right: 14, top: 14, color: '#78909c' }} /><input style={inputStyle} type="email" value={form.email} onChange={update('email')} placeholder="name@example.com" dir="ltr" required /></div><button className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: 13, borderRadius: 12 }}>{loading ? 'جاري الإرسال...' : 'إرسال رمز الاستعادة'}</button></form>}
        {step === 2 && <form onSubmit={verifyCode}><label style={{ display: 'block', marginBottom: 8, fontWeight: 700, color: '#173a52' }}>رمز التحقق</label><p style={{ color: '#6b7f8c', fontSize: '.9rem' }}>أدخل الرمز المرسل إلى <b dir="ltr">{form.email}</b></p><div style={{ position: 'relative', marginBottom: 20 }}><ShieldCheck size={18} style={{ position: 'absolute', right: 14, top: 14, color: '#78909c' }} /><input style={{ ...inputStyle, letterSpacing: 7, textAlign: 'center' }} inputMode="numeric" maxLength={6} value={form.otp} onChange={update('otp')} placeholder="000000" dir="ltr" required /></div><button className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: 13, borderRadius: 12 }}>{loading ? 'جاري التحقق...' : 'تحقق من الرمز'}</button><button type="button" onClick={() => setStep(1)} style={{ width: '100%', marginTop: 12, padding: 10, border: 0, background: 'transparent', color: '#527084', cursor: 'pointer' }}>تغيير البريد الإلكتروني</button></form>}
        {step === 3 && <form onSubmit={changePassword}><label style={{ display: 'block', marginBottom: 8, fontWeight: 700, color: '#173a52' }}>كلمة المرور الجديدة</label><input style={{ ...inputStyle, marginBottom: 14 }} type="password" minLength={8} value={form.password} onChange={update('password')} placeholder="8 أحرف على الأقل" dir="ltr" required /><label style={{ display: 'block', marginBottom: 8, fontWeight: 700, color: '#173a52' }}>تأكيد كلمة المرور</label><input style={{ ...inputStyle, marginBottom: 20 }} type="password" minLength={8} value={form.confirmPassword} onChange={update('confirmPassword')} placeholder="أعد كتابة كلمة المرور" dir="ltr" required /><button className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: 13, borderRadius: 12 }}>{loading ? 'جاري الحفظ...' : 'حفظ كلمة المرور الجديدة'}</button></form>}
      </section>
    </main>
  );
}
