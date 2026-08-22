const DEFAULT_VERSION = process.env.WHATSAPP_API_VERSION || 'v23.0';

function normalizePhone(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/[^0-9]/g, '');
  return digits || null;
}

function isConfigured() {
  return Boolean(
    process.env.WHATSAPP_ACCESS_TOKEN &&
    process.env.WHATSAPP_PHONE_NUMBER_ID &&
    process.env.WHATSAPP_TEMPLATE_NAME
  );
}

async function sendTemplateMessage({ to, parameters = [] }) {
  const recipient = normalizePhone(to);
  if (!recipient) return { sent: false, skipped: true, reason: 'missing_phone' };
  if (!isConfigured()) return { sent: false, skipped: true, reason: 'whatsapp_not_configured' };

  const url = `https://graph.facebook.com/${DEFAULT_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const body = {
    messaging_product: 'whatsapp',
    to: recipient,
    type: 'template',
    template: {
      name: process.env.WHATSAPP_TEMPLATE_NAME,
      language: { code: process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'ar' },
      components: parameters.length
        ? [{ type: 'body', parameters: parameters.map(text => ({ type: 'text', text: String(text) })) }]
        : undefined
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = result?.error?.message || `WhatsApp API returned ${response.status}`;
    const error = new Error(message);
    error.providerResponse = result;
    throw error;
  }

  return { sent: true, messageId: result?.messages?.[0]?.id || null, providerResponse: result };
}

module.exports = { sendTemplateMessage, isConfigured };
