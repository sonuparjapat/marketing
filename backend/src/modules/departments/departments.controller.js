const pool = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, fail } = require('../../utils/response');

const listDepartments = asyncHandler(async (req, res) => {
  const result = await pool.query(`
    SELECT departments.*,
      COALESCE(json_agg(DISTINCT permissions.key) FILTER (WHERE permissions.key IS NOT NULL), '[]') AS permission_keys,
      COUNT(DISTINCT admins.id)::int AS admin_count
    FROM departments
    LEFT JOIN department_permissions ON department_permissions.department_id = departments.id
    LEFT JOIN permissions ON permissions.id = department_permissions.permission_id
    LEFT JOIN admins ON admins.department_id = departments.id
    GROUP BY departments.id
    ORDER BY departments.created_at ASC
  `);
  ok(res, { items: result.rows, page: 1, limit: result.rows.length, total: result.rows.length });
});

const createDepartment = asyncHandler(async (req, res) => {
  const { name, description, permission_keys } = req.body;
  if (!name) return fail(res, 'name is required', 400);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const deptResult = await client.query(
      'INSERT INTO departments (name, description) VALUES ($1, $2) RETURNING *',
      [name, description || null]
    );
    const department = deptResult.rows[0];

    if (Array.isArray(permission_keys) && permission_keys.length) {
      await client.query(
        `INSERT INTO department_permissions (department_id, permission_id)
         SELECT $1, id FROM permissions WHERE key = ANY($2::text[])`,
        [department.id, permission_keys]
      );
    }
    await client.query('COMMIT');
    ok(res, department, 201);
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') return fail(res, 'A department with that name already exists', 409);
    throw err;
  } finally {
    client.release();
  }
});

const updateDepartment = asyncHandler(async (req, res) => {
  const { name, description, permission_keys } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const fields = [];
    const values = [];
    if (name !== undefined) {
      values.push(name);
      fields.push(`name = $${values.length}`);
    }
    if (description !== undefined) {
      values.push(description);
      fields.push(`description = $${values.length}`);
    }
    if (fields.length) {
      values.push(req.params.id);
      await client.query(`UPDATE departments SET ${fields.join(', ')} WHERE id = $${values.length}`, values);
    }

    if (Array.isArray(permission_keys)) {
      await client.query('DELETE FROM department_permissions WHERE department_id = $1', [req.params.id]);
      if (permission_keys.length) {
        await client.query(
          `INSERT INTO department_permissions (department_id, permission_id)
           SELECT $1, id FROM permissions WHERE key = ANY($2::text[])`,
          [req.params.id, permission_keys]
        );
      }
    }

    const result = await client.query('SELECT * FROM departments WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) {
      await client.query('ROLLBACK');
      return fail(res, 'Department not found', 404);
    }
    await client.query('COMMIT');
    ok(res, result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

const deleteDepartment = asyncHandler(async (req, res) => {
  const inUse = await pool.query('SELECT COUNT(*)::int AS count FROM admins WHERE department_id = $1', [req.params.id]);
  if (inUse.rows[0].count > 0) {
    return fail(res, 'Reassign the admins in this department before deleting it', 400);
  }
  const result = await pool.query('DELETE FROM departments WHERE id = $1 RETURNING id', [req.params.id]);
  if (!result.rows[0]) return fail(res, 'Department not found', 404);
  ok(res, { id: result.rows[0].id });
});

module.exports = { listDepartments, createDepartment, updateDepartment, deleteDepartment };
