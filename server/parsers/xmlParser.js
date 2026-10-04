const { parseStringPromise } = require('xml2js');
const AppError = require('../utils/AppError');

/**
 * Teamcenter-style exports typically look like:
 *
 *   <ItemExport>
 *     <Item><ItemID>000123</ItemID><ItemName>Bracket</ItemName>...</Item>
 *     <Item>...</Item>
 *   </ItemExport>
 *
 * The wrapping root tag and the repeated record tag both vary by export
 * configuration, so rather than hardcoding tag names we parse generically
 * and look for the first array under the root — that's the record list in
 * every export shape we've seen. A document with a single, non-repeated
 * record is treated as a one-record batch.
 */
async function parseXML(input) {
  const xmlString = Buffer.isBuffer(input) ? input.toString('utf-8') : input;

  let parsed;
  try {
    parsed = await parseStringPromise(xmlString, {
      explicitArray: false,
      trim: true,
      mergeAttrs: true,
    });
  } catch (err) {
    throw new AppError(`Malformed XML payload: ${err.message}`, 400);
  }

  const rootKeys = Object.keys(parsed || {});
  if (rootKeys.length === 0) {
    throw new AppError('XML payload has no root element', 400);
  }

  const root = parsed[rootKeys[0]];

  if (root === null || typeof root !== 'object') {
    throw new AppError('XML payload root element has no child records', 400);
  }

  const arrayKey = Object.keys(root).find((key) => Array.isArray(root[key]));
  if (arrayKey) {
    return root[arrayKey];
  }

  // No repeated child element found — treat the root's own fields as a
  // single record, unless it's just a bag of nested objects with no
  // scalar leaves at all (unusual shape we don't try to guess further).
  return [root];
}

module.exports = parseXML;
