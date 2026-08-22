import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { LogOut, User, Menu, Car, X, LayoutDashboard, Search, Heart, Settings, Bell, CheckCircle } from 'lucide-react';
import { io } from 'socket.io-client';
import { notificationsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import logo from '../assets/LOGO.png';

const navItems = [
  { to: '/', label: 'الرئيسية' },
  { to: '/home', label: 'المنصة' },
  { to: '/cars', label: 'استئجار سيارة' },
  { to: '/about', label: 'عن المنصة' },
];

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 18);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsMobileMenuOpen(false);
      setShowNotifications(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [location.pathname, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated() || !user) return undefined;

    notificationsAPI.getAll().then((response) => {
      setNotifications(response.data.data || []);
      setUnreadCount(response.data.unread || 0);
    }).catch((error) => console.error(error));
    const socket = io('http://localhost:5000');
    socket.emit('join_room', user.id);
    socket.on('new_notification', (data) => {
      setNotifications((prev) => [data, ...prev]);
      setUnreadCount((prev) => prev + 1);
      toast.success(data.title, { icon: '🔔' });
    });
    return () => socket.disconnect();
  }, [user, isAuthenticated]);

  const handleMarkRead = async (id, isRead) => {
    if (isRead) return;
    try {
      await notificationsAPI.markRead(id);
      setNotifications((prev) => prev.map((item) => item.id === id ? { ...item, is_read: true } : item));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error(error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error(error);
    }
  };

  const handleOpenNotification = async (notification) => {
    await handleMarkRead(notification.id, notification.is_read);
    setShowNotifications(false);
    navigate(`/notifications/${notification.id}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'supplier') return '/supplier/dashboard';
    return '/my-reservations';
  };

  const getDashboardText = () => {
    if (!user) return '';
    if (user.role === 'admin') return 'لوحة التحكم';
    if (user.role === 'supplier') return 'لوحة المورد';
    return 'حجوزاتي';
  };

  const isActive = (path) => path === '/' ? location.pathname === '/' : location.pathname === path || location.pathname.startsWith(`${path}/`);
  const isHome = location.pathname === '/';
  const shellSolid = isScrolled || !isHome || isMobileMenuOpen;

  return (
    <>
      <nav className={`rc-navbar ${shellSolid ? 'rc-navbar-solid' : ''}`} dir="rtl">
        <div className="rc-navbar-glow" />
        <div className="rc-navbar-inner">
          <Link to="/" className="rc-brand" aria-label="العودة للرئيسية">
            <span className="rc-brand-orbit" />
            <span className="rc-brand-mark"><img src={logo} alt="RC" /></span>
            <span className="rc-brand-copy"><strong>RC</strong><small>RENTAL CIRCLE</small></span>
          </Link>

          <div className="rc-desktop-links">
            {navItems.map((item) => <Link key={item.to} to={item.to} className={`rc-nav-link ${isActive(item.to) ? 'rc-nav-link-active' : ''}`}>{item.label}<span /></Link>)}
          </div>

          <div className="rc-actions">
            {isAuthenticated() ? (
              <>
                <Link to={getDashboardLink()} className="rc-dashboard-link"><LayoutDashboard size={16} /><span>{getDashboardText()}</span></Link>
                <div className="rc-notification-wrap">
                  <button type="button" onClick={() => setShowNotifications((value) => !value)} className={`rc-icon-button ${showNotifications ? 'rc-icon-button-active' : ''}`} title="الإشعارات" aria-label="الإشعارات">
                    <Bell size={18} />
                    {unreadCount > 0 && <b className="rc-notification-count">{unreadCount > 99 ? '99+' : unreadCount}</b>}
                  </button>
                  {showNotifications && <NotificationPanel notifications={notifications} unreadCount={unreadCount} onOpenNotification={handleOpenNotification} onMarkAllRead={handleMarkAllRead} />}
                </div>
                <Link to="/profile" className="rc-user-pill"><span className="rc-avatar">{user?.name?.charAt(0) || 'U'}</span><span className="rc-user-name">{user?.name?.split(' ')[0]}</span></Link>
                <Link to={user?.role === 'supplier' ? '/supplier/settings' : '/settings'} className="rc-icon-button rc-desktop-only" title="الإعدادات" aria-label="الإعدادات"><Settings size={17} /></Link>
                <button type="button" onClick={handleLogout} className="rc-icon-button rc-logout-button rc-desktop-only" title="تسجيل الخروج" aria-label="تسجيل الخروج"><LogOut size={17} /></button>
              </>
            ) : (
              <div className="rc-auth-actions"><Link to="/login" className="rc-login-link">دخول</Link><Link to="/register" className="rc-register-link">حساب جديد <span>↗</span></Link></div>
            )}
            <button type="button" className="rc-menu-button" onClick={() => setIsMobileMenuOpen((value) => !value)} aria-label="فتح القائمة">{isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}</button>
          </div>
        </div>
      </nav>

      {isMobileMenuOpen && <MobileMenu authenticated={isAuthenticated()} getDashboardLink={getDashboardLink} getDashboardText={getDashboardText} handleLogout={handleLogout} setOpen={setIsMobileMenuOpen} isActive={isActive} />}

      <style>{`
        .rc-navbar { position: fixed; inset: 0 0 auto; height: 78px; z-index: 1000; color: #f7fbff; background: linear-gradient(180deg, rgba(7,18,33,.84), rgba(7,18,33,.35)); border-bottom: 1px solid rgba(255,255,255,.12); backdrop-filter: blur(16px); transition: background .28s ease, box-shadow .28s ease, border-color .28s ease; }
        .rc-navbar-solid { background: rgba(7,18,33,.94); border-bottom-color: rgba(81,245,202,.18); box-shadow: 0 12px 38px rgba(2,9,19,.26); }
        .rc-navbar-glow { position: absolute; inset: auto 12% -1px; height: 1px; background: linear-gradient(90deg, transparent, #4df5c7, #ac7cff, transparent); opacity: .72; filter: blur(.3px); }
        .rc-navbar-inner { width: min(1240px, calc(100% - 40px)); height: 100%; margin: auto; display: flex; align-items: center; justify-content: space-between; gap: 22px; position: relative; z-index: 1; }
        .rc-brand { display: inline-flex; align-items: center; gap: 10px; color: #fff; text-decoration: none; min-width: 174px; }
        .rc-brand-mark { width: 42px; height: 42px; position: relative; display: grid; place-items: center; border-radius: 14px; background: linear-gradient(145deg, rgba(255,255,255,.95), rgba(209,235,255,.78)); box-shadow: 0 0 0 1px rgba(77,245,199,.48), 0 0 22px rgba(77,245,199,.16); overflow: hidden; }
        .rc-brand-mark img { width: 34px; height: 34px; object-fit: contain; position: relative; z-index: 1; }
        .rc-brand-orbit { width: 50px; height: 50px; position: absolute; margin: 0 0 0 0; border: 1px solid rgba(172,124,255,.5); border-left-color: transparent; border-radius: 50%; transform: rotate(-28deg); animation: rcOrbit 6s linear infinite; pointer-events: none; }
        .rc-brand-copy { display: grid; line-height: 1; gap: 4px; }
        .rc-brand-copy strong { font-size: 17px; letter-spacing: 3px; font-weight: 950; color: #fff; }
        .rc-brand-copy small { color: rgba(220,235,245,.56); font-size: 7px; letter-spacing: 1.5px; font-weight: 800; }
        .rc-desktop-links { display: flex; align-items: center; justify-content: center; gap: 5px; flex: 1; }
        .rc-nav-link { position: relative; display: inline-flex; align-items: center; height: 44px; padding: 0 14px; border-radius: 12px; color: rgba(235,244,250,.72); text-decoration: none; font-size: 13px; font-weight: 800; white-space: nowrap; transition: color .2s ease, background .2s ease, transform .2s ease; }
        .rc-nav-link span { position: absolute; right: 14px; left: 14px; bottom: 5px; height: 2px; border-radius: 99px; background: linear-gradient(90deg, #4df5c7, #ac7cff); transform: scaleX(0); transform-origin: right; transition: transform .22s ease; box-shadow: 0 0 13px rgba(77,245,199,.75); }
        .rc-nav-link:hover, .rc-nav-link-active { color: #fff; background: rgba(77,245,199,.09); transform: translateY(-1px); }
        .rc-nav-link:hover span, .rc-nav-link-active span { transform: scaleX(1); }
        .rc-actions, .rc-auth-actions { display: flex; align-items: center; gap: 8px; }
        .rc-login-link, .rc-register-link, .rc-dashboard-link, .rc-icon-button, .rc-user-pill { transition: transform .2s ease, background .2s ease, border-color .2s ease, box-shadow .2s ease, color .2s ease; }
        .rc-login-link { color: rgba(235,244,250,.82); padding: 10px 12px; text-decoration: none; font-size: 13px; font-weight: 800; }
        .rc-login-link:hover { color: #4df5c7; transform: translateY(-1px); }
        .rc-register-link { display: inline-flex; align-items: center; gap: 8px; color: #06131f; background: linear-gradient(135deg, #4df5c7, #c8ffed); padding: 10px 14px; border-radius: 12px; text-decoration: none; font-size: 12px; font-weight: 950; box-shadow: 0 0 0 1px rgba(77,245,199,.35), 0 8px 20px rgba(77,245,199,.17); }
        .rc-register-link:hover { transform: translateY(-2px); box-shadow: 0 0 0 1px #4df5c7, 0 0 22px rgba(77,245,199,.44); }
        .rc-register-link span { font-size: 16px; line-height: 0; }
        .rc-dashboard-link { display: inline-flex; align-items: center; gap: 7px; border: 1px solid rgba(172,124,255,.42); border-radius: 11px; padding: 9px 12px; color: #e9dbff; background: rgba(172,124,255,.1); text-decoration: none; font-size: 12px; font-weight: 900; }
        .rc-dashboard-link:hover { transform: translateY(-2px); color: #fff; background: rgba(172,124,255,.2); box-shadow: 0 0 18px rgba(172,124,255,.22); }
        .rc-icon-button { width: 38px; height: 38px; position: relative; display: grid; place-items: center; border: 1px solid rgba(255,255,255,.14); border-radius: 11px; color: rgba(245,250,255,.86); background: rgba(255,255,255,.07); cursor: pointer; }
        .rc-icon-button:hover, .rc-icon-button-active { color: #4df5c7; border-color: rgba(77,245,199,.55); background: rgba(77,245,199,.1); box-shadow: 0 0 18px rgba(77,245,199,.16); transform: translateY(-2px); }
        .rc-logout-button:hover { color: #ff95b6; border-color: rgba(255,149,182,.55); background: rgba(255,149,182,.1); box-shadow: 0 0 18px rgba(255,149,182,.16); }
        .rc-notification-wrap { position: relative; }
        .rc-notification-count { position: absolute; top: -7px; right: -7px; min-width: 18px; height: 18px; display: grid; place-items: center; padding: 0 4px; border: 2px solid #071221; border-radius: 99px; color: #071221; background: #ff76a8; font-size: 9px; font-weight: 950; box-shadow: 0 0 13px rgba(255,118,168,.68); }
        .rc-user-pill { display: inline-flex; align-items: center; gap: 8px; padding: 4px 10px 4px 6px; border: 1px solid rgba(255,255,255,.13); border-radius: 999px; color: #fff; background: rgba(255,255,255,.07); text-decoration: none; }
        .rc-user-pill:hover { border-color: rgba(77,245,199,.45); background: rgba(77,245,199,.08); transform: translateY(-1px); }
        .rc-avatar { width: 28px; height: 28px; display: grid; place-items: center; border-radius: 50%; color: #071221; background: linear-gradient(135deg, #4df5c7, #ac7cff); font-size: 12px; font-weight: 950; }
        .rc-user-name { max-width: 82px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; font-weight: 850; }
        .rc-menu-button { display: none; width: 40px; height: 40px; place-items: center; border: 1px solid rgba(77,245,199,.36); border-radius: 11px; color: #4df5c7; background: rgba(77,245,199,.09); cursor: pointer; }
        .rc-notification-panel { position: absolute; top: 48px; left: 0; width: min(360px, calc(100vw - 32px)); overflow: hidden; border: 1px solid #dfe8ee; border-radius: 16px; background: #fff; box-shadow: 0 20px 50px rgba(3,14,26,.27); color: #173a52; }
        .rc-notification-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 14px 16px; background: #f5f8fa; border-bottom: 1px solid #e8edf0; }
        .rc-notification-head h3 { margin: 0; font-size: 14px; }
        .rc-notification-head button { border: 0; color: #507080; background: transparent; cursor: pointer; font-size: 11px; font-weight: 850; }
        .rc-notification-list { max-height: 360px; overflow-y: auto; }
        .rc-notification-item { display: flex; gap: 10px; padding: 14px 16px; border-bottom: 1px solid #eef1f3; background: #fff; cursor: pointer; transition: background .2s ease; }
        .rc-notification-item:hover, .rc-notification-item-unread { background: #f3fbfa; }
        .rc-notification-item h4 { display: flex; justify-content: space-between; gap: 8px; margin: 0 0 4px; color: #173a52; font-size: 13px; }
        .rc-notification-item p { margin: 0; color: #6c7a86; font-size: 12px; line-height: 1.55; }
        .rc-notification-item small { display: block; margin-top: 7px; color: #9aa6ae; font-size: 10px; }
        .rc-unread-dot { width: 7px; height: 7px; flex: 0 0 auto; margin-top: 5px; border-radius: 50%; background: #ff76a8; box-shadow: 0 0 10px rgba(255,118,168,.7); }
        .rc-empty-notifications { padding: 30px 18px; color: #96a2aa; text-align: center; font-size: 13px; }
        .rc-mobile-menu { position: fixed; inset: 78px 0 0; z-index: 999; padding: 24px 22px; overflow-y: auto; background: radial-gradient(circle at 90% 10%, rgba(172,124,255,.18), transparent 28%), radial-gradient(circle at 10% 20%, rgba(77,245,199,.12), transparent 25%), #071221; animation: rcMenuIn .2s ease-out; }
        .rc-mobile-menu-header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,.1); }
        .rc-mobile-menu-kicker { color: #4df5c7; font-size: 11px; font-weight: 950; letter-spacing: 2px; }
        .rc-mobile-menu-nav { display: grid; gap: 8px; margin-top: 24px; }
        .rc-mobile-link { display: flex; align-items: center; justify-content: space-between; padding: 15px 14px; border: 1px solid rgba(255,255,255,.09); border-radius: 13px; color: rgba(255,255,255,.78); text-decoration: none; font-size: 16px; font-weight: 850; transition: all .2s ease; }
        .rc-mobile-link:hover, .rc-mobile-link-active { color: #fff; border-color: rgba(77,245,199,.45); background: rgba(77,245,199,.09); transform: translateX(-3px); }
        .rc-mobile-user-actions { display: grid; gap: 10px; margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,.1); }
        .rc-mobile-user-actions a, .rc-mobile-user-actions button { display: flex; align-items: center; gap: 9px; padding: 12px 14px; border: 0; border-radius: 12px; color: #dbe8f0; background: rgba(255,255,255,.06); text-align: right; text-decoration: none; font: inherit; font-size: 14px; font-weight: 800; cursor: pointer; }
        .rc-mobile-user-actions a:hover, .rc-mobile-user-actions button:hover { color: #4df5c7; background: rgba(77,245,199,.1); }
        @keyframes rcOrbit { to { transform: rotate(332deg); } }
        @keyframes rcMenuIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 1080px) { .rc-navbar-inner { width: min(100% - 28px, 1240px); } .rc-desktop-links { gap: 0; } .rc-nav-link { padding: 0 10px; font-size: 12px; } .rc-dashboard-link span, .rc-user-name { display: none; } .rc-dashboard-link { width: 38px; height: 38px; justify-content: center; padding: 0; } }
        @media (max-width: 820px) { .rc-navbar { height: 70px; } .rc-navbar-inner { width: calc(100% - 28px); } .rc-desktop-links, .rc-auth-actions, .rc-dashboard-link, .rc-user-pill, .rc-desktop-only { display: none; } .rc-menu-button { display: grid; } .rc-brand { min-width: auto; } .rc-brand-copy small { display: none; } .rc-brand-copy strong { font-size: 15px; } .rc-mobile-menu { inset: 70px 0 0; } }
        @media (max-width: 480px) { .rc-navbar-inner { width: calc(100% - 20px); } .rc-brand-mark { width: 38px; height: 38px; border-radius: 12px; } .rc-brand-mark img { width: 31px; height: 31px; } .rc-brand-copy strong { font-size: 14px; } .rc-notification-panel { left: -52px; } }
        @media (prefers-reduced-motion: reduce) { .rc-navbar *, .rc-navbar, .rc-mobile-menu { animation: none !important; transition: none !important; } }
      `}</style>
    </>
  );
}

function NotificationPanel({ notifications, unreadCount, onOpenNotification, onMarkAllRead }) {
  return <div className="rc-notification-panel" onClick={(event) => event.stopPropagation()}>
    <div className="rc-notification-head"><h3>الإشعارات {unreadCount > 0 ? `(${unreadCount})` : ''}</h3>{unreadCount > 0 && <button type="button" onClick={onMarkAllRead}>تحديد الكل كمقروء</button>}</div>
    <div className="rc-notification-list">
      {notifications.length === 0 ? <div className="rc-empty-notifications">لا توجد إشعارات جديدة</div> : notifications.map((notification) => <div key={notification.id} className={`rc-notification-item ${!notification.is_read ? 'rc-notification-item-unread' : ''}`} onClick={() => onOpenNotification(notification)}><div className="rc-notification-item-copy"><h4>{notification.title}{!notification.is_read && <span className="rc-unread-dot" />}</h4><p>{notification.message}</p><small>{format(new Date(notification.created_at), 'yyyy-MM-dd HH:mm')}</small></div></div>)}
    </div>
  </div>;
}

function MobileMenu({ authenticated, getDashboardLink, getDashboardText, handleLogout, setOpen, isActive }) {
  return <div className="rc-mobile-menu" dir="rtl"><div className="rc-mobile-menu-header"><div><div className="rc-mobile-menu-kicker">RENTAL CIRCLE</div><div style={{ color: '#fff', marginTop: 6, fontSize: 22, fontWeight: 950 }}>مساحتك تبدأ من هنا</div></div><CheckCircle size={25} color="#4df5c7" /></div><div className="rc-mobile-menu-nav">{navItems.map((item) => <Link key={item.to} to={item.to} onClick={() => setOpen(false)} className={`rc-mobile-link ${isActive(item.to) ? 'rc-mobile-link-active' : ''}`}>{item.label}<span>↗</span></Link>)}</div><div className="rc-mobile-user-actions">{authenticated ? <><Link to={getDashboardLink()} onClick={() => setOpen(false)}><LayoutDashboard size={17} />{getDashboardText()}</Link><Link to="/profile" onClick={() => setOpen(false)}>الملف الشخصي</Link><button type="button" onClick={() => { handleLogout(); setOpen(false); }}><LogOut size={17} />تسجيل الخروج</button></> : <><Link to="/login" onClick={() => setOpen(false)}>دخول</Link><Link to="/register" onClick={() => setOpen(false)} style={{ color: '#071221', justifyContent: 'center', background: 'linear-gradient(135deg,#4df5c7,#c8ffed)' }}>إنشاء حساب جديد</Link></>}</div></div>;
}
