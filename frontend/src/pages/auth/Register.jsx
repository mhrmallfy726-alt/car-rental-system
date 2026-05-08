import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import { Car, Mail, Lock, User, Phone, ChevronLeft, ShieldCheck, Briefcase } from 'lucide-react';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'customer' // customer or supplier
  });
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('الرجاء إدخال جميع الحقول المطلوبة');
      return;
    }

    const res = await register(formData);
    if (res.success) {
      toast.success('تم إنشاء الحساب بنجاح ✅');
      if (res.user.role === 'supplier') navigate('/supplier/dashboard');
      else navigate('/');
    } else {
      toast.error(res.error);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f8f9fa',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '24px',
        boxShadow: '0 20px 35px -10px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '650px',
        padding: '32px',
        animation: 'fadeIn 0.4s ease-out'
      }}>
        {/* زر الرجوع */}
        <Link to="/" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: '#f0f2f5',
          color: '#1a1a1a',
          padding: '6px 12px',
          borderRadius: '20px',
          fontSize: '0.8rem',
          textDecoration: 'none',
          marginBottom: '24px',
          width: 'fit-content'
        }}>
          <ChevronLeft size={16} /> العودة للرئيسية
        </Link>

        {/* الشعار والعنوان */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Car size={40} style={{ color: '#0a58ca' }} />
            <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0a58ca', letterSpacing: '-1px' }}>لبيتكم</span>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '8px', color: '#1a1a1a' }}>إنشاء حساب جديد</h1>
          <p style={{ color: '#6c757d', fontSize: '0.9rem' }}>ابدأ رحلتك معنا اليوم باختيار نوع الحساب المناسب</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Role Selection */}
          <div>
            <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', fontSize: '0.85rem' }}>أنا أسجل بصفتي:</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div 
                onClick={() => setFormData({...formData, role: 'customer'})}
                style={{ 
                  padding: '16px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                  border: formData.role === 'customer' ? '2px solid #0a58ca' : '1px solid #ced4da',
                  background: formData.role === 'customer' ? 'rgba(10, 88, 202, 0.05)' : 'white'
                }}
              >
                <ShieldCheck size={24} color={formData.role === 'customer' ? '#0a58ca' : '#6c757d'} />
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: formData.role === 'customer' ? '#0a58ca' : '#1a1a1a' }}>مستأجر سيارة</span>
              </div>
              <div 
                onClick={() => setFormData({...formData, role: 'supplier'})}
                style={{ 
                  padding: '16px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                  border: formData.role === 'supplier' ? '2px solid #0a58ca' : '1px solid #ced4da',
                  background: formData.role === 'supplier' ? 'rgba(10, 88, 202, 0.05)' : 'white'
                }}
              >
                <Briefcase size={24} color={formData.role === 'supplier' ? '#0a58ca' : '#6c757d'} />
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: formData.role === 'supplier' ? '#0a58ca' : '#1a1a1a' }}>مكتب تأجير / مورد</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '0.85rem' }}>الاسم الكامل</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6c757d' }} />
                <input 
                  type="text" 
                  name="name" 
                  placeholder="الاسم" 
                  value={formData.name} 
                  onChange={handleChange} 
                  required 
                  style={{
                    width: '100%',
                    padding: '10px 40px 10px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '0.85rem' }}>رقم الهاتف</label>
              <div style={{ position: 'relative' }}>
                <Phone size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6c757d' }} />
                <input 
                  type="tel" 
                  name="phone" 
                  placeholder="05xxxxxxxx" 
                  value={formData.phone} 
                  onChange={handleChange} 
                  dir="ltr" 
                  required 
                  style={{
                    width: '100%',
                    padding: '10px 40px 10px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '0.85rem' }}>البريد الإلكتروني</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6c757d' }} />
              <input 
                type="email" 
                name="email" 
                placeholder="example@mail.com" 
                value={formData.email} 
                onChange={handleChange} 
                dir="ltr" 
                required 
                style={{
                  width: '100%',
                  padding: '10px 40px 10px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '0.85rem' }}>كلمة المرور</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6c757d' }} />
              <input 
                type="password" 
                name="password" 
                placeholder="••••••••" 
                value={formData.password} 
                onChange={handleChange} 
                dir="ltr" 
                required 
                style={{
                  width: '100%',
                  padding: '10px 40px 10px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            style={{
              width: '100%',
              background: '#0a58ca',
              color: 'white',
              border: 'none',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              marginTop: '8px'
            }}
          >
            {isLoading ? 'جاري معالجة الطلب...' : 'إنشاء حساب جديد'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '32px', fontSize: '0.85rem', color: '#6c757d' }}>
          لديك حساب بالفعل؟{' '}
          <Link to="/login" style={{ color: '#0a58ca', fontWeight: 'bold', textDecoration: 'none' }}>تسجيل الدخول</Link>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 480px) {
          [style*="max-width: 650px"] {
            padding: 24px !important;
          }
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
