import { useEffect, useState } from 'react';
import { Bell, CalendarDays, CheckCheck, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { notificationsAPI } from '../services/api';

const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('ar-SA', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  const load = async () => {
    try {
      const response = await notificationsAPI.getAll();
      setNotifications(response.data?.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذر تحميل الإشعارات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const markAllRead = async () => {
    setMarking(true);
    try {
      await notificationsAPI.markAllRead();
      setNotifications((items) => items.map((item) => ({ ...item, is_read: true })));
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذر تحديث الإشعارات');
    } finally { setMarking(false); }
  };

  const openNotification = async (notification) => {
    if (!notification.is_read) {
      try {
        await notificationsAPI.markRead(notification.id);
        setNotifications((items) => items.map((item) => item.id === notification.id ? { ...item, is_read: true } : item));
      } catch { /* فتح التفاصيل لا يتوقف عند فشل تعليم القراءة */ }
    }
    navigate(`/notifications/${notification.id}`);
  };

  return <main dir="rtl" style={{ minHeight: '100vh', background: '#f4f8f9', padding: '32px 18px 70px' }}>
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: '#526873', textDecoration: 'none', fontWeight: 800, fontSize: 13 }}><ArrowRight size={17} /> العودة للرئيسية</Link>
      <section style={{ marginTop: 18, background: '#fff', border: '1px solid #dce9ed', borderRadius: 20, padding: '24px clamp(16px, 4vw, 34px)', boxShadow: '0 12px 30px rgba(19,61,80,.07)' }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', borderBottom: '1px solid #edf2f4', paddingBottom: 18, marginBottom: 18 }}>
          <div><h1 style={{ margin: 0, color: '#173a52', fontSize: 27 }}>الإشعارات</h1><p style={{ margin: '7px 0 0', color: '#71828a', fontSize: 13 }}>تابع آخر تحديثات السيارات والحجوزات والحساب.</p></div>
          <button type="button" onClick={markAllRead} disabled={marking || !notifications.some((item) => !item.is_read)} style={{ border: 0, borderRadius: 10, padding: '10px 13px', background: '#eef7f5', color: '#087f68', font: 'inherit', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}><CheckCheck size={15} style={{ verticalAlign: 'middle', marginLeft: 5 }} /> تحديد الكل كمقروء</button>
        </header>
        {loading ? <div style={{ padding: 45, textAlign: 'center', color: '#71828a' }}>جاري تحميل الإشعارات...</div> : notifications.length === 0 ? <div style={{ padding: 55, textAlign: 'center', color: '#71828a' }}><Bell size={40} style={{ opacity: .35, marginBottom: 10 }} /><p>لا توجد إشعارات حتى الآن.</p></div> : <div style={{ display: 'grid', gap: 10 }}>{notifications.map((notification) => <button key={notification.id} type="button" onClick={() => openNotification(notification)} style={{ textAlign: 'right', border: `1px solid ${notification.is_read ? '#edf2f4' : '#b9e9dc'}`, background: notification.is_read ? '#fff' : '#f2fcf9', borderRadius: 13, padding: 15, cursor: 'pointer', font: 'inherit' }}><div style={{ display: 'flex', alignItems: 'flex-start', gap: 11 }}><Bell size={18} color={notification.is_read ? '#8a9ca4' : '#087f68'} /><div style={{ flex: 1 }}><strong style={{ color: '#173a52', fontSize: 14 }}>{notification.title || 'إشعار'} {!notification.is_read && <span style={{ color: '#087f68', fontSize: 11 }}>• جديد</span>}</strong><p style={{ margin: '6px 0', color: '#526873', fontSize: 13, lineHeight: 1.7 }}>{notification.message}</p><small style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#8a9ca4', fontSize: 11 }}><CalendarDays size={13} /> {formatDate(notification.created_at)}</small></div></div></button>)}</div>}
      </section>
    </div>
  </main>;
}
