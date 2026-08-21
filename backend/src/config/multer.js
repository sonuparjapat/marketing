const multer = require('multer');

const ALLOWED_IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_IMAGE_MIME.includes(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG, WEBP or GIF images are allowed'));
    }
    cb(null, true);
  },
});

// A separate instance (not a widened ALLOWED_IMAGE_MIME) for the Documents feature — keeps the
// image-upload route's error message accurate and its accepted-type surface unchanged, rather than
// silently also accepting PDFs/Office files there.
const ALLOWED_DOCUMENT_MIME = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
];

const uploadDocument = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_DOCUMENT_MIME.includes(file.mimetype)) {
      return cb(new Error('Only PDF, Word, Excel or PowerPoint files are allowed'));
    }
    cb(null, true);
  },
});

module.exports = upload;
module.exports.uploadDocument = uploadDocument;
