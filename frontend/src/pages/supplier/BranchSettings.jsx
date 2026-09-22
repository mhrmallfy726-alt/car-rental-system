import { Building2, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import SupplierSidebar from '../../components/SupplierSidebar';

export default function BranchSettings() {
  const { user } = useAuthStore();
  return (
    <div dir="rtl" className="branch-settings-page" style={{ display:'flex', minHeight:'100vh', background:'#f4f8f8', color:'#173a52' }}>
      <SupplierSidebar />
      <main className="branch-settings-main" style={{ flex:1, padding:'32px 24px' }}>
        <div style={{ maxWidth:900, margin:'0 auto' }}>
          <header className="branch-settings-header" style={{ marginBottom:24 }}>
            <span style={{ color:'#0f766e', fontWeight:900, fontSize:12 }}>إعدادات الفرع</span>
            <h1 style={{ margin:'6px 0', fontSize:30 }}>إعدادات الحساب والفرع</h1>
            <p style={{ margin:0, color:'#71828a' }}>بيانات هذا الحساب مرتبطة بفرع واحد فقط ولا يمكنها تعديل إعدادات المورد الرئيسية.</p>
          </header>
          <section className="branch-settings-panel" style={{ background:'#fff', border:'1px solid #e3eeee', borderRadius:18, padding:24, boxShadow:'0 8px 24px rgba(23,58,82,.05)' }}>
            <div className="branch-settings-grid" style={{ display:'grid', gridTemplateColumns:'repeat(2,minmax(0,1fr))', gap:16 }}>
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
      <style>{`
        @media(max-width:800px){
          .branch-settings-main{padding:20px 14px 24px!important}
          .branch-settings-header h1{font-size:24px!important;line-height:1.35}
          .branch-settings-grid{grid-template-columns:1fr!important}
          .branch-settings-panel{padding:18px!important}
        }
        @media(max-width:540px){
          .branch-settings-main{padding-inline:10px!important}
          .branch-settings-header h1{font-size:22px!important}
          .branch-settings-panel{padding:14px!important;border-radius:15px!important}
          .branch-settings-panel a{max-width:100%;line-height:1.7}
        }
      `}</style>
    </div>
  );
}
function Info({icon:Icon,label,value}) {
  return <div style={{ border:'1px solid #edf2f2', borderRadius:14, padding:16, display:'flex', gap:12, alignItems:'center' }}>
    <div style={{ width:40,height:40,borderRadius:12,background:'#eaf6f2',color:'#0f766e',display:'grid',placeItems:'center' }}><Icon size={19}/></div>
    <div><small style={{display:'block',color:'#71828a',marginBottom:4}}>{label}</small><strong>{value}</strong></div>
  </div>;
}
