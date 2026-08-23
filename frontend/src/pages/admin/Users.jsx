import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import AdminSidebar from '../../components/AdminSidebar';
import toast from 'react-hot-toast';
import { Users as UsersIcon, LayoutDashboard, ShieldAlert, CheckCircle, XCircle, Car, Settings, UserCheck, UserX } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await adminAPI.getUsers();
      setUsers(res.data.data);
    } catch (error) {
      toast.error('فشل جلب المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id, currentStatus, userName) => {
    const action = currentStatus ? 'تعطيل' : 'تفعيل';
    if (!window.confirm(`هل أنت متأكد من ${action} حساب المستخدم "${userName}"؟`)) return;

    setTogglingId(id);
    try {
      await adminAPI.toggleUser(id);
      toast.success(`تم ${action} حساب المستخدم بنجاح`);
      fetchUsers();
    } catch (error) {
      toast.error('فشل التحديث');
    } finally {
      setTogglingId(null);
    }
  };

  const getRoleBadge = (role) => {
    const config = {
      admin: { label: 'مدير', bg: '#0a58ca', color: 'white' },
      supplier: { label: 'مورد', bg: '#17a2b8', color: 'white' },
      customer: { label: 'عميل', bg: '#6c757d', color: 'white' }
    };
    const { label, bg, color } = config[role] || config.customer;
    return <span style={{ background: bg, color: color, padding: '2px 8px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold' }}>{label}</span>;
  };

  const getStatusBadge = (isActive) => {
    return isActive
      ? <span style={{ background: '#28a745', color: 'white', padding: '2px 8px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold' }}>نشط</span>
      : <span style={{ background: '#dc3545', color: 'white', padding: '2px 8px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold' }}>معطل</span>;
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
      <AdminSidebar />

      <div style={{ flex: 1, padding: '30px 24px' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '32px' }}>إدارة المستخدمين</h1>

        {users.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '12px', padding: '32px', textAlign: 'center', color: '#6c757d' }}>
            لا يوجد مستخدمون مسجلون.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', minWidth: '600px' }}>
              <thead style={{ background: '#f8f9fa' }}>
                <tr>
                  <th style={{ padding: '12px 16px', textAlign: 'right', borderBottom: '1px solid #e9ecef' }}>الاسم</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', borderBottom: '1px solid #e9ecef' }}>البريد الإلكتروني</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', borderBottom: '1px solid #e9ecef' }}>الدور</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', borderBottom: '1px solid #e9ecef' }}>تاريخ التسجيل</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', borderBottom: '1px solid #e9ecef' }}>الحالة</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', borderBottom: '1px solid #e9ecef' }}>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #e9ecef' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>{u.name}</td>
                    <td style={{ padding: '12px 16px' }}>{u.email}</td>
                    <td style={{ padding: '12px 16px' }}>{getRoleBadge(u.role)}</td>
                    <td style={{ padding: '12px 16px' }}>{format(new Date(u.created_at), 'yyyy-MM-dd')}</td>
                    <td style={{ padding: '12px 16px' }}>{getStatusBadge(u.is_active)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleToggleActive(u.id, u.is_active, u.name)}
                          disabled={togglingId === u.id}
                          style={{
                            background: u.is_active ? '#dc3545' : '#28a745',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            cursor: togglingId === u.id ? 'not-allowed' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.8rem',
                            fontWeight: 'bold'
                          }}
                        >
                          {togglingId === u.id ? (
                            'جاري...'
                          ) : u.is_active ? (
                            <>
                              <UserX size={14} /> تعطيل
                            </>
                          ) : (
                            <>
                              <UserCheck size={14} /> تفعيل
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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