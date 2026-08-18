const pool = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const { ok } = require('../../utils/response');
const { buildAdminCrud } = require('../../utils/crud');

const listTestimonials = asyncHandler(async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM testimonials WHERE is_active = TRUE ORDER BY is_featured DESC, id DESC'
  );
  ok(res, result.rows);
});

const allowedFields = [
  'client_name', 'client_designation', 'client_company', 'client_photo',
  'rating', 'review', 'is_featured', 'is_active',
];
const adminCrud = buildAdminCrud('testimonials', { allowedFields, defaultOrder: 'id DESC' });

module.exports = {
  listTestimonials,
  adminList: adminCrud.list,
  adminGetOne: adminCrud.getOne,
  createTestimonial: adminCrud.create,
  updateTestimonial: adminCrud.update,
  removeTestimonial: adminCrud.remove,
};
