const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, fail } = require('../../utils/response');
const { s3, isConfigured: s3Configured, publicUrlFor } = require('../../config/aws');
const { PutObjectCommand } = require('@aws-sdk/client-s3');

const UPLOADS_DIR = path.join(__dirname, '../../../uploads');

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return fail(res, 'Email and password are required', 400);

  const result = await pool.query('SELECT * FROM admins WHERE email = $1', [email.trim().toLowerCase()]);
  const admin = result.rows[0];
  if (!admin) return fail(res, 'Invalid credentials', 401);
  if (admin.is_active === false) return fail(res, 'This account has been deactivated', 403);

  const match = await bcrypt.compare(password, admin.password_hash);
  if (!match) return fail(res, 'Invalid credentials', 401);

  let permissions = [];
  let departmentName = null;
  if (admin.role !== 'super_admin' && admin.department_id) {
    const permResult = await pool.query(
      `SELECT permissions.key FROM department_permissions
       JOIN permissions ON permissions.id = department_permissions.permission_id
       WHERE department_permissions.department_id = $1`,
      [admin.department_id]
    );
    permissions = permResult.rows.map((r) => r.key);
    const deptResult = await pool.query('SELECT name FROM departments WHERE id = $1', [admin.department_id]);
    departmentName = deptResult.rows[0]?.name || null;
  }

  const token = jwt.sign(
    {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      name: admin.name,
      department_id: admin.department_id,
      permissions,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  await pool.query('UPDATE admins SET last_login = NOW() WHERE id = $1', [admin.id]);

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  ok(res, {
    token,
    admin: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      department_id: admin.department_id,
      department_name: departmentName,
      permissions,
    },
  });
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie('token');
  ok(res, { loggedOut: true });
});

const me = asyncHandler(async (req, res) => {
  ok(res, req.admin);
});

const stats = asyncHandler(async (req, res) => {
  const [leadsToday, leadsTotal, subscribers, postViews, pendingCallbacks] = await Promise.all([
    pool.query("SELECT COUNT(*)::int AS count FROM leads WHERE created_at >= CURRENT_DATE"),
    pool.query('SELECT COUNT(*)::int AS count FROM leads'),
    pool.query('SELECT COUNT(*)::int AS count FROM subscribers WHERE is_active = TRUE'),
    pool.query("SELECT COALESCE(SUM(views),0)::int AS total FROM posts WHERE created_at >= date_trunc('month', CURRENT_DATE)"),
    pool.query("SELECT COUNT(*)::int AS count FROM callbacks WHERE status = 'pending'"),
  ]);

  const recentLeads = await pool.query('SELECT * FROM leads ORDER BY created_at DESC LIMIT 5');

  ok(res, {
    leadsToday: leadsToday.rows[0].count,
    leadsTotal: leadsTotal.rows[0].count,
    activeSubscribers: subscribers.rows[0].count,
    blogViewsThisMonth: postViews.rows[0].total,
    pendingCallbacks: pendingCallbacks.rows[0].count,
    recentLeads: recentLeads.rows,
  });
});

const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) return fail(res, 'No file uploaded', 400);

  const ext = (req.file.originalname.split('.').pop() || 'bin').toLowerCase();
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
  let url;

  if (s3Configured) {
    const key = `uploads/${filename}`;
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      })
    );
    url = publicUrlFor(key);
  } else {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    fs.writeFileSync(path.join(UPLOADS_DIR, filename), req.file.buffer);
    url = `${req.protocol}://${req.get('host')}/uploads/${filename}`;
  }

  const result = await pool.query(
    `INSERT INTO media (url, filename, mime_type, size_bytes, uploaded_by)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [url, req.file.originalname, req.file.mimetype, req.file.size, req.admin?.id || null]
  );

  ok(res, { url, media: result.rows[0] }, 201);
});

module.exports = { login, logout, me, stats, uploadImage };
