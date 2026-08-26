import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { User, Bell, Lock, ShieldCheck, Save, CheckCircle } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { authAPI } from '../services/api';

import { getImageUrl } from '../utils/imageUtils';
export default function UserSettings() {
  const { user, fetchMe } = useAuthStore();
  const [settings, setSettings] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    brand_description: user?.brand_description || '',
    notifications_email: true,
    notifications_sms: false,
    current_password: '',
    new_password: '',
    confirm_password: '',
    iban: user?.iban || '',
    bank_name: user?.bank_name || '',
    auto_accept_bookings: user?.auto_accept_bookings || false
  });
  const [brandLogo, setBrandLogo] = useState(user?.brand_logo || null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMe();
  }, []);

  // Update local settings if user data changes from fetchMe
  useEffect(() => {
    if (user) {
      setSettings(prev => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
        brand_description: user.brand_description || prev.brand_description,
        iban: user.iban || prev.iban,
        bank_name: user.bank_name || prev.bank_name,
        auto_accept_bookings: user.auto_accept_bookings ?? prev.auto_accept_bookings
      }));
      setBrandLogo(user.brand_logo);
    }
  }, [user]);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setSettings({ ...settings, [e.target.name]: value });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.updateProfile({
        name: settings.name,
        phone: settings.phone,
        address: settings.address || '',
        brand_description: settings.brand_description,
        iban: settings.iban,
        bank_name: settings.bank_name,
        auto_accept_bookings: settings.auto_accept_bookings
      });
      toast.success('تم تحديث الملف الشخصي بنجاح');
    } catch (error) {
      toast.error('فشل التحديث: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUploadLogo = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('avatar', selectedFile);

    try {
      setLoading(true);
      const res = await authAPI.uploadBrandLogo(formData);
      setBrandLogo(res.data.data.brand_logo);
      setSelectedFile(null);
      setPreviewUrl(null);
      toast.success('تم تحديث الشعار بنجاح');
    } catch (error) {
      toast.error('فشل رفع الشعار');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSecurity = async (e) => {
    e.preventDefault();
    if (settings.new_password !== settings.confirm_password) {
      return toast.error('كلمات المرور الجديدة غير متطابقة');
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('تم تغيير كلمة المرور بنجاح');
      setSettings({ ...settings, current_password: '', new_password: '', confirm_password: '' });
    }, 1000);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8f9fa',
      padding: '40px 20px'
    }}>
      <div className="container">
      <div className="flex-between mb-32 border-b pb-16" style={{ borderColor: 'var(--border)' }}>
        <h1 className="font-xl font-bold flex gap-8 align-center text-primary"><User /> إعدادات الحساب</h1>
      </div>

      <div className="flex gap-24 flex-wrap">

        {/* Navigation */}
        <div style={{ flex: '1', minWidth: '250px', maxWidth: '300px' }}>
          <div className="card p-16 sticky" style={{ top: '90px' }}>
            <div className="flex flex-col gap-8">
              <a href="#profile" className="btn btn-secondary flex-start gap-8 w-full border-none text-right text-primary bg-gray">
                <User size={18} /> الملف الشخصي
              </a>
              {user?.role === 'supplier' && (
                <a href="#brand" className="btn btn-secondary flex-start gap-8 w-full border-none text-right text-muted hover-bg-gray">
                  <ShieldCheck size={18} /> هوية الشركة (الماركة)
                </a>
              )}
              <a href="#security" className="btn btn-secondary flex-start gap-8 w-full border-none text-right text-muted hover-bg-gray">
                <Lock size={18} /> الأمان وكلمة المرور
              </a>
              <a href="#notifications" className="btn btn-secondary flex-start gap-8 w-full border-none text-right text-muted hover-bg-gray">
                <Bell size={18} /> الإشعارات
              </a>
              {user?.role === 'supplier' && (
                <a href="#payment" className="btn btn-secondary flex-start gap-8 w-full border-none text-right text-muted hover-bg-gray">
                  <Save size={18} /> بيانات الدفع
                </a>
              )}
              <a href="#verification" className="btn btn-secondary flex-start gap-8 w-full border-none text-right text-muted hover-bg-gray">
                <ShieldCheck size={18} /> التوثيق
              </a>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: '3', minWidth: '300px' }} className="flex flex-col gap-32">

          {/* Profile Section */}
          <div id="profile" className="card p-32 fade-in-up">
            <h3 className="font-bold border-b pb-8 mb-16 text-primary flex gap-8 align-center"><User size={20} /> الملف الشخصي</h3>
            <form onSubmit={handleSaveProfile} className="flex flex-col gap-16">
              <div className="grid-2 gap-16">
                <div className="form-group">
                  <label className="form-label">الاسم الكامل</label>
                  <input type="text" name="name" className="form-input" value={settings.name} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">رقم الهاتف</label>
                  <input type="tel" name="phone" className="form-input" value={settings.phone} onChange={handleChange} dir="ltr" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">البريد الإلكتروني</label>
                <input type="email" className="form-input text-muted" value={settings.email} disabled />
                <p className="text-xs text-secondary mt-4">لا يمكن تغيير البريد الإلكتروني حالياً. للتغيير، تواصل مع الدعم الفني.</p>
              </div>
              <div className="mt-8 text-right">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  <Save size={16} style={{ marginLeft: '6px' }} />
                  {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </button>
              </div>
            </form>
          </div>

          {/* Brand Section (Supplier Only) */}
          {user?.role === 'supplier' && (
            <div id="brand" className="card p-32 fade-in-up">
              <h3 className="font-bold border-b pb-8 mb-16 text-primary flex gap-8 align-center"><ShieldCheck size={20} /> هوية الشركة (Brand)</h3>

              <div className="flex gap-24 align-center mb-24 p-16 bg-base border-radius-md" style={{ border: '1px dashed var(--border)' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', background: '#fff', border: '2px solid var(--primary)', flexShrink: 0 }}>
                  <img
                    src={previewUrl || (brandLogo ? (brandLogo.startsWith('http') ? brandLogo : getImageUrl(brandLogo)) : 'https://via.placeholder.com/80?text=Logo')}
                    alt="شعار الشركة"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <h4 className="font-bold mb-8">شعار الشركة (اللوجو)</h4>
                  <p className="text-sm text-secondary mb-12">يظهر الشعار للعملاء في صفحة تفاصيل السيارات الخاصة بك.</p>
                  <div className="flex gap-12 align-center">
                    <input type="file" id="brandLogoInput" style={{ display: 'none' }} accept="image/*" onChange={handleFileChange} disabled={loading} />
                    <label htmlFor="brandLogoInput" className="btn btn-secondary btn-sm cursor-pointer">
                      {selectedFile ? 'تغيير الصورة المختارة' : 'اختيار شعار جديد'}
                    </label>
                    {selectedFile && (
                      <button onClick={handleUploadLogo} className="btn btn-primary btn-sm" disabled={loading}>
                        {loading ? 'جاري الحفظ...' : 'حفظ الشعار الجديد'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="flex flex-col gap-16">
                <div className="form-group">
                  <label className="form-label">نبذة عن الشركة (وصف الماركة)</label>
                  <textarea
                    name="brand_description"
                    className="form-input"
                    rows="4"
                    placeholder="اكتب نبذة مختصرة عن شركتك، خبرتك، ومميزات خدماتك لتشجيع العملاء على الحجز..."
                    value={settings.brand_description}
                    onChange={handleChange}
                  />
                  <p className="text-xs text-muted mt-4">هذا الوصف سيظهر للعملاء عند استعراض سياراتك.</p>
                </div>
                <div className="mt-8 text-right">
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    <Save size={16} style={{ marginLeft: '6px' }} />
                    حفظ الوصف
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Security Section */}
          <div id="security" className="card p-32 fade-in-up">
            <h3 className="font-bold border-b pb-8 mb-16 text-primary flex gap-8 align-center"><Lock size={20} /> تغيير كلمة المرور</h3>
            <form onSubmit={handleSaveSecurity} className="flex flex-col gap-16">
              <div className="form-group">
                <label className="form-label">كلمة المرور الحالية</label>
                <input type="password" name="current_password" className="form-input" value={settings.current_password} onChange={handleChange} required />
              </div>
              <div className="grid-2 gap-16">
                <div className="form-group">
                  <label className="form-label">كلمة المرور الجديدة</label>
                  <input type="password" name="new_password" className="form-input" value={settings.new_password} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">تأكيد كلمة المرور الجديدة</label>
                  <input type="password" name="confirm_password" className="form-input" value={settings.confirm_password} onChange={handleChange} required />
                </div>
              </div>
              <div className="mt-8 text-right">
                <button type="submit" className="btn btn-secondary" disabled={loading}>
                  تحديث كلمة المرور
                </button>
              </div>
            </form>
          </div>

          {/* Notifications Section */}
          <div id="notifications" className="card p-32 fade-in-up">
            <h3 className="font-bold border-b pb-8 mb-16 text-primary flex gap-8 align-center"><Bell size={20} /> تفضيلات الإشعارات</h3>
            <div className="flex flex-col gap-16">
              <label className="filter-checkbox font-bold">
                <input type="checkbox" name="notifications_email" checked={settings.notifications_email} onChange={handleChange} />
                تلقي إشعارات الحجوزات والتحديثات عبر البريد الإلكتروني
              </label>
              <label className="filter-checkbox font-bold">
                <input type="checkbox" name="notifications_sms" checked={settings.notifications_sms} onChange={handleChange} />
                تلقي رسائل نصية قصيرة (SMS) للتذكير بموعد الاستلام والتسليم
              </label>
            </div>
          </div>

          {/* Payment & Booking Section (Supplier Only) */}
          {user?.role === 'supplier' && (
            <div id="payment" className="card p-32 fade-in-up">
              <h3 className="font-bold border-b pb-8 mb-16 text-primary flex gap-8 align-center"><Save size={20} /> بيانات الدفع والحجز</h3>
              <form onSubmit={handleSaveProfile} className="flex flex-col gap-16">
                <div className="grid-2 gap-16">
                  <div className="form-group">
                    <label className="form-label">اسم البنك</label>
                    <input type="text" name="bank_name" className="form-input" value={settings.bank_name} onChange={handleChange} placeholder="مثال: بنك الراجحي" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">رقم الآيبان (IBAN)</label>
                    <input type="text" name="iban" className="form-input" value={settings.iban} onChange={handleChange} dir="ltr" placeholder="SA..." />
                  </div>
                </div>
                
                <div className="mt-16">
                  <h4 className="font-bold mb-12">إعدادات الحجز</h4>
                  <label className="flex gap-8 align-center cursor-pointer">
                    <input type="checkbox" name="auto_accept_bookings" checked={settings.auto_accept_bookings} onChange={handleChange} />
                    <span>قبول الحجوزات تلقائياً (تأكيد فوري للعميل)</span>
                  </label>
                </div>

                <div className="mt-16 text-right">
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    حفظ بيانات الدفع
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Verification Section */}
          <div id="verification" className={`card p-32 fade-in-up ${user?.is_verified ? 'border-success' : 'border-warning'}`} style={{ border: `1px solid ${user?.is_verified ? 'var(--accent)' : '#ffc107'}` }}>
            <h3 className={`font-bold border-b pb-8 mb-16 flex gap-8 align-center ${user?.is_verified ? 'text-success' : 'text-warning'}`}>
              <ShieldCheck size={20} /> حالة التوثيق (KYC)
            </h3>
            <div className="flex-between align-center">
              <div>
                <p className={`font-bold mb-4 ${user?.is_verified ? 'text-success' : 'text-warning'}`}>
                  {user?.is_verified ? 'حسابك موثق بالكامل' : 'حسابك قيد المراجعة / غير موثق'}
                </p>
                <p className="text-sm text-secondary">
                  {user?.is_verified 
                    ? 'تم التحقق من هويتك ورخصة القيادة بنجاح. يمكنك استئجار السيارات بكل حرية.' 
                    : 'يجب عليك إكمال توثيق الهوية (البطاقة الشخصية ورخصة القيادة) لتتمكن من إتمام الحجوزات في المنصة.'}
                </p>
              </div>
              <ShieldCheck size={48} className={`${user?.is_verified ? 'text-success' : 'text-warning'} opacity-50`} />
            </div>
          </div>

        </div>
      </div>
      </div>
    </div>
  );
}