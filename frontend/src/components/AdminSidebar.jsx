import { Link, useLocation } from 'react-router-dom';
import { BarChart3, Car, FileText, Megaphone, MessageSquare, Settings, Users, WalletCards } from 'lucide-react';

const adminLinks = [
  { to: '/admin/dashboard', label: 'لوحة الإحصائيات', icon: BarChart3 },
  { to: '/admin/users', label: 'المستخدمون', icon: Users },
  { to: '/admin/cars', label: 'السيارات', icon: Car },
  { to: '/admin/supplier-requests', label: 'طلبات الموردين', icon: FileText },
  { to: '/admin/advertisement-center', label: 'الإعلانات', icon: Megaphone },
  { to: '/admin/finance', label: 'الإدارة المالية', icon: WalletCards },
  { to: '/admin/complaints', label: 'الشكاوى', icon: MessageSquare },
  { to: '/admin/settings', label: 'الإعدادات', icon: Settings },
];

export default function AdminSidebar() {
  const location = useLocation();

  return (
    <aside className="admin-sidebar" aria-label="قائمة الإدارة">
      <div className="admin-sidebar-brand">
        <span className="admin-sidebar-kicker">RENTAL CIRCLE</span>
        <strong>مركز الإدارة</strong>
        <small>إدارة المنصة والعمليات</small>
      </div>
      <nav className="admin-sidebar-nav">
        {adminLinks.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to || (to !== '/admin/dashboard' && location.pathname.startsWith(`${to}/`));
          return <Link key={to} to={to} className={`admin-sidebar-link ${active ? 'is-active' : ''}`}><Icon size={18} /><span>{label}</span></Link>;
        })}
      </nav>
      <style>{`
        .admin-sidebar { width: 248px; flex: 0 0 248px; min-height: 100vh; padding: 24px 14px; background: #fff; border-left: 1px solid #e7edf0; direction: rtl; }
        .admin-sidebar-brand { display: grid; gap: 5px; padding: 0 12px 22px; margin-bottom: 14px; border-bottom: 1px solid #edf1f3; color: #173a52; }
        .admin-sidebar-brand strong { font-size: 19px; font-weight: 950; }
        .admin-sidebar-brand small { color: #7b8b94; font-size: 11px; }
        .admin-sidebar-kicker { color: #b78a22; font-size: 9px; font-weight: 950; letter-spacing: 1.3px; }
        .admin-sidebar-nav { display: grid; gap: 5px; }
        .admin-sidebar-link { display: flex; align-items: center; gap: 10px; min-height: 44px; padding: 0 13px; border: 1px solid transparent; border-radius: 12px; color: #50636d; text-decoration: none; font-size: 13px; font-weight: 800; transition: background .18s ease, color .18s ease, transform .18s ease, border-color .18s ease; }
        .admin-sidebar-link:hover { color: #173a52; background: #f2f7f8; transform: translateX(-2px); }
        .admin-sidebar-link.is-active { color: #173a52; background: linear-gradient(135deg, #edf7f5, #f8fbfb); border-color: #cfe7e0; box-shadow: 0 7px 16px rgba(23,58,82,.07); }
        .admin-sidebar-link.is-active svg { color: #b78a22; }
        @media (max-width: 900px) { .admin-sidebar { display: none !important; } }
      `}</style>
    </aside>
  );
}
