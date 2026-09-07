export function maskEmail(email) {
  const value = String(email || '').trim();
  const [local = '', domain = ''] = value.split('@');
  if (!local || !domain) return value ? '***' : '';

  const maskedLocal = local.length <= 2
    ? `${local.charAt(0)}***`
    : `${local.charAt(0)}***${local.charAt(local.length - 1)}`;
  const domainParts = domain.split('.');
  const host = domainParts.shift() || '';
  const maskedHost = host.length <= 2
    ? `${host.charAt(0)}***`
    : `${host.charAt(0)}***${host.charAt(host.length - 1)}`;

  return `${maskedLocal}@${[maskedHost, ...domainParts].join('.')}`;
}
