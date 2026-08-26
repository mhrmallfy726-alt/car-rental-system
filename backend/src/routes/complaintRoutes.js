const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { query } = require('../config/database');
const { uploadComplaintAttachment } = require('../middleware/upload');

// Create complaint or chat (One Thread Per Reservation)
router.post('/', protect, asyncHandler(async (req, res, next) => {
  const { reservation_id, against_id: provided_against_id, type, title, description, is_chat } = req.body;
  if (!reservation_id || !title || !description || !type) return next(new AppError('جميع الحقول مطلوبة', 400));

  // Auto-determine against_id from reservation if not provided
  let against_id = provided_against_id;
  if (!against_id) {
    const reservation = await query('SELECT * FROM reservations WHERE id = $1', [reservation_id]);
    if (reservation.rows.length === 0) return next(new AppError('الحجز غير موجود', 404));
    const res_data = reservation.rows[0];
    if (req.user.role === 'customer') {
      against_id = res_data.supplier_id;
    } else if (req.user.role === 'supplier') {
      against_id = res_data.customer_id;
    } else {
      against_id = res_data.customer_id;
    }
  }

  if (!against_id) return next(new AppError('لا يمكن تحديد الطرف الآخر', 400));

  const existing = await query('SELECT * FROM complaints WHERE reservation_id = $1', [reservation_id]);
  
  if (existing.rows.length > 0) {
    const comp = existing.rows[0];
    // If escalating a chat to a dispute
    if (is_chat === false && comp.is_chat === true) {
      const updated = await query(
        `UPDATE complaints SET is_chat = false, type = $1, title = $2, description = $3, status = 'open' WHERE id = $4 RETURNING *`,
        [type, title, description, comp.id]
      );
      await query(`UPDATE reservations SET status = 'disputed' WHERE id = $1`, [reservation_id]);
      
      const io = req.app.get('io');
      if (io) {
        io.to(`user_${against_id}`).emit('notification', {
          type: 'dispute_opened',
          complaint_id: comp.id,
          message: `تم تصعيد المحادثة إلى نزاع للحجز #${reservation_id}`
        });
      }
      return res.status(200).json({ success: true, data: updated.rows[0] });
    }
    // Return existing thread
    return res.status(200).json({ success: true, data: comp });
  }

  // Insert new thread
  const result = await query(
    `INSERT INTO complaints (reservation_id, complainant_id, against_id, type, title, description, is_chat) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [reservation_id, req.user.id, against_id, type, title, description, is_chat !== undefined ? is_chat : true]
  );

  // If created directly as a dispute
  if (is_chat === false) {
    await query(`UPDATE reservations SET status = 'disputed' WHERE id = $1`, [reservation_id]);

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${against_id}`).emit('notification', {
        type: 'dispute_opened',
        complaint_id: result.rows[0].id,
        message: `تم فتح نزاع بخصوص الحجز #${reservation_id}`
      });
    }
  }

  res.status(201).json({ success: true, data: result.rows[0] });
}));

