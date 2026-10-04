/**
 * The whole point of a unified schema is that it doesn't matter whether a
 * field arrived as `itemId`, `ItemID`, or a spreadsheet column header of
 * "Item Number" — this table maps every alias we've seen in Teamcenter-style
 * exports onto the one canonical IngestionPayload field name.
 */
const FIELD_ALIASES = {
  sourceRecordId: ['sourceRecordId', 'itemId', 'itemid', 'item_id', 'partnumber', 'part_no', 'itemnumber', 'id'],
  itemName: ['itemname', 'item_name', 'name', 'description_short', 'title'],
  revision: ['revision', 'rev'],
  itemType: ['itemtype', 'item_type', 'type'],
  description: ['description', 'desc', 'itemdescription'],
  quantity: ['quantity', 'qty'],
  unitOfMeasure: ['unitofmeasure', 'uom', 'unit'],
  workCenter: ['workcenter', 'work_center', 'wc'],
  routingOperation: ['routingoperation', 'operation', 'op', 'opnumber'],
};

/**
 * Normalizes a header/key for comparison: lowercase, strip spaces,
 * underscores, and hyphens. This lets "Item Number", "item_number", and
 * "ItemNumber" all match the same alias.
 */
function normalizeKey(key) {
  return String(key).toLowerCase().replace(/[\s_-]/g, '');
}

function findValueByAliases(record, aliases) {
  const normalizedAliases = new Set(aliases.map(normalizeKey));
  for (const [key, value] of Object.entries(record)) {
    if (normalizedAliases.has(normalizeKey(key))) {
      return value;
    }
  }
  return undefined;
}

function toNumberOrNull(value) {
  if (value === undefined || value === null || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function toStringOrNull(value) {
  if (value === undefined || value === null || value === '') return null;
  return String(value).trim();
}

/**
 * Best-effort extraction of BOM lines from a raw record. Structured
 * sources (JSON/XML) may already nest an array under bomLines/BOMLine(s);
 * flat sources (a single XLSX/CSV row) simply won't have one, which is
 * fine — bomLines defaults to an empty array.
 */
function extractBomLines(record) {
  const raw = findValueByAliases(record, ['bomlines', 'bomline', 'components', 'bom']);
  if (!raw) return [];
  const list = Array.isArray(raw) ? raw : [raw];

  return list
    .filter((line) => line && typeof line === 'object')
    .map((line) => ({
      componentId: toStringOrNull(
        findValueByAliases(line, ['componentid', 'component_id', 'partnumber', 'id']),
      ),
      quantity: toNumberOrNull(findValueByAliases(line, ['quantity', 'qty'])),
      unitOfMeasure: toStringOrNull(findValueByAliases(line, ['unitofmeasure', 'uom', 'unit'])),
    }))
    .filter((line) => line.componentId);
}

/**
 * Transforms one raw record (from any source format) into the unified
 * IngestionPayload shape. Never throws — callers validate the result
 * afterward via validationService so a single malformed record doesn't
 * abort an otherwise-healthy batch.
 */
function transformRecord(rawRecord, { pipelineRunId, sourceSystem = 'Teamcenter', targetSystem = 'MES' } = {}) {
  const record = rawRecord && typeof rawRecord === 'object' ? rawRecord : {};

  return {
    pipelineRunId,
    sourceRecordId: toStringOrNull(findValueByAliases(record, FIELD_ALIASES.sourceRecordId)),
    itemName: toStringOrNull(findValueByAliases(record, FIELD_ALIASES.itemName)),
    revision: toStringOrNull(findValueByAliases(record, FIELD_ALIASES.revision)),
    itemType: toStringOrNull(findValueByAliases(record, FIELD_ALIASES.itemType)),
    description: toStringOrNull(findValueByAliases(record, FIELD_ALIASES.description)),
    quantity: toNumberOrNull(findValueByAliases(record, FIELD_ALIASES.quantity)),
    unitOfMeasure: toStringOrNull(findValueByAliases(record, FIELD_ALIASES.unitOfMeasure)),
    workCenter: toStringOrNull(findValueByAliases(record, FIELD_ALIASES.workCenter)),
    routingOperation: toStringOrNull(findValueByAliases(record, FIELD_ALIASES.routingOperation)),
    bomLines: extractBomLines(record),
    sourceSystem,
    targetSystem,
    rawSnapshot: record,
  };
}

module.exports = { transformRecord, normalizeKey, findValueByAliases };
