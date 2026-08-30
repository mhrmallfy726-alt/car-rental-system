const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { query } = require('../config/database');

router.use(protect, authorize('supplier'));

// Supplier financial dashboard: earnings, platform commission, payable balance,
// previous settlements and pending settlements. All values are scoped to req.user.id.
router.get('/summary', asyncHandler(async (req, res) => {
  const supplierId = req.user.id;

  const summaryResult = await query(`
    WITH payable AS (
      SELECT COALESCE(SUM(amount) FILTER (WHERE entry_type = 'supplier_payable' AND direction = 'credit'), 0) AS total_payable
      FROM ledger_entries
      WHERE supplier_id = $1
    ),
    fees AS (
      SELECT COALESCE(SUM(amount) FILTER (WHERE entry_type IN ('platform_fee', 'platform_revenue') AND direction = 'credit'), 0) AS total_commission
      FROM ledger_entries
      WHERE supplier_id = $1 AND reservation_id IS NOT NULL
    ),
    payouts AS (
      SELECT
        COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0) AS paid_out,
        COALESCE(SUM(amount) FILTER (WHERE status IN ('pending', 'processing')), 0) AS pending_payout
      FROM supplier_payouts
      WHERE supplier_id = $1
    ),
    gross AS (
      SELECT COALESCE(SUM(amount), 0) AS gross_revenue
      FROM payments
      WHERE supplier_id = $1 AND reservation_id IS NOT NULL AND status = 'paid'
    )
    SELECT
      gross.gross_revenue,
      fees.total_commission,
      payable.total_payable,
      payouts.paid_out,
      payouts.pending_payout,
      GREATEST(0, payable.total_payable - payouts.paid_out - payouts.pending_payout) AS available_balance
    FROM gross, fees, payable, payouts
  `, [supplierId]);

  const transactionsResult = await query(`
    SELECT
      p.id,
      p.reservation_id,
      p.amount AS gross_amount,
      p.currency,
      p.status,
      p.paid_at,
      p.created_at,
      c.make,
      c.model,
      COALESCE(fee.amount, 0) AS commission,
      COALESCE(payable.amount, 0) AS supplier_amount
    FROM payments p
    JOIN reservations r ON r.id = p.reservation_id
    JOIN cars c ON c.id = r.car_id
    LEFT JOIN LATERAL (
      SELECT amount
      FROM ledger_entries
      WHERE payment_id = p.id
        AND supplier_id = $1
        AND entry_type IN ('platform_fee', 'platform_revenue')
        AND reservation_id IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 1
    ) fee ON TRUE
    LEFT JOIN LATERAL (
      SELECT amount
      FROM ledger_entries
      WHERE payment_id = p.id
        AND supplier_id = $1
        AND entry_type = 'supplier_payable'
        AND direction = 'credit'
      ORDER BY created_at DESC
      LIMIT 1
    ) payable ON TRUE
    WHERE p.supplier_id = $1 AND p.reservation_id IS NOT NULL
    ORDER BY p.created_at DESC
    LIMIT 100
  `, [supplierId]);

  const payoutsResult = await query(`
    SELECT id, amount, currency, mode, status, notes, external_reference, processed_at, created_at
    FROM supplier_payouts
    WHERE supplier_id = $1
    ORDER BY created_at DESC
    LIMIT 100
  `, [supplierId]);

  const settingsResult = await query(`
    SELECT currency, commission_rate, settlement_mode
    FROM finance_settings
    WHERE id = 1
  `);

  res.json({
    success: true,
    data: {
      summary: summaryResult.rows[0] || {},
      transactions: transactionsResult.rows,
      payouts: payoutsResult.rows,
      settings: settingsResult.rows[0] || { currency: 'YER', commission_rate: 10, settlement_mode: 'manual' },
    },
  });
}));

module.exports = router;
