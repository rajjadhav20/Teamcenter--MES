const { submitBatch } = require('../services/ingestionService');
const { detectFormat } = require('../parsers');
const { listMockFiles, fetchMockFileContent } = require('../services/googleDriveMockService');
const { SOURCE, FORMAT } = require('../config/constants');
const AppError = require('../utils/AppError');

/**
 * POST /api/v1/ingest
 * Accepts either a JSON body (Content-Type: application/json) or a
 * multipart file upload (field name "file") — the same endpoint doubles
 * as the "Direct API POST" adapter for both shapes, since a PLM system
 * could reasonably push either.
 */
async function ingestDirect(req, res) {
  let format;
  let rawInput;
  let fileName = null;

  if (req.file) {
    format = detectFormat({ fileName: req.file.originalname, mimeType: req.file.mimetype });
    rawInput = req.file.buffer;
    fileName = req.file.originalname;
  } else if (req.body && Object.keys(req.body).length > 0) {
    format = FORMAT.JSON;
    rawInput = req.body;
  } else {
    throw new AppError('Request must include a JSON body or a file upload (field "file")', 400);
  }

  if (!format) {
    throw new AppError('Could not determine payload format from file extension/mimetype', 400);
  }

  const run = await submitBatch({ source: SOURCE.API, format, fileName, rawInput });
  res.status(202).json({ success: true, message: 'Batch accepted for processing', run: run.toJSON() });
}

/**
 * POST /api/v1/ingest/folder-watcher
 * Simulates a network-folder watcher picking up a dropped file: the
 * dashboard's "Folder Watcher" trigger uploads a file here exactly as if
 * a background process had just noticed it land in a share. (A genuine
 * filesystem watcher is also available — see services/folderWatcherService.)
 */
async function ingestFolderWatcher(req, res) {
  if (!req.file) {
    throw new AppError('Folder watcher simulation requires a file upload (field "file")', 400);
  }

  const format = detectFormat({ fileName: req.file.originalname, mimeType: req.file.mimetype });
  if (!format) {
    throw new AppError('Could not determine payload format from file extension/mimetype', 400);
  }

  const run = await submitBatch({
    source: SOURCE.FOLDER_WATCHER,
    format,
    fileName: req.file.originalname,
    rawInput: req.file.buffer,
  });

  res.status(202).json({ success: true, message: 'Batch accepted for processing', run: run.toJSON() });
}

/** GET /api/v1/ingest/google-drive-mock/files */
async function listGoogleDriveMockFiles(_req, res) {
  const files = await listMockFiles();
  res.json({ success: true, files });
}

/**
 * POST /api/v1/ingest/google-drive-mock
 * Body: { fileId?: string } — omit to sync every mocked file, as if
 * running a full folder sync.
 */
async function triggerGoogleDriveMock(req, res) {
  const { fileId } = req.body || {};
  const targets = fileId ? [{ fileId }] : await listMockFiles();

  if (targets.length === 0) {
    throw new AppError('No mock Google Drive files available', 404);
  }

  const runs = [];
  for (const target of targets) {
    const mockFile = await fetchMockFileContent(target.fileId);
    if (!mockFile) {
      throw new AppError(`Unknown mock Google Drive file id: ${target.fileId}`, 404);
    }
    // eslint-disable-next-line no-await-in-loop -- intentionally sequential so run creation order matches file order
    const run = await submitBatch({
      source: SOURCE.GOOGLE_DRIVE_MOCK,
      format: mockFile.format,
      fileName: mockFile.fileName,
      rawInput: mockFile.content,
    });
    runs.push(run);
  }

  res.status(202).json({ success: true, message: `${runs.length} batch(es) accepted for processing`, runs: runs.map((r) => r.toJSON()) });
}

module.exports = {
  ingestDirect,
  ingestFolderWatcher,
  listGoogleDriveMockFiles,
  triggerGoogleDriveMock,
};
