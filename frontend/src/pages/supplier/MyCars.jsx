import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { carsAPI } from '../../services/api';
import SupplierSidebar from '../../components/SupplierSidebar';
import toast from 'react-hot-toast';
import { Car, LayoutDashboard, Plus, Calendar, Edit, Trash2, Megaphone, Settings } from 'lucide-react';
import { getCarImage } from '../../utils/imageUtils';
import { useSupplierShowroom } from '../../hooks/useSupplierShowroom';

export default function MyCars() {
  const navigate = useNavigate();
  const { showroom } = useSupplierShowroom();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCars = useCallback(async () => {
    try {
      const res = await carsAPI.getMyCars(showroom?.id ? { location_id: showroom.id } : undefined);
      setCars(res.data.data);
    } catch (error) {
      toast.error('فشل جلب السيارات');
    } finally {
      setLoading(false);
    }
  }, [showroom?.id]);

  useEffect(() => {
    fetchCars();
  }, [fetchCars]);

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

  const handleEditCar = (carId) => {
    navigate(`/supplier/cars/edit/${carId}`);
  };

  const handleCreateAdvertisement = (carId) => {
    navigate(`/supplier/advertisement-request?car_id=${encodeURIComponent(carId)}`);
  };

  const getStatusBadge = (status, is_approved, rejection_reason) => {
    if (!is_approved) {
      if (rejection_reason) return <span style={{ background: '#ffe0e0', color: '#a23a3a', padding: '2px 8px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold' }}>مرفوض</span>;
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
      <SupplierSidebar />

      <div className="dashboard-content supplier-dashboard-content" style={{ flex: 1, padding: '30px 24px' }}>
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
          <>
          <div className="mobile-cars-grid">
            {cars.map((car) => <article className="mobile-car-card" key={car.id}>
              <div className="mobile-car-image-wrap"><img src={getCarImage(car, 'https://via.placeholder.com/640x360?text=Car')} alt={`${car.make} ${car.model}`} className="mobile-car-image" />{!car.is_approved && <span className="mobile-car-review">قيد المراجعة</span>}</div>
              <div className="mobile-car-body"><div className="mobile-car-title-row"><div><h2>{car.make} {car.model}</h2><small>{car.license_plate || 'بدون رقم لوحة'}</small></div>{getStatusBadge(car.status, car.is_approved, car.rejection_reason)}</div>
                <div className="mobile-car-details"><span><b>سنة الصنع</b>{car.year || '—'}</span><span><b>الفئة</b>{car.category_name || 'غير محددة'}</span><span><b>السعر اليومي</b>${car.price_per_day || 0}</span></div>{car.rejection_reason && <p style={{ margin: '8px 0', color: '#a23a3a', fontSize: 12 }}><b>سبب الرفض:</b> {car.rejection_reason}</p>}
                <div className="mobile-car-actions"><button type="button" onClick={() => handleCreateAdvertisement(car.id)}><Megaphone size={15} /> عرض</button><button type="button" onClick={() => handleEditCar(car.id)}><Edit size={15} /> تعديل</button><button type="button" className="danger" onClick={() => handleDelete(car.id)}><Trash2 size={15} /> حذف</button></div>
              </div>
            </article>)}
          </div>
          <div style={{ overflowX: 'auto' }} className="table-container desktop-cars-table">
            <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <thead style={{ background: '#f8f9fa' }}>
                <tr>
                  <th style={{ padding: '12px 16px', textAlign: 'right', borderBottom: '1px solid #e9ecef' }}>السيارة</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', borderBottom: '1px solid #e9ecef' }}>الفئة</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', borderBottom: '1px solid #e9ecef' }}>السعر الأساسي</th>
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
                    <td style={{ padding: '12px 16px' }}>{getStatusBadge(car.status, car.is_approved, car.rejection_reason)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleCreateAdvertisement(car.id)} className="btn btn-primary" style={{ background: '#0a58ca', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                          <Megaphone size={14} /> عرض
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
          </>
        )}
      </div>

      <style>{`
        .mobile-cars-grid { display: none; }
        .mobile-car-card { overflow: hidden; background: #fff; border: 1px solid #e3eaee; border-radius: 18px; box-shadow: 0 8px 22px rgba(23,58,82,.07); }
        .mobile-car-image-wrap { position: relative; height: 174px; background: #edf3f5; }
        .mobile-car-image { width: 100%; height: 100%; display: block; object-fit: cover; }
        .mobile-car-review { position: absolute; top: 12px; right: 12px; padding: 6px 10px; border-radius: 999px; background: #fff4d6; color: #8b651a; font-size: 11px; font-weight: 900; }
        .mobile-car-body { padding: 15px; }
        .mobile-car-title-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
        .mobile-car-title-row h2 { margin: 0 0 5px; color: #173a52; font-size: 18px; }

        .mobile-car-card { overflow: hidden; background: #fff; border: 1px solid #dfe9ec; border-radius: 18px; box-shadow: 0 8px 22px rgba(23,58,82,.07); }
        .mobile-car-image-wrap { position: relative; height: 190px; background: linear-gradient(135deg,#edf4f5,#f8fbfb); }
        .mobile-car-image { width: 100%; height: 100%; display: block; object-fit: cover; }
        .mobile-car-review { position: absolute; top: 12px; right: 12px; padding: 6px 10px; border-radius: 999px; background: #fff4d6; color: #8b651a; font-size: 11px; font-weight: 900; }
        .mobile-car-body { padding: 16px; }
        .mobile-car-title-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
        .mobile-car-title-row h2 { margin: 0 0 5px; color: #173a52; font-size: 18px; line-height: 1.35; }
3cdf650 (Improve mobile car cards and sidebar layout)
        .mobile-car-title-row small { color: #81929b; font-size: 12px; }
        .mobile-car-details { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 15px 0 11px; padding: 12px 0; border-top: 1px solid #edf2f4; border-bottom: 1px solid #edf2f4; }
        .mobile-car-details span { display: grid; gap: 4px; color: #526873; font-size: 12px; }
        .mobile-car-details b { color: #94a2a8; font-size: 10px; font-weight: 700; }
        .mobile-car-offer { min-height: 18px; display: inline-flex; align-items: center; gap: 5px; color: #71828a; font-size: 12px; font-weight: 800; }
        .mobile-car-actions { display: grid; grid-template-columns: 1.15fr 1fr 1fr; gap: 7px; margin-top: 14px; }

        .mobile-car-actions button { display: inline-flex; justify-content: center; align-items: center; gap: 5px; padding: 10px 6px; border: 1px solid #d9e5e8; border-radius: 10px; background: #fff; color: #173a52; font: inherit; font-size: 11px; font-weight: 900; cursor: pointer; }

        .mobile-car-actions button { display: inline-flex; justify-content: center; align-items: center; gap: 5px; min-height: 40px; padding: 10px 6px; border: 1px solid #d9e5e8; border-radius: 10px; background: #fff; color: #173a52; font: inherit; font-size: 11px; font-weight: 900; cursor: pointer; transition: transform .16s ease, box-shadow .16s ease; }
        .mobile-car-actions button:active { transform: scale(.97); }
 3cdf650 (Improve mobile car cards and sidebar layout)
        .mobile-car-actions button:first-child { background: #fff7df; border-color: #f1d589; color: #80601a; }
        .mobile-car-actions .danger { background: #fff5f5; border-color: #f1d5d5; color: #b64040; }
        @media (max-width: 768px) {
          .dashboard { flex-direction: column; }
          .dashboard-content { width: 100%; }
          .dashboard-content {
            padding: 20px 16px !important;
          }
          .desktop-cars-table { display: none; }

          .mobile-cars-grid { display: grid; grid-template-columns: 1fr; gap: 14px; }

          .mobile-cars-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 14px; }
        }
        @media (max-width: 420px) {
          .mobile-car-image-wrap { height: 165px; }
          .mobile-car-body { padding: 14px; }
          .mobile-car-title-row { display: block; }
          .mobile-car-title-row > span { display: inline-flex; margin-top: 9px; }
          .mobile-car-details { gap: 5px; }
          .mobile-car-details span { font-size: 11px; }
          .mobile-car-actions { grid-template-columns: 1fr 1fr; }
          .mobile-car-actions button:first-child { grid-column: 1 / -1; }
3cdf650 (Improve mobile car cards and sidebar layout)
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
