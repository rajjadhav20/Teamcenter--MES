const path = require('path');
const parseJSON = require('./jsonParser');
const parseXML = require('./xmlParser');
const parseXLSX = require('./xlsxParser');
const parseCSV = require('./csvParser');
const { FORMAT, EXTENSION_TO_FORMAT } = require('../config/constants');
const AppError = require('../utils/AppError');

/**
 * Given raw input (Buffer, string, or object) and a known format, returns
 * a normalized array of raw record objects. This is the single entry
 * point every ingestion adapter (direct API, folder watcher, Drive mock)
 * routes through, so adding a new source never means adding a new parser.
 */
async function parseByFormat(format, input) {
  switch (format) {
    case FORMAT.JSON:
      return parseJSON(input);
    case FORMAT.XML:
      return parseXML(input);
    case FORMAT.XLSX:
      return parseXLSX(input);
    case FORMAT.CSV:
      return parseCSV(input);
    default:
      throw new AppError(`Unsupported format: ${format}`, 400);
  }
}

/**
 * Infers a FORMAT from a file name's extension, and from mimetype as a
 * fallback for uploads where the extension is missing or generic.
 */
function detectFormat({ fileName, mimeType } = {}) {
  if (fileName) {
    const ext = path.extname(fileName).toLowerCase();
    if (EXTENSION_TO_FORMAT[ext]) return EXTENSION_TO_FORMAT[ext];
  }

  if (mimeType) {
    if (mimeType.includes('json')) return FORMAT.JSON;
    if (mimeType.includes('xml')) return FORMAT.XML;
    if (mimeType.includes('csv')) return FORMAT.CSV;
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return FORMAT.XLSX;
  }

  return null;
}

module.exports = { parseByFormat, detectFormat };
