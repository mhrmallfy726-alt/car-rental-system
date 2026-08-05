import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { LogOut, User, Menu, Car, X, LayoutDashboard, Search, Heart, Settings, Bell, CheckCircle } from 'lucide-react';
import { io } from 'socket.io-client';
import { notificationsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import logo from '../assets/LOGO.PNG';

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
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setShowNotifications(false);
  }, [location]);

  useEffect(() => {
    if (isAuthenticated() && user) {
      fetchNotifications();

      const socket = io('http://localhost:5000');
      socket.emit('join_room', user.id);

      socket.on('new_notification', (data) => {
        setNotifications(prev => [data, ...prev]);
        setUnreadCount(prev => prev + 1);
        toast.success(data.title, { icon: '🔔' });
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await notificationsAPI.getAll();
      setNotifications(res.data.data);
      setUnreadCount(res.data.unread);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkRead = async (id, isRead) => {
    if (isRead) return;
    try {
      await notificationsAPI.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
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

  const isHome = location.pathname === '/';

  return (
    <nav className={`navbar ${isScrolled || !isHome ? 'scrolled' : ''}`}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        height: '72px', transition: 'all 0.3s ease',
        background: isScrolled || !isHome ? 'var(--primary)' : 'transparent',
        boxShadow: isScrolled ? 'var(--shadow-md)' : 'none',
        display: 'flex', alignItems: 'center'
      }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', textDecoration: 'none' }}>
        <img src={logo} alt="RC Logo" style={{ width:'50px', height:'50px',   objectFit:'contain'}}/>
          <span style={{ fontSize: '1.5rem', fontWeight: 2000, letterSpacing: '1px' }}>RC</span>
        </Link>

        {/* Desktop Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }} className="hide-tablet">
          <Link to="/" className={`navbar-link ${location.pathname === '/' ? 'active' : ''}`} style={{ color: 'white', fontWeight: 600, textDecoration: 'none' }}>الرئيسية</Link>
          <Link to="/landing" className={`navbar-link ${location.pathname === '/landing' ? 'active' : ''}`} style={{ color: 'white', fontWeight: 600, textDecoration: 'none' }}>المنصة</Link>
          <Link to="/cars" className={`navbar-link ${location.pathname === '/cars' ? 'active' : ''}`} style={{ color: 'white', fontWeight: 600, textDecoration: 'none' }}>استئجار سيارة</Link>
          <Link to="/about" className="navbar-link" style={{ color: 'white', fontWeight: 600, textDecoration: 'none' }}>عن المنصة</Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isAuthenticated() ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Link to={getDashboardLink()} className="btn btn-secondary btn-sm hide-mobile" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <LayoutDashboard size={16} /> {getDashboardText()}
              </Link>

              {/* Notification Bell */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="btn btn-icon"
                  style={{ position: 'relative', color: 'white', background: 'rgba(255,255,255,0.1)' }}
                  title="الإشعارات"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span style={{
                      position: 'absolute', top: '-5px', right: '-5px',
                      background: 'var(--danger)', color: 'white', fontSize: '0.7rem',
                      fontWeight: 'bold', width: '18px', height: '18px',
                      borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="fade-in" style={{
                    position: 'absolute', top: '120%', left: 0, width: '350px',
                    background: 'white', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                    overflow: 'hidden', zIndex: 1001, direction: 'rtl'
                  }}>
                    <div style={{ padding: '16px', background: '#f8f9fa', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0, fontSize: '1rem', color: '#333' }}>الإشعارات</h3>
                      {unreadCount > 0 && (
                        <button onClick={handleMarkAllRead} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>
                          تحديد الكل كمقروء
                        </button>
                      )}
                    </div>
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {notifications.length === 0 ? (
                        <div style={{ padding: '30px', textAlign: 'center', color: '#999' }}>لا توجد إشعارات</div>
                      ) : (
                        notifications.map(notif => (
                          <div
                            key={notif.id}
                            onClick={() => handleMarkRead(notif.id, notif.is_read)}
                            style={{
                              padding: '16px', borderBottom: '1px solid #eee', cursor: 'pointer',
                              background: notif.is_read ? 'white' : '#f0f7ff',
                              transition: 'background 0.2s', display: 'flex', gap: '12px'
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', color: '#333', display: 'flex', justifyContent: 'space-between' }}>
                                {notif.title}
                                {!notif.is_read && <span style={{ width: '8px', height: '8px', background: 'var(--primary)', borderRadius: '50%', marginTop: '4px' }}></span>}
                              </h4>
                              <p style={{ margin: 0, fontSize: '0.85rem', color: '#666', lineHeight: '1.4' }}>{notif.message}</p>
                              <span style={{ fontSize: '0.75rem', color: '#999', marginTop: '8px', display: 'block' }}>
                                {format(new Date(notif.created_at), 'yyyy-MM-dd HH:mm')}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 12px', color: 'white', background: 'rgba(255,255,255,0.15)', borderRadius: '999px', lineHeight: '40px', textDecoration: 'none' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 800, fontSize: '0.8rem' }}>
                  {user?.name?.charAt(0)}
                </div>
                <span className="hide-mobile" style={{ fontSize: '0.9rem', fontWeight: 600 }}>{user?.name?.split(' ')[0]}</span>
              </Link>
              <Link to={user?.role === 'supplier' ? "/supplier/settings" : "/settings"} className="btn btn-icon" style={{ color: 'white', background: 'rgba(255,255,255,0.1)', marginLeft: '8px' }} title="الإعدادات">
                <Settings size={18} />
              </Link>
              <button onClick={handleLogout} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', width: '36px', height: '36px', color: 'white', cursor: 'pointer' }} title="تسجيل الخروج">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* إزالة زر البحث الخادع */}
              <Link to="/login" className="btn btn-secondary btn-sm">دخول</Link>
              <Link to="/register" className="btn btn-warning btn-sm hide-mobile">حساب جديد</Link>
            </div>
          )}

          {/* زر القائمة المتنقلة */}
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} style={{ display: 'none', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }} className="show-tablet">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* قائمة الموبايل المحسنة */}
      {isMobileMenuOpen && (
        <div className="fade-in" style={{
          position: 'fixed', top: '72px', left: 0, right: 0, bottom: 0,
          background: 'var(--primary)', zIndex: 999, padding: '2rem',
          display: 'flex', flexDirection: 'column', gap: '1.5rem'
        }}>
          <Link to="/" onClick={() => setIsMobileMenuOpen(false)} style={{ color: 'white', fontSize: '1.2rem', fontWeight: 'bold', textDecoration: 'none' }}>الرئيسية</Link>
          <Link to="/landing" onClick={() => setIsMobileMenuOpen(false)} style={{ color: 'white', fontSize: '1.2rem', fontWeight: 'bold', textDecoration: 'none' }}>المنصة</Link>
          <Link to="/cars" onClick={() => setIsMobileMenuOpen(false)} style={{ color: 'white', fontSize: '1.2rem', fontWeight: 'bold', textDecoration: 'none' }}>السيارات</Link>

          {isAuthenticated() ? (
            <>
              <Link to={getDashboardLink()} onClick={() => setIsMobileMenuOpen(false)} style={{ color: 'white', fontSize: '1.2rem', fontWeight: 'bold', textDecoration: 'none' }}>
                {getDashboardText()}
              </Link>
              <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} style={{ color: 'white', fontSize: '1.2rem', fontWeight: 'bold', textDecoration: 'none' }}>الملف الشخصي</Link>
              <button onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', fontWeight: 'bold', textAlign: 'right', cursor: 'pointer', padding: 0 }}>
                تسجيل الخروج
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} style={{ color: 'white', fontSize: '1.2rem', fontWeight: 'bold', textDecoration: 'none' }}>دخول</Link>
              <Link to="/register" onClick={() => setIsMobileMenuOpen(false)} className="btn btn-warning" style={{ textAlign: 'center', marginTop: '1rem' }}>إنشاء حساب مجاني</Link>
            </>
          )}
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        .hide-tablet { display: flex; }
        .show-tablet { display: none; }
        @media (max-width: 992px) {
          .hide-tablet { display: none; }
          .show-tablet { display: inline-flex; }
        }
        @media (max-width: 640px) {
          .hide-mobile { display: none; }
        }
        .navbar.scrolled {
          background: var(--primary) !important;
        }
        .navbar-link.active {
          border-bottom: 2px solid white;
        }
        .btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s;
        }
        .btn-secondary {
          background: rgba(255,255,255,0.15);
          color: white;
        }
        .btn-secondary:hover {
          background: rgba(255,255,255,0.25);
        }
        .btn-warning {
          background: #ffc107;
          color: #1a1a1a;
        }
        .btn-warning:hover {
          background: #e0a800;
        }
        .btn-sm {
          padding: 6px 12px;
          font-size: 0.875rem;
        }
      `}} />
    </nav>
  );
}