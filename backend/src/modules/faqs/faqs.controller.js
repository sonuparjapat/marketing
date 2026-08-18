const pool = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const { ok } = require('../../utils/response');
const { buildAdminCrud } = require('../../utils/crud');

const listFaqs = asyncHandler(async (req, res) => {
  const params = [];
  let where = 'WHERE is_active = TRUE';
  if (req.query.category) {
    params.push(req.query.category);
    where += ` AND category = $${params.length}`;
  }
  const result = await pool.query(
    `SELECT * FROM faqs ${where} ORDER BY sort_order ASC, id ASC`,
    params
  );
  ok(res, result.rows);
});

const allowedFields = ['question', 'answer', 'category', 'sort_order', 'is_active'];
const adminCrud = buildAdminCrud('faqs', { allowedFields, defaultOrder: 'sort_order ASC, id ASC' });

module.exports = {
  listFaqs,
  adminList: adminCrud.list,
  adminGetOne: adminCrud.getOne,
  createFaq: adminCrud.create,
  updateFaq: adminCrud.update,
  removeFaq: adminCrud.remove,
};
