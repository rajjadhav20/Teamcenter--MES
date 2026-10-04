const path = require('path');
const fs = require('fs/promises');
const chokidar = require('chokidar');
const { submitBatch } = require('./ingestionService');
const { detectFormat } = require('../parsers');
const { SOURCE } = require('../config/constants');
const logger = require('../utils/logger');

const WATCH_DIR = path.join(__dirname, '..', 'watched-folder');

/**
 * The spec calls for the folder watcher to be simulated via file upload
 * (see routes/ingestionRoutes.js `POST /ingest/folder-watcher`), which is
 * what the dashboard's "Folder Watcher" button drives. This module is an
 * optional, off-by-default extra: a real chokidar watcher on a local
 * directory, for anyone who wants to drop actual files on disk and see
 * them picked up the same way a real network-share watcher would. It
 * reuses the exact same submitBatch() pipeline entry point, so a run that
 * arrives this way is indistinguishable downstream from one that arrived
 * through the simulated endpoint — both are tagged SOURCE.FOLDER_WATCHER.
 */
function maybeStartFolderWatcher() {
  if (String(process.env.ENABLE_REAL_FOLDER_WATCHER).toLowerCase() !== 'true') {
    logger.info('Real folder watcher disabled (set ENABLE_REAL_FOLDER_WATCHER=true to enable) — simulated upload endpoint remains active');
    return null;
  }

  const watcher = chokidar.watch(WATCH_DIR, {
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 300, pollInterval: 100 },
  });

  watcher.on('add', async (filePath) => {
    const fileName = path.basename(filePath);
    const format = detectFormat({ fileName });

    if (!format) {
      logger.warn(`Folder watcher ignoring unsupported file type: ${fileName}`);
      return;
    }

    try {
      const buffer = await fs.readFile(filePath);
      logger.info(`Folder watcher picked up ${fileName} -> submitting batch`);
      await submitBatch({ source: SOURCE.FOLDER_WATCHER, format, fileName, rawInput: buffer });
    } catch (err) {
      logger.error(`Folder watcher failed to read ${fileName}:`, err.message);
    }
  });

  watcher.on('error', (err) => logger.error('Folder watcher error:', err.message));

  logger.info(`Real folder watcher active on ${WATCH_DIR}`);
  return watcher;
}

module.exports = { maybeStartFolderWatcher, WATCH_DIR };
