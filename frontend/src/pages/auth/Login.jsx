import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import { Car, Mail, Lock, ChevronLeft } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('الرجاء إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    const res = await login({ email, password });
    if (res.success) {
      toast.success('تم تسجيل الدخول بنجاح'); // تم إزالة الإيموجي ✅
      if (res.user.role === 'admin') navigate('/admin/dashboard');
      else if (res.user.role === 'supplier') navigate('/supplier/dashboard');
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
      background: '#f8f9fa',  // رمادي فاتح محايد
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '24px',
        boxShadow: '0 20px 35px -10px rgba(0,0,0,0.2)',
        width: '100%',
        maxWidth: '450px',
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
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '8px', color: '#1a1a1a' }}>مرحباً بعودتك</h1>
          <p style={{ color: '#6c757d', fontSize: '0.9rem' }}>سجل دخولك للوصول إلى أفضل العروض</p>
        </div>

        {/* نموذج تسجيل الدخول */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '0.85rem' }}>البريد الإلكتروني</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6c757d' }} />
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                dir="ltr"
                required
                style={{
                  width: '100%',
                  padding: '10px 40px 10px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#0a58ca'}
                onBlur={(e) => e.target.style.borderColor = '#ced4da'}
              />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>كلمة المرور</label>
              <Link to="/forgot-password" style={{ fontSize: '0.75rem', color: '#0a58ca', textDecoration: 'none', fontWeight: '600' }}>نسيت كلمة المرور؟</Link>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6c757d' }} />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                dir="ltr"
                required
                style={{
                  width: '100%',
                  padding: '10px 40px 10px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#0a58ca'}
                onBlur={(e) => e.target.style.borderColor = '#ced4da'}
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
              padding: '10px',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              marginTop: '8px'
            }}
          >
            {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>

        {/* رابط التسجيل */}
        <div style={{ textAlign: 'center', marginTop: '32px', fontSize: '0.85rem', color: '#6c757d' }}>
          ليس لديك حساب؟{' '}
          <Link to="/register" style={{ color: '#0a58ca', fontWeight: 'bold', textDecoration: 'none' }}>إنشاء حساب جديد</Link>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 480px) {
          [style*="max-width: 450px"] {
            padding: 24px !important;
          }
          [style*="font-size: 1.8rem"] {
            font-size: 1.5rem !important;
          }
        }
      `}</style>
    </div>
  );
}