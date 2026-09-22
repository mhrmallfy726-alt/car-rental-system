import { Building2, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import SupplierSidebar from '../../components/SupplierSidebar';

export default function BranchSettings() {
  const { user } = useAuthStore();
  return (
    <div dir="rtl" style={{ display:'flex', minHeight:'100vh', background:'#f4f8f8', color:'#173a52' }}>
      <SupplierSidebar />
      <main style={{ flex:1, padding:'32px 24px' }}>
        <div style={{ maxWidth:900, margin:'0 auto' }}>
          <header style={{ marginBottom:24 }}>
            <span style={{ color:'#0f766e', fontWeight:900, fontSize:12 }}>إعدادات الفرع</span>
            <h1 style={{ margin:'6px 0', fontSize:30 }}>إعدادات الحساب والفرع</h1>
            <p style={{ margin:0, color:'#71828a' }}>بيانات هذا الحساب مرتبطة بفرع واحد فقط ولا يمكنها تعديل إعدادات المورد الرئيسية.</p>
          </header>
          <section style={{ background:'#fff', border:'1px solid #e3eeee', borderRadius:18, padding:24, boxShadow:'0 8px 24px rgba(23,58,82,.05)' }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,minmax(0,1fr))', gap:16 }}>
              <Info icon={Building2} label="اسم الفرع" value={user?.branch_name || 'الفرع الحالي'} />
              <Info icon={ShieldCheck} label="البريد المرتبط بالحساب" value={user?.email || 'غير متوفر'} />
              <Info icon={Building2} label="اسم المسؤول" value={user?.name || 'غير متوفر'} />
              <Info icon={ShieldCheck} label="نوع الحساب" value="حساب فرع" />
            </div>
            <div style={{ marginTop:20, padding:15, borderRadius:13, background:'#eef7f5', color:'#45616b', lineHeight:1.8, fontSize:13 }}>
              هذا الحساب لا يملك إعدادات المورد العامة أو اختيار فروع أخرى. إدارة السيارات والحجوزات والموظفين والإعلانات تتم ضمن الفرع المرتبط بالحساب.
            </div>
            <Link to="/settings" style={{ display:'inline-flex', marginTop:18, color:'#0f766e', fontWeight:800, textDecoration:'none' }}>إعدادات الأمان والحساب العام ←</Link>
          </section>
        </div>
      </main>
      <style>{'@media(max-width:800px){main{padding:20px 14px!important}section>div{grid-template-columns:1fr!important}}'}</style>
    </div>
  );
}
function Info({icon:Icon,label,value}) {
  return <div style={{ border:'1px solid #edf2f2', borderRadius:14, padding:16, display:'flex', gap:12, alignItems:'center' }}>
    <div style={{ width:40,height:40,borderRadius:12,background:'#eaf6f2',color:'#0f766e',display:'grid',placeItems:'center' }}><Icon size={19}/></div>
    <div><small style={{display:'block',color:'#71828a',marginBottom:4}}>{label}</small><strong>{value}</strong></div>
  </div>;
}
