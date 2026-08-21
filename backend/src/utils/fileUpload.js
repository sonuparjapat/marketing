const fs = require('fs');
const path = require('path');
const { s3, isConfigured: s3Configured, publicUrlFor } = require('../config/aws');
const { PutObjectCommand } = require('@aws-sdk/client-s3');

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

// The client-reported mimetype (checked by multer's fileFilter) is just a request header — trivial
// to spoof. These check the actual file bytes (magic numbers), so a renamed/relabeled file (an HTML
// or SVG-with-script payload pretending to be an image, say) can't slip through as something safe
// to serve back with that content-type. Shared by the image-upload path (admin.controller.js) and
// the document-upload path (documents.controller.js) — real duplication across 2 call sites,
// extracted here rather than copy-pasted.
function hasImageSignature(buffer) {
  if (buffer.length < 4) return false;
  const sig = buffer.subarray(0, 4);
  if (sig[0] === 0xff && sig[1] === 0xd8 && sig[2] === 0xff) return true; // JPEG
  if (sig[0] === 0x89 && sig[1] === 0x50 && sig[2] === 0x4e && sig[3] === 0x47) return true; // PNG
  if (sig[0] === 0x47 && sig[1] === 0x49 && sig[2] === 0x46) return true; // GIF
  if (sig[0] === 0x52 && sig[1] === 0x49 && sig[2] === 0x46 && sig[3] === 0x46) return true; // RIFF (WEBP container)
  return false;
}

function hasDocumentSignature(buffer) {
  if (buffer.length < 4) return false;
  const sig = buffer.subarray(0, 4);
  if (sig[0] === 0x25 && sig[1] === 0x50 && sig[2] === 0x44 && sig[3] === 0x46) return true; // %PDF
  if (sig[0] === 0x50 && sig[1] === 0x4b && sig[2] === 0x03 && sig[3] === 0x04) return true; // ZIP-based (docx/xlsx/pptx)
  return false;
}

// S3-or-local storage, decided once here — every upload path (images, documents) calls this
// instead of re-deciding. Returns the public URL a client can load the file from.
async function storeFile({ buffer, originalname, mimetype, req, prefix = 'uploads' }) {
  const ext = (originalname.split('.').pop() || 'bin').toLowerCase();
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;

  if (s3Configured) {
    const key = `${prefix}/${filename}`;
    await s3.send(
      new PutObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: key, Body: buffer, ContentType: mimetype })
    );
    return { url: publicUrlFor(key), filename: originalname };
  }

  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);
  return { url: `${req.protocol}://${req.get('host')}/uploads/${filename}`, filename: originalname };
}

module.exports = { hasImageSignature, hasDocumentSignature, storeFile, UPLOADS_DIR };
