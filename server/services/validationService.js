/**
 * Validates one transformed IngestionPayload record. Returns
 * { valid, errors } rather than throwing, so the queue worker can keep
 * processing the rest of a batch when one record fails.
 */
function validatePayload(payload) {
  const errors = [];

  if (!payload.sourceRecordId) {
    errors.push('sourceRecordId is required (no matching itemId/partNumber/id field found)');
  }

  if (!payload.itemName) {
    errors.push('itemName is required (no matching name/description field found)');
  }

  if (payload.quantity !== null && payload.quantity !== undefined) {
    if (typeof payload.quantity !== 'number' || Number.isNaN(payload.quantity)) {
      errors.push('quantity must be numeric');
    } else if (payload.quantity < 0) {
      errors.push('quantity cannot be negative');
    }
  }

  if (Array.isArray(payload.bomLines)) {
    payload.bomLines.forEach((line, idx) => {
      if (line.quantity !== null && line.quantity !== undefined && line.quantity < 0) {
        errors.push(`bomLines[${idx}].quantity cannot be negative`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

module.exports = { validatePayload };
