// import { useState } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import useAuthStore from '../../store/authStore';
// import toast from 'react-hot-toast';
// import { Car, Mail, Lock, ChevronLeft } from 'lucide-react';
// // import { setAccessToken } from "../../../src/API/axios"; // عدّل المسار حسب مكان الملف

// export default function Login() {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   //const [isLoading,setIsLoading] = useState(false);
//    const { login, isLoading } = useAuthStore();
//   const navigate = useNavigate();

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!email || !password) {
//       toast.error('الرجاء إدخال البريد الإلكتروني وكلمة المرور');
//       return;
//     }

//     const res = await login({ email, password });

//     if (res.success) {
//       toast.success('تم تسجيل الدخول بنجاح'); // تم إزالة الإيموجي ✅
//       if (res.user.role === 'admin') navigate('/admin/dashboard');
//       else if (res.user.role === 'supplier') navigate('/supplier/dashboard');
//       else navigate('/');
//     } else {
//       toast.error(res.error);
//     }
//   }; 

//   return (
//     <div style={{
//       minHeight: '100vh',
//       display: 'flex',
//       alignItems: 'center',
//       justifyContent: 'center',
//       background: '#f8f9fa',  // رمادي فاتح محايد
//       padding: '20px'
//     }}>
//       <div style={{
//         background: 'white',
//         borderRadius: '24px',
//         boxShadow: '0 20px 35px -10px rgba(0,0,0,0.2)',
//         width: '100%',
//         maxWidth: '450px',
//         padding: '32px',
//         animation: 'fadeIn 0.4s ease-out'
//       }}>
//         {/* زر الرجوع */}
//         <Link to="/" style={{
//           display: 'inline-flex',
//           alignItems: 'center',
//           gap: '6px',
//           background: '#f0f2f5',
//           color: '#1a1a1a',
//           padding: '6px 12px',
//           borderRadius: '20px',
//           fontSize: '0.8rem',
//           textDecoration: 'none',
//           marginBottom: '24px',
//           width: 'fit-content'
//         }}>
//           <ChevronLeft size={16} /> العودة للرئيسية
//         </Link>

//         {/* الشعار والعنوان */}
//         <div style={{ textAlign: 'center', marginBottom: '32px' }}>
//           <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
//             <Car size={40} style={{ color: '#0a58ca' }} />
//             <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0a58ca', letterSpacing: '-1px' }}>لبيتكم</span>
//           </div>
//           <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '8px', color: '#1a1a1a' }}>مرحباً بعودتك</h1>
//           <p style={{ color: '#6c757d', fontSize: '0.9rem' }}>سجل دخولك للوصول إلى أفضل العروض</p>
//         </div>

//         {/* نموذج تسجيل الدخول */}
//         <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
//           <div>
//             <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '0.85rem' }}>البريد الإلكتروني</label>
//             <div style={{ position: 'relative' }}>
//               <Mail size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6c757d' }} />
//               <input
//                 type="email"
//                 placeholder="name@example.com"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 dir="ltr"
//                 required
//                 style={{
//                   width: '100%',
//                   padding: '10px 40px 10px 12px',
//                   border: '1px solid #ced4da',
//                   borderRadius: '8px',
//                   fontSize: '0.9rem',
//                   outline: 'none',
//                   transition: 'border-color 0.2s'
//                 }}
//                 onFocus={(e) => e.target.style.borderColor = '#0a58ca'}
//                 onBlur={(e) => e.target.style.borderColor = '#ced4da'}
//               />
//             </div>
//           </div>

//           <div>
//             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
//               <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>كلمة المرور</label>
//               <Link to="/forgot-password" style={{ fontSize: '0.75rem', color: '#0a58ca', textDecoration: 'none', fontWeight: '600' }}>نسيت كلمة المرور؟</Link>
//             </div>
//             <div style={{ position: 'relative' }}>
//               <Lock size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6c757d' }} />
//               <input
//                 type="password"
//                 placeholder="••••••••"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 dir="ltr"
//                 required
//                 style={{
//                   width: '100%',
//                   padding: '10px 40px 10px 12px',
//                   border: '1px solid #ced4da',
//                   borderRadius: '8px',
//                   fontSize: '0.9rem',
//                   outline: 'none',
//                   transition: 'border-color 0.2s'
//                 }}
//                 onFocus={(e) => e.target.style.borderColor = '#0a58ca'}
//                 onBlur={(e) => e.target.style.borderColor = '#ced4da'}
//               />
//             </div>
//           </div>

//           <button
//             type="submit"
//             disabled={isLoading}
//             style={{
//               width: '100%',
//               background: '#0a58ca',
//               color: 'white',
//               border: 'none',
//               padding: '10px',
//               borderRadius: '8px',
//               fontSize: '1rem',
//               fontWeight: 'bold',
//               cursor: isLoading ? 'not-allowed' : 'pointer',
//               marginTop: '8px'
//             }}
//           >
//             {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
//           </button>
//         </form>

//         {/* رابط التسجيل */}
//         <div style={{ textAlign: 'center', marginTop: '32px', fontSize: '0.85rem', color: '#6c757d' }}>
//           ليس لديك حساب؟{' '}
//           <Link to="/register" style={{ color: '#0a58ca', fontWeight: 'bold', textDecoration: 'none' }}>إنشاء حساب جديد</Link>
//         </div>
//       </div>

//       <style>{`
//         @keyframes fadeIn {
//           from { opacity: 0; transform: translateY(-20px); }
//           to { opacity: 1; transform: translateY(0); }
//         }
//         @media (max-width: 480px) {
//           [style*="max-width: 450px"] {
//             padding: 24px !important;
//           }
//           [style*="font-size: 1.8rem"] {
//             font-size: 1.5rem !important;
//           }
//         }
//       `}</style>
//     </div>
//   );
// }





import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import logo from '../../assets/LOGO.png';
import { Car, Mail, Lock, ChevronLeft } from 'lucide-react';
import { setAccessToken } from "../../../src/API/axios"; // عدّل المسار حسب مكان الملف

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // const [,setIsLoading] = useState(false);
   const { login,isLoading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [supplierStatus, setSupplierStatus] = useState(null);
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!email || !password) {
      toast.error("الرجاء إدخال البريد الإلكتروني وكلمة المرور");
      return;
    }
  
    const res = await login({ email, password });
  
    // إذا لم يصل أي رد
    if (!res) {
      toast.error("حدث خطأ أثناء تسجيل الدخول");
      return;
    }
    console.log(res);
    // إذا كان حساب المورد بانتظار المراجعة أو مرفوضًا
    if (
      res.verification_status === "pending" ||
      res.verification_status === "rejected"
    ) {
      setSupplierStatus(res);
      return;
    }
  
    // نجاح تسجيل الدخول
    if (res.success) {
      // إذا كانت دالة login ترجع token
      if (res.token) {
        setAccessToken(res.token);
      }
  
      toast.success("تم تسجيل الدخول بنجاح");

      const requestedPath = location.state?.from;
      if (requestedPath && requestedPath !== '/login') {
        navigate(requestedPath, { replace: true });
        return;
      }

      if (res.user.account_type === 'employee' || res.user.role === 'employee') {
        navigate('/employee/dashboard', { replace: true });
        return;
      }

      switch (res.user.role) {
        case "admin":
          navigate("/admin/dashboard", { replace: true });
          break;
        case "supplier":
          navigate("/supplier/dashboard", { replace: true });
          break;
        default:
          navigate("/my-reservations", { replace: true });
          break;
      }

      return;
    }
  
    // فشل تسجيل الدخول
    toast.error(res.error || res.message || "فشل تسجيل الدخول");
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
            {/* <Car size={40} style={{ color: '#0a58ca' }} /> */}
            <img src={logo} alt="RC Logo" style={{ width:'70px', height:'70px',objectFit:'contain'}}/>
            {/* <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0a58ca', letterSpacing: '-1px' }}>RENTALCAR</span> */}
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
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.target.style.background = '#059669';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#10B981';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>
        {supplierStatus && (
 <div
 className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60"
>
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-8">

      {/* العنوان */}
      <h2 className="text-2xl font-bold text-center mb-6">
        {supplierStatus.verification_status === "pending"
          ? "⏳ حسابك قيد المراجعة"
          : "❌ تم رفض طلب التحقق"}
      </h2>

      {/* حالة المراجعة */}
      {supplierStatus.verification_status === "pending" && (
        <>
          <p className="text-gray-600 text-center mb-6">
            يقوم فريق الإدارة بمراجعة بياناتك ووثائقك،
            وسيتم إشعارك فور الانتهاء.
          </p>
        </>
      )}

      {/* حالة الرفض */}
      {supplierStatus.verification_status === "rejected" && (
        <>

          {/* السجل التجاري */}
          {supplierStatus.commercial_register_reason && (
            <div className="mb-5 border rounded-xl p-4 bg-red-50">

              <h3 className="font-bold text-red-700">
                السجل التجاري
              </h3>

              <p className="text-sm text-gray-600 mt-2">
                سبب الرفض:
              </p>

              <p className="font-medium text-red-600">
                {supplierStatus.commercial_register_reason}
              </p>

              <input
                type="file"
                name="commercial_register"
                className="mt-3 w-full"
              />

            </div>
          )}

          {/* الهوية */}
          {supplierStatus.owner_id_reason && (
            <div className="mb-5 border rounded-xl p-4 bg-red-50">

              <h3 className="font-bold text-red-700">
                هوية المالك
              </h3>

              <p className="text-sm text-gray-600 mt-2">
                سبب الرفض:
              </p>

              <p className="font-medium text-red-600">
                {supplierStatus.owner_id_reason}
              </p>

              <input
                type="file"
                name="owner_id"
                className="mt-3 w-full"
              />

            </div>
          )}

          {/* الشعار */}
          {supplierStatus.avatar_reason && (
            <div className="mb-5 border rounded-xl p-4 bg-red-50">

              <h3 className="font-bold text-red-700">
                شعار المعرض
              </h3>

              <p className="text-sm text-gray-600 mt-2">
                سبب الرفض:
              </p>

              <p className="font-medium text-red-600">
                {supplierStatus.avatar_reason}
              </p>

              <input
                type="file"
                name="avatar"
                className="mt-3 w-full"
              />

            </div>
          )}

        </>
      )}

      {/* التواصل */}
      <div className="border-t pt-4 mt-4 text-center">
        <p className="font-semibold">
          للتواصل مع الإدارة
        </p>

        <p>{supplierStatus.phone}</p>

        <p>{supplierStatus.email}</p>
      </div>

      {/* الأزرار */}
      <div className="flex justify-end gap-3 mt-6">

        {supplierStatus.verification_status === "rejected" && (
          <button
            className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            إعادة إرسال الوثائق
          </button>
        )}

        <button
          onClick={() => setSupplierStatus(null)}
          className="px-5 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
        >
          إغلاق
        </button>

      </div>

    </div>
  </div>
  
)}
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