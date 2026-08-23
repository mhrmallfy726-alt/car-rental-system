const crypto = require('crypto');

const DEFAULT_VERSION = process.env.WHATSAPP_API_VERSION || 'v23.0';

function normalizePhone(phone) {
  if (!phone) return null;

  let digits = String(phone).replace(/[^0-9]/g, '');
  if (!digits) return null;

  const defaultCountryCode = String(
    process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || '967'
  ).replace(/[^0-9]/g, '');

  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0') && defaultCountryCode) {
    digits = `${defaultCountryCode}${digits.slice(1)}`;
  }

  return digits;
}

function getConfig() {
  return {
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    verifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
    appSecret: process.env.WHATSAPP_APP_SECRET,
    templateName: process.env.WHATSAPP_TEMPLATE_NAME,
    templateLanguage: process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'ar',
  };
}

function isConfigured() {
  const { accessToken, phoneNumberId } = getConfig();
  return Boolean(accessToken && phoneNumberId);
}

function getStatus() {
  const config = getConfig();
  return {
    configured: Boolean(config.accessToken && config.phoneNumberId),
    templateConfigured: Boolean(config.templateName),
    webhookConfigured: Boolean(config.verifyToken),
    phoneNumberIdConfigured: Boolean(config.phoneNumberId),
  };
}

async function sendMessagePayload(payload) {
  const { accessToken, phoneNumberId } = getConfig();
  if (!accessToken || !phoneNumberId) {
    return {
      sent: false,
      skipped: true,
      reason: 'whatsapp_not_configured',
    };
  }

  const url = `https://graph.facebook.com/${DEFAULT_VERSION}/${phoneNumberId}/messages`;
  const timeoutMs = Math.max(1000, Number(process.env.WHATSAPP_REQUEST_TIMEOUT_MS || 8000));
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        ...payload,
      }),
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(
        result?.error?.message ||
        `WhatsApp API returned ${response.status}`
      );
      error.status = response.status;
      error.providerResponse = result;
      throw error;
    }

    return {
      sent: true,
      messageId: result?.messages?.[0]?.id || null,
      providerResponse: result,
    };
  } catch (error) {
    // WhatsApp is an optional integration. Its outage must never crash the API.
    console.warn('[whatsapp] delivery skipped:', error.name === 'AbortError' ? `timeout after ${timeoutMs}ms` : error.message);
    return {
      sent: false,
      skipped: true,
      reason: error.name === 'AbortError' ? 'whatsapp_timeout' : 'whatsapp_unreachable',
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function sendTextMessage({ to, body, previewUrl = false }) {
  const recipient = normalizePhone(to);
  if (!recipient) {
    return { sent: false, skipped: true, reason: 'missing_phone' };
  }
  if (!body) {
    return { sent: false, skipped: true, reason: 'missing_message' };
  }

  return sendMessagePayload({
    to: recipient,
    type: 'text',
    text: {
      preview_url: previewUrl,
      body: String(body),
    },
  });
}

async function sendTemplateMessage({ to, parameters = [], templateName }) {
  const recipient = normalizePhone(to);
  const config = getConfig();

  if (!recipient) {
    return { sent: false, skipped: true, reason: 'missing_phone' };
  }
  if (!config.templateName && !templateName) {
    return {
      sent: false,
      skipped: true,
      reason: 'whatsapp_template_not_configured',
    };
  }

  return sendMessagePayload({
    to: recipient,
    type: 'template',
    template: {
      name: templateName || config.templateName,
      language: { code: config.templateLanguage },
      components: parameters.length
        ? [
            {
              type: 'body',
              parameters: parameters.map((text) => ({
                type: 'text',
                text: String(text ?? ''),
              })),
            },
          ]
        : undefined,
    },
  });
}

async function sendReservationStatusMessage({
  to,
  customerName,
  carName,
  status,
  reservationId,
  reason,
}) {
  const statusLabels = {
    awaiting_pickup: 'تمت الموافقة على الحجز وهو بانتظار الاستلام',
    rejected: 'تم رفض الحجز',
    cancelled: 'تم إلغاء الحجز',
    completed: 'تم إكمال الحجز بنجاح',
  };

  const statusText = statusLabels[status] || `تحديث حالة الحجز: ${status}`;
  const message = [
    `مرحبًا ${customerName || 'عميلنا الكريم'}،`,
    statusText,
    carName ? `السيارة: ${carName}` : null,
    reservationId ? `رقم الحجز: ${reservationId}` : null,
    reason ? `التفاصيل: ${reason}` : null,
    'يمكنك مراجعة تفاصيل الحجز من حسابك في المنصة.',
  ]
    .filter(Boolean)
    .join('\n');

  return sendTextMessage({ to, body: message });
}

function verifyWebhookSignature(rawBody, signature) {
  const { appSecret } = getConfig();
  if (!appSecret) return process.env.NODE_ENV !== 'production';
  if (!signature || !signature.startsWith('sha256=')) return false;

  const expected = crypto
    .createHmac('sha256', appSecret)
    .update(rawBody)
    .digest('hex');

  const received = signature.slice('sha256='.length);
  const expectedBuffer = Buffer.from(expected, 'utf8');
  const receivedBuffer = Buffer.from(received, 'utf8');

  return (
    expectedBuffer.length === receivedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

function extractWebhookEvents(payload) {
  const events = [];
  for (const entry of payload?.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value || {};
      for (const message of value.messages || []) {
        events.push({ kind: 'incoming_message', message, value });
      }
      for (const status of value.statuses || []) {
        events.push({ kind: 'message_status', status, value });
      }
    }
  }
  return events;
}

module.exports = {
  normalizePhone,
  isConfigured,
  getStatus,
  sendTextMessage,
  sendTemplateMessage,
  sendReservationStatusMessage,
  verifyWebhookSignature,
  extractWebhookEvents,
};
