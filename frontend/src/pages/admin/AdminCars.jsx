import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Car, CheckCircle, LayoutDashboard, Users, ShieldAlert, Settings, RefreshCw, Image, Clock } from 'lucide-react';

export default function AdminCars() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | pending | approved
  const [approvingId, setApprovingId] = useState(null);

  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getCars();
      setCars(res.data.data);
    } catch (error) {
      toast.error('فشل جلب السيارات: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('هل أنت متأكد من الموافقة على هذه السيارة؟')) return;
    setApprovingId(id);
    try {
      await adminAPI.approveCar(id);
      toast.success('تمت الموافقة على السيارة بنجاح');
      // تحديث الحالة محلياً
      setCars(cars.map(c => c.id === id ? { ...c, is_approved: true, status: 'available' } : c));
    } catch (error) {
      toast.error('فشل الموافقة: ' + (error.response?.data?.message || error.message));
    } finally {
      setApprovingId(null);
    }
  };

  const filtered = filter === 'all' ? cars
    : filter === 'pending' ? cars.filter(c => !c.is_approved)
      : cars.filter(c => c.is_approved);

  const getStatusBadge = (isApproved) => {
    if (isApproved) {
      return (
        <span style={{ background: '#28a745', color: 'white', padding: '2px 8px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <CheckCircle size={12} /> مفعّلة
        </span>
      );
    } else {
      return (
        <span style={{ background: '#ffc107', color: '#1a1a1a', padding: '2px 8px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Clock size={12} /> بانتظار الموافقة
        </span>
      );
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <div className="spinner"></div>
      </div>
    );
  }

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
          <Link to="/admin/cars" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', background: '#e9ecef', color: '#0a58ca', fontWeight: 'bold', textDecoration: 'none' }}>
            <Car size={20} /> السيارات
          </Link>
          <Link to="/admin/complaints" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: '#1a1a1a', textDecoration: 'none' }}>
            <ShieldAlert size={20} /> الشكاوى
          </Link>
          <Link to="/admin/settings" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: '#1a1a1a', textDecoration: 'none' }}>
            <Settings size={20} /> الإعدادات
          </Link>
        </div>
      </div>

      <div style={{ flex: 1, padding: '30px 24px' }}>
        {/* رأس الصفحة */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <h1 style={{ fontSize: '1.8rem', margin: 0 }}>إدارة السيارات</h1>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ background: '#ffc107', color: '#1a1a1a', padding: '2px 8px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold' }}>
              {cars.filter(c => !c.is_approved).length} بانتظار الموافقة
            </span>
            <button onClick={fetchCars} style={{ background: '#6c757d', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>
              <RefreshCw size={14} /> تحديث
            </button>
          </div>
        </div>

        {/* أزرار التصفية */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[
            ['all', 'الكل'],
            ['pending', 'بانتظار الموافقة'],
            ['approved', 'مفعّلة']
          ].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)} style={{
              background: filter === val ? '#0a58ca' : '#e9ecef',
              color: filter === val ? 'white' : '#1a1a1a',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: filter === val ? 'bold' : 'normal'
            }}>
              {label}
            </button>
          ))}
        </div>
           {/* جدول السيارات مع تمرير أفقي */}
        {/* {cars.map(car => ( */}
                  {/* <Link key={car.id} to={`/cars/${car.id}`} style={{ textDecoration: 'none', color: 'inherit', background: 'white', borderRadius: '12px', overflow: 'hidden', display: 'flex', transition: 'transform 0.2s, box-shadow 0.2s' }} className="hover-up"> */}
        <div style={{ overflowX: 'auto', background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
            
            <thead style={{ background: '#f8f9fa' }}>
              <tr>
                <th style={{ padding: '12px 16px', textAlign: 'right', borderBottom: '1px solid #e9ecef' }}>صورة</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', borderBottom: '1px solid #e9ecef' }}>السيارة</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', borderBottom: '1px solid #e9ecef' }}>المورد</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', borderBottom: '1px solid #e9ecef' }}>السعر/يوم</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', borderBottom: '1px solid #e9ecef' }}>الحالة</th>
                {/* <th style={{ padding: '12px 16px', textAlign: 'right', borderBottom: '1px solid #e9ecef' }}>إجراءات</th> */}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: '#6c757d' }}>لا توجد سيارات في هذا التصنيف</td></tr>
              ) : (
                filtered.map(car => (
                  <tr key={car.id} style={{ borderBottom: '1px solid #e9ecef' }}>
                    <td style={{ padding: '12px 16px' }}>
                      {car.primary_image ? (
                        <img src={car.primary_image.startsWith('http') ? car.primary_image : `http://localhost:5000/${car.primary_image}`} alt={car.make}
                          style={{ width: '60px', height: '44px', objectFit: 'cover', borderRadius: '6px' }} />
                      ) : (
                        <div style={{ width: '60px', height: '44px', background: '#e9ecef', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Image size={16} color="#6c757d" />
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>
                      {car.make} {car.model} <span style={{ fontWeight: 'normal', color: '#6c757d' }}>({car.year})</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>{car.supplier_name}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 'bold', color: '#0a58ca' }}>${car.price_per_day}</td>
                    <td style={{ padding: '12px 16px' }}>{getStatusBadge(car.is_approved)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      {!car.is_approved && (
                        <button
                          onClick={() => handleApprove(car.id)}
                          disabled={approvingId === car.id}
                          style={{
                            background: '#28a745',
                            color: 'white',
                            border: 'none',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            cursor: approvingId === car.id ? 'not-allowed' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold'
                          }}
                        >
                          {approvingId === car.id ? 'جاري...' : <><CheckCircle size={14} /> موافقة</>}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
         
        </div>
        {/* </Link> */}
         {/* ))} */}
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