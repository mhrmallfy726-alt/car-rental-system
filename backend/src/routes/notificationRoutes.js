const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { query } = require('../config/database');

// Get my notifications
router.get('/', protect, asyncHandler(async (req, res) => {
  const result = await query(
    'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
    [req.user.id]
  );
  const unreadCount = await query(
    'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false',
    [req.user.id]
  );
  res.json({ success: true, data: result.rows, unread: parseInt(unreadCount.rows[0].count) });
}));

// Get one notification owned by the current user
router.get('/:id', protect, asyncHandler(async (req, res) => {
  const result = await query(
    'SELECT * FROM notifications WHERE id = $1 AND user_id = $2 LIMIT 1',
    [req.params.id, req.user.id]
  );

  if (!result.rows[0]) {
    return res.status(404).json({
      success: false,
      message: 'الإشعار غير موجود',
    });
  }

  res.json({ success: true, data: result.rows[0] });
}));

// Mark as read
router.put('/:id/read', protect, asyncHandler(async (req, res) => {
  await query('UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  res.json({ success: true });
}));

// Mark all as read
router.put('/read-all', protect, asyncHandler(async (req, res) => {
  await query('UPDATE notifications SET is_read = true WHERE user_id = $1', [req.user.id]);
  res.json({ success: true });
}));

module.exports = router;
