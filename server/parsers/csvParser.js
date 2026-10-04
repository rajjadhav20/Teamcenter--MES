const { Readable } = require('stream');
const csv = require('csv-parser');
const AppError = require('../utils/AppError');

/**
 * csv-parser is stream-based, so we wrap it in a promise that collects
 * every row into an array. CSV files are the one format here that can
 * realistically be huge, so this keeps parsing off the main event loop
 * tick-by-tick rather than blocking on a single synchronous parse.
 */
function parseCSV(input) {
  return new Promise((resolve, reject) => {
    const buffer = Buffer.isBuffer(input) ? input : Buffer.from(String(input), 'utf-8');
    const rows = [];

    Readable.from(buffer)
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', (err) => reject(new AppError(`Malformed CSV payload: ${err.message}`, 400)));
  });
}

module.exports = parseCSV;
