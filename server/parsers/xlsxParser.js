const XLSX = require('xlsx');
const AppError = require('../utils/AppError');

// SheetJS has a documented history of prototype-pollution issues when
// reading maliciously crafted workbooks (rows whose header cells are named
// __proto__/constructor/prototype). We only ever consume a fixed, known set
// of business fields downstream (see services/transformService.js), but we
// still strip these keys at the parser boundary so a polluted row object
// never exists in memory in the first place.
const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function sanitizeRow(row) {
  const clean = {};
  for (const [key, value] of Object.entries(row)) {
    if (DANGEROUS_KEYS.has(key)) continue;
    clean[key] = value;
  }
  return clean;
}

/**
 * Reads the first worksheet of an XLSX/XLS buffer and returns it as an
 * array of row objects keyed by header row.
 */
function parseXLSX(buffer) {
  let workbook;
  try {
    workbook = XLSX.read(buffer, { type: 'buffer' });
  } catch (err) {
    throw new AppError(`Malformed XLSX payload: ${err.message}`, 400);
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new AppError('XLSX workbook contains no worksheets', 400);
  }

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: null, raw: true });

  return rows.map(sanitizeRow);
}

module.exports = parseXLSX;
