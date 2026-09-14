const fs = require('fs/promises');
const path = require('path');
const { query } = require('../config/database');

async function removeLocalFile(fileUrl) {
  if (!fileUrl || /^https?:\/\//i.test(fileUrl)) return;
  const normalized = String(fileUrl).replace(/\\/g, '/');
  const uploadMarker = normalized.indexOf('/uploads/');
  if (uploadMarker < 0) return;
  const relative = normalized.slice(uploadMarker + 1);
  const fullPath = path.resolve(__dirname, '../../', relative);
  const uploadsRoot = path.resolve(__dirname, '../../uploads');
  if (!fullPath.startsWith(`${uploadsRoot}${path.sep}`)) return;
  try { await fs.unlink(fullPath); } catch (error) { if (error.code !== 'ENOENT') console.error('Evidence file deletion failed:', error.message); }
}

async function purgeExpiredHandoverEvidence() {
  const candidates = await query(`
    SELECT r.id, r.completed_at,
           COALESCE(MAX(c.resolved_at), r.completed_at) AS retention_anchor,
           COALESCE(MAX(c.resolved_at), r.completed_at) + (settings.evidence_retention_days || ' days')::interval AS delete_after,
           ARRAY_REMOVE(ARRAY_AGG(DISTINCT hi.image_url), NULL) AS handover_urls,
           ARRAY_REMOVE(ARRAY_AGG(DISTINCT vi.image_url), NULL) AS verification_urls
    FROM reservations r
    JOIN policy_settings settings ON settings.policy_version = COALESCE(r.policy_version, '1.1')
    LEFT JOIN complaints c ON c.reservation_id = r.id
    LEFT JOIN handover_logs hl ON hl.reservation_id = r.id
    LEFT JOIN handover_images hi ON hi.handover_log_id = hl.id
    LEFT JOIN handover_verifications hv ON hv.reservation_id = r.id
    LEFT JOIN handover_verification_images vi ON vi.verification_id = hv.id
    WHERE r.status = 'completed'
      AND r.completed_at IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM complaints open_c WHERE open_c.reservation_id = r.id AND open_c.status NOT IN ('resolved', 'closed', 'rejected'))
    GROUP BY r.id, r.completed_at, settings.evidence_retention_days
    HAVING COALESCE(MAX(c.resolved_at), r.completed_at) + (settings.evidence_retention_days || ' days')::interval <= NOW()
    LIMIT 100
  `);

  let purged = 0;
  for (const row of candidates.rows) {
    const urls = [...(row.handover_urls || []), ...(row.verification_urls || [])];
    for (const url of urls) await removeLocalFile(url);
    await query('INSERT INTO audit_logs (action, entity_type, entity_id, new_data) VALUES ($1,$2,$3,$4)', ['handover_evidence_purged', 'reservation', row.id, JSON.stringify({ retention_anchor: row.retention_anchor, delete_after: row.delete_after, evidence_retention_days: 10 })]);
    await query('DELETE FROM handover_logs WHERE reservation_id = $1', [row.id]);
    purged += 1;
  }
  return purged;
}

module.exports = { purgeExpiredHandoverEvidence };
