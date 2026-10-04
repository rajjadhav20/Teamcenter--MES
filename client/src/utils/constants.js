export const RUN_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
};

// Colors are read as CSS custom properties (defined in index.css's
// @theme block) rather than hardcoded hexes, so the palette only ever
// lives in one place.
export const STATUS_META = {
  PENDING: { label: 'Pending', color: 'var(--color-andon-pending)' },
  PROCESSING: { label: 'Processing', color: 'var(--color-andon-processing)' },
  SUCCESS: { label: 'Success', color: 'var(--color-andon-success)' },
  FAILED: { label: 'Failed', color: 'var(--color-andon-failed)' },
};

export const SOURCE_META = {
  API: { label: 'Direct API', short: 'API' },
  FOLDER_WATCHER: { label: 'Folder Watcher', short: 'FOLDER' },
  GOOGLE_DRIVE_MOCK: { label: 'Google Drive (Mock)', short: 'GDRIVE' },
};

export const STAGE_META = {
  'OP-10': { label: 'Receive' },
  'OP-20': { label: 'Parse' },
  'OP-30': { label: 'Validate / Transform' },
  'OP-40': { label: 'Load to MES' },
};

export const STAGE_SEQUENCE = ['OP-10', 'OP-20', 'OP-30', 'OP-40'];
