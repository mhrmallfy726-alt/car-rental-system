import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { reservationsAPI, paymentsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { ShieldCheck, CreditCard, CheckCircle, Plus, ArrowRight, X } from 'lucide-react';
import { getCarImage } from '../../utils/imageUtils';

// دوال مساعدة للتحقق من صحة البطاقة
const validateCardNumber = (num) => {
  const cleaned = num.replace(/\s/g, '');
  if (!/^\d{13,19}$/.test(cleaned)) return false;
  // Luhn algorithm (simple)
  let sum = 0;
  let alternate = false;
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let n = parseInt(cleaned[i], 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
};

const validateExpiry = (month, year) => {
  if (!month || !year) return false;
  const currentYear = new Date().getFullYear() % 100;
  const currentMonth = new Date().getMonth() + 1;
  const expYear = parseInt(year, 10);
  const expMonth = parseInt(month, 10);
  if (expMonth < 1 || expMonth > 12) return false;
  return expYear > currentYear || (expYear === currentYear && expMonth >= currentMonth);
};

const validateCVV = (cvv) => /^\d{3,4}$/.test(cvv);

export default function Checkout() {
  const { reservationId } = useParams();
  const navigate = useNavigate();
  const [reservation, setReservation] = useState(null);
  const [savedCards, setSavedCards] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showNewCard, setShowNewCard] = useState(false);

  const [cardData, setCardData] = useState({
    card_holder_name: '',
    card_number: '',
    expiry_month: '',
    expiry_year: '',
    cvv: ''
  });
  const [cardErrors, setCardErrors] = useState({});

  useEffect(() => {
    fetchData();
  }, [reservationId]);

  const fetchData = async () => {
    try {
      const [resRes, cardsRes] = await Promise.all([
        reservationsAPI.getOne(reservationId),
        paymentsAPI.getSavedCards()
      ]);

      if (resRes.data.data.status !== 'approved') {
        toast.error('لا يمكن الدفع لهذا الحجز');
        navigate('/my-reservations');
        return;
      }

      setReservation(resRes.data.data);
      setSavedCards(cardsRes.data.data);

      if (cardsRes.data.data.length > 0) {
        setSelectedCardId(cardsRes.data.data[0].id);
        setShowNewCard(false);
      } else {
        setShowNewCard(true);
      }
    } catch (error) {
      toast.error('الحجز غير موجود أو فشل جلب البيانات');
      navigate('/my-reservations');
    } finally {
      setLoading(false);
    }
  };

  const handleCardInputChange = (field, value) => {
    setCardData(prev => ({ ...prev, [field]: value }));
    // Clear error for that field
    if (cardErrors[field]) setCardErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateNewCard = () => {
    const errors = {};
    if (!cardData.card_holder_name.trim()) errors.card_holder_name = 'الاسم مطلوب';
    if (!validateCardNumber(cardData.card_number)) errors.card_number = 'رقم بطاقة غير صالح';
    if (!validateExpiry(cardData.expiry_month, cardData.expiry_year)) errors.expiry = 'تاريخ انتهاء غير صالح';
    if (!validateCVV(cardData.cvv)) errors.cvv = 'رمز الأمان غير صالح (3-4 أرقام)';
    setCardErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePayment = async (e) => {
    if (e) e.preventDefault();
    setProcessing(true);
    try {
      let finalCardId = selectedCardId;

      if (showNewCard) {
        if (!validateNewCard()) {
          setProcessing(false);
          return;
        }
        const cardRes = await paymentsAPI.saveCard(cardData);
        finalCardId = cardRes.data.data.id;
      }

      await paymentsAPI.checkout({
        reservation_id: reservationId,
        payment_method: 'card',
        saved_card_id: finalCardId
      });

      toast.success('تم الدفع بنجاح! الحجز الآن نشط.');
      navigate('/my-reservations');
    } catch (error) {
      toast.error(error.response?.data?.message || 'فشل الدفع');
    } finally {
      setProcessing(false);
    }
  };

  const cancelNewCard = () => {
    setShowNewCard(false);
    setCardData({
      card_holder_name: '',
      card_number: '',
      expiry_month: '',
      expiry_year: '',
      cvv: ''
    });
    setCardErrors({});
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh', padding: '24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* زر الرجوع */}
        <Link to="/my-reservations" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '24px', color: '#0a58ca', textDecoration: 'none' }}>
          <ArrowRight size={18} /> العودة إلى حجوزاتي
        </Link>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '8px' }}>إتمام الدفع</h1>
          <p style={{ color: '#6c757d' }}>بوابة الدفع الآمنة الخاصة بمنصتنا</p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'flex-start' }}>
          {/* قسم نموذج الدفع */}
          <div style={{ flex: '2', minWidth: '280px', background: 'white', borderRadius: '12px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '24px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <CreditCard size={20} style={{ color: '#0a58ca' }} /> تفاصيل الدفع
            </h2>

            {/* البطاقات المحفوظة */}
            {savedCards.length > 0 && !showNewCard && (
              <div style={{ marginBottom: '24px' }}>
                <p style={{ color: '#6c757d', marginBottom: '16px' }}>اختر بطاقة الدفع:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {savedCards.map(card => (
                    <label key={card.id} style={{
                      display: 'flex', gap: '12px', alignItems: 'center', padding: '16px',
                      border: selectedCardId === card.id ? '2px solid #0a58ca' : '1px solid #dee2e6',
                      borderRadius: '8px', background: '#f8f9fa', cursor: 'pointer'
                    }}>
                      <input type="radio" name="saved_card" checked={selectedCardId === card.id} onChange={() => setSelectedCardId(card.id)} />
                      <div>
                        <p style={{ fontWeight: 'bold' }}>{card.brand} - {card.card_number_masked}</p>
                        <p style={{ fontSize: '0.75rem', color: '#6c757d' }}>ينتهي في {card.expiry_month}/{card.expiry_year}</p>
                      </div>
                    </label>
                  ))}
                </div>
                <button type="button" onClick={() => setShowNewCard(true)} style={{ marginTop: '16px', background: 'none', border: '1px solid #0a58ca', color: '#0a58ca', padding: '6px 12px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <Plus size={16} /> إضافة بطاقة جديدة
                </button>
              </div>
            )}

            {/* نموذج بطاقة جديدة */}
            {showNewCard && (
              <form id="payment-form" onSubmit={handlePayment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>الاسم على البطاقة</label>
                  <input type="text" className="form-input" required placeholder="مثال: Ahmed Ali"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px' }}
                    value={cardData.card_holder_name} onChange={e => handleCardInputChange('card_holder_name', e.target.value)} />
                  {cardErrors.card_holder_name && <p style={{ color: '#dc3545', fontSize: '0.7rem', marginTop: '4px' }}>{cardErrors.card_holder_name}</p>}
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>رقم البطاقة</label>
                  <input type="text" className="form-input" required placeholder="0000 0000 0000 0000" maxLength="19" dir="ltr"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px' }}
                    value={cardData.card_number} onChange={e => handleCardInputChange('card_number', e.target.value.replace(/\s/g, ''))} />
                  {cardErrors.card_number && <p style={{ color: '#dc3545', fontSize: '0.7rem', marginTop: '4px' }}>{cardErrors.card_number}</p>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>تاريخ الانتهاء</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input type="text" placeholder="MM" maxLength="2" required dir="ltr"
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px', textAlign: 'center' }}
                        value={cardData.expiry_month} onChange={e => handleCardInputChange('expiry_month', e.target.value)} />
                      <span style={{ display: 'flex', alignItems: 'center' }}>/</span>
                      <input type="text" placeholder="YY" maxLength="2" required dir="ltr"
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px', textAlign: 'center' }}
                        value={cardData.expiry_year} onChange={e => handleCardInputChange('expiry_year', e.target.value)} />
                    </div>
                    {cardErrors.expiry && <p style={{ color: '#dc3545', fontSize: '0.7rem', marginTop: '4px' }}>{cardErrors.expiry}</p>}
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>رمز الأمان (CVV)</label>
                    <input type="password" className="form-input" required placeholder="123" maxLength="4" dir="ltr"
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px' }}
                      value={cardData.cvv} onChange={e => handleCardInputChange('cvv', e.target.value)} />
                    {cardErrors.cvv && <p style={{ color: '#dc3545', fontSize: '0.7rem', marginTop: '4px' }}>{cardErrors.cvv}</p>}
                  </div>
                </div>

                {savedCards.length > 0 && (
                  <button type="button" onClick={cancelNewCard} style={{ background: 'none', border: 'none', color: '#0a58ca', textAlign: 'right', cursor: 'pointer', fontSize: '0.85rem' }}>
                    إلغاء واستخدام بطاقة محفوظة
                  </button>
                )}
              </form>
            )}

            <div style={{ marginTop: '32px', background: '#e9ecef', padding: '16px', borderRadius: '8px', display: 'flex', gap: '12px', color: '#0a58ca', fontSize: '0.85rem' }}>
              <ShieldCheck size={32} />
              <p>جميع بيانات بطاقتك مشفرة ومؤمنة بالكامل داخل نظامنا. لن يتم مشاركة بياناتك مع أي جهة خارجية.</p>
            </div>
          </div>

          {/* ملخص الطلب */}
          <div style={{ flex: '1', minWidth: '280px', background: 'white', borderRadius: '12px', padding: '32px', position: 'sticky', top: '90px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontWeight: 'bold', borderBottom: '1px solid #dee2e6', paddingBottom: '16px', marginBottom: '24px' }}>ملخص الطلب</h3>

            <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
              <img src={getCarImage(reservation)} alt="Car" style={{ width: '60px', height: '45px', objectFit: 'cover', borderRadius: '6px' }} />
              <div>
                <p style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{reservation.make} {reservation.model}</p>
                <p style={{ fontSize: '0.7rem', color: '#6c757d' }}>المدة: {reservation.total_days} أيام</p>
              </div>
            </div>

            <div style={{ borderBottom: '1px solid #dee2e6', paddingBottom: '16px', marginBottom: '16px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>التكلفة اليومية</span>
                <span>${reservation.price_per_day}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>الضريبة (0%)</span>
                <span>$0.00</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
              <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>الإجمالي</span>
              <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#0a58ca' }}>${reservation.total_price}</span>
            </div>

            <button
              type="submit"
              form={showNewCard ? "payment-form" : undefined}
              onClick={!showNewCard ? handlePayment : undefined}
              disabled={processing}
              style={{ background: '#0a58ca', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', width: '100%', fontWeight: 'bold', cursor: processing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {processing ? 'جاري الدفع...' : <><CheckCircle size={18} /> تأكيد الدفع</>}
            </button>
          </div>
        </div>
      </div>

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
        .form-input:focus {
          outline: none;
          border-color: #86b7fe;
          box-shadow: 0 0 0 2px rgba(13,110,253,0.25);
        }
        @media (max-width: 768px) {
          [style*="flex-wrap: wrap"] {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}