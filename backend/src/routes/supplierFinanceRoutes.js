const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { query } = require('../config/database');

router.use(protect, authorize('supplier'));

router.get('/summary', asyncHandler(async (req, res) => {
  const supplierId = req.user.id;

  // Financial balances are grouped by currency. Never add USD/SAR/YER together.
  const balancesResult = await query(`
    WITH currencies AS (
      SELECT DISTINCT currency FROM ledger_entries
      WHERE supplier_id=$1 AND entry_type IN ('supplier_payable','payout')
      UNION
      SELECT DISTINCT currency FROM supplier_payouts WHERE supplier_id=$1
    ),
    payable AS (
      SELECT currency, COALESCE(SUM(amount),0) AS total_payable
      FROM ledger_entries
      WHERE supplier_id=$1 AND entry_type='supplier_payable' AND direction='credit'
      GROUP BY currency
    ),
    payouts AS (
      SELECT currency,
             COALESCE(SUM(amount) FILTER (WHERE status='paid'),0) AS paid_out,
             COALESCE(SUM(amount) FILTER (WHERE status IN ('pending','processing')),0) AS pending_payout
      FROM supplier_payouts
      WHERE supplier_id=$1
      GROUP BY currency
    ),
    gross AS (
      SELECT currency, COALESCE(SUM(amount),0) AS gross_revenue
      FROM payments
      WHERE supplier_id=$1 AND reservation_id IS NOT NULL AND status='paid'
      GROUP BY currency
    ),
    fees AS (
      SELECT currency, COALESCE(SUM(amount),0) AS total_commission
      FROM ledger_entries
      WHERE supplier_id=$1 AND reservation_id IS NOT NULL AND entry_type='platform_fee' AND direction='credit'
      GROUP BY currency
    )
    SELECT c.currency,
           COALESCE(g.gross_revenue,0)::numeric AS gross_revenue,
           COALESCE(f.total_commission,0)::numeric AS total_commission,
           COALESCE(p.total_payable,0)::numeric AS total_payable,
           COALESCE(po.paid_out,0)::numeric AS paid_out,
           COALESCE(po.pending_payout,0)::numeric AS pending_payout,
           GREATEST(0,COALESCE(p.total_payable,0)-COALESCE(po.paid_out,0)-COALESCE(po.pending_payout,0))::numeric AS available_balance
    FROM currencies c
    LEFT JOIN gross g ON g.currency=c.currency
    LEFT JOIN fees f ON f.currency=c.currency
    LEFT JOIN payable p ON p.currency=c.currency
    LEFT JOIN payouts po ON po.currency=c.currency
    ORDER BY c.currency
  `, [supplierId]);

  const transactionsResult = await query(`
    SELECT p.id,p.reservation_id,p.amount AS gross_amount,p.currency,p.status,p.paid_at,p.created_at,
           r.start_date,r.end_date,r.with_driver,u.name AS customer_name,
           c.make,c.model,
           COALESCE(fee.amount,0) AS commission,
           CASE WHEN p.amount > 0 THEN ROUND((COALESCE(fee.amount,0)/p.amount*100)::numeric,2) ELSE 0 END AS commission_rate,
           COALESCE(payable.amount,0) AS supplier_amount,
           CASE WHEN p.status='paid' AND COALESCE(fee.amount,0)+COALESCE(payable.amount,0)=p.amount THEN 'matched' ELSE 'check' END AS reconciliation_status
    FROM payments p
    JOIN reservations r ON r.id=p.reservation_id
    JOIN cars c ON c.id=r.car_id
    LEFT JOIN users u ON u.id=r.customer_id
    LEFT JOIN LATERAL (
      SELECT amount FROM ledger_entries
      WHERE payment_id=p.id AND supplier_id=$1 AND entry_type='platform_fee' AND direction='credit'
      ORDER BY created_at DESC LIMIT 1
    ) fee ON TRUE
    LEFT JOIN LATERAL (
      SELECT amount FROM ledger_entries
      WHERE payment_id=p.id AND supplier_id=$1 AND entry_type='supplier_payable' AND direction='credit'
      ORDER BY created_at DESC LIMIT 1
    ) payable ON TRUE
    WHERE p.supplier_id=$1 AND p.reservation_id IS NOT NULL
    ORDER BY p.created_at DESC LIMIT 100
  `, [supplierId]);

  const payoutsResult = await query(`
    SELECT id,amount,currency,mode,status,notes,external_reference,processed_at,created_at
    FROM supplier_payouts WHERE supplier_id=$1 ORDER BY created_at DESC LIMIT 100
  `, [supplierId]);

  const settingsResult = await query(`SELECT currency,commission_rate,settlement_mode FROM finance_settings WHERE id=1`);
  const settings = settingsResult.rows[0] || { currency:'YER', commission_rate:10, settlement_mode:'manual' };

  res.json({
    success:true,
    data:{
      balances_by_currency: balancesResult.rows,
      // Backward-compatible default balance for the platform currency.
      summary: balancesResult.rows.find(x => x.currency === settings.currency) || {
        currency: settings.currency, gross_revenue:0, total_commission:0, total_payable:0,
        paid_out:0, pending_payout:0, available_balance:0,
      },
      transactions: transactionsResult.rows,
      payouts: payoutsResult.rows,
      settings,
    },
  });
}));

module.exports = router;