// Get my complaints (both as complainant and as the receiving party)
router.get('/my', protect, asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT c.*, 
      u1.name as against_name, 
      u2.name as complainant_name,
      r.car_id,
      cars.make || ' ' || cars.model as car_name
     FROM complaints c 
     JOIN users u1 ON c.against_id = u1.id 
     JOIN users u2 ON c.complainant_id = u2.id
     LEFT JOIN reservations r ON c.reservation_id = r.id
     LEFT JOIN cars ON r.car_id = cars.id
     WHERE c.complainant_id = $1 OR c.against_id = $1 
     ORDER BY c.created_at DESC`,
    [req.user.id]
  );
  res.json({ success: true, data: result.rows });
}));

// Get single complaint
router.get('/:id', protect, asyncHandler(async (req, res, next) => {
  let result;
  if (req.user.role === 'admin') {
    result = await query(
      `SELECT c.*, u1.name as against_name, u2.name as complainant_name 
       FROM complaints c 
       JOIN users u1 ON c.against_id = u1.id 
       JOIN users u2 ON c.complainant_id = u2.id
       WHERE c.id = $1`,
      [req.params.id]
    );
  } else {
    result = await query(
      `SELECT c.*, u1.name as against_name, u2.name as complainant_name 
       FROM complaints c 
       JOIN users u1 ON c.against_id = u1.id 
       JOIN users u2 ON c.complainant_id = u2.id
       WHERE c.id = $1 AND (c.complainant_id = $2 OR c.against_id = $2)`,
      [req.params.id, req.user.id]
    );
  }
  if (result.rows.length === 0) return next(new AppError('المحادثة غير موجودة', 404));
  res.json({ success: true, data: result.rows[0] });
}));

// Send message in complaint (with file attachment)
router.post('/:id/message', protect, uploadComplaintAttachment, asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { message } = req.body;
  if (!message) return next(new AppError('الرسالة مطلوبة', 400));

  let complaint;
  if (req.user.role === 'admin') {
    complaint = await query('SELECT * FROM complaints WHERE id = $1', [id]);
  } else {
    complaint = await query(
      'SELECT * FROM complaints WHERE id = $1 AND (complainant_id = $2 OR against_id = $2)',
      [id, req.user.id]
    );
  }
  if (complaint.rows.length === 0) return next(new AppError('غير مصرح لك بالمشاركة في هذه المحادثة', 403));

  if (complaint.rows[0].status === 'resolved' || complaint.rows[0].status === 'closed') {
    return next(new AppError('تم إغلاق هذه المحادثة ولا يمكن إضافة رسائل جديدة', 400));
  }

  const attachment = req.file ? req.file.path.replace(/\\/g, '/') : null;
  const result = await query(
    `INSERT INTO complaint_messages (complaint_id, sender_id, message, attachment_url) VALUES ($1,$2,$3,$4) RETURNING *`,
    [id, req.user.id, message, attachment]
  );

  const newMessageObj = {
    ...result.rows[0],
    sender_name: req.user.name,
    sender_role: req.user.role,
    attachment_url: attachment
  };

  const io = req.app.get('io');
  if (io) {
    io.to(`complaint_${id}`).emit('receive_message', newMessageObj);
    // Notify the other party (if not the sender) that a new message arrived
    if (req.user.role === 'admin') {
      io.to(`user_${complaint.rows[0].complainant_id}`).emit('notification', { type: 'new_message', complaint_id: id, message: `رسالة جديدة من الإدارة في النزاع` });
      io.to(`user_${complaint.rows[0].against_id}`).emit('notification', { type: 'new_message', complaint_id: id, message: `رسالة جديدة من الإدارة في النزاع` });
    } else {
      const otherPartyId = complaint.rows[0].complainant_id === req.user.id ? complaint.rows[0].against_id : complaint.rows[0].complainant_id;
      io.to(`user_${otherPartyId}`).emit('notification', {
        type: 'new_message',
        complaint_id: id,
        message: `رسالة جديدة في المحادثة: ${complaint.rows[0].title}`
      });
    }
  }

  res.status(201).json({ success: true, data: newMessageObj });
}));

// Get complaint messages
router.get('/:id/messages', protect, asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT cm.*, u.name as sender_name, u.role as sender_role FROM complaint_messages cm JOIN users u ON cm.sender_id = u.id WHERE cm.complaint_id = $1 ORDER BY cm.created_at ASC`,
    [req.params.id]
  );
  // Add full URL for attachments
  const messagesWithUrls = result.rows.map(msg => ({
    ...msg,
    attachment_url: msg.attachment_url
  }));
  res.json({ success: true, data: messagesWithUrls });
}));

// Resolve / update complaint status (Admin only)
router.put('/:id/resolve', protect, authorize('admin'), asyncHandler(async (req, res, next) => {
  const { resolution, status } = req.body;
  const newStatus = status || 'resolved';

  const existing = await query('SELECT * FROM complaints WHERE id = $1', [req.params.id]);
  if (existing.rows.length === 0) return next(new AppError('الشكوى غير موجودة', 404));
  const complaint = existing.rows[0];

  // Update complaint status
  const result = await query(
    `UPDATE complaints SET status = $1, resolution = $2, resolved_by = $3, resolved_at = NOW() WHERE id = $4 RETURNING *`,
    [newStatus, resolution, req.user.id, req.params.id]
  );

  // If resolved/closed and reservation was disputed, restore it to appropriate status
  if ((newStatus === 'resolved' || newStatus === 'closed') && complaint.reservation_id) {
    const reservation = await query('SELECT status, start_date, end_date FROM reservations WHERE id = $1', [complaint.reservation_id]);
    if (reservation.rows.length > 0 && reservation.rows[0].status === 'disputed') {
      // Determine new status: if end_date < today -> completed, else active
      const today = new Date();
      const endDate = new Date(reservation.rows[0].end_date);
      let newResStatus = endDate < today ? 'completed' : 'active';
      await query(`UPDATE reservations SET status = $1 WHERE id = $2`, [newResStatus, complaint.reservation_id]);
    }
  }

  // Send a system message to the chat
  const adminMsg = newStatus === 'resolved'
    ? `[System] ✅ تم حل النزاع من قِبل الإدارة. القرار: ${resolution || 'تم الإغلاق'}`
    : `[System] ⚠️ تم تحديث حالة النزاع إلى: ${newStatus}`;
  const msgResult = await query(
    `INSERT INTO complaint_messages (complaint_id, sender_id, message) VALUES ($1,$2,$3) RETURNING *`,
    [req.params.id, req.user.id, adminMsg]
  );

  const io = req.app.get('io');
  if (io) {
    io.to(`complaint_${req.params.id}`).emit('receive_message', {
      ...msgResult.rows[0],
      sender_name: req.user.name,
      sender_role: req.user.role
    });
    io.to(`complaint_${req.params.id}`).emit('complaint_status_changed', newStatus);
    // Notify both parties
    io.to(`user_${complaint.complainant_id}`).emit('notification', {
      type: 'complaint_resolved',
      complaint_id: req.params.id,
      message: `تم ${newStatus === 'resolved' ? 'حل' : 'تحديث'} النزاع`
    });
    io.to(`user_${complaint.against_id}`).emit('notification', {
      type: 'complaint_resolved',
      complaint_id: req.params.id,
      message: `تم ${newStatus === 'resolved' ? 'حل' : 'تحديث'} النزاع`
    });
  }

  res.json({ success: true, data: result.rows[0] });
}));

module.exports = router;