import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Bell, CalendarDays, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { notificationsAPI } from '../services/api';
import useAuthStore from '../store/authStore';

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('ar-SA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const getReferencePath = (notification, user) => {
  if (!notification?.reference_id) return null;

  switch (notification.reference_type || notification.type) {
    case 'reservation':
      if (user?.role === 'supplier') return `/supplier/reservations/${notification.reference_id}`;
      if (user?.role === 'employee') return '/employee/dashboard';
      if (user?.role === 'admin') return '/admin/dashboard';
      return '/';
    case 'car':
      return `/cars/${notification.reference_id}`;
    case 'advertisement':
    case 'advertisement_request':
      return user?.role === 'supplier' ? '/supplier/advertisement-request' : '/admin/advertisement-center';
    case 'complaint':
      return `/complaints/${notification.reference_id}`;
    case 'user':
      return `/profile`;
    default:
      return null;
  }
};

export default function NotificationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadNotification = async () => {
      try {
        const response = await notificationsAPI.getOne(id);
        const item = response.data?.data;

        if (cancelled) return;
        setNotification(item || null);

        if (item && !item.is_read) {
          await notificationsAPI.markRead(id);
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error.response?.data?.message || 'تعذر تحميل الإشعار'
          );
          navigate('/', { replace: true });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadNotification();
    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  if (loading) {
    return (
      <main className="notification-detail-page" dir="rtl">
        <div className="notification-detail-loading">جاري تحميل الإشعار...</div>
      </main>
    );
  }

  if (!notification) return null;

  const referencePath = getReferencePath(notification, user);

  return (
    <main className="notification-detail-page" dir="rtl">
      <div className="notification-detail-container">
        <Link to="/" className="notification-back-link">
          <ArrowRight size={17} /> العودة للرئيسية
        </Link>

        <article className="notification-detail-card">
          <div className="notification-detail-icon">
            <Bell size={27} />
          </div>

          <span className="notification-detail-kicker">مركز الإشعارات</span>
          <h1>{notification.title || 'إشعار'}</h1>
          <p className="notification-detail-message">
            {notification.message || 'لا يوجد محتوى إضافي لهذا الإشعار.'}
          </p>

          <div className="notification-detail-meta">
            <span><CalendarDays size={15} /> {formatDate(notification.created_at)}</span>
            {notification.type && <span>{notification.type}</span>}
          </div>

          {referencePath && (
            <button
              type="button"
              className="notification-detail-action"
              onClick={() => navigate(referencePath)}
            >
              فتح التفاصيل <ExternalLink size={17} />
            </button>
          )}
        </article>
      </div>
    </main>
  );
}
