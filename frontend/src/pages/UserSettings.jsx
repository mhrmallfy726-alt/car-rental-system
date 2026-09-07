import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Bell, Building2, CheckCircle2, KeyRound, Lock, Mail, Save, ShieldCheck, Smartphone, User, Upload } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { authAPI } from '../services/api';
import { validateStrongPassword } from '../utils/inputValidation';
import { getImageUrl } from '../utils/imageUtils';
import { maskEmail } from '../utils/privacy';

const navy = '#173a52';
const teal = '#178263';
const soft = '#f4f8f8';

const Field = ({ label, children, hint }) => (
  <label style={{ display: 'grid', gap: 7, color: navy, fontWeight: 800, fontSize: 13 }}>
    {label}
    {children}
    {hint && <span style={{ color: '#71828a', fontSize: 11, fontWeight: 500 }}>{hint}</span>}
  </label>
);

const inputStyle = { width: '100%', border: '1px solid #dbe6e8', borderRadius: 12, padding: '12px 13px', background: '#fff', color: navy, outline: 'none', boxSizing: 'border-box' };

export default function UserSettings() {
  const { user, fetchMe } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [settings, setSettings] = useState({
    name: '', email: '', phone: '', address: '', brand_description: '',
    current_password: '', new_password: '', confirm_password: '', otp: '',
    iban: '', bank_name: '', auto_accept_bookings: false,
    notifications_email: true, notifications_sms: false,
  });
  const [brandLogo, setBrandLogo] = useState(null);

  useEffect(() => { fetchMe(); }, [fetchMe]);
  useEffect(() => {
    if (!user) return;
    setSettings((prev) => ({ ...prev, name: user.name || '', email: user.email || '', phone: user.phone || '', address: user.address || '', brand_description: user.brand_description || '', iban: user.iban || '', bank_name: user.bank_name || '', auto_accept_bookings: user.auto_accept_bookings ?? false }));
    setBrandLogo(user.brand_logo || null);
  }, [user]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setSettings((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await authAPI.updateProfile({ name: settings.name, phone: settings.phone, address: settings.address, brand_description: settings.brand_description, iban: settings.iban, bank_name: settings.bank_name, auto_accept_bookings: settings.auto_accept_bookings });
      await fetchMe();
      toast.success('تم حفظ بيانات الحساب بنجاح');
    } catch (error) { toast.error(error.response?.data?.message || 'تعذر حفظ بيانات الحساب'); }
    finally { setLoading(false); }
  };

  const requestOtp = async () => {
    setOtpLoading(true);
    try {
      await authAPI.requestPasswordChangeOTP();
      setOtpSent(true);
      toast.success('تم إرسال رمز التحقق إلى بريدك الإلكتروني');
    } catch (error) { toast.error(error.response?.data?.message || 'تعذر إرسال رمز التحقق'); }
    finally { setOtpLoading(false); }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    if (!otpSent) return toast.error('اطلب رمز التحقق أولاً');
    if (!validateStrongPassword(settings.new_password)) return toast.error('كلمة المرور يجب أن تكون 10 أحرف على الأقل وتحتوي حرفًا كبيرًا وصغيرًا ورقمًا ورمزًا خاصًا');
    if (settings.new_password !== settings.confirm_password) return toast.error('كلمات المرور الجديدة غير متطابقة');
    setLoading(true);
    try {
      await authAPI.changePassword({ current_password: settings.current_password, new_password: settings.new_password, confirm_password: settings.confirm_password, otp: settings.otp });
      toast.success('تم تغيير كلمة المرور بنجاح');
      setOtpSent(false);
      setSettings((prev) => ({ ...prev, current_password: '', new_password: '', confirm_password: '', otp: '' }));
    } catch (error) { toast.error(error.response?.data?.message || 'تعذر تغيير كلمة المرور'); }
    finally { setLoading(false); }
  };

  const chooseLogo = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) return toast.error('اختر صورة JPG أو PNG أو WEBP بحجم أقصى 2 ميجابايت');
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const uploadLogo = async () => {
    if (!selectedFile) return;
    const data = new FormData();
    data.append('avatar', selectedFile);
    setLoading(true);
    try {
      const response = await authAPI.uploadBrandLogo(data);
      setBrandLogo(response.data.data.brand_logo);
      setSelectedFile(null);
      setPreviewUrl(null);
      await fetchMe();
      toast.success('تم تحديث شعار الشركة');
    } catch (error) { toast.error(error.response?.data?.message || 'تعذر رفع الشعار'); }
    finally { setLoading(false); }
  };

  const isSupplier = user?.role === 'supplier';
  const verification = isSupplier ? (user.verification_status || (user.is_verified ? 'approved' : 'pending')) : (user?.is_verified ? 'approved' : 'pending');
  const verificationText = verification === 'approved' ? 'الحساب معتمد' : verification === 'rejected' ? 'تم رفض التوثيق' : 'بانتظار التوثيق';
  const verificationColor = verification === 'approved' ? teal : verification === 'rejected' ? '#b42318' : '#9a6b16';
  const verificationBackground = verification === 'approved' ? '#eaf6f2' : verification === 'rejected' ? '#fff0f0' : '#fff7e5';
  const tabs = [
    ['profile', 'الحساب والبيانات', User],
    ...(isSupplier ? [['company', 'هوية الشركة', Building2]] : []),
    ['security', 'الأمان وكلمة المرور', KeyRound],
    ['notifications', 'الإشعارات', Bell],
  ];

  return (
    <main dir="rtl" style={{ minHeight: '100vh', background: soft, padding: '28px 20px', color: navy }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 18, marginBottom: 24 }}>
          <div><span style={{ color: teal, fontSize: 12, fontWeight: 900 }}>إدارة الحساب</span><h1 style={{ margin: '5px 0', fontSize: 30 }}>الإعدادات</h1><p style={{ margin: 0, color: '#71828a' }}>تحكم ببياناتك، هوية شركتك وأمان حسابك من مكان واحد.</p><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, padding: '7px 11px', borderRadius: 20, background: verificationBackground, color: verificationColor, fontSize: 12, fontWeight: 900 }}><ShieldCheck size={15} />{verificationText}</span>{verification === 'rejected' && user?.rejection_reason && <small style={{ display: 'block', color: '#b42318', marginTop: 6 }}>سبب الرفض: {user.rejection_reason}</small>}</div>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: navy, color: '#fff', display: 'grid', placeItems: 'center' }}><SettingsIcon /></div>
        </header>
        <div style={{ display: 'grid', gridTemplateColumns: '250px minmax(0, 1fr)', gap: 20, alignItems: 'start' }}>
          <aside style={{ background: '#fff', border: '1px solid #e3eeee', borderRadius: 18, padding: 10, position: 'sticky', top: 20 }}>
            {tabs.map(([id, label, Icon]) => <button key={id} type="button" onClick={() => setActiveTab(id)} style={{ width: '100%', border: 0, borderRadius: 12, padding: '13px 12px', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 10, textAlign: 'right', cursor: 'pointer', background: activeTab === id ? '#eaf6f2' : 'transparent', color: activeTab === id ? teal : '#71828a', fontWeight: 800 }}><Icon size={18} />{label}</button>)}
            <div style={{ margin: '14px 5px 4px', padding: 12, borderRadius: 13, background: '#f6faf9', color: '#71828a', fontSize: 11, lineHeight: 1.8 }}><ShieldCheck size={17} color={teal} /><br />بياناتك محمية، وتغيير كلمة المرور يتطلب رمز تحقق يرسل إلى بريدك الإلكتروني.</div>
          </aside>
          <section style={{ display: 'grid', gap: 18 }}>
            {activeTab === 'profile' && <Card title="بيانات الحساب" icon={User} subtitle="المعلومات الأساسية المستخدمة للتواصل معك"><form onSubmit={saveProfile} style={{ display: 'grid', gap: 17 }}><div style={grid}><Field label="الاسم الكامل"><input name="name" value={settings.name} onChange={handleChange} required style={inputStyle} /></Field><Field label="رقم الهاتف"><input name="phone" type="tel" value={settings.phone} onChange={handleChange} dir="ltr" style={inputStyle} /></Field></div><Field label="البريد الإلكتروني" hint="يظهر بشكل محمي، ويُستخدم داخليًا لإرسال رموز OTP"><input value={maskEmail(settings.email)} disabled style={{ ...inputStyle, background: '#f5f7f7', color: '#71828a', direction: 'ltr', textAlign: 'left' }} /></Field><Field label="العنوان"><input name="address" value={settings.address} onChange={handleChange} style={inputStyle} /></Field><button disabled={loading} style={primaryButton}><Save size={17} />{loading ? 'جاري الحفظ...' : 'حفظ بيانات الحساب'}</button></form></Card>}
            {activeTab === 'company' && isSupplier && <Card title="هوية الشركة" icon={Building2} subtitle="المعلومات التي تظهر للعملاء عند استعراض سياراتك"><div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, background: '#f7fbfa', borderRadius: 15, marginBottom: 18 }}><img src={previewUrl || (brandLogo ? (brandLogo.startsWith('http') ? brandLogo : getImageUrl(brandLogo)) : 'https://via.placeholder.com/80?text=Logo')} alt="شعار الشركة" style={{ width: 82, height: 82, borderRadius: 18, objectFit: 'contain', background: '#fff', border: '1px solid #dbe6e8' }} /><div><b>شعار الشركة</b><p style={{ color: '#71828a', fontSize: 12, margin: '5px 0 10px' }}>JPG أو PNG أو WEBP، وبحد أقصى 2 ميجابايت.</p><input id="account-logo" type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseLogo} style={{ display: 'none' }} /><label htmlFor="account-logo" style={secondaryButton}> <Upload size={15} /> اختيار صورة</label>{selectedFile && <button type="button" onClick={uploadLogo} disabled={loading} style={{ ...primaryButton, display: 'inline-flex', marginRight: 8 }}>{loading ? 'جاري الرفع...' : 'حفظ الشعار'}</button>}</div></div><form onSubmit={saveProfile} style={{ display: 'grid', gap: 17 }}><Field label="نبذة عن الشركة"><textarea name="brand_description" value={settings.brand_description} onChange={handleChange} maxLength="1000" rows="5" style={{ ...inputStyle, resize: 'vertical' }} placeholder="اكتب نبذة مختصرة عن خدمات التأجير وفروعك..." /></Field><div style={grid}><Field label="اسم البنك"><input name="bank_name" value={settings.bank_name} onChange={handleChange} style={inputStyle} /></Field><Field label="رقم IBAN"><input name="iban" value={settings.iban} onChange={handleChange} dir="ltr" style={inputStyle} placeholder="SA..." /></Field></div><button disabled={loading} style={primaryButton}><Save size={17} />حفظ هوية الشركة</button></form></Card>}
            {activeTab === 'security' && <Card title="الأمان وكلمة المرور" icon={KeyRound} subtitle="سيتم إرسال رمز تحقق إلى بريدك قبل تنفيذ التغيير"><form onSubmit={changePassword} style={{ display: 'grid', gap: 17 }}><Field label="كلمة المرور الحالية"><input type="password" name="current_password" value={settings.current_password} onChange={handleChange} required style={inputStyle} /></Field><div style={grid}><Field label="كلمة المرور الجديدة" hint="10 أحرف على الأقل: كبير، صغير، رقم ورمز"><input type="password" name="new_password" value={settings.new_password} onChange={handleChange} minLength="10" maxLength="72" required style={inputStyle} /></Field><Field label="تأكيد كلمة المرور"><input type="password" name="confirm_password" value={settings.confirm_password} onChange={handleChange} required style={inputStyle} /></Field></div>{otpSent && <Field label="رمز التحقق OTP" hint="تحقق من بريدك الإلكتروني، الرمز صالح لمدة 10 دقائق"><input name="otp" value={settings.otp} onChange={handleChange} inputMode="numeric" maxLength="6" pattern="[0-9]{6}" required style={{ ...inputStyle, letterSpacing: 6, textAlign: 'center', fontSize: 20 }} /></Field>}<div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}><button type="button" onClick={requestOtp} disabled={otpLoading} style={secondaryButton}><Mail size={17} />{otpLoading ? 'جاري إرسال الرمز...' : otpSent ? 'إعادة إرسال OTP' : 'إرسال رمز التحقق'}</button>{otpSent && <button type="submit" disabled={loading} style={primaryButton}><Lock size={17} />{loading ? 'جاري التغيير...' : 'تأكيد تغيير كلمة المرور'}</button>}</div></form></Card>}
            {activeTab === 'notifications' && <Card title="تفضيلات الإشعارات" icon={Bell} subtitle="حدد القنوات التي تفضل استقبال تنبيهات المنصة عبرها"><div style={{ display: 'grid', gap: 13 }}><Toggle checked={settings.notifications_email} onChange={handleChange} name="notifications_email" icon={Mail} label="إشعارات البريد الإلكتروني" description="الحجوزات والتحديثات المهمة على حسابك." /><Toggle checked={settings.notifications_sms} onChange={handleChange} name="notifications_sms" icon={Smartphone} label="رسائل الجوال" description="التذكير بمواعيد الاستلام والتسليم." /><div style={{ marginTop: 8, padding: 14, borderRadius: 12, background: '#fff9e9', color: '#8a6818', fontSize: 12 }}>يمكنك حفظ هذه التفضيلات عند تفعيل مركز الإشعارات في إعدادات المنصة.</div></div></Card>}
          </section>
        </div>
      </div>
      <style>{`@media (max-width: 760px){main>div>div{grid-template-columns:1fr!important}aside{position:static!important;display:flex;overflow:auto;gap:4px}aside button{white-space:nowrap;width:auto!important;margin:0!important}.grid-settings{grid-template-columns:1fr!important}}`}</style>
    </main>
  );
}

