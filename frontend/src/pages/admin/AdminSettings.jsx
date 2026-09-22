import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Save } from 'lucide-react';
import AdminSidebar from '../../components/AdminSidebar';
import { financeAPI } from '../../services/api';

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    platform_fee_percentage: 10,
    auto_approve_users: false,
    auto_approve_cars: false,
    maintenance_mode: false,
    support_email: 'support@rentcar.com'
  });

  const [loading, setLoading] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadSettings = async () => {
      try {
        const response = await financeAPI.getSettings();
        if (mounted && response.data?.data) {
          setSettings((current) => ({
            ...current,
            platform_fee_percentage: Number(response.data.data.commission_rate ?? 0),
          }));
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'تعذر تحميل إعدادات العمولة');
      } finally {
        if (mounted) setLoadingSettings(false);
      }
    };
    loadSettings();
    return () => { mounted = false; };
  }, []);

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
    try {
      await financeAPI.updateSettings({
        commission_rate: parseFloat(settings.platform_fee_percentage),
      });
      toast.success('تم حفظ عمولة المنصة وتطبيقها على المدفوعات الجديدة');
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذر حفظ عمولة المنصة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-settings-page" style={{ display: 'flex', minHeight: '100vh', background: '#f7fafb' }}>
      <AdminSidebar />

      {/* المحتوى الرئيسي */}
      <div className="admin-settings-content" style={{ flex: 1, padding: '30px 24px' }}>
        <h1 className="admin-settings-title" style={{ fontSize: '1.8rem', marginBottom: '32px' }}>إعدادات المنصة</h1>

        <div className="admin-settings-card" style={{ background: 'white', borderRadius: '12px', padding: '32px', maxWidth: '800px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* العمولات والرسوم */}
            <div>
              <h3 style={{ fontWeight: 'bold', borderBottom: '1px solid #dee2e6', paddingBottom: '8px', marginBottom: '16px', color: '#087f68' }}>العمولات والرسوم</h3>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>نسبة عمولة المنصة (%)</label>
                <input
                  type="number"
                  name="platform_fee_percentage"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px' }}
                  value={settings.platform_fee_percentage}
                  disabled={loadingSettings || loading}
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
              <h3 style={{ fontWeight: 'bold', borderBottom: '1px solid #dee2e6', paddingBottom: '8px', marginBottom: '16px', color: '#087f68' }}>إعدادات الموافقة</h3>
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
              <h3 style={{ fontWeight: 'bold', borderBottom: '1px solid #dee2e6', paddingBottom: '8px', marginBottom: '16px', color: '#087f68' }}>إعدادات النظام</h3>
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
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 'bold', color: '#b42318' }}>
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
                  background: '#087f68',
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
                {loading ? 'جاري الحفظ...' : <><Save size={18} /> حفظ عمولة المنصة</>}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .admin-settings-content { width: 100%; box-sizing: border-box; padding: 92px 14px 48px !important; }
          .admin-settings-card { max-width: none !important; }
        }
        @media (max-width: 520px) {
          .admin-settings-title { font-size: 1.45rem !important; margin-bottom: 20px !important; }
          .admin-settings-card { padding: 20px !important; }
          .admin-settings-content h3 { font-size: 1rem; line-height: 1.5; }
        }
      `}</style>
    </div>
  );
}
