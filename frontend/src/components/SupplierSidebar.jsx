import { Link, useLocation } from 'react-router-dom';
import { Megaphone, Calendar, Car, LayoutDashboard, Plus, Settings, Users } from 'lucide-react';

const supplierLinks = [
  { to: '/supplier/dashboard', label: 'لوحة المورد', icon: LayoutDashboard },
  { to: '/supplier/cars', label: 'سياراتي', icon: Car },
  { to: '/supplier/cars/add', label: 'إضافة سيارة', icon: Plus },
  { to: '/supplier/reservations', label: 'الحجوزات', icon: Calendar },
  { to: '/supplier/employees', label: 'الموظفون', icon: Users },
  { to: '/supplier/advertisement-request', label: 'الإعلانات', icon: Megaphone },
  { to: '/supplier/settings', label: 'الإعدادات', icon: Settings },
];

export default function SupplierSidebar() {
  const location = useLocation();

  return (
    <aside className="supplier-sidebar" aria-label="قائمة المورد">
      <div className="supplier-sidebar-brand">
        <span className="supplier-sidebar-kicker">RENTAL CIRCLE</span>
        <strong>مساحة المورد</strong>
        <small>إدارة الأسطول والحجوزات</small>
      </div>
      <nav className="supplier-sidebar-nav">
        {supplierLinks.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to || (to !== '/supplier/dashboard' && location.pathname.startsWith(`${to}/`));
          return (
            <Link key={to} to={to} className={`supplier-sidebar-link ${active ? 'is-active' : ''}`}>
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
      <style>{`
        .supplier-sidebar { width: 248px; flex: 0 0 248px; min-height: 100vh; padding: 24px 14px; background: #fff; border-left: 1px solid #e7edf0; direction: rtl; }
        .supplier-sidebar-brand { display: grid; gap: 5px; padding: 0 12px 22px; margin-bottom: 14px; border-bottom: 1px solid #edf1f3; color: #173a52; }
        .supplier-sidebar-brand strong { font-size: 19px; font-weight: 950; }
        .supplier-sidebar-brand small { color: #7b8b94; font-size: 11px; }
        .supplier-sidebar-kicker { color: #b78a22; font-size: 9px; font-weight: 950; letter-spacing: 1.3px; }
        .supplier-sidebar-nav { display: grid; gap: 5px; }
        .supplier-sidebar-link { display: flex; align-items: center; gap: 10px; min-height: 44px; padding: 0 13px; border: 1px solid transparent; border-radius: 12px; color: #50636d; text-decoration: none; font-size: 13px; font-weight: 800; transition: background .18s ease, color .18s ease, transform .18s ease, border-color .18s ease; }
        .supplier-sidebar-link:hover { color: #173a52; background: #f2f7f8; transform: translateX(-2px); }
        .supplier-sidebar-link.is-active { color: #173a52; background: linear-gradient(135deg, #edf7f5, #f8fbfb); border-color: #cfe7e0; box-shadow: 0 7px 16px rgba(23,58,82,.07); }
        .supplier-sidebar-link.is-active svg { color: #178263; }
        @media (max-width: 900px) { .supplier-sidebar { width: 100%; min-height: auto; padding: 14px; border-left: 0; border-bottom: 1px solid #e7edf0; } .supplier-sidebar-brand { display: flex; align-items: baseline; gap: 9px; padding: 0 4px 12px; margin-bottom: 10px; } .supplier-sidebar-brand small { display: none; } .supplier-sidebar-nav { display: flex; overflow-x: auto; padding-bottom: 2px; } .supplier-sidebar-link { flex: 0 0 auto; min-height: 40px; white-space: nowrap; } }
      `}</style>
    </aside>
  );
}
