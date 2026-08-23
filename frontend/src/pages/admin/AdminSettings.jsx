import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LayoutDashboard, Users, Car, ShieldAlert, Settings as SettingsIcon, Save, AlertTriangle } from 'lucide-react';

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    platform_fee_percentage: 10,
    auto_approve_users: false,
    auto_approve_cars: false,
    maintenance_mode: false,
    support_email: 'support@rentcar.com'
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setSettings({ ...settings, [e.target.name]: value });
  };

  const validateSettings = () => {
    const fee = parseFloat(settings.platform_fee_percentage);
    if (isNaN(fee) || fee < 0 || fee > 100) {
      toast.error('نسبة العمولة يجب أن تكون بين 0 و 100');
      return false;
    }
    if (settings.support_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.support_email)) {
      toast.error('البريد الإلكتروني للدعم غير صالح');
      return false;
    }
    return true;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validateSettings()) return;

    // تأكيد عند تفعيل وضع الصيانة
    if (settings.maintenance_mode && !window.confirm('تحذير: تفعيل وضع الصيانة سيمنع جميع المستخدمين من الوصول إلى المنصة. هل أنت متأكد؟')) {
      return;
    }

    setLoading(true);
    // TODO: استبدل هذا الاستدعاء بـ API حقيقي
    // await adminAPI.updateSettings(settings);
    setTimeout(() => {
      setLoading(false);
      toast.success('تم حفظ إعدادات المنصة بنجاح'); // بدون إيموجي
    }, 1000);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8f9fa' }}>
      {/* القائمة الجانبية */}
      <div className="sidebar" style={{ width: '260px', background: 'white', borderLeft: '1px solid #e9ecef', padding: '24px 0', position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Link to="/admin/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: '#1a1a1a', textDecoration: 'none' }}>
            <LayoutDashboard size={20} /> الإحصائيات
          </Link>
          <Link to="/admin/users" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: '#1a1a1a', textDecoration: 'none' }}>
            <Users size={20} /> المستخدمين
          </Link>
          <Link to="/admin/cars" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: '#1a1a1a', textDecoration: 'none' }}>
            <Car size={20} /> السيارات
          </Link>
          <Link to="/admin/complaints" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: '#1a1a1a', textDecoration: 'none' }}>
            <ShieldAlert size={20} /> الشكاوى
          </Link>
          <Link to="/admin/advertisement-center" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: '#1a1a1a', textDecoration: 'none' }}>
            <ShieldAlert size={20} />  الإحصائيات
          </Link>
          <Link to="/admin/settings" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', background: '#e9ecef', color: '#0a58ca', fontWeight: 'bold', textDecoration: 'none' }}>
            <SettingsIcon size={20} /> الإعدادات
          </Link>
        </div>
      </div>

      {/* المحتوى الرئيسي */}
      <div style={{ flex: 1, padding: '30px 24px' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '32px' }}>إعدادات المنصة</h1>

        <div style={{ background: 'white', borderRadius: '12px', padding: '32px', maxWidth: '800px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* العمولات والرسوم */}
            <div>
              <h3 style={{ fontWeight: 'bold', borderBottom: '1px solid #dee2e6', paddingBottom: '8px', marginBottom: '16px', color: '#0a58ca' }}>العمولات والرسوم</h3>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>نسبة عمولة المنصة (%)</label>
                <input
                  type="number"
                  name="platform_fee_percentage"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px' }}
                  value={settings.platform_fee_percentage}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  step="0.5"
                />
                <p style={{ fontSize: '0.7rem', color: '#6c757d', marginTop: '4px' }}>هذه النسبة سيتم خصمها من أرباح الموردين لصالح المنصة.</p>
              </div>
            </div>

            {/* إعدادات الموافقة */}
            <div>
              <h3 style={{ fontWeight: 'bold', borderBottom: '1px solid #dee2e6', paddingBottom: '8px', marginBottom: '16px', color: '#0a58ca' }}>إعدادات الموافقة</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
                  <input type="checkbox" name="auto_approve_users" checked={settings.auto_approve_users} onChange={handleChange} style={{ width: '18px', height: '18px' }} />
                  الموافقة التلقائية على المستخدمين الجدد
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
                  <input type="checkbox" name="auto_approve_cars" checked={settings.auto_approve_cars} onChange={handleChange} style={{ width: '18px', height: '18px' }} />
                  الموافقة التلقائية على السيارات الجديدة المضافة
                </label>
              </div>
            </div>

            {/* إعدادات النظام */}
            <div>
              <h3 style={{ fontWeight: 'bold', borderBottom: '1px solid #dee2e6', paddingBottom: '8px', marginBottom: '16px', color: '#0a58ca' }}>إعدادات النظام</h3>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>البريد الإلكتروني للدعم الفني</label>
                <input
                  type="email"
                  name="support_email"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px' }}
                  value={settings.support_email}
                  onChange={handleChange}
                />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 'bold', color: '#dc3545' }}>
                <input type="checkbox" name="maintenance_mode" checked={settings.maintenance_mode} onChange={handleChange} style={{ width: '18px', height: '18px' }} />
                تفعيل وضع الصيانة (سيمنع وصول المستخدمين للمنصة)
              </label>
            </div>

            {/* زر الحفظ */}
            <div style={{ borderTop: '1px solid #dee2e6', paddingTop: '24px', marginTop: '8px' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: '#0a58ca',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {loading ? 'جاري الحفظ...' : <><Save size={18} /> حفظ التغييرات</>}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .sidebar {
            width: 100% !important;
            height: auto !important;
            position: relative !important;
            border-left: none !important;
            border-bottom: 1px solid #e9ecef;
            padding: 12px 0 !important;
          }
          .sidebar > div {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            justify-content: center;
          }
          .sidebar a {
            flex: 1 0 auto;
            justify-content: center;
          }
          [style*="max-width: 800px"] {
            max-width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}