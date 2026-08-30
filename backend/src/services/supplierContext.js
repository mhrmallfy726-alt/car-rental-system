// Helpers for supplier showroom context. The selected location is kept client-side;
// every backend query must still scope data by authenticated supplier_id.
function normalizeSupplierContext(locationId) {
  if (!locationId) return null;
  return String(locationId);
}

module.exports = { normalizeSupplierContext };
