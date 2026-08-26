import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { carsAPI } from '../services/api';
import { User, Shield, Heart, Car, LogOut, ChevronLeft, MapPin, Mail, Phone, Calendar, CheckCircle, Clock, Settings } from 'lucide-react';

import { getImageUrl } from '../utils/imageUtils';
export default function Profile() {
  const { user, isCustomer, logout, fetchMe } = useAuthStore();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    fetchMe();
    if (isCustomer() && activeTab === 'favorites') {
      fetchFavorites();
    }
  }, [activeTab]);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const res = await carsAPI.getFavorites();
      setFavorites(res.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8f9fa',
      padding: '40px 20px'
    }}>
      <div className="container pb-60">
      <div className="flex-between align-end mt-32 mb-32">
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary)' }}>حسابي الشخصي</h1>
          <p className="text-secondary">مرحباً بك، {user?.name}</p>
        </div>
      </div>

      <div className="profile-layout">
        {/* الشريط الجانبي */}
        <aside className="profile-sidebar">
          <div className="card p-24 text-center mb-24">
            <div className="flex-center mx-auto mb-20" style={{
              width: '100px', height: '100px', borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
              color: 'white', fontSize: '2.5rem', fontWeight: 900,
              boxShadow: '0 8px 16px rgba(0,53,128,0.2)'
            }}>
              {user?.name?.charAt(0)}
            </div>
            <h2 className="font-bold mb-4">{user?.name}</h2>
            <p className="text-muted text-sm mb-16">{user?.email}</p>
            <span className={`badge ${user?.is_verified ? 'badge-success' : 'badge-warning'}`} style={{ padding: '6px 16px', borderRadius: 'var(--radius-full)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              {user?.is_verified ? (
                <>
                  <CheckCircle size={14} /> حساب موثق
                </>
              ) : (
                <>
                  <Clock size={14} /> بانتظار التوثيق
                </>
              )}
            </span>
          </div>

          <div className="card p-12 flex flex-column gap-4">
            <button
              className={`sidebar-item w-full ${activeTab === 'info' ? 'active' : ''}`}
              onClick={() => setActiveTab('info')}
              style={{ border: 'none', background: 'transparent', textAlign: 'right', cursor: 'pointer' }}
            >
              <User size={18} /> المعلومات الشخصية
            </button>
            {isCustomer() && (
              <button
                className={`sidebar-item w-full ${activeTab === 'favorites' ? 'active' : ''}`}
                onClick={() => setActiveTab('favorites')}
                style={{ border: 'none', background: 'transparent', textAlign: 'right', cursor: 'pointer' }}
              >
                <Heart size={18} /> السيارات المفضلة
              </button>
            )}
            <Link to="/settings" className="sidebar-item w-full" style={{ border: 'none', background: 'transparent', textAlign: 'right', cursor: 'pointer' }}>
              <Settings size={18} /> إعدادات الحساب
            </Link>
            <button onClick={handleLogout} className="sidebar-item w-full text-danger mt-12" style={{ border: 'none', background: 'transparent', textAlign: 'right', cursor: 'pointer' }}>
              <LogOut size={18} /> تسجيل الخروج
            </button>
          </div>
        </aside>

        {/* منطقة المحتوى */}
        <main className="profile-content">
          <div className="card p-32 fade-in">
            {activeTab === 'info' && (
              <div className="fade-in">
                <h3 className="font-bold mb-32 text-primary flex gap-8 align-center border-b pb-12">
                  المعلومات الأساسية
                </h3>
                <div className="grid-2 gap-32">
                  <div className="info-group">
                    <label className="flex gap-8 align-center text-muted text-sm mb-8 font-bold"><User size={16} /> الاسم الكامل</label>
                    <p className="font-bold font-lg p-12 bg-base border-radius-md" style={{ background: '#f8f9fa' }}>{user?.name}</p>
                  </div>
                  <div className="info-group">
                    <label className="flex gap-8 align-center text-muted text-sm mb-8 font-bold"><Mail size={16} /> البريد الإلكتروني</label>
                    <p className="font-bold font-lg p-12 bg-base border-radius-md" style={{ background: '#f8f9fa' }} dir="ltr">{user?.email}</p>
                  </div>
                  <div className="info-group">
                    <label className="flex gap-8 align-center text-muted text-sm mb-8 font-bold"><Phone size={16} /> رقم الهاتف</label>
                    <p className="font-bold font-lg p-12 bg-base border-radius-md" style={{ background: '#f8f9fa' }} dir="ltr">{user?.phone || 'لم يتم الربط بعد'}</p>
                  </div>
                  <div className="info-group">
                    <label className="flex gap-8 align-center text-muted text-sm mb-8 font-bold"><Calendar size={16} /> نوع الحساب</label>
                    <p className="font-bold font-lg p-12 bg-base border-radius-md" style={{ background: '#f8f9fa' }}>
                      {user?.role === 'customer' ? 'مستأجر (عميل)' : user?.role === 'supplier' ? 'مورد (مكتب تأجير)' : 'مدير النظام'}
                    </p>
                  </div>
                </div>

                {!user?.is_verified && isCustomer() && (
                  <div className="bg-warning-light p-24 border-radius-md mt-40 border" style={{ background: '#fffaf0', borderColor: '#feebc8' }}>
                    <div className="flex gap-16 align-start">
                      <Shield size={32} className="text-warning" />
                      <div>
                        <h4 className="font-bold text-warning mb-8">خطوة متبقية: توثيق الهوية</h4>
                        <p className="text-sm text-secondary mb-16">لأمانك وأمان الموردين، نطلب توثيق الهوية (KYC) قبل إتمام أي حجز. يمكنك التوثيق عند حجز أول سيارة.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'favorites' && (
              <div className="fade-in">
                <h3 className="font-bold mb-32 text-danger flex gap-8 align-center border-b pb-12">
                  قائمة المفضلات
                </h3>

                {loading ? (
                  <div className="flex-center py-60"><div className="spinner"></div></div>
                ) : favorites.length === 0 ? (
                  <div className="text-center py-60 text-secondary">
                    <div className="mb-20 opacity-20"><Heart size={80} className="mx-auto" /></div>
                    <h3 className="font-bold text-primary mb-8">قائمة مفضلاتك فارغة</h3>
                    <p className="mb-24">ابدأ باستكشاف السيارات وأضف ما يعجبك هنا للرجوع إليه لاحقاً.</p>
                    <Link to="/cars" className="btn btn-primary">تصفح السيارات الآن</Link>
                  </div>
                ) : (
                  <div className="grid-2 gap-16">
                    {favorites.map(car => {
                      // معالجة مسار الصورة بشكل موحد
                      let imageUrl = 'https://via.placeholder.com/100x70?text=No+Image';
                      if (car.primary_image) {
                        imageUrl = car.primary_image.startsWith('http')
                          ? car.primary_image
                          : getImageUrl(car.primary_image);
                      }
                      return (
                        <div key={car.id} className="card p-16 flex gap-16 align-center hover-up">
                          <div style={{ width: '100px', height: '70px', borderRadius: '8px', overflow: 'hidden', background: '#f8f9fa' }}>
                            <img src={imageUrl} alt={`${car.make} ${car.model}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <h4 className="font-bold">{car.make} {car.model}</h4>
                            <p className="text-primary font-bold text-sm">${car.price_per_day} <span className="text-muted font-normal">/ يوم</span></p>
                          </div>
                          <Link to={`/cars/${car.id}`} className="btn btn-secondary btn-icon"><ChevronLeft size={18} /></Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .profile-layout { display: flex; gap: 32px; align-items: flex-start; }
        .profile-sidebar { width: 320px; flex-shrink: 0; }
        .profile-content { flex: 1; }
        
        @media (max-width: 992px) {
          .profile-layout { flex-direction: column; }
          .profile-sidebar { width: 100%; }
        }
      `}} />
      </div>
    </div>
  );
}