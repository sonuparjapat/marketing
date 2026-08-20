const pool = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const { ok } = require('../../utils/response');
const { buildAdminCrud } = require('../../utils/crud');

const allowedFields = ['key', 'label', 'description', 'is_active'];
const adminCrud = buildAdminCrud('premium_services', { allowedFields, defaultOrder: 'label ASC' });

// No hard delete is exposed — a service can be referenced by plan_services (which itself may be
// locked by active subscribers) or posts.required_service_id, so deactivating (is_active = FALSE
// via the normal update route) is the only supported way to retire one. This keeps every past
// payment/subscription row meaningfully attributable to a real service forever.

const listActive = asyncHandler(async (req, res) => {
  const result = await pool.query('SELECT id, key, label, description FROM premium_services WHERE is_active = TRUE ORDER BY label ASC');
  ok(res, result.rows);
});

module.exports = {
  adminList: adminCrud.list,
  adminGetOne: adminCrud.getOne,
  createService: adminCrud.create,
  updateService: adminCrud.update,
  listActive,
};
