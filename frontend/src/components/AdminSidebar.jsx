import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart3, Car, FileText, Megaphone, MessageSquare, Settings, Users, WalletCards, Menu, X } from 'lucide-react';

const adminLinks = [
  { to: '/admin/dashboard', label: 'لوحة الإحصائيات', icon: BarChart3 },
  { to: '/admin/users', label: 'المستخدمون', icon: Users },
  { to: '/admin/cars', label: 'السيارات', icon: Car },
  { to: '/admin/supplier-requests', label: 'اعتماد الموردين', icon: FileText },
  { to: '/admin/advertisement-center', label: 'الإعلانات', icon: Megaphone },
  { to: '/admin/finance', label: 'الإدارة المالية', icon: WalletCards },
  { to: '/admin/complaints', label: 'الشكاوى', icon: MessageSquare },
  { to: '/admin/settings', label: 'الإعدادات', icon: Settings },
];

export default function AdminSidebar() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [location.pathname]);
  useEffect(() => {
    document.body.classList.toggle('admin-menu-open', open);
    return () => document.body.classList.remove('admin-menu-open');
  }, [open]);

  return <>
    <header className="admin-mobile-header"><button type="button" className="admin-mobile-menu-button" onClick={() => setOpen(true)}><Menu size={19} /> القائمة</button><div className="admin-mobile-title"><span className="admin-mobile-mark">RC</span><span><strong>مركز الإدارة</strong><small>إدارة المنصة والعمليات</small></span></div></header>
    {open && <button type="button" aria-label="إغلاق القائمة" className="admin-sidebar-overlay" onClick={() => setOpen(false)} />}
    <aside className={`admin-sidebar${open ? ' is-mobile-open' : ''}`} aria-label="قائمة الإدارة">
      <button type="button" className="admin-mobile-close" aria-label="إغلاق القائمة" onClick={() => setOpen(false)}><X size={19} /></button>
      <div className="admin-sidebar-brand"><span className="admin-sidebar-kicker">RENTAL CIRCLE</span><strong>مركز الإدارة</strong><small>إدارة المنصة والعمليات</small></div>
      <nav className="admin-sidebar-nav">{adminLinks.map(({ to, label, icon: Icon }) => { const active = location.pathname === to || (to !== '/admin/dashboard' && location.pathname.startsWith(`${to}/`)); return <Link key={to} to={to} className={`admin-sidebar-link ${active ? 'is-active' : ''}`}><Icon size={18} /><span>{label}</span></Link>; })}</nav>
    </aside>
    <style>{`
      .admin-sidebar{width:248px;flex:0 0 248px;min-height:100vh;padding:24px 14px;background:#fff;border-left:1px solid #e7edf0;direction:rtl;position:relative;z-index:120}.admin-sidebar-brand{display:grid;gap:5px;padding:0 12px 22px;margin-bottom:14px;border-bottom:1px solid #edf1f3;color:#173a52}.admin-sidebar-brand strong{font-size:19px;font-weight:950}.admin-sidebar-brand small{color:#7b8b94;font-size:11px}.admin-sidebar-kicker{color:#b78a22;font-size:9px;font-weight:950;letter-spacing:1.3px}.admin-sidebar-nav{display:grid;gap:5px}.admin-sidebar-link{display:flex;align-items:center;gap:10px;min-height:44px;padding:0 13px;border:1px solid transparent;border-radius:12px;color:#50636d;text-decoration:none;font-size:13px;font-weight:800;transition:.18s}.admin-sidebar-link:hover{color:#173a52;background:#f2f7f8;transform:translateX(-2px)}.admin-sidebar-link.is-active{color:#173a52;background:linear-gradient(135deg,#edf7f5,#f8fbfb);border-color:#cfe7e0;box-shadow:0 7px 16px rgba(23,58,82,.07)}.admin-sidebar-link.is-active svg{color:#b78a22}.admin-mobile-header{display:none}.admin-mobile-menu-button,.admin-mobile-close,.admin-sidebar-overlay{display:none}
      @media(max-width:900px){.admin-mobile-header{display:flex;position:fixed;top:72px;right:0;left:0;z-index:850;align-items:center;justify-content:space-between;gap:12px;padding:10px 14px;background:#fff;border-bottom:1px solid #e7edf0;box-shadow:0 3px 12px rgba(23,58,82,.06);direction:rtl}.admin-mobile-title{display:flex;align-items:center;gap:9px;min-width:0;color:#173a52}.admin-mobile-title>span:last-child{display:grid;gap:1px;min-width:0}.admin-mobile-title strong{font-size:14px;line-height:1.3}.admin-mobile-title small{color:#7b8b94;font-size:9px}.admin-mobile-mark{display:grid;place-items:center;width:34px;height:34px;border-radius:10px;background:#173a52;color:#fff;font-size:10px;font-weight:900;letter-spacing:1px}.admin-mobile-header .admin-mobile-menu-button{display:flex;align-items:center;gap:6px;border:1px solid #cfe7e0;border-radius:10px;padding:8px 10px;background:#173a52;color:#fff;font:inherit;font-size:11px;font-weight:800;cursor:pointer}.admin-sidebar{position:fixed;top:0;right:0;bottom:0;width:min(320px,88vw);min-height:100vh;overflow-y:auto;transform:translateX(105%);transition:transform .22s ease;box-shadow:-12px 0 35px rgba(15,23,42,.18);z-index:901}.admin-sidebar.is-mobile-open{transform:translateX(0)}.admin-sidebar-overlay{display:block;position:fixed;inset:0;z-index:900;border:0;background:rgba(15,23,42,.42);cursor:pointer}.admin-mobile-close{display:grid;place-items:center;position:absolute;top:16px;left:14px;width:35px;height:35px;border:1px solid #dbe7e9;border-radius:10px;background:#fff;color:#173a52;cursor:pointer}.admin-sidebar-brand{padding-left:48px}.admin-sidebar-link{min-height:48px;font-size:14px}body.admin-menu-open{overflow:hidden}}
      @media(max-width:540px){.admin-mobile-header{padding-inline:12px}.admin-sidebar{width:min(320px,92vw)}}
    `}</style>
  </>;
}
