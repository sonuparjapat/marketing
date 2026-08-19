const pool = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, fail } = require('../../utils/response');

const listDepartments = asyncHandler(async (req, res) => {
  const result = await pool.query(`
    SELECT departments.*,
      COALESCE(
        json_agg(
          json_build_object(
            'resource_key', permissions.resource_key,
            'can_create', department_permissions.can_create,
            'can_read', department_permissions.can_read,
            'can_update', department_permissions.can_update,
            'can_delete', department_permissions.can_delete
          )
        ) FILTER (WHERE permissions.resource_key IS NOT NULL), '[]'
      ) AS permissions,
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

// `grants` is an array of {resource_key, can_create, can_read, can_update, can_delete}. Rows with
// every flag false are skipped — no point storing an all-false grant row.
async function insertPermissionGrants(client, departmentId, grants) {
  const rows = (grants || []).filter((g) => g.can_create || g.can_read || g.can_update || g.can_delete);
  if (!rows.length) return;

  const values = [];
  const placeholders = rows.map((g, i) => {
    const base = i * 6;
    values.push(departmentId, g.resource_key, Boolean(g.can_create), Boolean(g.can_read), Boolean(g.can_update), Boolean(g.can_delete));
    return `($${base + 1}, (SELECT id FROM permissions WHERE resource_key = $${base + 2}), $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`;
  });

  await client.query(
    `INSERT INTO department_permissions (department_id, permission_id, can_create, can_read, can_update, can_delete)
     VALUES ${placeholders.join(', ')}`,
    values
  );
}

const createDepartment = asyncHandler(async (req, res) => {
  const { name, description, permissions } = req.body;
  if (!name) return fail(res, 'name is required', 400);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const deptResult = await client.query(
      'INSERT INTO departments (name, description) VALUES ($1, $2) RETURNING *',
      [name, description || null]
    );
    const department = deptResult.rows[0];

    if (Array.isArray(permissions)) {
      await insertPermissionGrants(client, department.id, permissions);
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
  const { name, description, permissions } = req.body;
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

    if (Array.isArray(permissions)) {
      await client.query('DELETE FROM department_permissions WHERE department_id = $1', [req.params.id]);
      await insertPermissionGrants(client, req.params.id, permissions);
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
