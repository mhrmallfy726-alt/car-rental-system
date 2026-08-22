import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Car, Mail, Lock, User, Phone, MapPin, Building, FileText, 
  Upload, CheckCircle, AlertCircle, Eye, EyeOff, ChevronLeft,
  Image as ImageIcon, FileCheck, Clock, DollarSign
} from 'lucide-react';
import logo from '../assets/LOGO.png';
// import { setAccessToken, clearAccessToken } from '../api/axios';
import axios from "axios";
export default function Join() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const logoInputRef = useRef(null);
  const commercialInputRef = useRef(null);
  const idInputRef = useRef(null);

  // Form State
  const [formData, setFormData] = useState({
    // معلومات المالك
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    ownerPassword: '',
    ownerPasswordConfirm: '',
    
    // معلومات المعرض
    showroomName: '',
    city: '',
    address: '',
    
    // إعدادات التأجير
    lateFeePricePerHour: 10,
    gracePeriodHours: 2,
    
    // الموافقة على الشروط
    agreeToTerms: false
  });

  // File State
  const [files, setFiles] = useState({
    logo: null,
    logoPreview: null,
    commercial: null,
    commercialName: '',
    ownerId: null,
    ownerIdName: ''
  });

  // UI State
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    logo: 0,
    commercial: 0,
    ownerId: 0
  });
  const [currentStep, setCurrentStep] = useState(1); // 1: Basic, 2: Rental Settings, 3: Documents

  // Progress calculation
  const progressPercentage = Math.round((currentStep / 3) * 100);

  // Handle text input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle number input changes
  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: Math.max(0, parseInt(value) || 0)
    }));
  };

  // Handle logo upload
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validation
    if (!file.type.startsWith('image/')) {
      toast.error('يرجى اختيار صورة فقط');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('حجم الصورة يجب أن لا يتجاوز 2 ميجابايت');
      return;
    }

    // Simulate upload progress
    setUploadProgress(prev => ({ ...prev, logo: 0 }));
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        const newProgress = prev.logo + Math.random() * 30;
        if (newProgress >= 100) {
          clearInterval(interval);
          return { ...prev, logo: 100 };
        }
        return { ...prev, logo: newProgress };
      });
    }, 200);

    // Set file and preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setFiles(prev => ({
        ...prev,
        logo: file,
        logoPreview: e.target.result
      }));
    };
    reader.readAsDataURL(file);
  };

  // Handle commercial register upload
  const handleCommercialChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validation
    if (file.type !== 'application/pdf' && !file.type.startsWith('image/')) {
      toast.error('يرجى اختيار ملف PDF أو صورة');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم الملف يجب أن لا يتجاوز 5 ميجابايت');
      return;
    }

    // Simulate upload progress
    setUploadProgress(prev => ({ ...prev, commercial: 0 }));
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        const newProgress = prev.commercial + Math.random() * 30;
        if (newProgress >= 100) {
          clearInterval(interval);
          return { ...prev, commercial: 100 };
        }
        return { ...prev, commercial: newProgress };
      });
    }, 200);

    setFiles(prev => ({
      ...prev,
      commercial: file,
      commercialName: file.name
    }));
  };

  // Handle owner ID upload
  const handleIdChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validation
    if (!file.type.startsWith('image/')) {
      toast.error('يرجى اختيار صورة فقط');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error('حجم الصورة يجب أن لا يتجاوز 3 ميجابايت');
      return;
    }

    // Simulate upload progress
    setUploadProgress(prev => ({ ...prev, ownerId: 0 }));
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        const newProgress = prev.ownerId + Math.random() * 30;
        if (newProgress >= 100) {
          clearInterval(interval);
          return { ...prev, ownerId: 100 };
        }
        return { ...prev, ownerId: newProgress };
      });
    }, 200);

    setFiles(prev => ({
      ...prev,
      ownerId: file,
      ownerIdName: file.name
    }));
  };

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (!file) return;

    if (type === 'logo') {
      logoInputRef.current?.files && Object.assign(logoInputRef.current.files, { 0: file });
      handleLogoChange({ target: { files: [file] } });
    } else if (type === 'commercial') {
      handleCommercialChange({ target: { files: [file] } });
    } else if (type === 'id') {
      handleIdChange({ target: { files: [file] } });
    }
  };

  // Validation functions
  const validateStep1 = () => {
    if (!formData.ownerName.trim()) {
      toast.error('يرجى إدخال اسم المالك');
      return false;
    }
    if (!formData.ownerEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.ownerEmail)) {
      toast.error('يرجى إدخال بريد إلكتروني صحيح');
      return false;
    }
    if (!formData.ownerPhone.trim() || formData.ownerPhone.length < 9) {
      toast.error('يرجى إدخال رقم هاتف صحيح');
      return false;
    }
    if (!formData.ownerPassword.trim() || formData.ownerPassword.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return false;
    }
    if (formData.ownerPassword !== formData.ownerPasswordConfirm) {
      toast.error('كلمات المرور غير متطابقة');
      return false;
    }
    if (!formData.showroomName.trim()) {
      toast.error('يرجى إدخال اسم المعرض');
      return false;
    }
    if (!formData.city.trim()) {
      toast.error('يرجى اختيار المدينة');
      return false;
    }
    if (!formData.address.trim()) {
      toast.error('يرجى إدخال العنوان');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (formData.lateFeePricePerHour < 0) {
      toast.error('سعر التأخير يجب أن يكون موجباً');
      return false;
    }
    if (formData.gracePeriodHours < 0) {
      toast.error('فترة السماح يجب أن تكون موجبة');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!files.logo) {
      toast.error('يرجى رفع شعار المعرض');
      return false;
    }
    if (!files.commercial) {
      toast.error('يرجى رفع السجل التجاري');
      return false;
    }
    if (!files.ownerId) {
      toast.error('يرجى رفع صورة هوية المالك');
      return false;
    }
    if (!formData.agreeToTerms) {
      toast.error('يرجى الموافقة على الشروط والأحكام');
      return false;
    }
    return true;
  };

  // Handle next step
  const handleNextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };

  // Handle previous step
  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep3()) return;

    setLoading(true);
    try {
      // Create FormData for multipart upload
      const formDataToSend = new FormData();
      
      // Add basic info
      formDataToSend.append('name', formData.ownerName);
      formDataToSend.append('email', formData.ownerEmail);
      formDataToSend.append('password', formData.ownerPassword);
      formDataToSend.append('phone', formData.ownerPhone);
      formDataToSend.append('role', 'supplier');
      
      // Add showroom info
      formDataToSend.append('company_name', formData.showroomName);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('city', formData.city);
      
      // Add rental settings
      formDataToSend.append('late_fee_price_per_hour', formData.lateFeePricePerHour);
      formDataToSend.append('grace_period_hours', formData.gracePeriodHours);
      
      // Add files
      if (files.logo) formDataToSend.append('avatar', files.logo);
      if (files.commercial) formDataToSend.append('commercial_register', files.commercial);
      if (files.ownerId) formDataToSend.append('owner_id', files.ownerId);

      // TODO: Replace with actual API call
      // const response = await authAPI.registerVendor(formDataToSend);
      
      // For now, simulate API call
      const response = await axios.post(
        "http://localhost:5000/api/auth/register",
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      
      toast.success("تم إنشاء حساب المورد بنجاح");
      
      navigate("/supplier/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || 'حدث خطأ أثناء تقديم الطلب');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f8fafc',
      padding: '20px',
      paddingTop: '100px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
        width: '100%',
        maxWidth: '850px',
        padding: '40px',
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
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <img src={logo} alt="RC Logo" style={{ width:'500px', height:'200px',objectFit:'contain'}}/>
{/* 
            <span style={{ 
fontSize: "2.5rem",
letterSpacing: "5px",
fontStyle: "italic",
textTransform: "uppercase",
}}>RENTALCAR</span> */}
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 'bold', marginBottom: '8px', color: '#1a1a1a' }}>
            🚗 انضم كمورد سيارات
          </h1>
          <p style={{ color: '#6c757d', fontSize: '0.95rem' }}>
            أكمل بيانات معرضك للانضمام إلى منصتنا
          </p>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            {[1, 2, 3].map(step => (
              <div key={step} style={{
                flex: 1,
                height: '6px',
                background: step <= currentStep ? '#0F766E' : '#e9ecef',
                borderRadius: '3px',
                marginRight: step < 3 ? '8px' : '0',
                transition: 'all 0.3s ease'
              }} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#6c757d' }}>
            <span style={{ fontWeight: currentStep === 1 ? 'bold' : 'normal', color: currentStep === 1 ? '#0F766E' : '#6c757d' }}>البيانات الأساسية</span>
            <span style={{ fontWeight: currentStep === 2 ? 'bold' : 'normal', color: currentStep === 2 ? '#0F766E' : '#6c757d' }}>إعدادات التأجير</span>
            <span style={{ fontWeight: currentStep === 3 ? 'bold' : 'normal', color: currentStep === 3 ? '#0F766E' : '#6c757d' }}>الوثائق الرسمية</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* STEP 1: Basic Information */}
          {currentStep === 1 && (
            <div style={{ animation: 'slideIn 0.3s ease-out' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '20px', color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={20} style={{ color: '#0F766E' }} />
                معلومات المالك
              </h2>

              {/* Owner Name & Email */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.85rem', color: '#1a1a1a' }}>
                    اسم المالك *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6c757d' }} />
                    <input
                      type="text"
                      name="ownerName"
                      placeholder="أحمد محمد"
                      value={formData.ownerName}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '10px 40px 10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#0F766E'}
                      onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.85rem', color: '#1a1a1a' }}>
                    البريد الإلكتروني *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6c757d' }} />
                    <input
                      type="email"
                      name="ownerEmail"
                      placeholder="example@mail.com"
                      value={formData.ownerEmail}
                      onChange={handleChange}
                      dir="ltr"
                      style={{
                        width: '100%',
                        padding: '10px 40px 10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#0F766E'}
                      onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                    />
                  </div>
                </div>
              </div>

              {/* Phone & Password */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.85rem', color: '#1a1a1a' }}>
                    رقم الهاتف *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6c757d' }} />
                    <input
                      type="tel"
                      name="ownerPhone"
                      placeholder="05xxxxxxxx"
                      value={formData.ownerPhone}
                      onChange={handleChange}
                      dir="ltr"
                      style={{
                        width: '100%',
                        padding: '10px 40px 10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#0F766E'}
                      onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.85rem', color: '#1a1a1a' }}>
                    كلمة المرور *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6c757d' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="ownerPassword"
                      placeholder="••••••••"
                      value={formData.ownerPassword}
                      onChange={handleChange}
                      dir="ltr"
                      style={{
                        width: '100%',
                        padding: '10px 40px 10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#0F766E'}
                      onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#6c757d'
                      }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Confirm Password */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.85rem', color: '#1a1a1a' }}>
                  تأكيد كلمة المرور *
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6c757d' }} />
                  <input
                    type={showPasswordConfirm ? 'text' : 'password'}
                    name="ownerPasswordConfirm"
                    placeholder="••••••••"
                    value={formData.ownerPasswordConfirm}
                    onChange={handleChange}
                    dir="ltr"
                    style={{
                      width: '100%',
                      padding: '10px 40px 10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#0F766E'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#6c757d'
                    }}
                  >
                    {showPasswordConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div style={{ borderTop: '1px solid #e9ecef', margin: '24px 0' }} />

              <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '20px', color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building size={20} style={{ color: '#0F766E' }} />
                معلومات المعرض
              </h2>

              {/* Showroom Name */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.85rem', color: '#1a1a1a' }}>
                  اسم المعرض *
                </label>
                <div style={{ position: 'relative' }}>
                  <Building size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6c757d' }} />
                  <input
                    type="text"
                    name="showroomName"
                    placeholder="معرض أحمد للسيارات"
                    value={formData.showroomName}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '10px 40px 10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#0F766E'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                </div>
              </div>

              {/* City & Address */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.85rem', color: '#1a1a1a' }}>
                    المدينة *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6c757d' }} />
                    <select
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '10px 40px 10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        outline: 'none',
                        background: 'white',
                        cursor: 'pointer',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#0F766E'}
                      onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                    >
                      <option value="">اختر المدينة</option>
                      <option value="riyadh">الرياض</option>
                      <option value="jeddah">جدة</option>
                      <option value="dammam">الدمام</option>
                      <option value="medina">المدينة</option>
                      <option value="mecca">مكة</option>
                      <option value="khobar">الخبر</option>
                      <option value="abha">أبها</option>
                      <option value="tabuk">تبوك</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.85rem', color: '#1a1a1a' }}>
                    العنوان *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6c757d' }} />
                    <input
                      type="text"
                      name="address"
                      placeholder="شارع الملك فهد، الحي الشرقي"
                      value={formData.address}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '10px 40px 10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#0F766E'}
                      onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Rental Settings */}
          {currentStep === 2 && (
            <div style={{ animation: 'slideIn 0.3s ease-out' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '20px', color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={20} style={{ color: '#0F766E' }} />
                إعدادات التأجير
              </h2>

              <div style={{ 
                background: '#f0fdf4',
                border: '1px solid #86efac',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '24px',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start'
              }}>
                <AlertCircle size={20} style={{ color: '#16a34a', flexShrink: 0, marginTop: '2px' }} />
                <p style={{ fontSize: '0.9rem', color: '#166534', margin: 0 }}>
                  يمكنك تعديل هذه الإعدادات لاحقاً من لوحة التحكم الخاصة بك
                </p>
              </div>

              {/* Late Fee */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.85rem', color: '#1a1a1a' }}>
                  سعر التأخير بالساعة *
                </label>
                <div style={{ position: 'relative' }}>
                  <DollarSign size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6c757d' }} />
                  <input
                    type="number"
                    name="lateFeePricePerHour"
                    min="0"
                    value={formData.lateFeePricePerHour}
                    onChange={handleNumberChange}
                    style={{
                      width: '100%',
                      padding: '10px 40px 10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#0F766E'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6c757d', fontSize: '0.9rem' }}>
                    ر.س
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#6c757d', marginTop: '6px' }}>
                  السعر الذي سيتم فرضه على المستأجر عند تأخره عن موعد الإرجاع
                </p>
              </div>

              {/* Grace Period */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.85rem', color: '#1a1a1a' }}>
                  فترة السماح (بالساعات) *
                </label>
                <div style={{ position: 'relative' }}>
                  <Clock size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6c757d' }} />
                  <input
                    type="number"
                    name="gracePeriodHours"
                    min="0"
                    value={formData.gracePeriodHours}
                    onChange={handleNumberChange}
                    style={{
                      width: '100%',
                      padding: '10px 40px 10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#0F766E'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6c757d', fontSize: '0.9rem' }}>
                    ساعات
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#6c757d', marginTop: '6px' }}>
                  الوقت المسموح به قبل بدء حساب رسوم التأخير
                </p>
              </div>

              {/* Preview */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e9ecef',
                borderRadius: '12px',
                padding: '16px',
                marginTop: '24px'
              }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '12px', color: '#1a1a1a' }}>
                  معاينة الإعدادات
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ background: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                    <p style={{ fontSize: '0.75rem', color: '#6c757d', margin: '0 0 4px 0' }}>سعر التأخير</p>
                    <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#0F766E', margin: 0 }}>
                      {formData.lateFeePricePerHour} ر.س/ساعة
                    </p>
                  </div>
                  <div style={{ background: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                    <p style={{ fontSize: '0.75rem', color: '#6c757d', margin: '0 0 4px 0' }}>فترة السماح</p>
                    <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#0F766E', margin: 0 }}>
                      {formData.gracePeriodHours} ساعات
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Documents */}
          {currentStep === 3 && (
            <div style={{ animation: 'slideIn 0.3s ease-out' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '20px', color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={20} style={{ color: '#0F766E' }} />
                الوثائق الرسمية
              </h2>

              {/* Logo Upload */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', fontSize: '0.85rem', color: '#1a1a1a' }}>
                  📷 شعار المعرض *
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'logo')}
                  onClick={() => logoInputRef.current?.click()}
                  style={{
                    border: '2px dashed #0F766E',
                    borderRadius: '12px',
                    padding: '24px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: files.logoPreview ? 'transparent' : '#f0fdf4',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '180px'
                  }}
                  onMouseEnter={(e) => {
                    if (!files.logoPreview) e.currentTarget.style.background = '#e0f2fe';
                  }}
                  onMouseLeave={(e) => {
                    if (!files.logoPreview) e.currentTarget.style.background = '#f0fdf4';
                  }}
                >
                  {files.logoPreview ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <img src={files.logoPreview} alt="Logo" style={{ maxWidth: '100px', maxHeight: '100px', borderRadius: '8px' }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10B981' }}>
                        <CheckCircle size={18} />
                        <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>تم رفع الشعار بنجاح</span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: '#6c757d', margin: 0 }}>اضغط لتغيير الصورة</p>
                      {uploadProgress.logo < 100 && uploadProgress.logo > 0 && (
                        <div style={{ width: '100%', height: '4px', background: '#e9ecef', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${uploadProgress.logo}%`, height: '100%', background: '#0F766E', transition: 'width 0.2s' }} />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <ImageIcon size={32} style={{ color: '#0F766E', margin: '0 auto 12px' }} />
                      <p style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#0F766E', margin: '0 0 4px 0' }}>
                        اسحب الصورة أو اضغط للاختيار
                      </p>
                      <p style={{ fontSize: '0.75rem', color: '#6c757d', margin: 0 }}>
                        PNG, JPG - حتى 2MB
                      </p>
                    </div>
                  )}
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Commercial Register */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', fontSize: '0.85rem', color: '#1a1a1a' }}>
                  📄 السجل التجاري *
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'commercial')}
                  onClick={() => commercialInputRef.current?.click()}
                  style={{
                    border: '2px dashed #0F766E',
                    borderRadius: '12px',
                    padding: '24px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: files.commercial ? 'transparent' : '#f0fdf4',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '140px'
                  }}
                  onMouseEnter={(e) => {
                    if (!files.commercial) e.currentTarget.style.background = '#e0f2fe';
                  }}
                  onMouseLeave={(e) => {
                    if (!files.commercial) e.currentTarget.style.background = '#f0fdf4';
                  }}
                >
                  {files.commercial ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <FileCheck size={32} style={{ color: '#10B981' }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10B981' }}>
                        <CheckCircle size={18} />
                        <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>تم رفع الملف</span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: '#6c757d', margin: '0 0 8px 0' }}>
                        {files.commercialName}
                      </p>
                      {uploadProgress.commercial < 100 && uploadProgress.commercial > 0 && (
                        <div style={{ width: '100%', height: '4px', background: '#e9ecef', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${uploadProgress.commercial}%`, height: '100%', background: '#0F766E', transition: 'width 0.2s' }} />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <Upload size={32} style={{ color: '#0F766E', margin: '0 auto 12px' }} />
                      <p style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#0F766E', margin: '0 0 4px 0' }}>
                        اسحب الملف أو اضغط للاختيار
                      </p>
                      <p style={{ fontSize: '0.75rem', color: '#6c757d', margin: 0 }}>
                        PDF فقط - حتى 5MB
                      </p>
                    </div>
                  )}
                </div>
                <input
                  ref={commercialInputRef}
                  type="file"
                  accept=".pdf,image/*"
                  onChange={handleCommercialChange}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Owner ID */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', fontSize: '0.85rem', color: '#1a1a1a' }}>
                  🪪 هوية المالك *
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'id')}
                  onClick={() => idInputRef.current?.click()}
                  style={{
                    border: '2px dashed #0F766E',
                    borderRadius: '12px',
                    padding: '24px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: files.ownerId ? 'transparent' : '#f0fdf4',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '140px'
                  }}
                  onMouseEnter={(e) => {
                    if (!files.ownerId) e.currentTarget.style.background = '#e0f2fe';
                  }}
                  onMouseLeave={(e) => {
                    if (!files.ownerId) e.currentTarget.style.background = '#f0fdf4';
                  }}
                >
                  {files.ownerId ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <FileCheck size={32} style={{ color: '#10B981' }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10B981' }}>
                        <CheckCircle size={18} />
                        <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>تم رفع الصورة</span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: '#6c757d', margin: '0 0 8px 0' }}>
                        صورة أمامية واضحة
                      </p>
                      {uploadProgress.ownerId < 100 && uploadProgress.ownerId > 0 && (
                        <div style={{ width: '100%', height: '4px', background: '#e9ecef', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${uploadProgress.ownerId}%`, height: '100%', background: '#0F766E', transition: 'width 0.2s' }} />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <ImageIcon size={32} style={{ color: '#0F766E', margin: '0 auto 12px' }} />
                      <p style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#0F766E', margin: '0 0 4px 0' }}>
                        اسحب الصورة أو اضغط للاختيار
                      </p>
                      <p style={{ fontSize: '0.75rem', color: '#6c757d', margin: 0 }}>
                        صورة أمامية واضحة - PNG, JPG - حتى 3MB
                      </p>
                    </div>
                  )}
                </div>
                <input
                  ref={idInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleIdChange}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Terms & Conditions */}
              <div style={{
                background: '#fef3c7',
                border: '1px solid #fcd34d',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '24px',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start'
              }}>
                <AlertCircle size={20} style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />
                <p style={{ fontSize: '0.9rem', color: '#92400e', margin: 0 }}>
                  تأكد من أن جميع الوثائق واضحة وصحيحة. قد يتم رفض طلبك إذا كانت الوثائق غير مكتملة أو غير واضحة.
                </p>
              </div>

              {/* Checkbox */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '24px' }}>
                <input
                  type="checkbox"
                  id="terms"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer',
                    marginTop: '2px',
                    accentColor: '#0F766E'
                  }}
                />
                <label htmlFor="terms" style={{ fontSize: '0.9rem', color: '#1a1a1a', cursor: 'pointer' }}>
                  ☑ أوافق على <strong>الشروط والأحكام</strong> و<strong>سياسة الخصوصية</strong> الخاصة بمنصة لبيتكم
                </label>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between', marginTop: '32px' }}>
            <button
              type="button"
              onClick={handlePrevStep}
              disabled={currentStep === 1}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                border: '1px solid #d1d5db',
                background: 'white',
                color: '#1a1a1a',
                borderRadius: '8px',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
                opacity: currentStep === 1 ? 0.5 : 1,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (currentStep > 1) {
                  e.target.style.background = '#f8fafc';
                  e.target.style.borderColor = '#0F766E';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'white';
                e.target.style.borderColor = '#d1d5db';
              }}
            >
              <ChevronLeft size={18} /> السابق
            </button>

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  background: '#0F766E',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#0d5f57';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(15, 118, 110, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#0F766E';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                التالي
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  background: '#10B981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
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
                {loading ? 'جاري معالجة الطلب...' : '✓ تقديم طلب الانضمام'}
              </button>
            )}
          </div>
        </form>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @media (max-width: 768px) {
          [style*="max-width: 850px"] {
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
