import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { carsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Car, LayoutDashboard, Plus, Calendar, Edit, Trash2, Percent, Settings } from 'lucide-react';
import { getCarImage } from '../../utils/imageUtils';

export default function MyCars() {
  const navigate = useNavigate();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [newDiscount, setNewDiscount] = useState(0);
  const [updatingDiscount, setUpdatingDiscount] = useState(false);

  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async () => {
    try {
      const res = await carsAPI.getMyCars();
      setCars(res.data.data);
    } catch (error) {
      toast.error('فشل جلب السيارات');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه السيارة؟ لا يمكن التراجع.')) return;
    try {
      await carsAPI.delete(id);
      toast.success('تم حذف السيارة');
      fetchCars();
    } catch (error) {
      toast.error('فشل عملية الحذف');
    }
  };

  const handleUpdateDiscount = async (e) => {
    e.preventDefault();
    const discountValue = parseInt(newDiscount);
    if (isNaN(discountValue) || discountValue < 0 || discountValue > 100) {
      toast.error('نسبة الخصم يجب أن تكون بين 0 و 100');
      return;
    }
    setUpdatingDiscount(true);
    try {
      await carsAPI.update(editingDiscount.id, { discount_percentage: discountValue });
      toast.success('تم تحديث الخصم بنجاح');
      setEditingDiscount(null);
      fetchCars();
    } catch (error) {
      toast.error('فشل تحديث الخصم');
    } finally {
      setUpdatingDiscount(false);
    }
  };

  const handleEditCar = (carId) => {
    navigate(`/supplier/cars/edit/${carId}`);
  };

  const getStatusBadge = (status, is_approved) => {
    if (!is_approved) {
      return <span style={{ background: '#ffc107', color: '#1a1a1a', padding: '2px 8px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold' }}>قيد المراجعة</span>;
    }
    switch (status) {
      case 'available': return <span style={{ background: '#28a745', color: 'white', padding: '2px 8px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold' }}>متاحة</span>;
      case 'reserved': return <span style={{ background: '#17a2b8', color: 'white', padding: '2px 8px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold' }}>محجوزة</span>;
      case 'maintenance': return <span style={{ background: '#dc3545', color: 'white', padding: '2px 8px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold' }}>في الصيانة</span>;
      default: return <span style={{ background: '#6c757d', color: 'white', padding: '2px 8px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold' }}>{status}</span>;
    }
  };

  return (
    <div className="dashboard" style={{ display: 'flex', minHeight: '100vh', background: '#f8f9fa' }}>
      {/* Sidebar محسّن للهواتف */}
      <div className="sidebar" style={{ width: '260px', background: 'white', borderLeft: '1px solid #e9ecef', padding: '24px 0', position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ padding: '0 16px' }}>
          <Link to="/supplier/dashboard" className="sidebar-item" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: '#1a1a1a', textDecoration: 'none', marginBottom: '4px' }}>
            <LayoutDashboard size={20} /> لوحة التحكم
          </Link>
          <Link to="/supplier/cars" className="sidebar-item active" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', background: '#e9ecef', color: '#0a58ca', fontWeight: 'bold', textDecoration: 'none' }}>
            <Car size={20} /> سياراتي
          </Link>
          <Link to="/supplier/cars/add" className="sidebar-item" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: '#1a1a1a', textDecoration: 'none', marginBottom: '4px' }}>
            <Plus size={20} /> إضافة سيارة
          </Link>
          <Link to="/supplier/reservations" className="sidebar-item" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: '#1a1a1a', textDecoration: 'none', marginBottom: '4px' }}>
            <Calendar size={20} /> الحجوزات
          </Link>
          <Link to="/supplier/settings" className="sidebar-item" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: '#1a1a1a', textDecoration: 'none' }}>
            <Settings size={20} /> الإعدادات
          </Link>
        </div>
      </div>

      <div className="dashboard-content" style={{ flex: 1, padding: '30px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div><h1 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>إدارة سياراتي</h1></div>
          <Link to="/supplier/cars/add" className="btn btn-primary" style={{ background: '#0a58ca', color: 'white', padding: '8px 16px', borderRadius: '8px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={18} /> إضافة سيارة
          </Link>
        </div>

        {loading ? (
          <div className="loading-screen" style={{ minHeight: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><div className="spinner"></div></div>
        ) : cars.length === 0 ? (
          <div className="card" style={{ background: 'white', borderRadius: '12px', padding: '32px', textAlign: 'center', color: '#6c757d' }}>
            <Car size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>لم تقم بإضافة أي سيارات بعد</h3>
            <Link to="/supplier/cars/add" className="btn btn-primary" style={{ background: '#0a58ca', color: 'white', padding: '8px 16px', borderRadius: '8px', textDecoration: 'none' }}>إضافة أول سيارة</Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }} className="table-container">
            <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <thead style={{ background: '#f8f9fa' }}>
                <tr>
                  <th style={{ padding: '12px 16px', textAlign: 'right', borderBottom: '1px solid #e9ecef' }}>السيارة</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', borderBottom: '1px solid #e9ecef' }}>الفئة</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', borderBottom: '1px solid #e9ecef' }}>السعر الأساسي</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', borderBottom: '1px solid #e9ecef' }}>الخصم (العرض)</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', borderBottom: '1px solid #e9ecef' }}>الحالة</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', borderBottom: '1px solid #e9ecef' }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {cars.map(car => (
                  <tr key={car.id} style={{ borderBottom: '1px solid #e9ecef' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <img src={getCarImage(car, 'https://via.placeholder.com/60')} alt="Car" style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '6px' }} />
                        <div>
                          <p style={{ fontWeight: 'bold' }}>{car.make} {car.model}</p>
                          <p style={{ fontSize: '0.75rem', color: '#6c757d' }}>{car.license_plate}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>{car.category_name}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>${car.price_per_day}</td>
                    <td style={{ padding: '12px 16px' }}>
                      {car.discount_percentage > 0 ? (
                        <span style={{ background: '#E3000F', color: 'white', padding: '2px 8px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Percent size={12} /> {car.discount_percentage}% خصم
                        </span>
                      ) : (
                        <span style={{ color: '#6c757d', fontSize: '0.8rem' }}>لا يوجد عرض</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>{getStatusBadge(car.status, car.is_approved)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => { setEditingDiscount(car); setNewDiscount(car.discount_percentage || 0); }} className="btn btn-warning" style={{ background: '#ffc107', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                          <Percent size={14} /> عروض
                        </button>
                        <button onClick={() => handleEditCar(car.id)} className="btn btn-secondary" style={{ background: '#6c757d', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
                          <Edit size={14} />
                        </button>
                        <button onClick={() => handleDelete(car.id)} className="btn btn-danger" style={{ background: '#dc3545', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* مودال تعديل الخصم */}
      {editingDiscount && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="modal-content" style={{ background: 'white', borderRadius: '12px', maxWidth: '400px', width: '100%', padding: '24px' }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '16px' }}>إدارة العروض لسيارة {editingDiscount.make} {editingDiscount.model}</h3>
            <form onSubmit={handleUpdateDiscount}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>نسبة الخصم (%)</label>
                <input type="number" className="form-input" min="0" max="100" value={newDiscount} onChange={e => setNewDiscount(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px' }} />
                <p style={{ fontSize: '0.7rem', color: '#6c757d', marginTop: '4px' }}>ضع 0 لإلغاء الخصم.</p>
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
                <button type="submit" className="btn btn-primary" disabled={updatingDiscount} style={{ flex: 1, background: '#0a58ca', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                  {updatingDiscount ? 'جاري الحفظ...' : 'حفظ'}
                </button>
                <button type="button" onClick={() => setEditingDiscount(null)} className="btn btn-secondary" style={{ flex: 1, background: '#6c757d', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer' }}>
                  إلغاء
                </button>
              </div>
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
          table {
            min-width: 600px;
          }
        }
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
      `}</style>
    </div>
  );
}