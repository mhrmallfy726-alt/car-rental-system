import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Users, Car, Calendar, DollarSign, LayoutDashboard, ShieldAlert, Settings, ArrowRight } from 'lucide-react';
// import { format } from 'date-fns';
import { Building2 } from "lucide-react";
export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);  

  const fetchData = async () => {
    try {
      const [statsRes, resvRes, compRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getReservations(),
        adminAPI.getComplaints()
      ]);
      setStats(statsRes.data.data);
      // التأكد من أن البيانات مصفوفات
      setReservations(Array.isArray(resvRes.data.data) ? resvRes.data.data.slice(0, 5) : []);
      setComplaints(Array.isArray(compRes.data.data) ? compRes.data.data.filter(c => c.status !== 'resolved' && c.status !== 'closed').slice(0, 5) : []);
    } catch (error) {
      toast.error('فشل جلب الإحصائيات');
      setStats({ totalUsers: 0, totalCars: 0, totalReservations: 0, totalRevenue: 0, openComplaints: 0 });
    } finally {
      setLoading(false);
    }
  };

  // دالة للحصول على حالة badge
  const getStatusBadge = (status) => {
    const isActive = status === 'active';
    return (
      <span style={{
        background: isActive ? '#28a745' : '#6c757d',
        color: 'white',
        padding: '2px 8px',
        borderRadius: '20px',
        fontSize: '0.7rem',
        fontWeight: 'bold'
      }}>
        {status === 'active' ? 'نشط' : status}
      </span>
    );
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
      {/* القائمة الجانبية (مع تحسين للهواتف) */}
      <div className="sidebar" style={{ width: '260px', background: 'white', borderLeft: '1px solid #e9ecef', padding: '24px 0', position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Link to="/admin/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', background: '#e9ecef', color: '#0a58ca', fontWeight: 'bold', textDecoration: 'none' }}>
            <LayoutDashboard size={20} /> الإحصائيات
          </Link>
          <Link to="/admin/users" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: '#1a1a1a', textDecoration: 'none' }}>
            <Users size={20} /> المستخدمين
          </Link>
          <Link to="/admin/cars" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: '#1a1a1a', textDecoration: 'none' }}>
            <Car size={20} /> السيارات
          </Link>
          <Link to="/admin/complaints" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: '#1a1a1a', textDecoration: 'none' }}>
            <ShieldAlert size={20} /> الشكاوى
          </Link>
          <Link to="/admin/advertisements" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: '#1a1a1a', textDecoration: 'none' }}>
            <ShieldAlert size={20} /> الإعلانات
          </Link>
          <Link to="/admin/supplier-requests" style={{   display: "flex",   alignItems: "center",gap: "10px",   padding: "12px 16px",   borderRadius: "10px",   textDecoration: "none",  color: "#374151",fontWeight: 500, }}>
             <Building2 size={20} />  طلبات الموردين
          </Link>
          <Link to="/admin/settings" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: '#1a1a1a', textDecoration: 'none' }}>
            <Settings size={20} /> الإعدادات
          </Link>
        </div>
      </div>

      <div style={{ flex: 1, padding: '30px 24px' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '32px' }}>لوحة تحكم الإدارة</h1>

        {/* بطاقات الإحصائيات */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ background: '#e9ecef', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6f42c1' }}><Users size={24} /></div>
            <div><p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{stats?.totalUsers ?? 0}</p><p style={{ color: '#6c757d', margin: 0 }}>المستخدمين</p></div>
          </div>
          <div style={{ background: 'white', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ background: '#e9ecef', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0d6efd' }}><Car size={24} /></div>
            <div><p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{stats?.totalCars ?? 0}</p><p style={{ color: '#6c757d', margin: 0 }}>السيارات</p></div>
          </div>
          <div style={{ background: 'white', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ background: '#e9ecef', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffc107' }}><Calendar size={24} /></div>
            <div><p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{stats?.totalReservations ?? 0}</p><p style={{ color: '#6c757d', margin: 0 }}>إجمالي الحجوزات</p></div>
          </div>
          <div style={{ background: 'white', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ background: '#e9ecef', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#28a745' }}><DollarSign size={24} /></div>
            <div><p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>${stats?.totalRevenue?.toFixed(2) ?? '0.00'}</p><p style={{ color: '#6c757d', margin: 0 }}>الإيرادات</p></div>
          </div>
          <div style={{ background: 'white', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ background: '#e9ecef', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc3545' }}><ShieldAlert size={24} /></div>
            <div><p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{stats?.openComplaints ?? 0}</p><p style={{ color: '#6c757d', margin: 0 }}>شكاوى مفتوحة</p></div>
          </div>
        </div>

        {/* قسم الحجوزات والشكاوى */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {/* أحدث الحجوزات */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e9ecef', paddingBottom: '8px', marginBottom: '16px' }}>
              <h3 style={{ fontWeight: 'bold', display: 'flex', gap: '8px', margin: 0 }}><Calendar size={18} style={{ color: '#0a58ca' }} /> أحدث الحجوزات</h3>
            </div>
            {reservations.length === 0 ? (
              <p style={{ color: '#6c757d' }}>لا يوجد حجوزات.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {reservations.map(r => (
                  <div key={r.id} style={{ background: '#f8f9fa', padding: '12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <p style={{ fontWeight: 'bold', fontSize: '0.85rem', margin: 0 }}>{r.make} {r.model}</p>
                      <p style={{ fontSize: '0.7rem', color: '#6c757d', margin: 0 }}>العميل: {r.customer_name} | المورد: {r.supplier_name}</p>
                    </div>
                    {getStatusBadge(r.status)}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* الشكاوى المفتوحة */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e9ecef', paddingBottom: '8px', marginBottom: '16px' }}>
              <h3 style={{ fontWeight: 'bold', display: 'flex', gap: '8px', margin: 0, color: '#dc3545' }}><ShieldAlert size={18} /> شكاوى تتطلب تدخلاً</h3>
              <Link to="/admin/complaints" style={{ color: '#0a58ca', fontSize: '0.85rem', textDecoration: 'none' }}>إدارة الشكاوى ←</Link>
            </div>
            {complaints.length === 0 ? (
              <p style={{ color: '#6c757d' }}>لا يوجد شكاوى مفتوحة.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {complaints.map(c => (
                  <Link key={c.id} to="/admin/complaints" style={{ background: '#f8f9fa', padding: '12px', borderRadius: '8px', textDecoration: 'none', color: 'inherit', display: 'block' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <p style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#dc3545', margin: 0 }}>{c.title}</p>
                      <span style={{ background: '#dc3545', color: 'white', padding: '2px 8px', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 'bold' }}>{c.priority}</span>
                    </div>
                    <p style={{ fontSize: '0.7rem', color: '#6c757d', marginBottom: '6px' }}>الشاكي: {c.complainant_name} ضد {c.against_name}</p>
                    <p style={{ fontSize: '0.7rem', color: '#0a58ca', display: 'flex', alignItems: 'center', gap: '4px', margin: 0 }}>
                      <ArrowRight size={12} /> انقر للدخول والتدخل في النزاع
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* الأنماط العامة (spinner + responsive) */}
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
          [style*="display: grid"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}