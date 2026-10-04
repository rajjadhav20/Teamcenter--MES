const multer = require('multer');
const path = require('path');
const { EXTENSION_TO_FORMAT } = require('../config/constants');
const AppError = require('../utils/AppError');

const ALLOWED_EXTENSIONS = new Set(Object.keys(EXTENSION_TO_FORMAT));
const MAX_FILE_SIZE_BYTES = Number(process.env.MAX_UPLOAD_MB || 15) * 1024 * 1024;

// Memory storage: files are parsed in-place and never need to touch disk,
// which keeps the folder-watcher upload and direct API upload paths
// identical and avoids managing a temp-file cleanup lifecycle.
const storage = multer.memoryStorage();

function fileFilter(_req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    // A plain error (not necessarily a MulterError) is fine here — multer
    // forwards whatever we pass straight to next(), and our error handler
    // knows how to render an AppError with the right status code.
    cb(new AppError(`Unsupported file type: ${ext || 'unknown'}. Allowed: ${[...ALLOWED_EXTENSIONS].join(', ')}`, 400));
    return;
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 1 },
});

module.exports = upload;
