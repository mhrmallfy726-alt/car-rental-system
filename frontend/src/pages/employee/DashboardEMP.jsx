import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const pageByPermission = {
  view_cars: { label: 'السيارات', path: '/supplier/cars' },
  manage_cars: { label: 'إدارة السيارات', path: '/supplier/cars' },
  view_reservations: { label: 'الحجوزات', path: '/supplier/reservations' },
  manage_reservations: { label: 'إدارة الحجوزات', path: '/supplier/reservations' },
  view_customers: { label: 'العملاء', path: '/customers' },
  view_payments: { label: 'المدفوعات', path: '/payments' },
  manage_maintenance: { label: 'الصيانة', path: '/maintenance' },
  view_reports: { label: 'التقارير', path: '/reports' },
};

export default function EmployeeDashboard() {
  const [employee, setEmployee] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/employee/me'),
      api.get('/employee/me/permissions'),
    ])
      .then(([employeeResponse, permissionsResponse]) => {
        setEmployee(employeeResponse.data.data);
        setPermissions(permissionsResponse.data.data || []);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'تعذر تحميل بيانات الموظف');
      });
  }, []);

  const pages = useMemo(() => {
    const seen = new Set();
    return permissions
      .map((permission) => pageByPermission[permission.name])
      .filter((page) => page && !seen.has(page.path) && seen.add(page.path));
  }, [permissions]);

  return (
    <main style={{ padding: 32 }} dir="rtl">
      <h1>لوحة الموظف</h1>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      {employee && (
        <>
          <p>مرحباً {employee.full_name}</p>
          <p>الدور: {employee.role}</p>
          <hr />
          <h2>الصفحات المسموحة</h2>
          {pages.length === 0 ? (
            <p>لم يتم تعيين صلاحيات لهذا الموظف بعد.</p>
          ) : (
            <nav style={{ display: 'grid', gap: 12, maxWidth: 360 }}>
              {pages.map((page) => (
                <Link key={page.path} to={page.path}>{page.label}</Link>
              ))}
            </nav>
          )}
        </>
      )}
    </main>
  );
}
