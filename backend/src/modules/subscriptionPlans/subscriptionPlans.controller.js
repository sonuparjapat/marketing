const pool = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, fail } = require('../../utils/response');

async function attachServices(plans) {
  if (!plans.length) return plans;
  const ids = plans.map((p) => p.id);
  const result = await pool.query(
    `SELECT ps.plan_id, s.id, s.key, s.label
     FROM plan_services ps JOIN premium_services s ON s.id = ps.service_id
     WHERE ps.plan_id = ANY($1::int[]) ORDER BY s.label ASC`,
    [ids]
  );
  const byPlan = new Map(ids.map((id) => [id, []]));
  for (const row of result.rows) byPlan.get(row.plan_id).push({ id: row.id, key: row.key, label: row.label });
  return plans.map((p) => ({ ...p, services: byPlan.get(p.id) || [] }));
}

// Number of customers CURRENTLY (not historically) subscribed to a plan — the one query the whole
// service-lock business rule hinges on. Always derived live (status='active' AND expires_at>NOW()),
// never a stored/cached count, so it can never go stale.
async function activeSubscriberCount(planId) {
  const result = await pool.query(
    `SELECT COUNT(*)::int AS n FROM customer_subscriptions WHERE plan_id = $1 AND status = 'active' AND expires_at > NOW()`,
    [planId]
  );
  return result.rows[0].n;
}

// Public — plans available for purchase, with their bundled services, for the pricing page.
const listActivePlans = asyncHandler(async (req, res) => {
  const result = await pool.query(
    'SELECT id, name, description, duration_days, price_paise, sort_order FROM subscription_plans WHERE is_active = TRUE ORDER BY sort_order ASC, price_paise ASC'
  );
  ok(res, await attachServices(result.rows));
});

const adminList = asyncHandler(async (req, res) => {
  const result = await pool.query('SELECT * FROM subscription_plans ORDER BY sort_order ASC, id ASC');
  const withServices = await attachServices(result.rows);
  const withCounts = await Promise.all(
    withServices.map(async (p) => ({ ...p, active_subscribers: await activeSubscriberCount(p.id) }))
  );
  ok(res, withCounts);
});

const adminGetOne = asyncHandler(async (req, res) => {
  const result = await pool.query('SELECT * FROM subscription_plans WHERE id = $1', [req.params.id]);
  const plan = result.rows[0];
  if (!plan) return fail(res, 'Plan not found', 404);
  const [withServices] = await attachServices([plan]);
  withServices.active_subscribers = await activeSubscriberCount(plan.id);
  ok(res, withServices);
});

// New plan — service_ids is freely settable since a brand-new plan has zero subscribers.
const createPlan = asyncHandler(async (req, res) => {
  const { name, description, duration_days, price_paise, is_active, sort_order, service_ids } = req.body;
  if (!name || !duration_days || price_paise === undefined) {
    return fail(res, 'name, duration_days and price_paise are required', 400);
  }
  if (!Array.isArray(service_ids) || service_ids.length === 0) {
    return fail(res, 'A plan must include at least one service', 400);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const planResult = await client.query(
      `INSERT INTO subscription_plans (name, description, duration_days, price_paise, is_active, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name.trim(), description || null, duration_days, price_paise, is_active !== false, sort_order || 0]
    );
    const plan = planResult.rows[0];
    for (const serviceId of service_ids) {
      await client.query('INSERT INTO plan_services (plan_id, service_id) VALUES ($1, $2)', [plan.id, serviceId]);
    }
    await client.query('COMMIT');
    const [withServices] = await attachServices([plan]);
    ok(res, { ...withServices, active_subscribers: 0 }, 201);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// name/description/price_paise/is_active/sort_order are editable any time — price changes only
// affect FUTURE purchases, and deactivating just hides the plan from the pricing page, neither
// takes anything away from an existing subscriber. service_ids is the one field the lock rule
// guards: if this plan currently has any active subscriber, the services list is frozen — no
// additions (can't retroactively hand out free extra value) and no removals (can't take away
// something a paying subscriber already bought) — until every subscriber to it has expired.
const updatePlan = asyncHandler(async (req, res) => {
  const { name, description, duration_days, price_paise, is_active, sort_order, service_ids } = req.body;

  const existing = await pool.query('SELECT id FROM subscription_plans WHERE id = $1', [req.params.id]);
  if (!existing.rows[0]) return fail(res, 'Plan not found', 404);

  if (service_ids !== undefined) {
    const n = await activeSubscriberCount(req.params.id);
    if (n > 0) {
      return fail(
        res,
        `${n} customer${n === 1 ? ' is' : 's are'} actively subscribed to this plan — its services can't change until they expire. Duplicate this plan to offer a different service bundle instead.`,
        400
      );
    }
    if (!Array.isArray(service_ids) || service_ids.length === 0) {
      return fail(res, 'A plan must include at least one service', 400);
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const fields = [];
    const values = [];
    const set = (col, val) => {
      values.push(val);
      fields.push(`${col} = $${values.length}`);
    };
    if (name !== undefined) set('name', name.trim());
    if (description !== undefined) set('description', description);
    if (duration_days !== undefined) set('duration_days', duration_days);
    if (price_paise !== undefined) set('price_paise', price_paise);
    if (is_active !== undefined) set('is_active', is_active);
    if (sort_order !== undefined) set('sort_order', sort_order);

    if (fields.length) {
      values.push(req.params.id);
      await client.query(`UPDATE subscription_plans SET ${fields.join(', ')} WHERE id = $${values.length}`, values);
    }

    if (service_ids !== undefined) {
      await client.query('DELETE FROM plan_services WHERE plan_id = $1', [req.params.id]);
      for (const serviceId of service_ids) {
        await client.query('INSERT INTO plan_services (plan_id, service_id) VALUES ($1, $2)', [req.params.id, serviceId]);
      }
    }

    await client.query('COMMIT');
    const planResult = await pool.query('SELECT * FROM subscription_plans WHERE id = $1', [req.params.id]);
    const [withServices] = await attachServices(planResult.rows);
    withServices.active_subscribers = await activeSubscriberCount(req.params.id);
    ok(res, withServices);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// The sanctioned way to evolve a locked plan's offering: copies name/description/duration/price
// and the CURRENT service list into a brand-new plan (zero subscribers, so fully editable), rather
// than mutating what existing subscribers already paid for.
const duplicatePlan = asyncHandler(async (req, res) => {
  const planResult = await pool.query('SELECT * FROM subscription_plans WHERE id = $1', [req.params.id]);
  const plan = planResult.rows[0];
  if (!plan) return fail(res, 'Plan not found', 404);
  const servicesResult = await pool.query('SELECT service_id FROM plan_services WHERE plan_id = $1', [plan.id]);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const newPlanResult = await client.query(
      `INSERT INTO subscription_plans (name, description, duration_days, price_paise, is_active, sort_order)
       VALUES ($1, $2, $3, $4, FALSE, $5) RETURNING *`,
      [`${plan.name} (copy)`, plan.description, plan.duration_days, plan.price_paise, plan.sort_order]
    );
    const newPlan = newPlanResult.rows[0];
    for (const row of servicesResult.rows) {
      await client.query('INSERT INTO plan_services (plan_id, service_id) VALUES ($1, $2)', [newPlan.id, row.service_id]);
    }
    await client.query('COMMIT');
    const [withServices] = await attachServices([newPlan]);
    ok(res, { ...withServices, active_subscribers: 0 }, 201);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

module.exports = { listActivePlans, adminList, adminGetOne, createPlan, updatePlan, duplicatePlan };
