const pool = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const { ok } = require('../../utils/response');

const getAnalytics = asyncHandler(async (req, res) => {
  const [leadsByDay, topServices, topPages, totals, revenueByMonth, invoiceStatusBreakdown, topPlans] = await Promise.all([
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
    // Combines both revenue sources — premium subscription payments and agency invoice payments —
    // grouped by month over the last 6 months. Two structurally different tables (payments has a
    // customer_id/plan_id shape, invoice_payments has an invoice_id/method shape) so this is a
    // UNION ALL of two independently-aggregated subqueries, not a shared query.
    pool.query(`
      SELECT month, SUM(amount_paise)::bigint AS amount_paise, source FROM (
        SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS month, amount_paise, 'subscriptions' AS source
        FROM payments WHERE status = 'paid' AND created_at >= NOW() - INTERVAL '6 months'
        UNION ALL
        SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS month, amount_paise, 'invoices' AS source
        FROM invoice_payments WHERE status = 'paid' AND created_at >= NOW() - INTERVAL '6 months'
      ) combined
      GROUP BY month, source ORDER BY month
    `),
    pool.query(`SELECT status, COUNT(*)::int AS count FROM invoices GROUP BY status`),
    pool.query(`
      SELECT p.name, SUM(pay.amount_paise)::bigint AS revenue
      FROM payments pay JOIN subscription_plans p ON p.id = pay.plan_id
      WHERE pay.status = 'paid'
      GROUP BY p.name ORDER BY revenue DESC LIMIT 5
    `),
  ]);

  ok(res, {
    leadsByDay: leadsByDay.rows,
    topServices: topServices.rows,
    topPages: topPages.rows,
    pageViews30d: totals.rows[0].count,
    revenueByMonth: revenueByMonth.rows,
    invoiceStatusBreakdown: invoiceStatusBreakdown.rows,
    topPlans: topPlans.rows,
  });
});

module.exports = { getAnalytics };
