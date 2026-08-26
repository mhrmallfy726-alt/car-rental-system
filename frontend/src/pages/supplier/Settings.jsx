import { useState } from 'react';
import toast from 'react-hot-toast';
import { Settings, CreditCard, Building, ShieldCheck, Save, Upload, User, Check, X } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { authAPI } from '../../services/api';

import { getImageUrl } from '../../utils/imageUtils';
export default function SupplierSettings() {
  const { user, fetchMe } = useAuthStore();
  const [activeTab, setActiveTab] = useState('company'); // 'company', 'payment', 'booking'

  const [settings, setSettings] = useState({
    name: user?.name || '',
    company_name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    iban: user?.iban || '',
    bank_name: user?.bank_name || '',
    brand_description: user?.brand_description || '',
    tax_id: user?.tax_id || '',
    auto_accept_bookings: user?.auto_accept_bookings || false
  });
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(
    user?.brand_logo ? (user.brand_logo.startsWith('http') ? user.brand_logo : getImageUrl(user.brand_logo)) : null
  );
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setSettings({ ...settings, [e.target.name]: value });
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // التحقق من حجم الصورة (أقل من 2 ميجابايت)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('حجم الصورة يجب أن لا يتجاوز 2 ميجابايت');
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    // رفع تلقائي بعد اختيار الصورة (تحسين UX)
    uploadLogo(file);
  };

  const uploadLogo = async (file) => {
    if (!file) return;
    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      await authAPI.uploadBrandLogo(fd);
      toast.success('تم رفع الشعار بنجاح');
      if (fetchMe) await fetchMe();
      setLogoFile(null);
    } catch (error) {
      toast.error('فشل رفع الشعار: ' + (error.response?.data?.message || error.message));
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.updateProfile({
        name: settings.name,           // إضافة name المفقود
        company_name: settings.company_name,
        phone: settings.phone,
        address: settings.address,
        iban: settings.iban,
        bank_name: settings.bank_name,
        auto_accept_bookings: settings.auto_accept_bookings,
        brand_description: settings.brand_description,
        tax_id: settings.tax_id
      });
      toast.success('تم حفظ الإعدادات بنجاح');
      if (fetchMe) await fetchMe();
    } catch (error) {
      toast.error('فشل الحفظ: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh', padding: '24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* رأس الصفحة */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e9ecef', paddingBottom: '16px', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', gap: '8px', alignItems: 'center', color: '#0a58ca' }}>
            <Settings size={24} /> إعدادات المورد
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          {/* القائمة الجانبية (responsive) */}
          <div style={{ flex: '1', minWidth: '220px', maxWidth: '280px' }}>
            <div style={{ background: 'white', borderRadius: '12px', padding: '16px', position: 'sticky', top: '90px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={() => setActiveTab('company')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 16px', borderRadius: '8px', border: 'none',
                    background: activeTab === 'company' ? '#e9ecef' : 'transparent',
                    color: activeTab === 'company' ? '#0a58ca' : '#6c757d',
                    fontWeight: activeTab === 'company' ? 'bold' : 'normal',
                    width: '100%', textAlign: 'right', cursor: 'pointer'
                  }}
                >
                  <Building size={18} /> بيانات الشركة
                </button>
                <button
                  onClick={() => setActiveTab('payment')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 16px', borderRadius: '8px', border: 'none',
                    background: activeTab === 'payment' ? '#e9ecef' : 'transparent',
                    color: activeTab === 'payment' ? '#0a58ca' : '#6c757d',
                    fontWeight: activeTab === 'payment' ? 'bold' : 'normal',
                    width: '100%', textAlign: 'right', cursor: 'pointer'
                  }}
                >
                  <CreditCard size={18} /> بيانات الدفع
                </button>
                <button
                  onClick={() => setActiveTab('booking')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 16px', borderRadius: '8px', border: 'none',
                    background: activeTab === 'booking' ? '#e9ecef' : 'transparent',
                    color: activeTab === 'booking' ? '#0a58ca' : '#6c757d',
                    fontWeight: activeTab === 'booking' ? 'bold' : 'normal',
                    width: '100%', textAlign: 'right', cursor: 'pointer'
                  }}
                >
                  <ShieldCheck size={18} /> إعدادات الحجز
                </button>
              </div>
            </div>
          </div>

          {/* نموذج الإعدادات (يظهر حسب التبويب النشط) */}
          <div style={{ flex: '3', minWidth: '280px' }}>
            <div style={{ background: 'white', borderRadius: '12px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <form onSubmit={handleSave}>
                {/* تبويب بيانات الشركة */}
                {activeTab === 'company' && (
                  <div>
                    <h3 style={{ fontWeight: 'bold', borderBottom: '1px solid #e9ecef', paddingBottom: '8px', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center', color: '#0a58ca' }}>
                      <Building size={20} /> بيانات الشركة (الظاهرة للعملاء)
                    </h3>

                    {/* رفع الشعار */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', marginBottom: '24px', padding: '16px', background: '#f8f9fa', borderRadius: '8px', border: '1px dashed #dee2e6' }}>
                      <div style={{ width: '72px', height: '72px', borderRadius: '50%', overflow: 'hidden', background: '#e9ecef', border: '2px solid #dee2e6', flexShrink: 0 }}>
                        {logoPreview ? (
                          <img src={logoPreview} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User size={32} color="#6c757d" />
                          </div>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '0.9rem' }}>شعار الشركة / صورة المورد</p>
                        <p style={{ fontSize: '0.75rem', color: '#6c757d', marginBottom: '8px' }}>يظهر للعملاء في صفحات السيارات وبجانب تقييماتك</p>
                        <input type="file" accept="image/*" id="logo_upload" style={{ display: 'none' }} onChange={handleLogoChange} />
                        <label htmlFor="logo_upload" style={{ background: '#6c757d', color: 'white', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <Upload size={14} /> اختر صورة
                        </label>
                        {uploadingLogo && <span style={{ marginRight: '12px', fontSize: '0.8rem', color: '#0a58ca' }}>جاري الرفع...</span>}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>اسم المستخدم (للحساب)</label>
                        <input type="text" name="name" className="form-input" style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px' }} value={settings.name} onChange={handleChange} required />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>اسم الشركة / المعرض</label>
                        <input type="text" name="company_name" className="form-input" style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px' }} value={settings.company_name} onChange={handleChange} required />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '16px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>رقم الهاتف</label>
                        <input type="tel" name="phone" className="form-input" dir="ltr" style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px' }} value={settings.phone} onChange={handleChange} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>الرقم الضريبي (اختياري)</label>
                        <input type="text" name="tax_id" className="form-input" style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px' }} value={settings.tax_id} onChange={handleChange} />
                      </div>
                    </div>
                    <div style={{ marginTop: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>العنوان</label>
                      <input type="text" name="address" className="form-input" style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px' }} value={settings.address} onChange={handleChange} />
                    </div>
                    <div style={{ marginTop: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>وصف العلامة التجارية / نبذة عن المورد</label>
                      <textarea name="brand_description" rows="3" className="form-input" style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px' }} value={settings.brand_description} onChange={handleChange} placeholder="اكتب نبذة قصيرة تظهر للعملاء..."></textarea>
                    </div>
                  </div>
                )}

                {/* تبويب بيانات الدفع */}
                {activeTab === 'payment' && (
                  <div>
                    <h3 style={{ fontWeight: 'bold', borderBottom: '1px solid #e9ecef', paddingBottom: '8px', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center', color: '#0a58ca' }}>
                      <CreditCard size={20} /> بيانات الدفع (لاستلام الأرباح)
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>اسم البنك</label>
                        <input type="text" name="bank_name" className="form-input" style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px' }} value={settings.bank_name} onChange={handleChange} required />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>رقم الحساب الدولي (IBAN)</label>
                        <input type="text" name="iban" className="form-input" style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px', direction: 'ltr', textAlign: 'left' }} value={settings.iban} onChange={handleChange} placeholder="SA..." required />
                      </div>
                    </div>
                    <p style={{ fontSize: '0.7rem', color: '#6c757d', marginTop: '8px' }}>سيتم تحويل أرباحك إلى هذا الحساب في نهاية كل شهر بناءً على سياسة المنصة.</p>
                  </div>
                )}

                {/* تبويب إعدادات الحجز */}
                {activeTab === 'booking' && (
                  <div>
                    <h3 style={{ fontWeight: 'bold', borderBottom: '1px solid #e9ecef', paddingBottom: '8px', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center', color: '#0a58ca' }}>
                      <ShieldCheck size={20} /> إعدادات الحجز والعمليات
                    </h3>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>
                      <input type="checkbox" name="auto_accept_bookings" checked={settings.auto_accept_bookings} onChange={handleChange} style={{ width: '18px', height: '18px' }} />
                      قبول الحجوزات تلقائياً (سيتم تأكيد الحجز مباشرة دون الحاجة لموافقتك اليدوية)
                    </label>
                  </div>
                )}

                {/* أزرار الحفظ (تظهر في جميع التبويبات) */}
                <div style={{ borderTop: '1px solid #e9ecef', paddingTop: '24px', marginTop: '24px' }}>
                  <button type="submit" disabled={loading} style={{ background: '#0a58ca', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    {loading ? 'جاري الحفظ...' : <><Save size={18} /> حفظ الإعدادات</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* أنماط عامة و responsive */}
      <style>{`
        @media (max-width: 768px) {
          [style*="display: flex"][style*="gap: 24px"] {
            flex-direction: column;
          }
          [style*="max-width: 280px"] {
            max-width: 100% !important;
          }
        }
        .form-input:focus {
          outline: none;
          border-color: #86b7fe;
          box-shadow: 0 0 0 2px rgba(13,110,253,0.25);
        }
      `}</style>
    </div>
  );
}