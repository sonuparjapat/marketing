const pool = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const { ok } = require('../../utils/response');

const getAnalytics = asyncHandler(async (req, res) => {
  const [leadsByDay, topServices, topPages, totals] = await Promise.all([
    pool.query(`
      SELECT to_char(d.day, 'YYYY-MM-DD') AS day, COALESCE(COUNT(leads.id), 0)::int AS count
      FROM generate_series(CURRENT_DATE - INTERVAL '13 days', CURRENT_DATE, INTERVAL '1 day') AS d(day)
      LEFT JOIN leads ON leads.created_at::date = d.day
      GROUP BY d.day ORDER BY d.day
    `),
    pool.query(`
      SELECT COALESCE(service_interested, 'Not specified') AS service, COUNT(*)::int AS count
      FROM leads
      GROUP BY service_interested
      ORDER BY count DESC
      LIMIT 6
    `),
    pool.query(`
      SELECT path, COUNT(*)::int AS count
      FROM page_views
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY path
      ORDER BY count DESC
      LIMIT 10
    `),
    pool.query(`SELECT COUNT(*)::int AS count FROM page_views WHERE created_at >= NOW() - INTERVAL '30 days'`),
  ]);

  ok(res, {
    leadsByDay: leadsByDay.rows,
    topServices: topServices.rows,
    topPages: topPages.rows,
    pageViews30d: totals.rows[0].count,
  });
});

module.exports = { getAnalytics };
