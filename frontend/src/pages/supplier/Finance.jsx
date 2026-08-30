import { useEffect, useState } from 'react';
import { DollarSign, Wallet, Percent, Clock, CheckCircle, RefreshCw } from 'lucide-react';
import SupplierSidebar from '../../components/SupplierSidebar';
import { supplierFinanceAPI } from '../../services/api';
import toast from 'react-hot-toast';

const money = (value, currency = 'YER') => `${Number(value || 0).toLocaleString()} ${currency}`;

export default function SupplierFinance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const res = await supplierFinanceAPI.getSummary();
      setData(res.data.data);
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.message || 'تعذر تحميل البيانات المالية');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const s = data?.summary || {};
  const settings = data?.settings || {};
  const currency = settings.currency || 'YER';

  return (
    <div dir="rtl" style={{display:'flex',minHeight:'100vh',background:'#f8f9fa'}}>
      <SupplierSidebar />
      <main style={{flex:1,padding:'30px 24px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:28}}>
          <div><h1 style={{margin:0}}>المحفظة والإيرادات</h1><p style={{color:'#6c757d'}}>تفاصيل إيراداتك وعمولة المنصة والتسويات</p></div>
          <button onClick={load} disabled={loading} style={{border:0,borderRadius:8,padding:'9px 14px',cursor:'pointer'}}><RefreshCw size={17}/></button>
        </div>
        {loading ? <div style={{padding:50,textAlign:'center'}}>جاري تحميل البيانات...</div> : <>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:18,marginBottom:24}}>
            {[
              ['إجمالي الإيرادات',s.gross_revenue,'إيرادات الحجوزات',DollarSign],
              ['عمولة المنصة',s.total_commission,'المخصوم للمنصة',Percent],
              ['صافي مستحق المورد',s.total_payable,'بعد خصم العمولة',Wallet],
              ['المتاح للتسوية',s.available_balance,'الرصيد غير المسدد',Clock],
              ['تمت تسويته',s.paid_out,'تسويات مكتملة',CheckCircle],
              ['تحت التسوية',s.pending_payout,'تسويات معلقة',Clock],
            ].map(([title,value,sub,Icon])=><div key={title} style={{background:'#fff',borderRadius:12,padding:20,boxShadow:'0 1px 4px rgba(0,0,0,.08)'}}><Icon size={22}/><div style={{fontSize:22,fontWeight:700,marginTop:10}}>{money(value,currency)}</div><div style={{fontWeight:600}}>{title}</div><small style={{color:'#6c757d'}}>{sub}</small></div>)}
          </div>
          <div style={{background:'#fff',borderRadius:12,padding:22,marginBottom:24}}>
            <h3>تفاصيل العمليات</h3>
            <p style={{color:'#6c757d'}}>نسبة عمولة المنصة الحالية: <b>{settings.commission_rate}%</b></p>
            <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr><th>الحجز</th><th>السيارة</th><th>الإجمالي</th><th>العمولة</th><th>مستحق المورد</th><th>الحالة</th></tr></thead><tbody>{(data?.transactions||[]).map(x=><tr key={x.id}>{[x.reservation_id?.slice(0,8)||'-',`${x.make||''} ${x.model||''}`,money(x.gross_amount,x.currency),money(x.commission,x.currency),money(x.supplier_amount,x.currency),x.status].map((v,i)=><td key={i} style={{padding:10,borderTop:'1px solid #eee'}}>{v}</td>)}</tr>)}</tbody></table></div>
          </div>
          <div style={{background:'#fff',borderRadius:12,padding:22}}>
            <h3>سجل التسويات</h3>
            <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr><th>التاريخ</th><th>المبلغ</th><th>الطريقة</th><th>الحالة</th><th>ملاحظات</th></tr></thead><tbody>{(data?.payouts||[]).map(p=><tr key={p.id}>{[new Date(p.created_at).toLocaleString('ar-YE'),money(p.amount,p.currency),p.mode,p.status,p.notes||'-'].map((v,i)=><td key={i} style={{padding:10,borderTop:'1px solid #eee'}}>{v}</td>)}</tr>)}</tbody></table></div>
          </div>
        </>}
      </main>
    </div>
  );
}
