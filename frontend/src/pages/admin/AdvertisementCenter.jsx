import { useEffect, useMemo, useState } from 'react';
import { BarChart3, CheckCircle2, Clock3, Eye, FilePlus2, LayoutDashboard, Megaphone, MousePointerClick, Pencil, Plus, RefreshCw, Search, Settings, ShieldAlert, Trash2, Users, XCircle, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminAPI } from '../../services/api';

const navy = '#173a52';
const gold = '#d4af37';
const muted = '#6c7a86';
const statuses = { draft: ['مسودة', '#66737d', '#f0f2f4'], pending: ['قيد المراجعة', '#a66a00', '#fff6df'], active: ['نشط', '#18704b', '#e9f8f0'], paused: ['متوقف', '#7a5f22', '#fff7dc'], rejected: ['مرفوض', '#a23a3a', '#fff0f0'], expired: ['منتهٍ', '#66737d', '#f0f2f4'] };
const requestStatuses = { pending: ['قيد المراجعة', '#a66a00', '#fff6df'], approved: ['معتمد', '#18704b', '#e9f8f0'], rejected: ['مرفوض', '#a23a3a', '#fff0f0'] };
const blankForm = { supplier_id: '', car_id: '', title: '', description: '', ad_type: 'featured', placement: 'cars', image_url: '', link_url: '', price: 0, budget: 0, start_date: '', end_date: '', status: 'draft', featured: false, is_pinned: false };

