import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { financeAPI } from '../../services/api';

const money = (value, currency = 'YER') =>
  `${Number(value || 0).toLocaleString('ar-YE')} ${currency}`;

export default function FinanceCenter() {
  const [dashboard, setDashboard] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadFinance = async () => {
    setLoading(true);
    try {
      const [dashboardResponse, settingsResponse] = await Promise.all([
        financeAPI.getDashboard(),
        financeAPI.getSettings(),
      ]);
      setDashboard(dashboardResponse.data?.data || null);
      setSettings(settingsResponse.data?.data || null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذر تحميل الإدارة المالية');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinance();
  }, []);

  const saveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const response = await financeAPI.updateSettings({
        currency: 'YER',
        commission_rate: Number(settings.commission_rate || 0),
        settlement_mode: settings.settlement_mode,
      });
      setSettings(response.data?.data || settings);
      toast.success('تم حفظ إعدادات الإدارة المالية');
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذر حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const completePayout = async (payout) => {
    try {
      await financeAPI.completePayout(payout.id);
      toast.success('تمت تسوية مستحق المورد');
      await loadFinance();
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذر إكمال التسوية');
    }
  };

  if (loading) {
    return <main className="rc-page-shell"><p>جاري تحميل الإدارة المالية...</p></main>;
  }

  const summary = dashboard?.summary || {};
  const cards = [
    ['إجمالي الإيرادات', money(summary.gross_revenue)],
    ['إيرادات الإعلانات', money(summary.advertisement_revenue)],
    ['إيرادات الحجوزات', money(summary.reservation_revenue)],
    ['المبالغ المستردة', money(summary.refunded_amount)],
  ];

  return (
    <main className="rc-page-shell" dir="rtl">
      <div className="finance-page-head">
        <div>
          <span className="finance-eyebrow">مركز الإدارة المالية</span>
          <h1>المدفوعات والتسويات</h1>
          <p>إدارة محاكاة مالية بالريال اليمني مع سجل واضح لكل عملية.</p>
        </div>
        <span className="finance-simulation-badge">وضع المحاكاة</span>
      </div>

      <section className="finance-summary-grid">
        {cards.map(([label, value]) => (
          <article className="finance-summary-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </section>

      <section className="finance-settings-card">
        <div>
          <h2>إعدادات التسوية</h2>
          <p>اختر هل تُسجل تسوية المورد تلقائيًا أو تنتظر اعتماد الإدارة.</p>
        </div>
        {settings && (
          <div className="finance-settings-form">
            <label>
              العملة
              <input value="الريال اليمني YER" disabled />
            </label>
            <label>
              عمولة المنصة (%)
              <input
                type="number"
                min="0"
                max="100"
                value={settings.commission_rate}
                onChange={(event) => setSettings({ ...settings, commission_rate: event.target.value })}
              />
            </label>
            <label>
              طريقة التسوية
              <select
                value={settings.settlement_mode}
                onChange={(event) => setSettings({ ...settings, settlement_mode: event.target.value })}
              >
                <option value="manual">يدوية</option>
                <option value="automatic">تلقائية محاكاة</option>
              </select>
            </label>
            <button type="button" className="finance-primary-button" onClick={saveSettings} disabled={saving}>
              {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
            </button>
          </div>
        )}
      </section>

      <section className="finance-columns">
        <article className="finance-table-card">
          <div className="finance-table-head">
            <h2>مدفوعات الإعلانات</h2>
            <span>{dashboard?.advertisementPayments?.length || 0} عملية</span>
          </div>
          <div className="finance-table-list">
            {(dashboard?.advertisementPayments || []).map((payment) => (
              <div className="finance-row" key={payment.id}>
                <div>
                  <strong>{payment.title || 'إعلان'}</strong>
                  <small>{payment.supplier_name || 'مورد'} · {payment.provider_reference}</small>
                </div>
                <div className="finance-row-amount">
                  <b>{money(payment.amount, payment.currency)}</b>
                  <span className={`finance-status finance-status-${payment.status}`}>{payment.status === 'paid' ? 'مدفوع' : payment.status}</span>
                </div>
              </div>
            ))}
            {!dashboard?.advertisementPayments?.length && <p className="finance-empty">لا توجد مدفوعات إعلانات حتى الآن.</p>}
          </div>
        </article>

        <article className="finance-table-card">
          <div className="finance-table-head">
            <h2>التسويات المعلقة</h2>
            <span>{dashboard?.pendingPayouts?.length || 0} طلب</span>
          </div>
          <div className="finance-table-list">
            {(dashboard?.pendingPayouts || []).map((payout) => (
              <div className="finance-row" key={payout.id}>
                <div>
                  <strong>{payout.supplier_name}</strong>
                  <small>{payout.mode === 'manual' ? 'تسوية يدوية' : 'تسوية تلقائية محاكاة'}</small>
                </div>
                <div className="finance-row-amount">
                  <b>{money(payout.amount, payout.currency)}</b>
                  {payout.status === 'pending' && (
                    <button type="button" className="finance-small-button" onClick={() => completePayout(payout)}>
                      إتمام التسوية
                    </button>
                  )}
                </div>
              </div>
            ))}
            {!dashboard?.pendingPayouts?.length && <p className="finance-empty">لا توجد تسويات معلقة.</p>}
          </div>
        </article>
      </section>
    </main>
  );
}
