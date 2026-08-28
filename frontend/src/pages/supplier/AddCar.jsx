import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { carsAPI } from '../../services/api';
import SupplierSidebar from '../../components/SupplierSidebar';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Car, LayoutDashboard, Plus, Calendar, Save, Upload, Image, X, Fuel, Palette, DoorOpen, Gauge, User } from 'lucide-react';

export default function AddCar() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const [formData, setFormData] = useState({
    make: '', model: '', year: new Date().getFullYear(),
    category_id: '', location_id: '', color: '',
    license_plate: '', seats: 5, doors: 4,
    transmission: 'automatic', fuel_type: 'petrol',
    price_per_day: '', description: '', mileage: 0
  });

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      const [catRes, locRes] = await Promise.all([carsAPI.getCategories(), carsAPI.getLocations()]);
      setCategories(catRes.data.data);
      setLocations(locRes.data.data);
      if (catRes.data.data.length > 0) setFormData(prev => ({ ...prev, category_id: catRes.data.data[0].id }));
      if (locRes.data.data.length > 0) setFormData(prev => ({ ...prev, location_id: locRes.data.data[0].id }));
    } catch (error) {
      toast.error('فشل جلب البيانات الأساسية');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // تحقق بسيط للحقول الرقمية لتجنب القيم السالبة
    if (name === 'price_per_day' && parseFloat(value) < 0) return;
    if (name === 'year') {
      const currentYear = new Date().getFullYear();
      if (value < 1980 || value > currentYear + 1) return; // +1 للسماح بموديلات العام القادم
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    const invalidFiles = files.filter(f => !validTypes.includes(f.type));
    if (invalidFiles.length) {
      toast.error('يرجى رفع صور بصيغة JPG, PNG, أو WEBP فقط');
      return;
    }
    if (files.length + images.length > 8) {
      toast.error(`الحد الأقصى 8 صور، يمكنك إضافة ${8 - images.length} صور أخرى`);
      return;
    }
    setImages(prev => [...prev, ...files]);
    const previews = files.map(f => URL.createObjectURL(f));
    setImagePreviews(prev => [...prev, ...previews]);
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (images.length === 0) return toast.error('يرجى إضافة صورة واحدة على الأقل للسيارة');

    // تحقق إضافي من الأسعار
    if (parseFloat(formData.price_per_day) <= 0) {
      return toast.error('السعر اليومي يجب أن يكون أكبر من صفر');
    }

    setLoading(true);
    try {
      // Step 1: Create car
      const carRes = await carsAPI.create(formData);
      const carId = carRes.data.data.id;

      // Step 2: Upload images
      const formDataImages = new FormData();
      images.forEach(img => formDataImages.append('images', img));
      await api.post(`/cars/${carId}/images`, formDataImages, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('تم إضافة السيارة بنجاح (بانتظار موافقة الإدارة)');
      navigate('/supplier/cars');
    } catch (error) {
      toast.error(error.response?.data?.message || 'فشل إضافة السيارة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard" style={{ display: 'flex', minHeight: '100vh', background: '#f8f9fa' }}>
      <SupplierSidebar />

      <div className="dashboard-content" style={{ flex: 1, padding: '30px 24px' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '24px' }}>إضافة سيارة جديدة</h1>

        <div className="card" style={{ background: 'white', borderRadius: '12px', padding: '32px', maxWidth: '900px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* صف 1: الصانع والموديل */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div><label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>الشركة المصنعة</label>
                <input type="text" name="make" className="form-input" style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px' }} required value={formData.make} onChange={handleChange} placeholder="مثال: Toyota" />
              </div>
              <div><label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>الموديل</label>
                <input type="text" name="model" className="form-input" style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px' }} required value={formData.model} onChange={handleChange} placeholder="مثال: Camry" />
              </div>
            </div>

            {/* صف 2: السنة واللوحة */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div><label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>سنة الصنع</label>
                <input type="number" name="year" className="form-input" style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px' }} required value={formData.year} onChange={handleChange} min="1980" max={new Date().getFullYear() + 1} />
              </div>
              <div><label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>رقم اللوحة</label>
                <input type="text" name="license_plate" className="form-input" style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px' }} required value={formData.license_plate} onChange={handleChange} dir="ltr" />
              </div>
            </div>

            {/* صف 3: الفئة والموقع */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div><label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>الفئة</label>
                <select name="category_id" className="form-input" style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px' }} required value={formData.category_id} onChange={handleChange}>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name_ar || c.name}</option>)}
                </select>
              </div>
              <div><label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>المدينة المتاحة بها</label>
                <select name="location_id" className="form-input" style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px' }} required value={formData.location_id} onChange={handleChange}>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.city}</option>)}
                </select>
              </div>
            </div>

            {/* صف 4: ناقل الحركة والسعر */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div><label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>ناقل الحركة</label>
                <select name="transmission" className="form-input" style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px' }} value={formData.transmission} onChange={handleChange}>
                  <option value="automatic">أوتوماتيك</option><option value="manual">عادي (يدوي)</option>
                </select>
              </div>
              <div><label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>السعر اليومي ($)</label>
                <input type="number" name="price_per_day" className="form-input" style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px' }} required value={formData.price_per_day} onChange={handleChange} min="1" step="1" />
              </div>
            </div>


            {/* صف 6: الحقول المضافة (المقاعد، الأبواب، اللون، نوع الوقود، المسافة) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div><label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}><User size={14} style={{ display: 'inline', marginLeft: '4px' }} /> عدد المقاعد</label>
                <input type="number" name="seats" className="form-input" style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px' }} value={formData.seats} onChange={handleChange} min="1" max="9" />
              </div>
              <div><label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}><DoorOpen size={14} style={{ display: 'inline', marginLeft: '4px' }} /> عدد الأبواب</label>
                <input type="number" name="doors" className="form-input" style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px' }} value={formData.doors} onChange={handleChange} min="2" max="5" />
              </div>
              <div><label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}><Palette size={14} style={{ display: 'inline', marginLeft: '4px' }} /> اللون</label>
                <input type="text" name="color" className="form-input" style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px' }} value={formData.color} onChange={handleChange} placeholder="مثال: أبيض" />
              </div>
              <div><label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}><Fuel size={14} style={{ display: 'inline', marginLeft: '4px' }} /> نوع الوقود</label>
                <select name="fuel_type" className="form-input" style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px' }} value={formData.fuel_type} onChange={handleChange}>
                  <option value="petrol">بنزين</option><option value="diesel">ديزل</option><option value="hybrid">هايبرد</option><option value="electric">كهربائي</option>
                </select>
              </div>
              <div><label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}><Gauge size={14} style={{ display: 'inline', marginLeft: '4px' }} /> المسافة المقطوعة (كم)</label>
                <input type="number" name="mileage" className="form-input" style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px' }} value={formData.mileage} onChange={handleChange} min="0" step="1" />
              </div>
            </div>

            {/* الوصف */}
            <div><label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>وصف السيارة</label>
              <textarea name="description" className="form-input" rows="4" style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px' }} value={formData.description} onChange={handleChange} placeholder="اكتب تفاصيل ومميزات السيارة..."></textarea>
            </div>

            {/* رفع الصور */}
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>صور السيارة <span style={{ color: '#dc3545' }}>*</span> <span style={{ color: '#6c757d', fontSize: '0.8rem' }}>(الأولى ستكون الصورة الرئيسية)</span></label>
              <div style={{ border: '2px dashed #ced4da', borderRadius: '8px', padding: '20px', textAlign: 'center', background: '#f8f9fa' }}>
                <Image size={32} style={{ margin: '0 auto 8px', color: '#6c757d' }} />
                <p style={{ fontSize: '0.85rem', color: '#6c757d', marginBottom: '8px' }}>ارفع صور السيارة (حتى 8 صور - JPG, PNG, WEBP)</p>
                <p style={{ fontSize: '0.75rem', color: '#6c757d', marginBottom: '12px' }}>المتبقي: {8 - images.length} صورة</p>
                <input type="file" id="car_images" accept="image/jpeg,image/png,image/webp" multiple style={{ display: 'none' }} onChange={handleImageChange} />
                <label htmlFor="car_images" className="btn btn-secondary" style={{ display: 'inline-block', background: '#6c757d', color: 'white', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>
                  <Upload size={14} style={{ display: 'inline', marginLeft: '6px' }} /> اختر صوراً
                </label>
              </div>
              {/* معاينة الصور */}
              {imagePreviews.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '16px' }}>
                  {imagePreviews.map((src, i) => (
                    <div key={i} style={{ position: 'relative', width: '90px', height: '70px', border: '1px solid #dee2e6', borderRadius: '6px', overflow: 'hidden' }}>
                      <img src={src} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {i === 0 && <span style={{ position: 'absolute', top: '2px', right: '2px', background: '#0a58ca', color: 'white', fontSize: '0.6rem', padding: '1px 4px', borderRadius: '4px' }}>رئيسية</span>}
                      <button type="button" onClick={() => removeImage(i)} style={{ position: 'absolute', top: '2px', left: '2px', background: 'rgba(220,38,38,0.8)', color: 'white', border: 'none', borderRadius: '50%', width: '18px', height: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary" style={{ background: '#0a58ca', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} disabled={loading}>
              {loading ? 'جاري الحفظ...' : <><Save size={18} /> حفظ وإرسال للمراجعة</>}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .dashboard {
            flex-direction: column;
          }
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
          .sidebar-item {
            flex: 1 0 auto;
            justify-content: center;
          }
          .dashboard-content {
            padding: 20px 16px !important;
          }
          .card {
            padding: 20px !important;
          }
          [style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
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