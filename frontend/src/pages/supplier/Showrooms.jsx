import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import SupplierSidebar from '../../components/SupplierSidebar';
import { supplierShowroomsAPI, carsAPI } from '../../services/api';

export default function Showrooms() {
  const [showrooms, setShowrooms] = useState([]);
  const [locations, setLocations] = useState([]);
  const [name, setName] = useState('');
  const [locationId, setLocationId] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [showroomRes, locationRes] = await Promise.all([
        supplierShowroomsAPI.getAll(),
        carsAPI.getLocations(),
      ]);
      setShowrooms(showroomRes.data.data || []);
      setLocations(locationRes.data.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذر تحميل المعارض');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const createShowroom = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('أدخل اسم المعرض');
    setSaving(true);
    try {
      await supplierShowroomsAPI.create({
        name: name.trim(),
        location_id: locationId || null,
        address: address.trim() || null,
        phone: phone.trim() || null,
      });
      toast.success('تم إنشاء المعرض بنجاح');
      setName(''); setLocationId(''); setAddress(''); setPhone('');
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذر إنشاء المعرض');
    } finally {
      setSaving(false);
    }
  };

  const disableShowroom = async (id) => {
    if (!window.confirm('هل تريد تعطيل هذا المعرض؟')) return;
    try {
      await supplierShowroomsAPI.disable(id);
      toast.success('تم تعطيل المعرض');
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذر تعطيل المعرض');
    }
  };

  return (
    <div className="dashboard" style={{ display: 'flex', minHeight: '100vh', background: '#f8f9fa' }}>
      <SupplierSidebar />
      <main className="dashboard-content" style={{ flex: 1, padding: 30 }} dir="rtl">
        <h1>معارضي</h1>
        <p style={{ color: '#667085' }}>حساب مورد واحد يمكنه إدارة عدة معارض، بينما يبقى البريد الإلكتروني للحساب واحداً.</p>

        <form onSubmit={createShowroom} style={{ background: '#fff', padding: 24, borderRadius: 14, margin: '24px 0', display: 'grid', gap: 14, maxWidth: 850 }}>
          <h2 style={{ margin: 0 }}>إضافة معرض جديد</h2>
          <input required value={name} onChange={e => setName(e.target.value)} placeholder="اسم المعرض — يجب ألا يتكرر" />
          <select value={locationId} onChange={e => setLocationId(e.target.value)}>
            <option value="">اختر المدينة</option>
            {locations.map(l => <option key={l.id} value={l.id}>{l.city}</option>)}
          </select>
          <input value={address} onChange={e => setAddress(e.target.value)} placeholder="العنوان التفصيلي" />
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="هاتف المعرض" dir="ltr" />
          <button type="submit" disabled={saving}>{saving ? 'جاري الحفظ...' : 'إضافة المعرض'}</button>
        </form>

        {loading ? <p>جاري التحميل...</p> : (
          <div style={{ display: 'grid', gap: 14 }}>
            {showrooms.length === 0 && <p>لا توجد معارض مضافة حتى الآن.</p>}
            {showrooms.map(showroom => (
              <div key={showroom.id} style={{ background: '#fff', padding: 20, borderRadius: 14, display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0 }}>{showroom.name}</h3>
                  <div>{showroom.location_city || 'لم تحدد المدينة'}</div>
                  {showroom.address && <small>{showroom.address}</small>}
                  {showroom.phone && <div dir="ltr">{showroom.phone}</div>}
                  <small>{showroom.is_active ? 'نشط' : 'معطل'}</small>
                </div>
                {showroom.is_active && <button type="button" onClick={() => disableShowroom(showroom.id)}>تعطيل</button>}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
