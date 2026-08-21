const fs = require('fs');
const path = require('path');
const pool = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, fail } = require('../../utils/response');
const { hasDocumentSignature, storeFile, UPLOADS_DIR } = require('../../utils/fileUpload');

const ENTITY_TYPES = ['client', 'project'];

const listDocuments = asyncHandler(async (req, res) => {
  const { entity_type, entity_id } = req.query;
  if (!ENTITY_TYPES.includes(entity_type) || !entity_id) {
    return fail(res, 'entity_type (client|project) and entity_id are required', 400);
  }
  const result = await pool.query(
    `SELECT d.*, a.name AS uploaded_by_name FROM documents d LEFT JOIN admins a ON a.id = d.uploaded_by
     WHERE d.entity_type = $1 AND d.entity_id = $2 ORDER BY d.created_at DESC`,
    [entity_type, entity_id]
  );
  ok(res, result.rows);
});

const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) return fail(res, 'No file uploaded', 400);
  if (!hasDocumentSignature(req.file.buffer)) return fail(res, 'That file does not look like a valid PDF or Office document', 400);
  const { entity_type, entity_id } = req.body;
  if (!ENTITY_TYPES.includes(entity_type) || !entity_id) {
    return fail(res, 'entity_type (client|project) and entity_id are required', 400);
  }

  const { url } = await storeFile({
    buffer: req.file.buffer,
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    req,
    prefix: 'documents',
  });

  const result = await pool.query(
    `INSERT INTO documents (url, filename, mime_type, size_bytes, entity_type, entity_id, uploaded_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [url, req.file.originalname, req.file.mimetype, req.file.size, entity_type, entity_id, req.admin?.id || null]
  );
  ok(res, result.rows[0], 201);
});

// Best-effort local file cleanup — never fails the request if the file is remote (S3) or already
// gone, matching media.controller.js's removeMedia.
const deleteDocument = asyncHandler(async (req, res) => {
  const result = await pool.query('DELETE FROM documents WHERE id = $1 RETURNING *', [req.params.id]);
  const row = result.rows[0];
  if (!row) return fail(res, 'Document not found', 404);

  if (row.url && row.url.includes('/uploads/')) {
    fs.unlink(path.join(UPLOADS_DIR, row.url.split('/uploads/').pop()), () => {});
  }

  ok(res, { deleted: true });
});

module.exports = { listDocuments, uploadDocument, deleteDocument };
