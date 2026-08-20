const pool = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, fail } = require('../../utils/response');
const { buildAdminCrud } = require('../../utils/crud');

const listTestimonials = asyncHandler(async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM testimonials WHERE is_active = TRUE AND is_approved = TRUE ORDER BY is_featured DESC, id DESC'
  );
  ok(res, result.rows);
});

const allowedFields = [
  'client_name', 'client_designation', 'client_company', 'client_photo',
  'rating', 'review', 'is_featured', 'is_active', 'is_approved',
];
const adminCrud = buildAdminCrud('testimonials', { allowedFields, defaultOrder: 'id DESC' });

// Customer-submitted review — always starts unapproved (customer_id set, is_approved false) until
// an admin flips is_approved on the existing admin CRUD; separate from the admin-only create above.
const submitReview = asyncHandler(async (req, res) => {
  const { rating, review } = req.body;
  if (!review || !review.trim()) return fail(res, 'Review text is required', 400);
  const numericRating = Math.min(5, Math.max(1, parseInt(rating, 10) || 5));

  const result = await pool.query(
    `INSERT INTO testimonials (client_name, customer_id, rating, review, is_active, is_approved)
     VALUES ($1, $2, $3, $4, TRUE, FALSE) RETURNING id, rating, review, is_approved`,
    [req.customer.name, req.customer.id, numericRating, review.trim().slice(0, 2000)]
  );
  ok(res, result.rows[0], 201);
});

module.exports = {
  listTestimonials,
  submitReview,
  adminList: adminCrud.list,
  adminGetOne: adminCrud.getOne,
  createTestimonial: adminCrud.create,
  updateTestimonial: adminCrud.update,
  removeTestimonial: adminCrud.remove,
};
