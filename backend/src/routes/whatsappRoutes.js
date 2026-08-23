const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const whatsappService = require('../services/whatsappService');

const router = express.Router();

// Meta webhook verification challenge.
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (
    mode === 'subscribe' &&
    token &&
    token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
  ) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

// Meta webhook delivery: respond quickly and process only normalized events.
router.post('/webhook', asyncHandler(async (req, res) => {
  const rawBody = Buffer.isBuffer(req.body)
    ? req.body
    : Buffer.from(JSON.stringify(req.body || {}));

  const signature = req.get('x-hub-signature-256');
  if (!whatsappService.verifyWebhookSignature(rawBody, signature)) {
    return res.status(403).json({
      success: false,
      message: 'Invalid WhatsApp webhook signature',
    });
  }

  let payload;
  try {
    payload = Buffer.isBuffer(req.body)
      ? JSON.parse(req.body.toString('utf8'))
      : req.body;
  } catch (error) {
    return res.status(400).json({ success: false, message: 'Invalid WhatsApp webhook payload' });
  }

  const events = whatsappService.extractWebhookEvents(payload);
  for (const event of events) {
    console.log('[whatsapp webhook]', event.kind, event.message?.id || event.status?.id || 'event');
  }

  return res.sendStatus(200);
}));

router.get('/status', protect, authorize('admin'), (req, res) => {
  res.json({ success: true, data: whatsappService.getStatus() });
});

router.post('/test', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const { to, message } = req.body || {};
  const result = await whatsappService.sendTextMessage({ to, body: message });
  res.json({ success: true, data: result });
}));

module.exports = router;
