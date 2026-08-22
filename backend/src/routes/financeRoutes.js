const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const financeService = require('../services/financeService');

const router = express.Router();
router.use(protect, authorize('admin'));

router.get('/dashboard', asyncHandler(async (req, res) => {
  const data = await financeService.getDashboard();
  res.json({ success: true, data });
}));

router.get('/settings', asyncHandler(async (req, res) => {
  const data = await financeService.getSettings();
  res.json({ success: true, data });
}));

router.put('/settings', asyncHandler(async (req, res) => {
  const data = await financeService.updateSettings(req.user.id, req.body);
  res.json({ success: true, data });
}));

router.post('/payouts', asyncHandler(async (req, res, next) => {
  const { supplier_id: supplierId, amount, notes } = req.body;
  if (!supplierId || amount === undefined) {
    return next(new AppError('المورد والمبلغ مطلوبان', 400));
  }
  const data = await financeService.createPayout(
    req.user.id,
    supplierId,
    amount,
    notes,
  );
  res.status(201).json({ success: true, data });
}));

router.put('/payouts/:id/complete', asyncHandler(async (req, res) => {
  const data = await financeService.completePayout(
    req.user.id,
    req.params.id,
    req.body.notes,
  );
  res.json({ success: true, data });
}));

module.exports = router;
