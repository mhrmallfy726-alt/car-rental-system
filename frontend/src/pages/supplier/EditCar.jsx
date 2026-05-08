import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { carsAPI } from '../../services/api';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Car, LayoutDashboard, Plus, Calendar, Save, Upload, Image, X, Fuel, Palette, DoorOpen, Gauge, User, ChevronLeft } from 'lucide-react';
import { useRef } from 'react';

export default function EditCar() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const discountRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

  const [formData, setFormData] = useState({
    make: '', model: '', year: new Date().getFullYear(),
    category_id: '', location_id: '', color: '',
    license_plate: '', seats: 5, doors: 4,
    transmission: 'automatic', fuel_type: 'petrol',
    price_per_day: '', description: '', mileage: 0,
    discount_percentage: 0
  });

  useEffect(() => {
    fetchInitialData();
  }, [id]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [catRes, locRes, carRes] = await Promise.all([
        carsAPI.getCategories(),
        carsAPI.getLocations(),
        carsAPI.getOne(id)
      ]);
      
      setCategories(catRes.data.data);
      setLocations(locRes.data.data);
      
      const car = carRes.data.data;
      setFormData({
        make: car.make,
        model: car.model,
        year: car.year,
        category_id: car.category_id,
        location_id: car.location_id,
        color: car.color,
        license_plate: car.license_plate,
        seats: car.seats,
        doors: car.doors,
        transmission: car.transmission,
        fuel_type: car.fuel_type,
        price_per_day: car.price_per_day,
        description: car.description,
        mileage: car.mileage || 0,
        discount_percentage: car.discount_percentage || 0
      });
      
      setExistingImages(car.images || []);

      // Focus on discount if requested
      const params = new URLSearchParams(location.search);
      if (params.get('focus') === 'discount') {
        setTimeout(() => {
          discountRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          discountRef.current?.focus();
        }, 500);
      }
    } catch (error) {
      toast.error('فشل جلب بيانات السيارة');
      navigate('/supplier/cars');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'price_per_day' && parseFloat(value) < 0) return;
    if (name === 'discount_percentage' && (parseFloat(value) < 0 || parseFloat(value) > 100)) return;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(prev => [...prev, ...files]);
    const previews = files.map(f => URL.createObjectURL(f));
    setImagePreviews(prev => [...prev, ...previews]);
  };

  const removeNewImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const removeExistingImage = async (imgId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الصورة؟')) return;
    try {
      await api.delete(`/cars/images/${imgId}`);
      setExistingImages(prev => prev.filter(img => img.id !== imgId));
      toast.success('تم حذف الصورة');
    } catch (err) {
      toast.error('فشل حذف الصورة');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Update car info
      await carsAPI.update(id, formData);

      // Upload new images if any
      if (images.length > 0) {
        const formDataImages = new FormData();
        images.forEach(img => formDataImages.append('images', img));
        await api.post(`/cars/${id}/images`, formDataImages, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      toast.success('تم تحديث بيانات السيارة بنجاح');
      navigate('/supplier/cars');
    } catch (error) {
      toast.error(error.response?.data?.message || 'فشل تحديث البيانات');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div className="dashboard" style={{ display: 'flex', minHeight: '100vh', background: '#f8f9fa' }}>
      <div className="sidebar" style={{ width: '260px', background: 'white', borderLeft: '1px solid #e9ecef', padding: '24px 0', position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ padding: '0 16px' }}>
          <Link to="/supplier/dashboard" className="sidebar-item" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: '#1a1a1a', textDecoration: 'none', marginBottom: '4px' }}>
            <LayoutDashboard size={20} /> لوحة التحكم
          </Link>
          <Link to="/supplier/cars" className="sidebar-item active" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', background: '#e9ecef', color: '#0a58ca', fontWeight: 'bold', textDecoration: 'none', marginBottom: '4px' }}>
            <Car size={20} /> سياراتي
          </Link>
          <Link to="/supplier/cars/add" className="sidebar-item" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: '#1a1a1a', textDecoration: 'none', marginBottom: '4px' }}>
            <Plus size={20} /> إضافة سيارة
          </Link>
          <Link to="/supplier/reservations" className="sidebar-item" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: '#1a1a1a', textDecoration: 'none' }}>
            <Calendar size={20} /> الحجوزات
          </Link>
        </div>
      </div>

      <div className="dashboard-content" style={{ flex: 1, padding: '30px 24px' }}>
        <div className="flex align-center gap-12 mb-24">
          <Link to="/supplier/cars" className="btn btn-icon" style={{ background: 'white' }}><ChevronLeft /></Link>
          <h1 style={{ fontSize: '1.8rem', margin: 0 }}>تعديل بيانات {formData.make} {formData.model}</h1>
        </div>

        <div className="card" style={{ background: 'white', borderRadius: '12px', padding: '32px', maxWidth: '900px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div><label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>الشركة المصنعة</label>
                <input type="text" name="make" className="form-input" style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px' }} required value={formData.make} onChange={handleChange} />
              </div>
              <div><label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>الموديل</label>
                <input type="text" name="model" className="form-input" style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px' }} required value={formData.model} onChange={handleChange} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div><label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>سنة الصنع</label>
                <input type="number" name="year" className="form-input" style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px' }} required value={formData.year} onChange={handleChange} />
              </div>
              <div><label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>رقم اللوحة</label>
                <input type="text" name="license_plate" className="form-input" style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px' }} required value={formData.license_plate} onChange={handleChange} dir="ltr" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div><label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>الفئة</label>
                <select name="category_id" className="form-input" style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px' }} required value={formData.category_id} onChange={handleChange}>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name_ar || c.name}</option>)}
                </select>
              </div>
              <div><label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>المدينة</label>
                <select name="location_id" className="form-input" style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px' }} required value={formData.location_id} onChange={handleChange}>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.city}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div><label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>ناقل الحركة</label>
                <select name="transmission" className="form-input" style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px' }} value={formData.transmission} onChange={handleChange}>
                  <option value="automatic">أوتوماتيك</option><option value="manual">يدوي</option>
                </select>
              </div>
              <div><label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>السعر اليومي ($)</label>
                <input type="number" name="price_per_day" className="form-input" style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px' }} required value={formData.price_per_day} onChange={handleChange} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div><label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>نسبة الخصم (%)</label>
                <input ref={discountRef} type="number" name="discount_percentage" className="form-input" style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px' }} value={formData.discount_percentage} onChange={handleChange} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div><label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}><User size={14} style={{ display: 'inline', marginLeft: '4px' }} /> المقاعد</label>
                <input type="number" name="seats" className="form-input" style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px' }} value={formData.seats} onChange={handleChange} />
              </div>
              <div><label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}><DoorOpen size={14} style={{ display: 'inline', marginLeft: '4px' }} /> الأبواب</label>
                <input type="number" name="doors" className="form-input" style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px' }} value={formData.doors} onChange={handleChange} />
              </div>
              <div><label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}><Fuel size={14} style={{ display: 'inline', marginLeft: '4px' }} /> الوقود</label>
                <select name="fuel_type" className="form-input" style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px' }} value={formData.fuel_type} onChange={handleChange}>
                  <option value="petrol">بنزين</option><option value="diesel">ديزل</option><option value="hybrid">هايبرد</option><option value="electric">كهربائي</option>
                </select>
              </div>
            </div>

            <div><label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>الوصف</label>
              <textarea name="description" className="form-input" rows="4" style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px' }} value={formData.description} onChange={handleChange}></textarea>
            </div>

            {/* الصور الموجودة */}
            <div>
              <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600' }}>الصور الحالية</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                {existingImages.map(img => (
                  <div key={img.id} style={{ position: 'relative', width: '120px', height: '90px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #dee2e6' }}>
                    <img src={img.image_url.startsWith('http') ? img.image_url : `http://localhost:5000/${img.image_url}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button type="button" onClick={() => removeExistingImage(img.id)} style={{ position: 'absolute', top: '4px', left: '4px', background: 'rgba(220,38,38,0.9)', color: 'white', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                  </div>
                ))}
              </div>
            </div>

            {/* إضافة صور جديدة */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>إضافة صور جديدة</label>
              <div style={{ border: '2px dashed #ced4da', borderRadius: '8px', padding: '20px', textAlign: 'center', background: '#f8f9fa' }}>
                <Upload size={32} style={{ margin: '0 auto 8px', color: '#6c757d' }} />
                <input type="file" id="new_images" multiple style={{ display: 'none' }} onChange={handleImageChange} />
                <label htmlFor="new_images" className="btn btn-secondary" style={{ cursor: 'pointer' }}>اختر صوراً</label>
              </div>
              {imagePreviews.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '16px' }}>
                  {imagePreviews.map((src, i) => (
                    <div key={i} style={{ position: 'relative', width: '90px', height: '70px', borderRadius: '6px', overflow: 'hidden' }}>
                      <img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button type="button" onClick={() => removeNewImage(i)} style={{ position: 'absolute', top: '2px', left: '2px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '50%', width: '18px', height: '18px', cursor: 'pointer' }}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary" style={{ height: '48px', fontSize: '1.1rem' }} disabled={saving}>
              {saving ? 'جاري الحفظ...' : <><Save size={18} /> حفظ التغييرات</>}
            </button>
          </form>
        </div>
      </div>
      
      <style>{`
        .sidebar-item:hover { background: #f1f3f5; }
        .sidebar-item.active { background: #e9ecef !important; }
        .spinner { width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #0a58ca; border-radius: 50%; animation: spin 1s linear infinite; margin: 50px auto; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