export default function AdvertisementCenter() {
  const [tab, setTab] = useState('overview');
  const [ads, setAds] = useState([]);
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({ total_ads: 0, active_ads: 0, pending_ads: 0, inactive_ads: 0, impressions: 0, clicks: 0, total_requests: 0, pending_requests: 0, approved_requests: 0, rejected_requests: 0, total_budget: 0 });
  const [suppliers, setSuppliers] = useState([]);
  const [supplierCars, setSupplierCars] = useState([]);
  const [form, setForm] = useState(blankForm);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const filteredAds = useMemo(() => ads.filter((ad) => {
    const matchesStatus = filter === 'all' || ad.status === filter;
    const text = `${ad.title || ''} ${ad.supplier_name || ''} ${ad.car_make || ''} ${ad.car_model || ''}`.toLowerCase();
    return matchesStatus && text.includes(search.toLowerCase());
  }), [ads, filter, search]);

  // const loadData = async () => {
  //   setLoading(true);
  
  //   const results = await Promise.allSettled([
  //     adminAPI.getAdvertisements(),
  //     adminAPI.getAdvertisementRequests(),
  //     adminAPI.getAdvertisementStats(),
  //     adminAPI.getSuppliers(),
  //   ]);
  
  //   const [
  //     adsResponse,
  //     requestsResponse,
  //     statsResponse,
  //     suppliersResponse,
  //   ] = results;
  
  //   if (adsResponse.status === 'fulfilled') {
  //     setAds(adsResponse.value.data?.data || []);
  //   } else {
  //     console.error('Advertisements error:', adsResponse.reason);
  //   }
  
  //   if (requestsResponse.status === 'fulfilled') {
  //     setRequests(
  //       requestsResponse.value.data?.data || []
  //     );
  //   } else {
  //     console.error('Advertisement requests error:', requestsResponse.reason);
  //   }
  
  //   if (statsResponse.status === 'fulfilled') {
  //     setStats((current) => ({
  //       ...current,
  //       ...(statsResponse.value.data?.data || {}),
  //     }));
  //   } else {
  //     console.error('Advertisement stats error:', statsResponse.reason);
  //   }
  
  //   if (suppliersResponse.status === 'fulfilled') {
  //     setSuppliers(
  //       suppliersResponse.value.data?.data || []
  //     );
  //   } else {
  //     console.error('Suppliers error:', suppliersResponse.reason);
  //   }
  
  //   const hasErrors = results.some(
  //     (result) => result.status === 'rejected'
  //   );
  
  //   if (hasErrors) {
  //     toast.error(
  //       'تعذر تحميل بعض بيانات الإعلانات'
  //     );
  //   }
  
  //   setLoading(false);
  // };
  
  const loadData = async () => {
    setLoading(true);
  
    const results = await Promise.allSettled([
      adminAPI.getAdvertisements(),
      adminAPI.getAdvertisementRequests(),
      adminAPI.getAdvertisementStats(),
      adminAPI.getSuppliers(),
    ]);
  
    const names = [
      'الإعلانات المنشورة',
      'طلبات الإعلانات',
      'إحصائيات الإعلانات',
      'الموردون',
    ];
  
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(
          `${names[index]} نجح:`,
          result.value.status,
          result.value.data
        );
      } else {
        console.error(
          `${names[index]} فشل:`,
          result.reason?.response?.status,
          result.reason?.response?.data ||
            result.reason?.message ||
            result.reason
        );
      }
    });
  
    const [adsResponse, requestsResponse, statsResponse, suppliersResponse] = results;
  
    if (adsResponse.status === 'fulfilled') {
      setAds(adsResponse.value.data?.data || []);
    }
  
    if (requestsResponse.status === 'fulfilled') {
      setRequests(requestsResponse.value.data?.data || []);
    }
  
    if (statsResponse.status === 'fulfilled') {
      setStats((current) => ({
        ...current,
        ...(statsResponse.value.data?.data || {}),
      }));
    }
  
    if (suppliersResponse.status === 'fulfilled') {
      setSuppliers(suppliersResponse.value.data?.data || []);
    }
  
    const failedNames = results
      .map((result, index) =>
        result.status === 'rejected' ? names[index] : null
      )
      .filter(Boolean);
  
    if (failedNames.length > 0) {
      toast.error(
        `فشل تحميل: ${failedNames.join('، ')}`
      );
    }
  
    setLoading(false);
  };
  
  useEffect(() => {
    const timer = window.setTimeout(() => { loadData(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const loadSupplierCars = async (supplierId) => {
    setForm((current) => ({ ...current, supplier_id: supplierId, car_id: '' }));
    if (!supplierId) return setSupplierCars([]);
    try {
      const response = await adminAPI.getSupplierCars(supplierId);
      setSupplierCars(response.data?.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذر تحميل سيارات المورد');
    }
  };

  const updateField = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('اختر صورة JPG أو PNG أو WEBP');
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم الصورة يجب ألا يتجاوز 5 ميجابايت');
      event.target.value = '';
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const resetForm = () => {
    setForm(blankForm);
    setSupplierCars([]);
    setEditingId(null);
    setImageFile(null);
    setImagePreview('');
  };

  const saveAdvertisement = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) return toast.error('أدخل عنوان الإعلان');
    setSaving(true);
    try {
      const formData = new FormData();

      Object.entries({
        ...form,
        price: Number(form.price || 0),
        budget: Number(form.budget || 0),
        supplier_id: form.supplier_id || '',
        car_id: form.car_id || '',
      }).forEach(([key, value]) => {
        if (key !== 'image_url') {
          formData.append(key, value ?? '');
        }
      });

      if (imageFile) {
        formData.append('image', imageFile);
      }

      if (editingId) {
        await adminAPI.updateAdvertisement(editingId, formData);
      } else {
        await adminAPI.createAdvertisement(formData);
      }
      toast.success(editingId ? 'تم تحديث الإعلان' : 'تم إنشاء الإعلان');
      resetForm();
      setTab('library');
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذر حفظ الإعلان');
    } finally {
      setSaving(false);
    }
  };

  const editAdvertisement = async (ad) => {
    setEditingId(ad.id);
    setImageFile(null);
    setImagePreview(ad.image_url || '');
    setForm({ supplier_id: ad.supplier_id || '', car_id: ad.car_id || '', title: ad.title || '', description: ad.description || '', ad_type: ad.ad_type || 'featured', placement: ad.placement || 'cars', image_url: ad.image_url || '', link_url: ad.link_url || '', price: ad.price || 0, budget: ad.budget || 0, start_date: ad.start_date || '', end_date: ad.end_date || '', status: ad.status || 'draft', featured: ad.featured || false, is_pinned: ad.is_pinned || false });
    if (ad.supplier_id) {
      try { const response = await adminAPI.getSupplierCars(ad.supplier_id); setSupplierCars(response.data?.data || []); } catch { setSupplierCars([]); }
    }
    setTab('create');
  };

  const updateStatus = async (id, status) => {
    try { await adminAPI.updateAdvertisement(id, { status }); toast.success('تم تحديث حالة الإعلان'); await loadData(); } catch (error) { toast.error(error.response?.data?.message || 'تعذر تحديث الحالة'); }
  };

  const deleteAd = async (id) => {
    if (!window.confirm('هل تريد حذف هذا الإعلان؟')) return;
    try { await adminAPI.deleteAdvertisement(id); toast.success('تم حذف الإعلان'); await loadData(); } catch (error) { toast.error(error.response?.data?.message || 'تعذر حذف الإعلان'); }
  };

  const reviewRequest = async (request, action) => {
    const note = action === 'reject'
      ? window.prompt('أدخل سبب الرفض')
      : '';
  
    if (action === 'reject' && note === null) {
      return;
    }
  
    try {
      if (action === 'approve') {
        await adminAPI.approveAdvertisement(request.id);
      } else if (action === 'reject') {
        if (!note.trim()) {
          toast.error('اكتب سبب الرفض');
          return;
        }
  
        await adminAPI.rejectAdvertisement(request.id, {
          note: note.trim(),
        });
      }
  
      toast.success(
        action === 'approve'
          ? 'تم اعتماد الطلب ونشر الإعلان'
          : 'تم رفض طلب الإعلان'
      );
  
      await loadData();
    } catch (error) {
      console.error('Review request error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
  
      toast.error(
        error.response?.data?.message ||
        'تعذر تحديث الطلب'
      );
    }
  };
  

  const overviewCards = [
    { label: 'الإعلانات النشطة', value: stats.active_ads, icon: Zap, color: '#18704b' },
    { label: 'طلبات بانتظار المراجعة', value: stats.pending_requests, icon: Clock3, color: '#a66a00' },
    { label: 'إجمالي الظهور', value: stats.impressions, icon: Eye, color: '#2f78a3' },
    { label: 'إجمالي النقرات', value: stats.clicks, icon: MousePointerClick, color: '#7b53a8' },
  ];

  return (
    <main dir="rtl" style={{ minHeight: '100vh', background: '#f7f8fa' }}>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <aside className="sidebar" style={{ width: 248, flexShrink: 0, padding: '26px 15px', background: '#fff', borderLeft: '1px solid #e8edf0', position: 'sticky', top: 0, height: '100vh', boxSizing: 'border-box' }}>
          <div style={{ padding: '0 10px 25px', borderBottom: '1px solid #eef1f3', marginBottom: 16 }}><div style={{ display: 'flex', alignItems: 'center', gap: 9, color: navy, fontWeight: 900, fontSize: 18 }}><Megaphone size={21} color={gold} /> مركز الإعلانات</div><p style={{ margin: '7px 0 0', color: muted, fontSize: 12 }}>إدارة الطلبات والظهور والأداء</p></div>
          {[['/admin/dashboard', LayoutDashboard, 'لوحة الإحصائيات'], ['/admin/advertisement-center', Megaphone, 'الإعلانات'], ['/admin/supplier-requests', Users, 'طلبات الموردين'], ['/admin/cars', ShieldAlert, 'السيارات'], ['/admin/settings', Settings, 'الإعدادات']].map(([to, Icon, label]) => <Link key={to} to={to} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 13px', marginBottom: 4, borderRadius: 11, color: to === '/admin/advertisement-center' ? navy : '#4d5a64', background: to === '/admin/advertisement-center' ? '#eef4f6' : 'transparent', textDecoration: 'none', fontWeight: to === '/admin/advertisement-center' ? 900 : 700, fontSize: 14 }}><Icon size={18} />{label}</Link>)}
        </aside>

        <section style={{ flex: 1, minWidth: 0, padding: '30px clamp(16px, 4vw, 42px) 60px' }}>
          <header style={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap', marginBottom: 24 }}><div><span style={{ color: gold, fontSize: 13, fontWeight: 900 }}>مساحة التحكم</span><h1 style={{ margin: '6px 0 5px', color: navy, fontSize: 32, fontWeight: 900 }}>إدارة الإعلانات والعملات</h1><p style={{ margin: 0, color: muted }}>راقب الطلبات، أنشئ الحملات، وتابع أثر كل إعلان من مكان واحد.</p></div><button type="button" onClick={loadData} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid #dfe5e9', borderRadius: 12, padding: '11px 15px', background: '#fff', color: navy, fontWeight: 800, cursor: 'pointer' }}><RefreshCw size={16} /> تحديث البيانات</button></header>

          <nav style={{ display: 'flex', gap: 7, flexWrap: 'wrap', padding: 6, marginBottom: 24, background: '#fff', border: '1px solid #e7eaee', borderRadius: 15 }}>
            {[['overview', 'نظرة عامة', BarChart3], ['requests', `طلبات الإعلانات (${stats.pending_requests || requests.filter((item) => item.status === 'pending').length})`, Clock3], ['library', 'مكتبة الإعلانات', Megaphone], ['create', editingId ? 'تعديل الإعلان' : 'إنشاء إعلان', FilePlus2]].map(([key, label, Icon]) => <button type="button" key={key} onClick={() => setTab(key)} style={{ flex: '1 1 160px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: 0, borderRadius: 11, padding: '12px 14px', background: tab === key ? navy : 'transparent', color: tab === key ? '#fff' : muted, fontWeight: 900, cursor: 'pointer' }}><Icon size={17} />{label}</button>)}
          </nav>

          {tab === 'overview' && <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 15, marginBottom: 22 }}>{overviewCards.map(({ label, value, icon: Icon, color }) => <div key={label} style={{ padding: 20, borderRadius: 18, background: '#fff', border: '1px solid #e8edf0', boxShadow: '0 12px 30px rgba(23,58,82,0.05)' }}><div style={{ width: 44, height: 44, display: 'grid', placeItems: 'center', borderRadius: 14, color, background: `${color}15`, marginBottom: 17 }}><Icon size={21} /></div><div style={{ color: navy, fontSize: 30, fontWeight: 900 }}>{value || 0}</div><div style={{ marginTop: 6, color: muted, fontSize: 13, fontWeight: 700 }}>{label}</div></div>)}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(260px, 0.8fr)', gap: 20 }}><section style={panelStyle}><div style={panelHeader}><div><h2 style={h2Style}>ملخص الحملات</h2><p style={subStyle}>الأرقام المحملة من قاعدة البيانات الحالية.</p></div><button type="button" onClick={() => setTab('library')} style={linkButton}>{'عرض المكتبة'} </button></div><div style={{ display: 'grid', gap: 13 }}>{[['إجمالي الإعلانات', stats.total_ads], ['الإعلانات النشطة', stats.active_ads], ['الطلبات المعتمدة', stats.approved_requests], ['الميزانية المسجلة', `${Number(stats.total_budget || 0).toLocaleString()} ر.س`]].map(([label, value]) => <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '13px 0', borderBottom: '1px solid #eef1f3', color: muted, fontSize: 14 }}><span>{label}</span><strong style={{ color: navy }}>{value || 0}</strong></div>)}</div></section><section style={{ ...panelStyle, background: `linear-gradient(145deg, ${navy}, #245a73)`, color: '#fff' }}><div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}><div style={{ width: 42, height: 42, display: 'grid', placeItems: 'center', borderRadius: 13, background: 'rgba(255,255,255,0.12)', color: gold }}><BarChart3 size={21} /></div><div><h2 style={{ ...h2Style, color: '#fff' }}>مؤشر التفاعل</h2><p style={{ ...subStyle, color: 'rgba(255,255,255,0.65)' }}>نسبة النقر إلى الظهور</p></div></div><div style={{ fontSize: 42, fontWeight: 900 }}>{stats.impressions ? `${((stats.clicks / stats.impressions) * 100).toFixed(1)}%` : '0%'}</div><p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, fontSize: 13 }}>لن تظهر أرقام تجريبية؛ يتم احتساب المؤشر فقط من مرات الظهور والنقرات المسجلة فعلياً.</p></section></div>
          </>}

          {tab === 'requests' && <section style={panelStyle}><div style={panelHeader}><div><h2 style={h2Style}>طلبات الإعلانات الواردة</h2><p style={subStyle}>راجع طلب المورد ثم اعتمده للنشر أو ارفضه مع توضيح السبب.</p></div><span style={{ color: gold, fontWeight: 900 }}>{requests.length} طلب</span></div>{loading ? <p style={{ color: muted }}>جاري التحميل...</p> : requests.length === 0 ? <EmptyState text="لا توجد طلبات إعلانية حالياً" /> : <div style={{ display: 'grid', gap: 14 }}>{requests.map((request) => { const meta = requestStatuses[request.status] || requestStatuses.pending; return <article key={request.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 18, alignItems: 'center', padding: 17, borderRadius: 15, border: '1px solid #e8edf0', background: '#fcfcfd' }}><div><div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}><h3 style={{ margin: 0, color: navy, fontSize: 17 }}>{request.title}</h3><span style={{ padding: '5px 8px', borderRadius: 999, color: meta[1], background: meta[2], fontSize: 11, fontWeight: 900 }}>{meta[0]}</span></div><p style={{ margin: '7px 0 0', color: muted, fontSize: 13 }}>{request.supplier_name} · {request.car_make} {request.car_model} · {request.duration_days} يوم</p>{request.description && <p style={{ margin: '9px 0 0', color: '#53636e', lineHeight: 1.7, fontSize: 13 }}>{request.description}</p>}</div>{request.status === 'pending' && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'end' }}><button type="button" onClick={() => reviewRequest(request, 'approve')} style={{ ...actionButton, background: '#18704b' }}><CheckCircle2 size={15} /> اعتماد</button><button type="button" onClick={() => reviewRequest(request, 'reject')} style={{ ...actionButton, background: '#a23a3a' }}><XCircle size={15} /> رفض</button></div>}</article>; })}</div>}</section>}

          {tab === 'library' && <section style={panelStyle}><div style={panelHeader}><div><h2 style={h2Style}>مكتبة الإعلانات</h2><p style={subStyle}>تحكم في الحالة ومواقع الظهور والمؤشرات.</p></div><button type="button" onClick={() => { resetForm(); setTab('create'); }} style={{ ...actionButton, background: navy }}><Plus size={15} /> إنشاء إعلان</button></div><div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}><div style={{ position: 'relative', flex: '1 1 240px' }}><Search size={16} color={muted} style={{ position: 'absolute', top: '50%', right: 12, transform: 'translateY(-50%)' }} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث بالعنوان أو المورد" style={{ ...inputStyle, paddingRight: 36 }} /></div><select value={filter} onChange={(event) => setFilter(event.target.value)} style={inputStyle}><option value="all">كل الحالات</option>{Object.keys(statuses).map((key) => <option value={key} key={key}>{statuses[key][0]}</option>)}</select></div>{loading ? <p style={{ color: muted }}>جاري التحميل...</p> : filteredAds.length === 0 ? <EmptyState text="لا توجد إعلانات مطابقة" /> : <div style={{ display: 'grid', gap: 11 }}>{filteredAds.map((ad) => <article key={ad.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 14, alignItems: 'center', padding: 15, border: '1px solid #e8edf0', borderRadius: 14 }}><div><div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}><h3 style={{ margin: 0, color: navy, fontSize: 16 }}>{ad.title}</h3><StatusBadge status={ad.status} /></div><p style={{ margin: '6px 0 0', color: muted, fontSize: 12 }}>{ad.supplier_name || 'إعلان إدارة'} · {ad.car_make ? `${ad.car_make} ${ad.car_model}` : 'عام'} · {ad.placement}</p><div style={{ display: 'flex', gap: 14, marginTop: 9, color: muted, fontSize: 12 }}><span><Eye size={13} style={{ verticalAlign: 'middle' }} /> {ad.impressions || 0}</span><span><MousePointerClick size={13} style={{ verticalAlign: 'middle' }} /> {ad.clicks || 0}</span></div></div><div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', justifyContent: 'end' }}><select value={ad.status} onChange={(event) => updateStatus(ad.id, event.target.value)} style={{ ...inputStyle, padding: '8px 10px', fontSize: 12 }}>{Object.keys(statuses).map((key) => <option key={key} value={key}>{statuses[key][0]}</option>)}</select><button type="button" onClick={() => editAdvertisement(ad)} style={iconButton} aria-label="تعديل"><Pencil size={15} /></button><button type="button" onClick={() => deleteAd(ad.id)} style={{ ...iconButton, color: '#a23a3a' }} aria-label="حذف"><Trash2 size={15} /></button></div></article>)}</div>}</section>}

          {tab === 'create' && <form onSubmit={saveAdvertisement} style={panelStyle}><div style={panelHeader}><div><h2 style={h2Style}>{editingId ? 'تعديل الإعلان' : ''}</h2><p style={subStyle}>حدد المحتوى والموضع والحالة قبل النشر.</p></div><button type="button" onClick={resetForm} style={linkButton}>تفريغ النموذج</button></div><div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 15 }}><Field label="المورد" name="supplier_id" type="select" value={form.supplier_id} onChange={(event) => loadSupplierCars(event.target.value)} options={[['', 'إعلان عام بدون مورد'], ...suppliers.map((supplier) => [supplier.id, `${supplier.name} — ${supplier.cars_count} سيارات`])]} /><Field label="السيارة" name="car_id" type="select" value={form.car_id} onChange={updateField} options={[['', 'بدون سيارة محددة'], ...supplierCars.map((car) => [car.id, `${car.make} ${car.model} — ${car.year}`])]} /><Field label="عنوان الإعلان" name="title" value={form.title} onChange={updateField} required wide /><Field label="الوصف" name="description" value={form.description} onChange={updateField} type="textarea" wide /><Field label="نوع الإعلان" name="ad_type" type="select" value={form.ad_type} onChange={updateField} options={[['featured', 'إعلان مميز'], ['discount', 'خصم'], ['main', 'رئيسي'], ['urgent', 'عاجل']]} /><Field label="مكان الظهور" name="placement" type="select" value={form.placement} onChange={updateField} options={[['home', 'الرئيسية'], ['cars', 'قائمة السيارات'], ['car_detail', 'تفاصيل السيارة'], ['all_public', 'كل الصفحات العامة']]} /><label style={{ gridColumn: '1 / -1', color: navy, fontSize: 13, fontWeight: 800 }}>صورة الإعلان<input name="image" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} style={inputStyle} /><span style={{ display: 'block', marginTop: 7, color: muted, fontSize: 12 }}>اختر صورة من الهاتف أو الكمبيوتر، بحد أقصى 5 ميجابايت.</span>{imagePreview && <img src={imagePreview} alt="معاينة صورة الإعلان" style={{ display: 'block', width: '100%', maxHeight: 190, objectFit: 'cover', marginTop: 10, borderRadius: 13 }} />}</label><Field label="الرابط عند النقر" name="link_url" value={form.link_url} onChange={updateField} placeholder="/cars أو https://..." /><Field label="السعر الظاهر" name="price" type="number" value={form.price} onChange={updateField} /><Field label="الميزانية" name="budget" type="number" value={form.budget} onChange={updateField} /><Field label="البداية" name="start_date" type="date" value={form.start_date} onChange={updateField} /><Field label="النهاية" name="end_date" type="date" value={form.end_date} onChange={updateField} /><Field label="الحالة" name="status" type="select" value={form.status} onChange={updateField} options={Object.keys(statuses).map((key) => [key, statuses[key][0]])} /></div><div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginTop: 20, color: muted, fontSize: 13 }}><label><input type="checkbox" checked={form.featured} onChange={(event) => setForm((current) => ({ ...current, featured: event.target.checked }))} /> إعلان مميز</label><label><input type="checkbox" checked={form.is_pinned} onChange={(event) => setForm((current) => ({ ...current, is_pinned: event.target.checked }))} /> تثبيت الإعلان</label></div><button type="submit" disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 22, border: 0, borderRadius: 13, padding: '13px 20px', background: navy, color: '#fff', fontWeight: 900, cursor: saving ? 'wait' : 'pointer' }}>{saving ? 'جاري الحفظ...' : editingId ? 'حفظ التعديلات' : 'إنشاء الإعلان'} <FilePlus2 size={17} /></button></form>}
        </section>
      </div>
    </main>
  );
}

