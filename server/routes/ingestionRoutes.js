const express = require('express');
const upload = require('../middleware/uploadMiddleware');
const {
  ingestDirect,
  ingestFolderWatcher,
  listGoogleDriveMockFiles,
  triggerGoogleDriveMock,
} = require('../controllers/ingestionController');

const router = express.Router();

// Direct API POST — JSON body or multipart file, both accepted here.
router.post('/', upload.single('file'), ingestDirect);

// Simulated local network folder watcher.
router.post('/folder-watcher', upload.single('file'), ingestFolderWatcher);

// Google Drive API mock.
router.get('/google-drive-mock/files', listGoogleDriveMockFiles);
router.post('/google-drive-mock', triggerGoogleDriveMock);

module.exports = router;
