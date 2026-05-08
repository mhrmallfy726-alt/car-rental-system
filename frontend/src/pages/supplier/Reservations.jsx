import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { reservationsAPI, handoverAPI, default as api } from '../../services/api';
import toast from 'react-hot-toast';
import { Calendar, LayoutDashboard, Car, Plus, CheckCircle, XCircle, Camera, Upload, X, Trash2, Eye, MessageSquare, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export default function SupplierReservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Handover State
  const [showHandover, setShowHandover] = useState(false);
  const [handoverType, setHandoverType] = useState('before');
  const [selectedResId, setSelectedResId] = useState(null);
  const [handoverData, setHandoverData] = useState({ fuel_level: 100, mileage: '', condition_notes: '', exterior_condition: 'excellent', interior_condition: 'excellent' });
  const [handoverImages, setHandoverImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [submittingHandover, setSubmittingHandover] = useState(false);
  const fileInputRef = useRef(null);

  // Dispute Modal State
  const [showDispute, setShowDispute] = useState(false);
  const [selectedResForDispute, setSelectedResForDispute] = useState(null);
  const [disputeData, setDisputeData] = useState({ type: 'other', title: '', description: '' });
  const [submittingDispute, setSubmittingDispute] = useState(false);

  const openDisputeModal = (res) => {
    setSelectedResForDispute(res);
    setDisputeData({ type: 'other', title: '', description: '' });
    setShowDispute(true);
  };

  const submitDispute = async (e) => {
    e.preventDefault();
    if (!disputeData.title || !disputeData.description) {
      toast.error('الرجاء إكمال جميع الحقول');
      return;
    }
    setSubmittingDispute(true);
    try {
      const res = await api.post('/complaints', {
        reservation_id: selectedResForDispute.id,
        title: disputeData.title,
        description: disputeData.description,
        type: disputeData.type,
        is_chat: false
      });
      toast.success('تم فتح النزاع بنجاح');
      setShowDispute(false);
      navigate(`/complaints/${res.data.data.id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'فشل فتح النزاع');
    } finally {
      setSubmittingDispute(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      const res = await reservationsAPI.getMy();
      setReservations(res.data.data);
    } catch (error) {
      toast.error('فشل جلب الحجوزات');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    try {
      if (action === 'approve') await reservationsAPI.approve(id);
      if (action === 'reject') {
        if (!window.confirm('هل أنت متأكد من رفض هذا الحجز؟ لا يمكن التراجع.')) return;
        await reservationsAPI.reject(id, { supplier_notes: 'مرفوض من قبل المورد' });
      }
      if (action === 'complete') await reservationsAPI.complete(id);

      toast.success('تم تحديث حالة الحجز');
      fetchReservations();
    } catch (error) {
      toast.error(error.response?.data?.message || 'فشل التحديث');
    }
  };

  const openHandover = (resId, type) => {
    setSelectedResId(resId);
    setHandoverType(type);
    setHandoverData({ fuel_level: 100, mileage: '', condition_notes: '', exterior_condition: 'excellent', interior_condition: 'excellent' });
    setHandoverImages([]);
    setImagePreviews([]);
    setShowHandover(true);
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    setHandoverImages(prev => [...prev, ...files]);
    // Create previews
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index) => {
    // Revoke object URL to avoid memory leaks
    URL.revokeObjectURL(imagePreviews[index]);
    setHandoverImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleHandoverSubmit = async (e) => {
    e.preventDefault();
    if (handoverImages.length === 0) return toast.error('يرجى إرفاق صورة واحدة على الأقل');
    if (!handoverData.mileage) return toast.error('يرجى إدخال قراءة العداد');
    if (parseInt(handoverData.mileage) <= 0) return toast.error('قراءة العداد يجب أن تكون رقماً موجباً');

    setSubmittingHandover(true);
    const formData = new FormData();
    Object.keys(handoverData).forEach(key => formData.append(key, handoverData[key]));
    for (let i = 0; i < handoverImages.length; i++) {
      formData.append('images', handoverImages[i]);
    }

    try {
      await handoverAPI.submit(selectedResId, handoverType, formData);
      toast.success('تم رفع تقرير التوثيق بنجاح');
      setShowHandover(false);

      if (handoverType === 'after') {
        await handleAction(selectedResId, 'complete');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'فشل رفع التقرير');
    } finally {
      setSubmittingHandover(false);
    }
  };

  const startChat = async (resId) => {
    try {
      const res = await api.post('/complaints', {
        reservation_id: resId,
        title: `محادثة الحجز #${resId}`,
        description: 'محادثة مباشرة مع العميل',
        type: 'other',
        priority: 'low',
        is_chat: true
      });
      navigate(`/complaints/${res.data.data.id}`);
    } catch (error) {
      toast.error('فشل بدء المحادثة: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="dashboard" style={{ display: 'flex', minHeight: '100vh', background: '#f8f9fa' }}>
      {/* Sidebar محسّن - أصبح responsive */}
      <div className="sidebar" style={{ width: '260px', background: 'white', borderLeft: '1px solid #e9ecef', padding: '24px 0', position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ padding: '0 16px' }}>
          <Link to="/supplier/dashboard" className="sidebar-item" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: '#1a1a1a', textDecoration: 'none', marginBottom: '4px' }}>
            <LayoutDashboard size={20} /> لوحة التحكم
          </Link>
          <Link to="/supplier/cars" className="sidebar-item" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: '#1a1a1a', textDecoration: 'none', marginBottom: '4px' }}>
            <Car size={20} /> سياراتي
          </Link>
          <Link to="/supplier/cars/add" className="sidebar-item" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: '#1a1a1a', textDecoration: 'none', marginBottom: '4px' }}>
            <Plus size={20} /> إضافة سيارة
          </Link>
          <Link to="/supplier/reservations" className="sidebar-item active" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', background: '#e9ecef', color: '#0a58ca', fontWeight: 'bold', textDecoration: 'none' }}>
            <Calendar size={20} /> الحجوزات
          </Link>
        </div>
      </div>

      <div className="dashboard-content" style={{ flex: 1, padding: '30px 24px' }}>
        <h1 className="section-title" style={{ fontSize: '1.8rem', marginBottom: '32px' }}>طلبات الحجز لسياراتي</h1>

        {loading ? (
          <div className="loading-screen" style={{ minHeight: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><div className="spinner"></div></div>
        ) : reservations.length === 0 ? (
          <div className="card" style={{ background: 'white', borderRadius: '12px', padding: '32px', textAlign: 'center', color: '#6c757d' }}>
            <Calendar size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.2rem' }}>لا توجد طلبات حجز حالياً</h3>
          </div>
        ) : (
          <div className="flex flex-col gap-16" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {reservations.map(res => (
              <div key={res.id} className="card" style={{ background: 'white', borderRadius: '12px', padding: '20px', display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <img src={res.car_image ? (res.car_image.startsWith('http') ? res.car_image : `http://localhost:5000/${res.car_image}`) : 'https://via.placeholder.com/150'} alt="Car" style={{ width: '120px', height: '80px', objectFit: 'contain', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #eee' }} />

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: '8px' }}>
                    <h3 style={{ fontWeight: 'bold' }}>{res.make} {res.model} <span style={{ color: '#6c757d', fontWeight: 'normal' }}>({res.customer_name})</span></h3>
                    <span className={`badge`} style={{
                      background: res.status === 'pending' ? '#ffc107' : res.status === 'active' ? '#28a745' : res.status === 'completed' ? '#0a58ca' : res.status === 'disputed' ? '#dc3545' : '#6c757d',
                      color: 'white', padding: '2px 8px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold'
                    }}>{res.status === 'pending' ? 'قيد الانتظار' : res.status === 'approved' ? 'موافق عليه' : res.status === 'active' ? 'قيد التنفيذ' : res.status === 'completed' ? 'مكتمل' : res.status === 'rejected' ? 'مرفوض' : res.status === 'disputed' ? 'في نزاع' : res.status}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '20px', fontSize: '0.85rem', color: '#6c757d', marginBottom: '8px' }}>
                    <span>من: {format(new Date(res.start_date), 'yyyy-MM-dd')}</span>
                    <span>إلى: {format(new Date(res.end_date), 'yyyy-MM-dd')}</span>
                    <span className="font-bold" style={{ color: '#0a58ca', fontWeight: 'bold' }}>${res.total_price}</span>
                  </div>
                  {res.customer_notes && <p style={{ fontSize: '0.8rem', background: '#f8f9fa', padding: '8px', borderRadius: '6px', color: '#495057' }}>ملاحظة العميل: {res.customer_notes}</p>}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '160px' }}>
                  {res.status === 'pending' && (
                    <>
                      <button onClick={() => handleAction(res.id, 'approve')} className="btn btn-success" style={{ background: '#28a745', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}><CheckCircle size={16} /> موافقة</button>
                      <button onClick={() => handleAction(res.id, 'reject')} className="btn btn-danger" style={{ background: '#dc3545', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}><XCircle size={16} /> رفض</button>
                    </>
                  )}
                  {res.status === 'approved' && (
                    <button onClick={() => openHandover(res.id, 'before')} className="btn btn-secondary" style={{ background: '#6c757d', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}><Camera size={16} /> توثيق التسليم (قبل)</button>
                  )}
                  {res.status === 'active' && (
                    <>
                      <button onClick={() => openHandover(res.id, 'after')} className="btn btn-warning" style={{ background: '#ffc107', color: '#1a1a1a', border: 'none', padding: '8px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}><Camera size={16} /> توثيق الاسترجاع (بعد)</button>
                    </>
                  )}
                   <Link to={`/supplier/reservations/${res.id}`} className="btn btn-primary" style={{ background: '#0a58ca', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', textDecoration: 'none', fontSize: '0.9rem' }}>
                    <Eye size={16} /> عرض التفاصيل والإجراءات
                  </Link>
                  <button onClick={() => startChat(res.id)} className="btn btn-outline" style={{ background: 'transparent', border: '1px solid #0a58ca', color: '#0a58ca', padding: '8px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}>
                    <MessageSquare size={16} /> مراسلة العميل (محادثة)
                  </button>
                  {res.status !== 'disputed' && ['active', 'completed', 'approved'].includes(res.status) && (
                    <button onClick={() => openDisputeModal(res)} className="btn btn-outline-danger" style={{ background: 'transparent', border: '1px solid #dc3545', color: '#dc3545', padding: '8px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', marginTop: '4px' }}>
                      <AlertTriangle size={16} /> تقديم شكوى / نزاع
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Handover Modal محسّن مع معاينة الصور وحذفها */}
      {showHandover && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="modal-content" style={{ background: 'white', borderRadius: '12px', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '24px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #dee2e6', paddingBottom: '16px', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Camera size={20} style={{ color: '#0a58ca' }} />
                توثيق حالة السيارة {handoverType === 'before' ? '(قبل التسليم للعميل)' : '(بعد الاسترجاع من العميل)'}
              </h2>
              <button onClick={() => setShowHandover(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleHandoverSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '0.85rem' }}>قراءة العداد (كم)</label>
                  <input type="number" className="form-input" style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px' }} required placeholder="مثال: 125000"
                    value={handoverData.mileage} onChange={e => setHandoverData({ ...handoverData, mileage: e.target.value })} />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '0.85rem' }}>مستوى الوقود</label>
                  <select className="form-input form-select" style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px' }} value={handoverData.fuel_level} onChange={e => setHandoverData({ ...handoverData, fuel_level: e.target.value })}>
                    <option value={100}>ممتلئ (100%)</option>
                    <option value={75}>3/4 (75%)</option>
                    <option value={50}>النصف (50%)</option>
                    <option value={25}>الربع (25%)</option>
                    <option value={0}>فارغ</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '0.85rem' }}>الحالة الخارجية</label>
                  <select className="form-input" style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px' }} value={handoverData.exterior_condition} onChange={e => setHandoverData({ ...handoverData, exterior_condition: e.target.value })}>
                    <option value="excellent">ممتازة (لا يوجد خدوش)</option>
                    <option value="good">جيدة (خدوش بسيطة)</option>
                    <option value="poor">سيئة (أضرار واضحة)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '0.85rem' }}>الحالة الداخلية</label>
                  <select className="form-input" style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px' }} value={handoverData.interior_condition} onChange={e => setHandoverData({ ...handoverData, interior_condition: e.target.value })}>
                    <option value="excellent">ممتازة (نظيفة جداً)</option>
                    <option value="good">جيدة (نظيفة)</option>
                    <option value="poor">سيئة (متسخة أو بها أضرار)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '0.85rem' }}>ملاحظات إضافية</label>
                <textarea className="form-input" rows="2" style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px' }} placeholder="أي ملاحظات حول حالة السيارة..."
                  value={handoverData.condition_notes} onChange={e => setHandoverData({ ...handoverData, condition_notes: e.target.value })}></textarea>
              </div>

              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '0.85rem' }}>الصور الموثقة (مهم جداً)</label>
                <div style={{ border: '1px dashed #ced4da', borderRadius: '8px', padding: '20px', textAlign: 'center', background: '#f8f9fa' }}>
                  <Upload size={24} style={{ margin: '0 auto 8px', color: '#6c757d' }} />
                  <p style={{ fontSize: '0.85rem', color: '#6c757d', marginBottom: '12px' }}>قم برفع صور لجميع جهات السيارة (الأمام، الخلف، الجوانب، الداخلية)</p>
                  <input type="file" multiple accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} id="handover_images" ref={fileInputRef} />
                  <label htmlFor="handover_images" className="btn btn-secondary" style={{ display: 'inline-block', background: '#6c757d', color: 'white', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>
                    اختر الصور
                  </label>
                </div>

                {imagePreviews.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '16px' }}>
                    {imagePreviews.map((src, idx) => (
                      <div key={idx} style={{ position: 'relative', width: '80px', height: '80px', border: '1px solid #dee2e6', borderRadius: '8px', overflow: 'hidden' }}>
                        <img src={src} alt={`معاينة ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button type="button" onClick={() => removeImage(idx)} style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button type="submit" className="btn btn-primary" style={{ background: '#0a58ca', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }} disabled={submittingHandover}>
                {submittingHandover ? 'جاري الحفظ...' : 'حفظ تقرير التوثيق'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* مودال الشكوى */}
      {showDispute && selectedResForDispute && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'white', borderRadius: '12px', maxWidth: '500px', width: '100%', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e9ecef', paddingBottom: '16px', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', display: 'flex', gap: '8px', alignItems: 'center', color: '#dc3545' }}>
                <AlertTriangle size={20} /> فتح نزاع / تقديم شكوى
              </h2>
              <button onClick={() => setShowDispute(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ color: '#6c757d', marginBottom: '24px', fontSize: '0.85rem' }}>
              سيتم إيقاف الحجز تلقائياً وسيتدخل فريق الإدارة لحل المشكلة بينك وبين العميل.
            </p>

            <form onSubmit={submitDispute} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>نوع المشكلة</label>
                <select
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px', fontFamily: 'inherit' }}
                  value={disputeData.type}
                  onChange={e => setDisputeData({ ...disputeData, type: e.target.value })}
                >
                  <option value="other">أخرى</option>
                  <option value="damage">أضرار بالسيارة</option>
                  <option value="payment">مشكلة مالية</option>
                  <option value="service">سوء تعامل من العميل</option>
                  <option value="late_return">تأخير في الإرجاع</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>العنوان (اختصار للمشكلة)</label>
                <input
                  type="text"
                  required
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px', fontFamily: 'inherit' }}
                  placeholder="مثال: تأخير العميل في إرجاع السيارة"
                  value={disputeData.title}
                  onChange={e => setDisputeData({ ...disputeData, title: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>تفاصيل المشكلة كاملة</label>
                <textarea
                  rows="4"
                  required
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px', fontFamily: 'inherit' }}
                  placeholder="اشرح المشكلة بالتفصيل..."
                  value={disputeData.description}
                  onChange={e => setDisputeData({ ...disputeData, description: e.target.value })}
                />
              </div>

              <button type="submit" disabled={submittingDispute} style={{ background: '#dc3545', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '8px' }}>
                {submittingDispute ? 'جاري الفتح...' : 'تأكيد وفتح النزاع'}
              </button>
            </form>
          </div>
        </div>
      )}

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
        }
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #ddd;
          border-top-color: #0a58ca;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}