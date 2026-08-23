import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reservationsAPI, reviewsAPI, default as api } from '../../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Calendar, CreditCard, XCircle, CheckCircle, Star, X, MessageSquare, AlertTriangle } from 'lucide-react';
import '../../styles/customer-reservations.css';

export default function MyReservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [showReview, setShowReview] = useState(false);
  const [selectedRes, setSelectedRes] = useState(null);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  const [showDispute, setShowDispute] = useState(false);
  const [disputeData, setDisputeData] = useState({ type: 'other', title: '', description: '' });
  const [submittingDispute, setSubmittingDispute] = useState(false);

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

  const handleCancel = async (id) => {
    if (!window.confirm('هل أنت متأكد من إلغاء هذا الحجز؟ لا يمكن التراجع.')) return;
    try {
      await reservationsAPI.cancel(id, { cancellation_reason: 'تم الإلغاء من قبل العميل' });
      toast.success('تم إلغاء الحجز');
      fetchReservations();
    } catch (error) {
      toast.error(error.response?.data?.message || 'فشل الإلغاء');
    }
  };

  const openReviewModal = (res) => {
    setSelectedRes(res);
    setReviewData({ rating: 5, comment: '' });
    setShowReview(true);
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (reviewData.comment.trim().length < 3 && reviewData.comment.trim() !== '') {
      toast.error('الرجاء كتابة تعليق أطول (3 أحرف على الأقل) أو اتركه فارغاً');
      return;
    }
    setSubmittingReview(true);
    try {
      await reviewsAPI.create({
        car_id: selectedRes.car_id,
        reservation_id: selectedRes.id,
        rating: reviewData.rating,
        comment: reviewData.comment
      });
      toast.success('شكراً لتقييمك!');
      setShowReview(false);
      fetchReservations();
    } catch (error) {
      toast.error(error.response?.data?.message || 'فشل إضافة التقييم');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Check if there is already an open complaint/chat for this reservation
  const hasOpenComplaint = (reservationId) => {
    // This would ideally be checked by fetching existing complaints, but for simplicity we'll allow
    // In a real app, you'd call API to check. We'll just allow creation and let backend handle duplicates? 
    // backend does not prevent duplicates. So we'll add a check by calling GET /complaints/my and filter.
    // To keep it simple, we assume user can have multiple chats per reservation.
    return false;
  };

  const startChat = async (resId) => {
    try {
      const res = await api.post('/complaints', {
        reservation_id: resId,
        title: `محادثة الحجز #${resId}`,
        description: 'محادثة مباشرة مع المورد',
        type: 'other',
        priority: 'low',
        is_chat: true
      });
      navigate(`/complaints/${res.data.data.id}`);
    } catch (error) {
      toast.error('فشل بدء المحادثة: ' + (error.response?.data?.message || error.message));
    }
  };

  const openDisputeModal = (res) => {
    // Optional: check if a dispute already exists open for this reservation
    setSelectedRes(res);
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
        reservation_id: selectedRes.id,
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

  const getStatusBadge = (status) => {
    const map = {
      pending: { label: 'جاهز لإتمام الحجز', bg: '#ffc107', color: '#212529' },
      approved: { label: 'بانتظار مراجعة المورد', bg: '#17a2b8', color: 'white' },
      awaiting_pickup: { label: 'بانتظار استلام العميل', bg: '#17a2b8', color: 'white' },
      returned: { label: 'تم استلام السيارة', bg: '#8b5cf6', color: 'white' },
      active: { label: 'نشط', bg: '#28a745', color: 'white' },
      completed: { label: 'مكتمل', bg: '#0a58ca', color: 'white' },
      cancelled: { label: 'ملغي', bg: '#dc3545', color: 'white' },
      rejected: { label: 'مرفوض', bg: '#dc3545', color: 'white' },
      disputed: { label: 'في نزاع', bg: '#dc3545', color: 'white' },
    };
    const s = map[status] || { label: status, bg: '#6c757d', color: 'white' };
    return <span style={{ background: s.bg, color: s.color, padding: '2px 8px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold' }}>{s.label}</span>;
  };

  const canPay = (reservation) => ['pending', 'approved'].includes(reservation.status) && reservation.payment_status !== 'paid';
  const canCancel = (status) => ['pending', 'approved'].includes(status);
  const canReview = (status) => status === 'completed';
  // Allow chat for all statuses except cancelled, rejected, disputed, pending? We'll allow active, completed, approved, pending
  const canMessage = (status) => ['active', 'completed', 'approved', 'pending', 'awaiting_pickup', 'disputed'].includes(status);
  // Dispute allowed only for active or completed (not if already disputed)
  const canDispute = (status) => ['active', 'completed'].includes(status);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="customer-reservations-page" dir="rtl" style={{ background: '#f8f9fa', minHeight: '100vh', padding: '24px' }}>
      <div className="customer-reservations-content" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '8px' }}>حجوزاتي</h1>
          <p style={{ color: '#6c757d' }}>إدارة ومتابعة طلبات الحجز الخاصة بك</p>
        </div>

        {reservations.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '12px', padding: '32px', textAlign: 'center', color: '#6c757d', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <Calendar size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>ليس لديك أي حجوزات حالياً</h3>
            <Link to="/cars" style={{ background: '#0a58ca', color: 'white', padding: '8px 16px', borderRadius: '8px', textDecoration: 'none', display: 'inline-block' }}>تصفح السيارات</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {reservations.map(res => (
              <div key={res.id} style={{ background: 'white', borderRadius: '12px', padding: '20px', display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <img src={res.car_image ? (res.car_image.startsWith('http') ? res.car_image : `http://localhost:5000/${res.car_image}`) : 'https://via.placeholder.com/150'} alt="Car" style={{ width: '120px', height: '80px', objectFit: 'cover', borderRadius: '12px' }} />

                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '8px' }}>
                    <h3 style={{ fontWeight: 'bold' }}>{res.make} {res.model} {res.year}</h3>
                    {getStatusBadge(res.status)}
                  </div>

                  <p style={{ fontSize: '0.85rem', color: '#6c757d', marginBottom: '16px' }}>
                    المورد: <span style={{ fontWeight: 'bold', color: '#0a58ca' }}>{res.supplier_name}</span>
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', fontSize: '0.8rem', color: '#6c757d' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={14} /> الاستلام: {format(new Date(res.start_date), 'yyyy-MM-dd')} {res.pickup_time || '09:00'}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={14} /> الإرجاع: {format(new Date(res.end_date), 'yyyy-MM-dd')} {res.return_time || '18:00'}</span>
                    <span style={{ fontWeight: 'bold' }}>المجموع: ${res.total_price}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '140px' }}>
                  {res.handover_state === 'with_customer' && (
                    <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '8px 12px', borderRadius: '8px', textAlign: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>السيارة معك الآن</span>
                  )}
                  {res.handover_state === 'returned' && res.status === 'returned' && (
                    <span style={{ background: '#ede7f6', color: '#5e35b1', padding: '8px 12px', borderRadius: '8px', textAlign: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>ﺗﻢ اﺳﺘﻼم اﻟﺴﻴﺎرة، واﻟﺤﺠﺰ ﺑﺎﻧﺘﻈﺎر اﻹﻏﻼق</span>
                  )}
                  {canPay(res) && (
                    <Link to={`/checkout/${res.id}`} style={{ background: '#28a745', color: 'white', padding: '8px 12px', borderRadius: '8px', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                      <CreditCard size={16} /> إتمام الدفع وإرسال الطلب
                    </Link>
                  )}
                  {canCancel(res.status) && (
                    <button onClick={() => handleCancel(res.id)} style={{ background: '#dc3545', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer' }}>
                      <XCircle size={16} /> إلغاء الحجز
                    </button>
                  )}
                  {canReview(res.status) && (
                    <button onClick={() => openReviewModal(res)} style={{ background: '#0a58ca', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer' }}>
                      <Star size={16} /> قيم تجربتك
                    </button>
                  )}
                  {canMessage(res.status) && (
                    <button onClick={() => startChat(res.id)} style={{ background: 'transparent', border: '1px solid #0a58ca', color: '#0a58ca', padding: '8px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer' }}>
                      <MessageSquare size={16} /> مراسلة المورد
                    </button>
                  )}
                  {canDispute(res.status) && res.status !== 'disputed' && (
                    <button onClick={() => openDisputeModal(res)} style={{ background: 'transparent', border: '1px solid #dc3545', color: '#dc3545', padding: '8px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', marginTop: '4px' }}>
                      <AlertTriangle size={16} /> تقديم شكوى / نزاع
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReview && selectedRes && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'white', borderRadius: '12px', maxWidth: '500px', width: '100%', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e9ecef', paddingBottom: '16px', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Star size={20} style={{ color: '#ffc107' }} /> تقييم السيارة والمورد
              </h2>
              <button onClick={() => setShowReview(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <p style={{ color: '#6c757d', marginBottom: '24px', fontSize: '0.85rem' }}>
              كيف كانت تجربتك مع سيارة {selectedRes.make} {selectedRes.model}؟ رأيك يهمنا ويساعد الآخرين.
            </p>
            <form onSubmit={submitReview} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ textAlign: 'center' }}>
                <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600' }}>التقييم (من 1 إلى 5)</label>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', direction: 'rtl' }}>
                  {[5, 4, 3, 2, 1].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewData({ ...reviewData, rating: star })}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px' }}
                    >
                      <Star size={32} fill={reviewData.rating >= star ? '#ffc107' : 'none'} color={reviewData.rating >= star ? '#ffc107' : '#ced4da'} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>اكتب تعليقك (اختياري)</label>
                <textarea
                  rows="4"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px', fontFamily: 'inherit' }}
                  placeholder="حدثنا عن نظافة السيارة، تعامل المورد، وسهولة الاستلام..."
                  value={reviewData.comment}
                  onChange={e => setReviewData({ ...reviewData, comment: e.target.value })}
                />
              </div>
              <button type="submit" disabled={submittingReview} style={{ background: '#0a58ca', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                {submittingReview ? 'جاري الحفظ...' : 'نشر التقييم'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Dispute Modal */}
      {showDispute && selectedRes && (
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
              سيتم إيقاف الحجز تلقائياً وسيتدخل فريق الإدارة لحل المشكلة بينك وبين المورد.
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
                  <option value="service">خدمة سيئة</option>
                  <option value="late_return">تأخير في الاستلام/التسليم</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>العنوان (اختصار للمشكلة)</label>
                <input
                  type="text"
                  required
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px', fontFamily: 'inherit' }}
                  placeholder="مثال: السيارة غير نظيفة عند الاستلام"
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
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e9ecef;
          border-top-color: #0a58ca;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          [style*="flex-wrap: wrap"] {
            flex-direction: column;
            align-items: stretch !important;
          }
          [style*="min-width: 140px"] {
            align-items: stretch;
          }
        }
      `}</style>
    </div>
  );
}