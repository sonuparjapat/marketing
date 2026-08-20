const pool = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, fail } = require('../../utils/response');
const { buildAdminCrud } = require('../../utils/crud');

// The homepage carousel's only data source — the admin-curated top 5 (see setHomepageSelection
// below), in the order the admin picked. A review being active+approved isn't enough on its own to
// appear here; it also has to be explicitly selected for the homepage.
const listTestimonials = asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT * FROM testimonials
     WHERE is_active = TRUE AND is_approved = TRUE AND home_sort_order IS NOT NULL
     ORDER BY home_sort_order ASC LIMIT 5`
  );
  ok(res, result.rows);
});

const allowedFields = [
  'client_name', 'client_designation', 'client_company', 'client_photo',
  'rating', 'review', 'is_active', 'is_approved',
];
const adminCrud = buildAdminCrud('testimonials', { allowedFields, defaultOrder: 'id DESC' });

// The picker's data source — every review an admin could choose to put on the homepage, with its
// current selection state so the UI can show what's already picked without a second round trip.
const listEligibleForHomepage = asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT id, client_name, client_designation, client_company, client_photo, rating, review, home_sort_order
     FROM testimonials WHERE is_active = TRUE AND is_approved = TRUE
     ORDER BY home_sort_order ASC NULLS LAST, id DESC`
  );
  ok(res, result.rows);
});

// PUT /admin/testimonials/homepage-selection { order: [id, id, ...] } — array position becomes the
// homepage display order (1-based). This is the ONLY place home_sort_order is ever written, so the
// "at most 5, always active+approved" invariant can't be bypassed through the generic testimonials
// CRUD. Admin can call this again at any time to change the selection or reorder it.
const setHomepageSelection = asyncHandler(async (req, res) => {
  const { order } = req.body;
  if (!Array.isArray(order)) return fail(res, 'order must be an array of testimonial ids', 400);
  if (order.length > 5) return fail(res, 'Choose at most 5 reviews for the homepage', 400);
  if (new Set(order).size !== order.length) return fail(res, 'Each review can only be selected once', 400);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Clear every currently-selected review first — anything left out of `order` this time is
    // deselected. Simpler and safer than diffing old vs. new selections field by field.
    await client.query('UPDATE testimonials SET home_sort_order = NULL WHERE home_sort_order IS NOT NULL');

    for (let i = 0; i < order.length; i++) {
      const result = await client.query(
        `UPDATE testimonials SET home_sort_order = $1 WHERE id = $2 AND is_active = TRUE AND is_approved = TRUE RETURNING id`,
        [i + 1, order[i]]
      );
      if (!result.rows[0]) {
        await client.query('ROLLBACK');
        return fail(res, `Review ${order[i]} isn't active and approved, so it can't be shown on the homepage`, 400);
      }
    }

    await client.query('COMMIT');
    ok(res, { selected: order.length });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

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
  listEligibleForHomepage,
  setHomepageSelection,
  adminList: adminCrud.list,
  adminGetOne: adminCrud.getOne,
  createTestimonial: adminCrud.create,
  updateTestimonial: adminCrud.update,
  removeTestimonial: adminCrud.remove,
};
