const { FORMAT } = require('../config/constants');

/**
 * Stands in for the Google Drive API. A real integration would call
 * `drive.files.list()` / `drive.files.get()` against a service account;
 * wiring that up needs real OAuth credentials that don't belong in a demo
 * repo, so this mocks the same shape (list -> fetch-by-id) against a small
 * fixed set of in-memory "files" containing generated Teamcenter-style
 * export data. Swapping this out for `googleapis` later only touches this
 * one file — controllers and the pipeline never know the difference.
 */

function buildMockItems(count, offset = 0) {
  const itemTypes = ['Part', 'Assembly', 'Document', 'Raw Material'];
  const workCenters = ['WC-PRESS-01', 'WC-WELD-02', 'WC-PAINT-01', 'WC-ASSY-03'];

  return Array.from({ length: count }, (_, i) => {
    const n = offset + i + 1;
    return {
      itemId: `TC-${String(1000 + n)}`,
      itemName: `Stamped Bracket ${n}`,
      revision: String.fromCharCode(65 + (n % 4)),
      itemType: itemTypes[n % itemTypes.length],
      description: `Auto-generated Teamcenter export record #${n}`,
      quantity: 10 + (n % 40),
      unitOfMeasure: 'EA',
      workCenter: workCenters[n % workCenters.length],
      routingOperation: `OP-${10 * (1 + (n % 4))}`,
    };
  });
}

const MOCK_FILES = [
  {
    fileId: 'gdrive-mock-1',
    fileName: 'teamcenter_item_export_2026-09-01.json',
    format: FORMAT.JSON,
    build: () => JSON.stringify({ records: buildMockItems(18, 0) }, null, 2),
  },
  {
    fileId: 'gdrive-mock-2',
    fileName: 'teamcenter_item_export_2026-09-02.xml',
    format: FORMAT.XML,
    build: () => {
      const items = buildMockItems(12, 100)
        .map(
          (it) => `    <Item>
      <ItemID>${it.itemId}</ItemID>
      <ItemName>${it.itemName}</ItemName>
      <Revision>${it.revision}</Revision>
      <ItemType>${it.itemType}</ItemType>
      <Description>${it.description}</Description>
      <Quantity>${it.quantity}</Quantity>
      <UnitOfMeasure>${it.unitOfMeasure}</UnitOfMeasure>
      <WorkCenter>${it.workCenter}</WorkCenter>
      <RoutingOperation>${it.routingOperation}</RoutingOperation>
    </Item>`,
        )
        .join('\n');
      return `<?xml version="1.0" encoding="UTF-8"?>\n<ItemExport>\n${items}\n</ItemExport>`;
    },
  },
];

/** Mirrors `drive.files.list()` for the mocked ingestion folder. */
async function listMockFiles() {
  return MOCK_FILES.map(({ fileId, fileName, format }) => ({ fileId, fileName, format }));
}

/** Mirrors `drive.files.get({ alt: 'media' })` for one mocked file. */
async function fetchMockFileContent(fileId) {
  const file = MOCK_FILES.find((f) => f.fileId === fileId);
  if (!file) return null;
  return { fileName: file.fileName, format: file.format, content: file.build() };
}

module.exports = { listMockFiles, fetchMockFileContent };
