import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MailCheck, ShieldCheck, KeyRound, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

const inputStyle = {
  width: '100%', boxSizing: 'border-box', padding: '13px 14px',
  border: '1px solid #d7e2e6', borderRadius: 12, fontSize: '1rem', outline: 'none'
};

export default function BranchFirstLogin() {
  const location = useLocation();
  const navigate = useNavigate();
  const { sendBranchOTP, verifyBranchOTP, changeBranchFirstPassword } = useAuthStore();
  const state = location.state || {};
  const [stage, setStage] = useState(state.passwordChangeToken ? 'password' : 'verify');
  const [verificationToken, setVerificationToken] = useState(state.verificationToken || '');
  const [passwordToken, setPasswordToken] = useState(state.passwordChangeToken || '');
  const [email] = useState(state.email || state.user?.email || '');
  const [user] = useState(state.user || null);
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!verificationToken) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await sendBranchOTP(verificationToken);
        if (!cancelled) {
          setSent(true);
          toast.success('تم إرسال رمز التحقق إلى بريد مدير الفرع');
        }
      } catch (error) {
        if (!cancelled) toast.error(error.response?.data?.message || 'تعذر إرسال رمز التحقق');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [verificationToken]);

  const verify = async (event) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(otp)) return toast.error('أدخل رمز التحقق المكون من 6 أرقام');
    setLoading(true);
    try {
      const result = await verifyBranchOTP(verificationToken, { otp });
      if (result.requiresPasswordChange && result.passwordChangeToken) {
        setPasswordToken(result.passwordChangeToken);
        setStage('password');
        toast.success('تم التحقق من البريد. أنشئ كلمة المرور الجديدة.');
      } else {
        toast.error('تعذر بدء مرحلة تعيين كلمة المرور');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'رمز التحقق غير صحيح أو منتهي');
    } finally { setLoading(false); }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    if (password !== confirmPassword) return toast.error('كلمتا المرور غير متطابقتين');
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s])[^\s]{10,72}$/.test(password)) {
      return toast.error('كلمة المرور يجب أن تكون 10 أحرف على الأقل وتحتوي حرفاً كبيراً وصغيراً ورقماً ورمزاً خاصاً');
    }
    setLoading(true);
    try {
      const result = await changeBranchFirstPassword(passwordToken, { password, confirmPassword });
      if (!result.success || !result.token) throw new Error(result.message || 'تعذر تفعيل الحساب');
      toast.success('تم تفعيل حساب الفرع بنجاح');
      navigate('/supplier/dashboard', { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'تعذر تعيين كلمة المرور');
    } finally { setLoading(false); }
  };

  const resend = async () => {
    if (!verificationToken) return;
    setLoading(true);
    try {
      await sendBranchOTP(verificationToken);
      setSent(true);
      toast.success('تم إرسال رمز جديد');
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذر إعادة إرسال الرمز');
    } finally { setLoading(false); }
  };

  return (
    <main dir="rtl" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: 'linear-gradient(135deg,#f3f8fa,#eaf1f4)' }}>
      <section style={{ width: '100%', maxWidth: 500, background: '#fff', borderRadius: 24, padding: 30, boxShadow: '0 25px 80px rgba(23,58,82,.14)' }}>
        <button type="button" onClick={() => navigate('/login')} style={{ border: 0, background: 'transparent', color: '#55717f', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <ArrowRight size={17}/> العودة لتسجيل الدخول
        </button>

        <div style={{ textAlign: 'center', margin: '22px 0 26px' }}>
          <div style={{ width: 68, height: 68, margin: '0 auto 14px', borderRadius: 20, display: 'grid', placeItems: 'center', background: stage === 'verify' ? '#173a52' : '#0f766e', color: '#fff' }}>
            {stage === 'verify' ? <MailCheck size={31}/> : <KeyRound size={31}/>}
          </div>
          <h1 style={{ margin: 0, color: '#173a52', fontSize: '1.55rem' }}>
            {stage === 'verify' ? 'التحقق من بريد مدير الفرع' : 'تعيين كلمة مرور جديدة'}
          </h1>
          <p style={{ color: '#6b7f8c', lineHeight: 1.8 }}>
            {stage === 'verify'
              ? <>أرسلنا رمز التحقق إلى <b dir="ltr">{email || user?.email || 'بريدك الإلكتروني'}</b></>
              : 'اختر كلمة مرور جديدة خاصة بحساب مدير هذا الفرع.'}
          </p>
        </div>

        {stage === 'verify' ? (
          <form onSubmit={verify}>
            <label style={{ display: 'block', fontWeight: 800, color: '#173a52', marginBottom: 8 }}>رمز التحقق</label>
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <ShieldCheck size={19} style={{ position: 'absolute', right: 14, top: 14, color: '#78909c' }}/>
              <input autoFocus inputMode="numeric" maxLength={6} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0,6))} placeholder="000000" dir="ltr" style={{ ...inputStyle, paddingRight: 45, textAlign: 'center', letterSpacing: 8 }} />
            </div>
            <button disabled={loading || !sent} style={{ width: '100%', border: 0, borderRadius: 12, padding: 13, background: '#0f766e', color: '#fff', fontWeight: 900, cursor: loading ? 'wait' : 'pointer' }}>
              {loading ? 'جاري التحقق...' : 'تحقق من البريد'}
            </button>
            <button type="button" disabled={loading} onClick={resend} style={{ width: '100%', marginTop: 10, border: 0, background: 'transparent', color: '#0f766e', padding: 10, cursor: 'pointer' }}>
              إعادة إرسال الرمز
            </button>
          </form>
        ) : (
          <form onSubmit={changePassword}>
            <label style={{ display: 'block', fontWeight: 800, color: '#173a52', marginBottom: 8 }}>كلمة المرور الجديدة</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} minLength={10} autoFocus dir="ltr" style={{ ...inputStyle, marginBottom: 15 }} placeholder="10 أحرف على الأقل" />
            <label style={{ display: 'block', fontWeight: 800, color: '#173a52', marginBottom: 8 }}>تأكيد كلمة المرور</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} minLength={10} dir="ltr" style={{ ...inputStyle, marginBottom: 18 }} placeholder="أعد كتابة كلمة المرور" />
            <div style={{ background: '#f5f9fa', border: '1px solid #e2ecef', borderRadius: 12, padding: 12, marginBottom: 18, color: '#607782', fontSize: 12, lineHeight: 1.8 }}>
              يجب أن تحتوي كلمة المرور على حرف كبير وحرف صغير ورقم ورمز خاص، وألا تقل عن 10 أحرف.
            </div>
            <button disabled={loading} style={{ width: '100%', border: 0, borderRadius: 12, padding: 13, background: '#0f766e', color: '#fff', fontWeight: 900, cursor: loading ? 'wait' : 'pointer' }}>
              {loading ? 'جاري تفعيل الحساب...' : 'حفظ والدخول إلى لوحة الفرع'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
