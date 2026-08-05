import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import {
  Users, LayoutDashboard, ShieldAlert, Car, Settings, MessageSquare,
  CheckCircle, Clock, AlertTriangle, X, Send, Filter, User,
  Zap, Circle, Check, AlertOctagon, MoreHorizontal, Shield, Paperclip, FileText,
  Eye, Edit, Trash2, Star, Pin, ChevronDown, Search
} from 'lucide-react';
import { format } from 'date-fns';

const STATUS_MAP = {
  pending: { label: 'قيد المراجعة', icon: Clock, color: '#ffc107' },
  active: { label: 'نشط', icon: CheckCircle, color: '#28a745' },
  rejected: { label: 'مرفوض', icon: AlertTriangle, color: '#dc3545' },
};

const AD_TYPE_MAP = {
  discount: 'خصم',
  featured: 'إعلان مميز',
  main: 'إعلان رئيسي',
  urgent: 'إعلان عاجل',
};


const DURATION_MAP = {
  '3_days': '3 أيام',
  'week': 'أسبوع',
  'two_weeks': 'أسبوعين',
  'month': 'شهر',
  'custom': 'مخصص',
};

export default function Admins() {
  const { user } = useAuthStore();
  const [s, sets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const [selectedAd, setSelectedAd] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState('create'); // create or edit
  const [suppliers, setSuppliers] = useState([]);
  const [supplierCars, setSupplierCars] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [selectedCar, setSelectedCar] = useState(null);
  const [searchSupplier, setSearchSupplier] = useState('');
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    ad_type: 'discount',
    discount: 0,
    price: 0,
    duration: '3_days',
    start_date: '',
    end_date: '',
    status: 'pending',
  });

  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchs();
  }, []);

  const fetchs = async () => {
    try {
      const res = await adminAPI.gets();
      sets(res.data.data);
    } catch (error) {
      toast.error('فشل جلب الإعلانات');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async (query = '') => {
    try {
      const res = await adminAPI.getSuppliers({ search: query });
      setSuppliers(res.data.data);
    } catch (error) {
      toast.error('فشل جلب الموردين');
    }
  };

  const fetchSupplierCars = async (supplierId) => {
    // console.log("supplierId =", supplierId);
    try {
      const res = await adminAPI.getSupplierCars(supplierId);
      setSupplierCars(res.data.data);
    } catch (error) {
      toast.error('فشل جلب سيارات المورد');
    }
  };

  const handleSupplierSearch = (e) => {
    const value = e.target.value;
    setSearchSupplier(value);
    if (value.length > 0) {
      fetchSuppliers(value);
      setShowSupplierDropdown(true);
    } else {
      setShowSupplierDropdown(false);
    }
  };

  const handleSelectSupplier = (supplier) => {
    setSelectedSupplier(supplier);
    setSearchSupplier(supplier.name);
    setShowSupplierDropdown(false);
    setSelectedCar(null);
    setSupplierCars([]);
    fetchSupplierCars(supplier.id);
  };

  const handleSelectCar = (car) => {
    setSelectedCar(car);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateAd = async (e) => {
    console.log("تم الضغط على زر إنشاء");
    e.preventDefault();
  
    if (!selectedSupplier || !selectedCar) {
      return toast.error("يرجى اختيار المورد والسيارة");
    }
  
    if (!formData.title.trim()) {
      return toast.error("يرجى إدخال عنوان الإعلان");
    }
  
    try {
  
      const adData = {
        ...formData,
        supplier_id: selectedSupplier.id,
        car_id: selectedCar.id,
      };
  
      if (formMode === "create") {
        console.log(selectedSupplier);
        console.log(selectedCar);
        await adminAPI.createAdvertisement(adData);
  
        toast.success("تم إنشاء الإعلان بنجاح");
  
      } else {
  
        await adminAPI.updateAdvertisement(
          selectedAd.id,
          adData
        );
  
        toast.success("تم تحديث الإعلان بنجاح");
  
      }
  
      resetForm();
  
      fetchs();
  
    } catch (error) {
  
      toast.error(
        error.response?.data?.message || "فشل العملية"
      );
  
    }
  };                   

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      ad_type: 'discount',
      discount: 0,
      price: 0,
      duration: '3_days',
      start_date: '',
      end_date: '',
      status: 'pending',
    });
  
    setSelectedSupplier(null);
    setSelectedCar(null);
    setSearchSupplier('');
    setSupplierCars([]);
    setFormMode('create');
  };

  const handleEditAd = (ad) => {
    setSelectedAd(ad);
    setFormMode('edit');
    setFormData({
      title: ad.title,
      description: ad.description,
      ad_type: ad.ad_type,
      discount: ad.discount || 0,
      price: ad.price,
      duration: ad.duration,
      start_date: ad.start_date,
      end_date: ad.end_date,
      status: ad.status,
    });
    setSelectedSupplier(ad.supplier_id);
    setSelectedCar(ad.car_id);
    setShowForm(true);
  };

  const handleDeleteAd = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الإعلان؟')) return;
    setDeleting(true);
    try {
      await adminAPI.delete(id);
      toast.success('تم حذف الإعلان بنجاح');
      fetchs();
    } catch (error) {
      toast.error(error.response?.data?.message || 'فشل الحذف');
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    setUpdatingStatus(true);
    try {
      await adminAPI.update(id, { status: newStatus });
      toast.success('تم تحديث حالة الإعلان');
      fetchs();
    } catch (error) {
      toast.error(error.response?.data?.message || 'فشل التحديث');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleToggleFeatured = async (id, currentFeatured) => {
    try {
      await adminAPI.update(id, { featured: !currentFeatured });
      toast.success('تم تحديث الإعلان');
      fetchs();
    } catch (error) {
      toast.error('فشل التحديث');
    }
  };

  const handleTogglePinned = async (id, currentPinned) => {
    try {
      await adminAPI.update(id, { is_pinned: !currentPinned });
      toast.success('تم تحديث الإعلان');
      fetchs();
    } catch (error) {
      toast.error('فشل التحديث');
    }
  };

  const filtered = filter === 'all' ? s : s.filter(a => a.status === filter);
  
  const stats = {
    total: s.length,
    active: s.filter(a => a.status === 'active').length,
    pending: s.filter(a => a.status === 'pending').length,
    rejected: s.filter(a => a.status === 'rejected').length,
  };
  console.log();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f8f9fa' }}>
      {/* Sidebar */}
      <div className="sidebar" style={{ width: '260px', background: 'white', borderLeft: '1px solid #e9ecef', padding: '24px 0', position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 100 }}>
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Link to="/admin/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: '#1a1a1a', textDecoration: 'none' }}>
            <LayoutDashboard size={20} /> الإحصائيات
          </Link>
          <Link to="/admin/users" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: '#1a1a1a', textDecoration: 'none' }}>
            <Users size={20} /> المستخدمين
          </Link>
          <Link to="/admin/cars" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: '#1a1a1a', textDecoration: 'none' }}>
            <Car size={20} /> السيارات
          </Link>
          <Link to="/admin/complaints" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: '#1a1a1a', textDecoration: 'none' }}>
            <ShieldAlert size={20} /> الشكاوى
          </Link>
          <Link to="/admin/s" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', background: '#e9ecef', color: '#0a58ca', fontWeight: 'bold', textDecoration: 'none' }}>
            <Zap size={20} /> الإعلانات
          </Link>
          <Link to="/admin/settings" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: '#1a1a1a', textDecoration: 'none' }}>
            <Settings size={20} /> الإعدادات
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div style={{ marginRight: '260px', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Stats cards */}
        <div style={{ padding: '24px', background: 'white', borderBottom: '1px solid #e9ecef', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <div style={{ padding: '16px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' }}>
            <div style={{ fontSize: '0.8rem', color: '#6c757d', marginBottom: '8px' }}>📢 إجمالي الإعلانات</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#0a58ca' }}>{stats.total}</div>
          </div>
          <div style={{ padding: '16px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' }}>
            <div style={{ fontSize: '0.8rem', color: '#6c757d', marginBottom: '8px' }}>🟢 الإعلانات النشطة</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#28a745' }}>{stats.active}</div>
          </div>
          <div style={{ padding: '16px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' }}>
            <div style={{ fontSize: '0.8rem', color: '#6c757d', marginBottom: '8px' }}>🟡 قيد المراجعة</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#ffc107' }}>{stats.pending}</div>
          </div>
          <div style={{ padding: '16px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' }}>
            <div style={{ fontSize: '0.8rem', color: '#6c757d', marginBottom: '8px' }}>🔴 المنتهية</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#dc3545' }}>{stats.rejected}</div>
          </div>
        </div>

        {/* Toolbar */}
        <div style={{ padding: '16px 24px', background: 'white', borderBottom: '1px solid #e9ecef', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6c757d' }} />
            <input
              type="text"
              placeholder="ابحث عن المورد..."
              value={searchSupplier}
              onChange={handleSupplierSearch}
              onFocus={() => searchSupplier && setShowSupplierDropdown(true)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                border: '1px solid #e9ecef',
                borderRadius: '6px',
                fontSize: '0.85rem',
              }}
            />
            {showSupplierDropdown && suppliers.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'white',
                border: '1px solid #e9ecef',
                borderTop: 'none',
                borderRadius: '0 0 6px 6px',
                maxHeight: '200px',
                overflowY: 'auto',
                zIndex: 10,
              }}>
                {suppliers.map(supplier => (
                  <div
                    key={supplier._id}
                    onClick={() => handleSelectSupplier(supplier)}
                    style={{
                      padding: '12px',
                      borderBottom: '1px solid #e9ecef',
                      cursor: 'pointer',
                      background: 'white',
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#f8f9fa'}
                    onMouseLeave={(e) => e.target.style.background = 'white'}
                  >
                    <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{supplier.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>{supplier.email}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #e9ecef',
              borderRadius: '6px',
              fontSize: '0.85rem',
              cursor: 'pointer',
              background: 'white',
            }}
          >
            <option value="all">جميع الحالات</option>
            <option value="pending">قيد المراجعة</option>
            <option value="active">نشط</option>
            <option value="rejected">مرفوض</option>
          </select>

          <button
      onClick={() => {
        console.log("قبل:", showForm);
        setShowForm(true);
        console.log("تم استدعاء setShowForm");
    }}
    
            style={{
              padding: '8px 16px',
              background: '#0a58ca',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.85rem',
            }}
       
          >
            +  إعلان
          </button>
        </div>
        
        {/* Selected supplier info */}
        {selectedSupplier && (
          <div style={{ padding: '16px 24px', background: '#f8f9fa', borderBottom: '1px solid #e9ecef', borderRadius: '8px', margin: '16px 24px 0' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '20px', fontSize: '0.9rem' }}>المورد</div>
            <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '4px solid #e9ecef' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '9px' }}>
                <User size={30} /> <strong>{selectedSupplier.name}</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontSize: '0.85rem', color: '#6c757d' }}>
              <User size={30} /> <strong>{selectedSupplier.address}</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#6c757d' }}>
                <Car size={30} /> عدد السيارات: <strong>{selectedSupplier.cars_count}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Main content area */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: '#f8f9fa' }}>
          {/* Left panel - s list */}
          <div style={{
            width: showForm ? '400px' : (selectedAd ? '300px' : '100%'),
            borderLeft: '1px solid #e9ecef',
            overflowY: 'auto',
            flexShrink: 0,
            transition: 'width 0.3s',
            background: 'white',
            boxShadow: selectedAd ? '2px 0 8px rgba(0,0,0,0.05)' : 'none',
          }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}><div className="spinner"></div></div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#6c757d' }}>
                <Zap size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                <p>لا توجد إعلانات</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {filtered.map(ad => {
                  const StatusIcon = STATUS_MAP[ad.status]?.icon || Circle;
                  return (
                    <div
                      key={ad._id}
                      onClick={() => setSelectedAd(ad)}
                      style={{
                        padding: '16px 20px',
                        borderBottom: '1px solid #e9ecef',
                        cursor: 'pointer',
                        background: selectedAd?._id === ad._id ? 'rgba(13,110,253,0.05)' : 'transparent',
                        borderRight: selectedAd?._id === ad._id ? '3px solid #0a58ca' : '3px solid transparent',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '8px' }}>
                        <p style={{ fontWeight: 'bold', fontSize: '0.85rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                          {ad.title}
                        </p>
                        <span style={{
                          background: STATUS_MAP[ad.status]?.color || '#6c757d',
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '20px',
                          fontSize: '0.65rem',
                          fontWeight: 'bold',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}>
                          <StatusIcon size={10} /> {STATUS_MAP[ad.status]?.label || ad.status}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '0.7rem', color: '#6c757d', marginBottom: '6px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><User size={12} /> {ad.supplier_id?.name || 'مورد'}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Zap size={12} /> {AD_TYPE_MAP[ad.ad_type] || ad.ad_type}</span>
                      </div>
                      <p style={{ fontSize: '0.65rem', color: '#6c757d', marginTop: '6px' }}>
                        {ad.created_at ? format(new Date(ad.created_at), 'yyyy-MM-dd HH:mm') : '---'}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right panel - Details and Form */}
          {selectedAd && !showForm && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: '#f8f9fa', overflowY: 'auto' }}>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid #e9ecef', background: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h2 style={{ fontWeight: 'bold', fontSize: '1.1rem', display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                      <Zap size={18} color="#0a58ca" />
                      {selectedAd.title}
                      <span style={{
                        background: STATUS_MAP[selectedAd.status]?.color || '#6c757d',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '20px',
                        fontSize: '0.65rem',
                        fontWeight: 'bold',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}>
                        {STATUS_MAP[selectedAd.status]?.label}
                      </span>
                    </h2>
                    <p style={{ fontSize: '0.8rem', color: '#6c757d', margin: 0 }}>
                      المورد: <strong>{selectedAd.supplier_id?.name}</strong> |
                      النوع: <strong>{AD_TYPE_MAP[selectedAd.ad_type]}</strong>
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDetailsModal(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '8px',
                      borderRadius: '6px',
                      color: '#6c757d',
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#f8f9fa'}
                    onMouseLeave={(e) => e.target.style.background = 'none'}
                  >
                    <MoreHorizontal size={18} />
                  </button>
                </div>
              </div>

              <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '12px' }}>الوصف</h3>
                  <p style={{ fontSize: '0.85rem', color: '#6c757d', lineHeight: '1.6' }}>
                    {selectedAd.description || 'لا يوجد وصف'}
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: '#6c757d', fontWeight: 'bold', marginBottom: '6px' }}>نوع الإعلان</p>
                    <p style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{AD_TYPE_MAP[selectedAd.ad_type]}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: '#6c757d', fontWeight: 'bold', marginBottom: '6px' }}>المدة</p>
                    <p style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{DURATION_MAP[selectedAd.duration]}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: '#6c757d', fontWeight: 'bold', marginBottom: '6px' }}>السعر</p>
                    <p style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>${selectedAd.price}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: '#6c757d', fontWeight: 'bold', marginBottom: '6px' }}>نسبة الخصم</p>
                    <p style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{selectedAd.discount || 0}%</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: '#6c757d', fontWeight: 'bold', marginBottom: '6px' }}>تاريخ البداية</p>
                    <p style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{format(new Date(selectedAd.start_date), 'yyyy-MM-dd')}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: '#6c757d', fontWeight: 'bold', marginBottom: '6px' }}>تاريخ النهاية</p>
                    <p style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{format(new Date(selectedAd.end_date), 'yyyy-MM-dd')}</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: '#6c757d', fontWeight: 'bold', marginBottom: '6px' }}>حالة الدفع</p>
                    <p style={{ fontSize: '0.9rem', fontWeight: 'bold', color: selectedAd.payment_status === 'paid' ? '#28a745' : '#dc3545' }}>
                      {selectedAd.payment_status === 'paid' ? 'مدفوع' : 'غير مدفوع'}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: '#6c757d', fontWeight: 'bold', marginBottom: '6px' }}>الحالة</p>
                    <p style={{ fontSize: '0.9rem', fontWeight: 'bold', color: STATUS_MAP[selectedAd.status]?.color }}>
                      {STATUS_MAP[selectedAd.status]?.label}
                    </p>
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleEditAd(selectedAd)}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      background: '#0a58ca',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <Edit size={16} /> تعديل
                  </button>

                  {selectedAd.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(selectedAd._id, 'active')}
                        style={{
                          flex: 1,
                          padding: '10px 16px',
                          background: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                        }}
                      >
                        <Check size={16} /> قبول
                      </button>

                      <button
                        onClick={() => handleUpdateStatus(selectedAd._id, 'rejected')}
                        style={{
                          flex: 1,
                          padding: '10px 16px',
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                        }}
                      >
                        <X size={16} /> رفض
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => handleToggleFeatured(selectedAd._id, selectedAd.featured)}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      background: selectedAd.featured ? '#ffc107' : '#e9ecef',
                      color: selectedAd.featured ? 'white' : '#1a1a1a',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <Star size={16} /> مميز
                  </button>

                  <button
                    onClick={() => handleTogglePinned(selectedAd._id, selectedAd.is_pinned)}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      background: selectedAd.is_pinned ? '#0a58ca' : '#e9ecef',
                      color: selectedAd.is_pinned ? 'white' : '#1a1a1a',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <Pin size={16} /> تثبيت
                  </button>

                  <button
                    onClick={() => handleDeleteAd(selectedAd._id)}
                    disabled={deleting}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      opacity: deleting ? 0.6 : 1,
                    }}
                  >
                    <Trash2 size={16} /> حذف
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Form panel */}
          {showForm && (
            
  
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: '#f8f9fa', overflowY: 'auto' }}>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid #e9ecef', background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontWeight: 'bold', fontSize: '1.1rem', margin: 0 }}>
                  {formMode === 'create' ? 'إنشاء إعلان جديد' : 'تعديل الإعلان'}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '6px',
                    color: '#6c757d',
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#f8f9fa'}
                  onMouseLeave={(e) => e.target.style.background = 'none'}
                >
                  <X size={18} />مممم
                </button>
              </div>

              <form onSubmit={handleCreateAd} style={ { padding: '24px', flex: 1, overflowY: 'auto' }}>
                {/* Supplier selection */}
                {formMode === 'create' && (
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px' }}>اختر المورد</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        placeholder="ابحث عن المورد..."
                        value={searchSupplier}
                        onChange={handleSupplierSearch}
                        onFocus={() => searchSupplier && setShowSupplierDropdown(true)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #e9ecef',
                          borderRadius: '6px',
                          fontSize: '0.85rem',
                        }}
                      />
                      {showSupplierDropdown && suppliers.length > 0 && (
                        <div style={{
                          position: 'absolute',
                          top: '-40%',
                          left: 0,
                          right: 0,
                          background: 'white',
                          border: '1px solid #e',
                          borderTop: 'none',
                          borderRadius: '0 0 6px 6px',
                          maxHeight: '150px',
                          overflowY: 'auto',
                          zIndex: 10,
                        }}>
                          {suppliers.map(supplier => (
                            <div
                              key={supplier.id}
                              onClick={() => handleSelectSupplier(supplier)}
                              style={{
                                padding: '10px 12px',
                                borderBottom: '4px solid #e9ecef',
                                cursor: 'pointer',
                                background: 'white',
                              }}
                              onMouseEnter={(e) => e.target.style.background = '#f8f9fa'}
                              onMouseLeave={(e) => e.target.style.background = 'white'}
                            >
                              <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{supplier.name}</div>
                              <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>{supplier.email}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {selectedSupplier && (
                      <div style={{ marginTop: '12px', padding: '12px', background: '#e9ecef', borderRadius: '6px', fontSize: '0.85rem' }}>
                        ✓ تم اختيار: <strong>{selectedSupplier.name}</strong>
                      </div>
                    )}
                  </div>
                )}

                {/* Car selection */}
                {selectedSupplier && formMode === 'create' && (
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px' }}>اختر السيارة</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {supplierCars.map(car => (
                        <label key={car._id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', border: '1px solid #e9ecef', borderRadius: '6px', cursor: 'pointer', background: selectedCar?._id === car._id ? '#e9ecef' : 'white' }}>
                          <input
                            type="radio"
                            name="car"
                            checked={selectedCar?.id === car.id}
                            onChange={() => handleSelectCar(car)}
                            style={{ cursor: 'pointer' }}
                          />
                          <div>
                            <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>ID {car._id} - {car.make} {car.model} {car.year}</div>
                            <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>السعر: ${car.price}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Form fields */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px' }}>عنوان الإعلان</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleFormChange}
                    placeholder="أدخل عنوان الإعلان"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e9ecef',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px' }}>وصف الإعلان</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    placeholder="أدخل وصف الإعلان"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e9ecef',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      minHeight: '80px',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px' }}>نوع الإعلان</label>
                    <select
                      name="ad_type"
                      value={formData.ad_type}
                      onChange={handleFormChange}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #e9ecef',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                      }}
                    >
                      <option value="discount">خصم</option>
                      <option value="featured">إعلان مميز</option>
                      <option value="main">إعلان رئيسي</option>
                      <option value="urgent">إعلان عاجل</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px' }}>نسبة الخصم %</label>
                    <input
                      type="number"
                      name="discount"
                      value={formData.discount}
                      onChange={handleFormChange}
                      min="0"
                      max="100"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #e9ecef',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px' }}>مدة الإعلان</label>
                    <select
                      name="duration"
                      value={formData.duration}
                      onChange={handleFormChange}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #e9ecef',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                      }}
                    >
                      <option value="3_days">3 أيام</option>
                      <option value="week">أسبوع</option>
                      <option value="two_weeks">أسبوعين</option>
                      <option value="month">شهر</option>
                      <option value="custom">مخصص</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px' }}>رسوم الإعلان</label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleFormChange}
                      placeholder="0"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #e9ecef',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px' }}>تاريخ البداية</label>
                    <input
                      type="date"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleFormChange}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #e9ecef',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px' }}>تاريخ النهاية</label>
                    <input
                      type="date"
                      name="end_date"
                      value={formData.end_date}
                      onChange={handleFormChange}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #e9ecef',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px' }}>الحالة</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleFormChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e9ecef',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                    }}
                  >
                    <option value="pending">قيد المراجعة</option>
                    <option value="active">نشط</option>
                    <option value="rejected">مرفوض</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      background: '#0a58ca',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '0.85rem',
                    }}
                  >
                    {formMode === 'create' ? 'إنشاء الإعلان' : 'تحديث الإعلان'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      resetForm();
                    }}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      background: '#e9ecef',
                      color: '#1a1a1a',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '0.85rem',
                    }}
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
           
          )}
          
        </div>
      </div>
    </div>
  );
}