const grid = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 15 };
const primaryButton = { border: 0, borderRadius: 11, padding: '12px 16px', background: teal, color: '#fff', fontWeight: 900, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: 'fit-content' };
const secondaryButton = { border: '1px solid #cfe1df', borderRadius: 11, padding: '11px 14px', background: '#fff', color: teal, fontWeight: 900, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, width: 'fit-content' };
function SettingsIcon() { return <KeyRound size={23} />; }
function Card({ title, subtitle, icon: Icon, children }) { return <div style={{ background: '#fff', border: '1px solid #e3eeee', borderRadius: 18, padding: 23, boxShadow: '0 8px 24px rgba(23,58,82,.05)' }}><div style={{ display: 'flex', gap: 12, alignItems: 'center', borderBottom: '1px solid #edf2f2', paddingBottom: 16, marginBottom: 20 }}><div style={{ width: 40, height: 40, borderRadius: 12, background: '#eaf6f2', color: teal, display: 'grid', placeItems: 'center' }}><Icon size={20} /></div><div><h2 style={{ margin: 0, fontSize: 19, color: navy }}>{title}</h2><p style={{ margin: '4px 0 0', color: '#71828a', fontSize: 12 }}>{subtitle}</p></div></div>{children}</div>; }
function Toggle({ checked, onChange, name, icon: Icon, label, description }) { return <label style={{ display: 'flex', alignItems: 'center', gap: 12, border: '1px solid #e3eeee', borderRadius: 14, padding: 14, cursor: 'pointer' }}><input type="checkbox" name={name} checked={checked} onChange={onChange} style={{ width: 18, height: 18, accentColor: teal }} /><Icon size={19} color={teal} /><span><b style={{ color: navy }}>{label}</b><small style={{ display: 'block', color: '#71828a', marginTop: 3 }}>{description}</small></span></label>; }
