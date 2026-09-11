import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, Megaphone, Calendar, Car, LayoutDashboard, Plus, Settings, Users, Wallet, Store } from 'lucide-react';
import { supplierContextAPI, getSelectedShowroom, setSelectedShowroom } from '../services/supplierContext';
import toast from 'react-hot-toast';

const supplierLinks = [
  { to: '/supplier/dashboard', label: 'لوحة المورد', icon: LayoutDashboard },
  { to: '/supplier/showrooms', label: 'فروعي', icon: Store },
  { to: '/supplier/cars', label: 'سياراتي', icon: Car },
  { to: '/supplier/cars/add', label: 'إضافة سيارة', icon: Plus },
  { to: '/supplier/reservations', label: 'الحجوزات', icon: Calendar },
  { to: '/supplier/finance', label: 'المحفظة والإيرادات', icon: Wallet },
  { to: '/supplier/employees', label: 'الموظفون', icon: Users },
  { to: '/supplier/advertisement-request', label: 'الإعلانات', icon: Megaphone },
  { to: '/supplier/settings', label: 'الإعدادات', icon: Settings },
];

export default function SupplierSidebar() {
  const location = useLocation();
  const [showrooms, setShowrooms] = useState([]);
  const [selected, setSelected] = useState(getSelectedShowroom());
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showroomMenuOpen, setShowroomMenuOpen] = useState(false);

  useEffect(() => {
    supplierContextAPI.getOptions().then((list) => {
      setShowrooms(list);
      const current = getSelectedShowroom();
      if (current && list.some((item) => item.id === current.id)) {
        setSelected(current);
      } else if (list.length > 0) {
        // أول فرع هو الفرع الذي أُنشئ مع الحساب، ويُستخدم كافتراضي.
        setSelectedShowroom(list[0]);
        setSelected(list[0]);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const currentLabel = selected?.showroom_name || (selected?.city ? `فرع ${selected.city}` : 'جاري تحميل الفرع');

  const chooseShowroom = async (item) => {
    try {
      const response = await supplierContextAPI.select(item.id);
      setSelectedShowroom(response.showroom);
      setSelected(response.showroom);
      setShowroomMenuOpen(false);
      toast.success(`الفرع الحالي: ${response.showroom.showroom_name || response.showroom.city}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذر اختيار الفرع');
    }
  };

  return (
    <>
      <button
        type="button"
        className="supplier-mobile-menu-button"
        aria-label="فتح قائمة المورد"
        onClick={() => setMobileOpen(true)}
      >
        <Menu size={22} />
        <span>القائمة</span>
      </button>

      {mobileOpen && <button type="button" className="supplier-sidebar-overlay" aria-label="إغلاق القائمة" onClick={() => setMobileOpen(false)} />}

      <aside className={`supplier-sidebar ${mobileOpen ? 'is-mobile-open' : ''}`} aria-label="قائمة المورد">
        <div className="supplier-sidebar-brand">
          <span className="supplier-sidebar-kicker">RENTAL CIRCLE</span>
          <strong>مساحة المورد</strong>
          <small>إدارة الأسطول والحجوزات والإيرادات</small>
        </div>

        <div className="supplier-current-showroom" aria-label="اختيار الفرع الحالي">
          <small>الفرع الحالي</small>
          <button type="button" className="supplier-showroom-trigger" onClick={() => setShowroomMenuOpen(value => !value)}>
            <span><Store size={16} />{currentLabel}</span><ChevronDown size={15} />
          </button>
          {showroomMenuOpen && <div className="supplier-showroom-menu">
            {showrooms.map((item, index) => <button type="button" key={item.id} className={selected?.id === item.id ? 'selected' : ''} onClick={() => chooseShowroom(item)}>
              <span>{index === 0 ? 'الفرع الرئيسي — ' : ''}{item.showroom_name || `فرع ${item.city}`}</span>
              <small>{item.city} · {item.car_count || 0} سيارة</small>
            </button>)}
          </div>}
          <em>يمكن تغيير الفرع أيضًا عند إضافة السيارة</em>
        </div>

        <button type="button" className="supplier-mobile-close" aria-label="إغلاق القائمة" onClick={() => setMobileOpen(false)}>
          <X size={20} />
        </button>

        <nav className="supplier-sidebar-nav">
          {supplierLinks.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to || (to !== '/supplier/dashboard' && location.pathname.startsWith(`${to}/`));
            return (
              <Link key={to} to={to} className={`supplier-sidebar-link ${active ? 'is-active' : ''}`}>
                <Icon size={18} /><span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <style>{`
        .supplier-sidebar{width:248px;flex:0 0 248px;min-height:100vh;padding:24px 14px;background:#fff;border-left:1px solid #e7edf0;direction:rtl;position:relative;z-index:120}
        .supplier-sidebar-brand{display:grid;gap:5px;padding:0 12px 18px;margin-bottom:14px;border-bottom:1px solid #edf1f3;color:#173a52}
        .supplier-sidebar-brand strong{font-size:19px;font-weight:950}.supplier-sidebar-brand small{color:#7b8b94;font-size:11px}.supplier-sidebar-kicker{color:#b78a22;font-size:9px;font-weight:950;letter-spacing:1.3px}
        .supplier-current-showroom{position:relative;display:grid;gap:6px;margin:0 0 14px;padding:11px;background:#f7fafb;border:1px solid #e3ebed;border-radius:14px;color:#173a52}.supplier-current-showroom>small{color:#7a8a92;font-size:10px}.supplier-showroom-trigger{width:100%;display:flex;justify-content:space-between;align-items:center;border:0;background:transparent;padding:2px;color:#173a52;font-weight:900;cursor:pointer}.supplier-showroom-trigger span{display:flex;align-items:center;gap:7px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.supplier-current-showroom em{font-style:normal;color:#178263;font-size:10px;line-height:1.5}.supplier-showroom-menu{position:absolute;z-index:140;top:calc(100% + 5px);right:0;left:0;background:#fff;border:1px solid #dfe8ea;border-radius:13px;box-shadow:0 15px 35px rgba(23,58,82,.15);padding:6px}.supplier-showroom-menu button{width:100%;display:block;text-align:right;border:0;background:#fff;padding:9px;border-radius:9px;color:#173a52;cursor:pointer}.supplier-showroom-menu button:hover,.supplier-showroom-menu button.selected{background:#edf7f5}.supplier-showroom-menu button small{display:block;color:#7b8b94;margin-top:3px}
        .supplier-sidebar-nav{display:grid;gap:5px}.supplier-sidebar-link{display:flex;align-items:center;gap:10px;min-height:44px;padding:0 13px;border:1px solid transparent;border-radius:12px;color:#50636d;text-decoration:none;font-size:13px;font-weight:800;transition:.18s}.supplier-sidebar-link:hover{color:#173a52;background:#f2f7f8;transform:translateX(-2px)}.supplier-sidebar-link.is-active{color:#173a52;background:linear-gradient(135deg,#edf7f5,#f8fbfb);border-color:#cfe7e0;box-shadow:0 7px 16px rgba(23,58,82,.07)}.supplier-sidebar-link.is-active svg{color:#178263}
        .supplier-mobile-menu-button,.supplier-mobile-close,.supplier-sidebar-overlay{display:none}
        @media(max-width:900px){
          .supplier-mobile-menu-button{display:flex;position:fixed;top:12px;right:12px;z-index:110;align-items:center;gap:7px;border:1px solid #cfe7e0;border-radius:12px;padding:9px 12px;background:#173a52;color:#fff;font-weight:800;box-shadow:0 5px 16px rgba(23,58,82,.2);cursor:pointer}
          .supplier-sidebar{position:fixed;top:0;right:0;bottom:0;width:min(290px,88vw);min-height:100vh;overflow-y:auto;transform:translateX(105%);transition:transform .22s ease;box-shadow:-12px 0 35px rgba(15,23,42,.18)}
          .supplier-sidebar.is-mobile-open{transform:translateX(0)}.supplier-sidebar-overlay{display:block;position:fixed;inset:0;z-index:115;border:0;background:rgba(15,23,42,.42);cursor:pointer}.supplier-mobile-close{display:grid;place-items:center;position:absolute;top:16px;left:14px;width:35px;height:35px;border:1px solid #dbe7e9;border-radius:10px;background:#fff;color:#173a52;cursor:pointer}.supplier-sidebar-brand{padding-left:48px}.supplier-sidebar-link{min-height:48px;font-size:14px}
        }
      `}</style>
    </>
  );
}
