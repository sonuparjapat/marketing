const pool = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, fail } = require('../../utils/response');
const { buildAdminCrud } = require('../../utils/crud');

const listBanners = asyncHandler(async (req, res) => {
  const placement = req.query.placement === 'promo' ? 'promo' : 'hero';
  const result = await pool.query(
    'SELECT * FROM banners WHERE is_active = TRUE AND placement = $1 ORDER BY sort_order ASC, id ASC',
    [placement]
  );
  ok(res, result.rows);
});

const allowedFields = [
  'tag_label', 'title', 'subtitle', 'image_url', 'button_label', 'button_link',
  'placement', 'is_active', 'sort_order',
];
const adminCrud = buildAdminCrud('banners', { allowedFields, defaultOrder: 'sort_order ASC, id ASC' });

const reorderBanners = asyncHandler(async (req, res) => {
  const { order } = req.body; // array of { id, sort_order }
  if (!Array.isArray(order)) return fail(res, 'order must be an array of { id, sort_order }', 400);

  await Promise.all(
    order.map(({ id, sort_order }) => pool.query('UPDATE banners SET sort_order = $1 WHERE id = $2', [sort_order, id]))
  );
  ok(res, { updated: order.length });
});

module.exports = {
  listBanners,
  adminList: adminCrud.list,
  adminGetOne: adminCrud.getOne,
  createBanner: adminCrud.create,
  updateBanner: adminCrud.update,
  removeBanner: adminCrud.remove,
  reorderBanners,
};
