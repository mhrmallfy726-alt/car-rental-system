import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { reservationsAPI, handoverAPI, authAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { 
  Calendar, Car, User, DollarSign, MapPin, 
  ChevronRight, CheckCircle, XCircle, Camera, 
  Clock, Shield, Info, ArrowLeft, MessageSquare, LayoutDashboard 
} from 'lucide-react';
import { format } from 'date-fns';

export default function SupplierReservationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reservation, setReservation] = useState(null);
  const [handoverLogs, setHandoverLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [resvRes, logsRes] = await Promise.all([
        reservationsAPI.getOne(id),
        handoverAPI.getLogs(id)
      ]);
      setReservation(resvRes.data.data);
      setHandoverLogs(logsRes.data.data || []);
    } catch (error) {
      toast.error('فشل جلب تفاصيل الحجز');
      navigate('/supplier/reservations');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action) => {
    try {
      if (action === 'approve') await reservationsAPI.approve(id);
      if (action === 'reject') {
        const reason = window.prompt('سبب الرفض (اختياري):');
        await reservationsAPI.reject(id, { supplier_notes: reason || 'مرفوض من قبل المورد' });
      }
      toast.success('تم تحديث حالة الحجز بنجاح');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'فشل تنفيذ الإجراء');
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;
  if (!reservation) return <div className="container p-32 text-center">الحجز غير موجود</div>;

  return (
    <div className="dashboard" style={{ display: 'flex', minHeight: '100vh', background: '#f8f9fa' }}>
      {/* Sidebar - يمكن اختصاره أو إبقاؤه كما في الصفحات الأخرى */}
      <div className="sidebar" style={{ width: '260px', background: 'white', borderLeft: '1px solid #e9ecef', padding: '24px 0', position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ padding: '0 16px' }}>
          <Link to="/supplier/dashboard" className="sidebar-item" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: '#1a1a1a', textDecoration: 'none', marginBottom: '4px' }}>
            <LayoutDashboard size={20} /> لوحة التحكم
          </Link>
          <Link to="/supplier/reservations" className="sidebar-item active" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', background: '#e9ecef', color: '#0a58ca', fontWeight: 'bold', textDecoration: 'none' }}>
            <Calendar size={20} /> الحجوزات
          </Link>
        </div>
      </div>

      <div className="dashboard-content" style={{ flex: 1, padding: '30px 24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'white', border: '1px solid #ddd', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}><ArrowLeft size={20} /></button>
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>تفاصيل الحجز #{reservation.id.split('-')[0]}</h1>
          <span style={{
            background: reservation.status === 'pending' ? '#ffc107' : reservation.status === 'active' ? '#28a745' : '#0a58ca',
            color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', marginLeft: 'auto'
          }}>{reservation.status}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* معلومات الحجز */}
            <div className="card" style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontWeight: 'bold', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}><Info size={18} /> نظرة عامة</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <p style={{ color: '#6c757d', fontSize: '0.85rem', marginBottom: '4px' }}>تاريخ الاستلام</p>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><Calendar size={16} /> <span style={{ fontWeight: 'bold' }}>{format(new Date(reservation.start_date), 'dd MMMM yyyy')}</span></div>
                </div>
                <div>
                  <p style={{ color: '#6c757d', fontSize: '0.85rem', marginBottom: '4px' }}>تاريخ التسليم</p>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><Calendar size={16} /> <span style={{ fontWeight: 'bold' }}>{format(new Date(reservation.end_date), 'dd MMMM yyyy')}</span></div>
                </div>
                <div>
                  <p style={{ color: '#6c757d', fontSize: '0.85rem', marginBottom: '4px' }}>المدة</p>
                  <div style={{ fontWeight: 'bold' }}>{reservation.total_days} أيام</div>
                </div>
                <div>
                  <p style={{ color: '#6c757d', fontSize: '0.85rem', marginBottom: '4px' }}>إجمالي المبلغ</p>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#28a745' }}>${reservation.total_price}</div>
                </div>
              </div>
            </div>

            {/* تقارير التوثيق (Handover) */}
            <div className="card" style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontWeight: 'bold', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}><Shield size={18} /> تقارير التوثيق (Handover)</h3>
              {handoverLogs.length === 0 ? (
                <p style={{ color: '#6c757d', fontSize: '0.85rem', textAlign: 'center', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>لم يتم رفع أي تقارير توثيق لهذا الحجز بعد.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {handoverLogs.map(log => (
                    <div key={log.id} style={{ border: '1px solid #eee', borderRadius: '12px', padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ fontWeight: 'bold', color: log.type === 'before' ? '#0a58ca' : '#ffc107' }}>
                          {log.type === 'before' ? 'تقرير تسليم (قبل)' : 'تقرير استلام (بعد)'}
                        </span>
                        <span style={{ color: '#6c757d', fontSize: '0.8rem' }}>{format(new Date(log.created_at), 'yyyy/MM/dd HH:mm')}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px', fontSize: '0.85rem' }}>
                        <div><span style={{ color: '#6c757d' }}>عداد المسافة:</span> {log.mileage} كم</div>
                        <div><span style={{ color: '#6c757d' }}>الوقود:</span> {log.fuel_level}</div>
                        <div><span style={{ color: '#6c757d' }}>الحالة:</span> {log.exterior_condition}</div>
                      </div>
                      <p style={{ fontSize: '0.85rem', background: '#f8f9fa', padding: '10px', borderRadius: '6px', marginBottom: '12px' }}>{log.condition_notes || 'لا توجد ملاحظات إضافية'}</p>
                      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
                        {log.images?.map((img, i) => (
                          <img key={i} src={img.image_url.startsWith('http') ? img.image_url : `http://localhost:5000/${img.image_url}`} style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '6px' }} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* معلومات العميل */}
            <div className="card" style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontWeight: 'bold', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}><User size={18} /> العميل</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {reservation.customer_avatar ? <img src={reservation.customer_avatar} style={{ width: '100%', height: '100%', borderRadius: '50%' }} /> : <User size={24} />}
                </div>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{reservation.customer_name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>{reservation.customer_email}</div>
                </div>
              </div>
              <button onClick={() => navigate(`/supplier/reservations`)} style={{ width: '100%', background: '#f8f9fa', border: '1px solid #ddd', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <MessageSquare size={16} /> مراسلة العميل
              </button>
            </div>

            {/* معلومات السيارة */}
            <div className="card" style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontWeight: 'bold', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}><Car size={18} /> السيارة</h3>
              <img src={reservation.car_image ? (reservation.car_image.startsWith('http') ? reservation.car_image : `http://localhost:5000/${reservation.car_image}`) : 'https://via.placeholder.com/200'} style={{ width: '100%', height: '120px', objectFit: 'contain', borderRadius: '8px', marginBottom: '12px' }} />
              <div style={{ fontWeight: 'bold' }}>{reservation.make} {reservation.model}</div>
              <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>رقم اللوحة: {reservation.license_plate}</div>
            </div>

            {/* الإجراءات */}
            {reservation.status === 'pending' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button onClick={() => handleAction('approve')} style={{ background: '#28a745', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><CheckCircle size={20} /> موافقة على الطلب</button>
                <button onClick={() => handleAction('reject')} style={{ background: '#dc3545', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><XCircle size={20} /> رفض الطلب</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .loading-screen { display: flex; justify-content: center; alignItems: center; min-height: 100vh; }
        .spinner { width: 40px; height: 40px; border: 4px solid #ddd; border-top-color: #0a58ca; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