function StatusBadge({ status }) { const meta = statuses[status] || statuses.draft; return <span style={{ padding: '5px 8px', borderRadius: 999, color: meta[1], background: meta[2], fontSize: 11, fontWeight: 900 }}>{meta[0]}</span>; }
function EmptyState({ text }) { return <div style={{ padding: '50px 16px', color: muted, textAlign: 'center', border: '1px dashed #dfe5e9', borderRadius: 14 }}>{text}</div>; }
function Field({ label, name, type = 'text', value, onChange, options, placeholder, required, wide }) { return <label style={{ gridColumn: wide ? '1 / -1' : undefined, color: navy, fontSize: 13, fontWeight: 800 }}>{label}{type === 'select' ? <select name={name} value={value} onChange={onChange} style={inputStyle} required={required}>{options.map(([key, optionLabel]) => <option value={key} key={key}>{optionLabel}</option>)}</select> : type === 'textarea' ? <textarea name={name} value={value} onChange={onChange} style={{ ...inputStyle, minHeight: 95, resize: 'vertical' }} required={required} placeholder={placeholder} /> : <input name={name} value={value} onChange={onChange} type={type} style={inputStyle} required={required} placeholder={placeholder} />}</label>; }

const inputStyle = { display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 8, padding: '11px 12px', border: '1px solid #dfe5e9', borderRadius: 10, background: '#fff', color: navy, font: 'inherit', outline: 'none' };
const panelStyle = { padding: 24, borderRadius: 19, background: '#fff', border: '1px solid #e8edf0', boxShadow: '0 12px 30px rgba(23,58,82,0.05)' };
const panelHeader = { display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: 15, flexWrap: 'wrap', marginBottom: 22 };
const h2Style = { margin: 0, color: navy, fontSize: 21, fontWeight: 900 };
const subStyle = { margin: '6px 0 0', color: muted, fontSize: 13, lineHeight: 1.6 };
const linkButton = { border: 0, padding: 0, background: 'transparent', color: navy, fontWeight: 900, cursor: 'pointer' };
const actionButton = { display: 'inline-flex', alignItems: 'center', gap: 6, border: 0, borderRadius: 10, padding: '9px 12px', color: '#fff', fontSize: 12, fontWeight: 900, cursor: 'pointer' };
const iconButton = { display: 'grid', placeItems: 'center', width: 34, height: 34, border: '1px solid #dfe5e9', borderRadius: 9, color: navy, background: '#fff', cursor: 'pointer' };

