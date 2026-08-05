import React, {useState,useEffect} from 'react';
import api from '../../api/axios';
import { useAuth } from '../../store/auth';
import{Car,Mail,Lock} from 'lucide-react';
import{Link} from 'react-router-dom';
export default function () {
  const { loginWithToken } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handlechange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
  
   
    try {
      const res = await api.post('/auth/login', formData);

      const { token, user } = res.data;

      if (token) {
        loginWithToken(token, user);
      }

      window.location.href = '/';
    } catch (err) {
      alert(err?.response?.data?.message || 'فشل تسجيل الدخول');
    };
  }
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
           {/* الشعار والعنوان */}
           <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Car size={40} style={{ color: '#0a58ca' }} />
            <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0a58ca', letterSpacing: '-1px' }}>لبيتكم</span>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '8px', color: '#1a1a1a' }}>مرحباً بعودتك</h1>
          <p style={{ color: '#6c757d', fontSize: '0.9rem' }}>سجل دخولك للوصول إلى أفضل العروض</p>
        </div>

        </div>
    

    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h2>تسجيل دخول</h2>
      <div>
        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '0.85rem' }}>البريد الإلكتروني</label>
        <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6c757d' }} />
        <input
 type="email"
     placeholder="name@example.com"
  name="email"
  value={formData.email}
  onChange={handlechange}
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
        <label  style={{ fontWeight: '600', fontSize: '0.85rem' }}>كلمة المرور</label>
        <Link to="/forgot-password" style={{ fontSize: '0.75rem', color: '#0a58ca', textDecoration: 'none', fontWeight: '600' }}>نسيت كلمة المرور؟</Link>
        </div>
        <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6c757d' }} />
        <input
     type="password"
  placeholder="••••••••"
  name="password"
  value={formData.password}
  onChange={handlechange}
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
      <button   type="submit"
           
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

          > </button>
    </form>
    </div>
  );
}