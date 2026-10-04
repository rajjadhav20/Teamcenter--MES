const AppError = require('../utils/AppError');

/**
 * Accepts a Buffer, JSON string, or already-parsed object/array and
 * normalizes it to an array of plain record objects. A single object is
 * treated as a one-record batch, which is the common shape for direct
 * API POSTs.
 */
function parseJSON(input) {
  let data = input;

  if (Buffer.isBuffer(input)) {
    data = input.toString('utf-8');
  }

  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch (err) {
      throw new AppError(`Malformed JSON payload: ${err.message}`, 400);
    }
  }

  if (Array.isArray(data)) {
    return data;
  }

  if (data && typeof data === 'object') {
    // Common export shapes wrap the array under a key, e.g. { records: [...] }
    // or { items: [...] }. Fall back to treating the object as one record.
    const wrapperKey = ['records', 'items', 'data', 'rows'].find(
      (key) => Array.isArray(data[key]),
    );
    if (wrapperKey) return data[wrapperKey];
    return [data];
  }

  throw new AppError('JSON payload must be an object or array of objects', 400);
}

module.exports = parseJSON;
