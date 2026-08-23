import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { carsAPI, reservationsAPI } from '../../services/api';
import SupplierSidebar from '../../components/SupplierSidebar';
import toast from 'react-hot-toast';
import { Car, Calendar, DollarSign, Star, LayoutDashboard, Plus, Eye, Settings, RefreshCw, Edit,Users} from 'lucide-react';

import { format } from 'date-fns';
export default function SupplierDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalCars: 0,
    revenue: 0,
    activeReservations: 0,
    avgRating: 0,
    activeDeals: 0,
    discountedCars: []
  });
  const [recentReservations, setRecentReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const getCarName = (reservation) => {
    if (reservation.make && reservation.model) return `${reservation.make} ${reservation.model}`;
    if (reservation.car) return `${reservation.car.make} ${reservation.car.model}`;
    return 'سيارة غير معروفة';
  };

  const fetchData = useCallback(async (showToast = false) => {
    if (showToast === false && refreshing) setRefreshing(true);
    else setLoading(true);

    try {
      const [carsRes, resvRes] = await Promise.all([
        carsAPI.getMyCars(),
        reservationsAPI.getMy()
      ]);

      const cars = carsRes.data.data || [];
      const reservations = resvRes.data.data || [];

      const totalCars = cars.length;
      let revenue = 0;
      let activeCount = 0;

      reservations.forEach(r => {
        if (r.status === 'completed' || r.status === 'active') {
          const price = parseFloat(r.total_price);
          if (!isNaN(price)) revenue += price;
        }
        if (r.status === 'active') activeCount++;
      });

      let avgRating = 0;
      if (cars.length > 0) {
        const sumRatings = cars.reduce((acc, c) => acc + parseFloat(c.average_rating || 0), 0);
        avgRating = (sumRatings / cars.length);
      }

      setStats({
        totalCars,
        revenue: isNaN(revenue) ? 0 : revenue,
        activeReservations: activeCount,
        avgRating: avgRating,
        activeDeals: cars.filter(c => c.discount_percentage > 0).length,
        discountedCars: cars.filter(c => c.discount_percentage > 0).slice(0, 3)
      });

      setRecentReservations(reservations.slice(0, 5));
      if (showToast) toast.success('تم تحديث البيانات');
    } catch (error) {
      console.error(error);
      toast.error('فشل جلب الإحصائيات: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    fetchData(true);
  };

  const occupancyRate = stats.totalCars > 0 ? ((stats.activeReservations / stats.totalCars) * 100).toFixed(0) : 0;
  // إزالة حساب avgDailyPrice لأنه غير دقيق، واستبداله بإجمالي الإيرادات فقط (موجود بالفعل)

  const handleEditDiscount = (carId) => {
    navigate(`/supplier/cars/edit/${carId}?focus=discount`);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8f9fa' }}>
      <SupplierSidebar />

      <div style={{ flex: 1, padding: '30px 24px' }}>
        {/* رأس الصفحة */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>مرحباً {user?.name || 'مورد'}</h1>
            <p style={{ color: '#6c757d' }}>إليك نظرة عامة على نشاطك</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handleRefresh} disabled={refreshing} style={{ background: '#6c757d', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <RefreshCw size={18} style={refreshing ? { animation: 'spin 1s linear infinite' } : {}} />
              {refreshing ? 'جاري التحديث...' : 'تحديث'}
            </button>
            <Link to="/supplier/cars/add" style={{ background: '#0a58ca', color: 'white', padding: '8px 16px', borderRadius: '8px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={18} /> إضافة سيارة جديدة
            </Link>
          </div>
        </div>

        {loading && !refreshing ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
            <div className="spinner"></div>
          </div>
        ) : (
          <>
            {/* بطاقات الإحصائيات */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
              <div style={{ background: 'white', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ background: '#e9ecef', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6f42c1' }}><Car size={24} /></div>
                <div><p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{stats.totalCars}</p><p style={{ color: '#6c757d', margin: 0 }}>إجمالي السيارات</p></div>
              </div>
              <div style={{ background: 'white', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ background: '#e9ecef', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#28a745' }}><DollarSign size={24} /></div>
                <div><p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>${stats.revenue.toFixed(2)}</p><p style={{ color: '#6c757d', margin: 0 }}>إجمالي الأرباح</p></div>
              </div>
              <div style={{ background: 'white', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ background: '#e9ecef', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffc107' }}><Calendar size={24} /></div>
                <div><p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{stats.activeReservations}</p><p style={{ color: '#6c757d', margin: 0 }}>حجوزات نشطة</p></div>
              </div>
              <div style={{ background: 'white', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ background: '#e9ecef', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc3545' }}><Star size={24} /></div>
                <div><p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{stats.avgRating.toFixed(1)} / 5</p><p style={{ color: '#6c757d', margin: 0 }}>متوسط التقييم</p></div>
              </div>
            </div>

            {/* القسم السفلي: العروض والنظرة العامة */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
              {/* العروض الترويجية */}
              <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e9ecef', paddingBottom: '8px', marginBottom: '16px' }}>
                  <h3 style={{ fontWeight: 'bold', display: 'flex', gap: '8px', alignItems: 'center', margin: 0 }}><Star size={18} style={{ color: '#ffc107' }} /> العروض الترويجية</h3>
                  <Link to="/supplier/advertisement-request" style={{ color: '#0a58ca', fontSize: '0.85rem', textDecoration: 'none' }}>إدارة العروض والإعلانات ({stats.activeDeals})</Link>
                </div>
                <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '8px', border: '1px dashed #ffc107', marginBottom: '16px' }}>
                  <p style={{ fontWeight: 'bold', marginBottom: '8px', color: '#0a58ca' }}>نصيحة للمورد:</p>
                  <p style={{ fontSize: '0.85rem', color: '#6c757d' }}>السيارات التي تملك خصماً بنسبة 15% أو أكثر تحصل على مشاهدات أعلى بـ 3 أضعاف.</p>
                </div>
                {stats.discountedCars.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {stats.discountedCars.map(car => (
                      <div key={car.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <img src={car.primary_image ? (car.primary_image.startsWith('http') ? car.primary_image : `http://localhost:5000/${car.primary_image}`) : 'https://via.placeholder.com/40'}
                            style={{ width: '40px', height: '30px', objectFit: 'contain', borderRadius: '4px', background: '#f8f9fa' }} />
                          <div>
                            <p style={{ fontSize: '0.85rem', fontWeight: 'bold', margin: 0 }}>{car.make} {car.model}</p>
                            <p style={{ fontSize: '0.7rem', color: '#E3000F', margin: 0 }}>خصم {car.discount_percentage}%</p>
                          </div>
                        </div>
                        <button onClick={() => handleEditDiscount(car.id)} style={{ background: 'none', border: 'none', color: '#0a58ca', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Edit size={14} /> تعديل
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.8rem', color: '#6c757d', textAlign: 'center', padding: '12px 0' }}>لا توجد عروض نشطة حالياً. ابدأ بخصم لزيادة مبيعاتك!</p>
                )}
              </div>

              {/* نظرة عامة (تم إزالة متوسط السعر غير الدقيق) */}
              <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ borderBottom: '1px solid #e9ecef', paddingBottom: '8px', marginBottom: '16px' }}>
                  <h3 style={{ fontWeight: 'bold', display: 'flex', gap: '8px', alignItems: 'center', margin: 0 }}><LayoutDashboard size={18} style={{ color: '#6c757d' }} /> نظرة عامة</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}><span>نسبة إشغال الأسطول:</span> <span style={{ fontWeight: 'bold' }}>{occupancyRate}%</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}><span>إجمالي الإيرادات:</span> <span style={{ fontWeight: 'bold' }}>${stats.revenue.toFixed(2)}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}><span>السيارات المعروضة (خصم):</span> <span style={{ fontWeight: 'bold' }}>{stats.activeDeals}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}><span>عدد السيارات الكلي:</span> <span style={{ fontWeight: 'bold' }}>{stats.totalCars}</span></div>
                </div>
              </div>
            </div>

            {/* أحدث الحجوزات */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e9ecef', paddingBottom: '8px', marginBottom: '16px' }}>
                <h3 style={{ fontWeight: 'bold', display: 'flex', gap: '8px', alignItems: 'center', margin: 0 }}><Calendar size={18} style={{ color: '#0a58ca' }} /> أحدث طلبات الحجز</h3>
                <Link to="/supplier/reservations" style={{ color: '#0a58ca', fontSize: '0.85rem', textDecoration: 'none' }}>عرض الكل</Link>
              </div>

              {recentReservations.length === 0 ? (
                <p style={{ color: '#6c757d', fontSize: '0.85rem' }}>لا توجد حجوزات حتى الآن.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                    <thead style={{ background: '#f8f9fa' }}>
                      <tr>
                        <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e9ecef' }}>رقم الحجز</th>
                        <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e9ecef' }}>السيارة</th>
                        <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e9ecef' }}>التاريخ</th>
                        <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e9ecef' }}>المبلغ</th>
                        <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e9ecef' }}>الحالة</th>
                        <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e9ecef' }}>الإجراء</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentReservations.map(r => (
                        <tr key={`${r.id}-${r.start_date}`} style={{ borderBottom: '1px solid #e9ecef' }}>
                          <td style={{ padding: '12px' }}>{r.id?.split('-')[0] || r.id}</td>
                          <td style={{ padding: '12px' }}>{getCarName(r)}</td>
                          <td style={{ padding: '12px' }} dir="ltr">{format(new Date(r.start_date), 'dd/MM/yyyy')}</td>
                          <td style={{ padding: '12px' }}>${parseFloat(r.total_price).toFixed(2)}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              background: r.status === 'pending' ? '#ffc107' : r.status === 'active' ? '#28a745' : r.status === 'completed' ? '#0a58ca' : '#6c757d',
                              color: 'white',
                              padding: '2px 8px',
                              borderRadius: '20px',
                              fontSize: '0.7rem',
                              fontWeight: 'bold'
                            }}>
                              {r.status === 'pending' ? 'قيد الانتظار' : r.status === 'active' ? 'نشط' : r.status === 'completed' ? 'مكتمل' : r.status}
                            </span>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <Link to={`/supplier/reservations/${r.id}`} style={{ background: '#6c757d', color: 'white', padding: '4px 8px', borderRadius: '6px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
                              <Eye size={14} /> التفاصيل
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* الأنماط العامة (spinner + responsive) */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e9ecef;
          border-top-color: #0a58ca;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
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
        }
      `}</style>
    </div>
  );
}