/**
 * Populates the database with a handful of demo pipeline runs so the
 * dashboard has something to show on first run, instead of four zeroed
 * stat cards and an empty table. Run with `npm run seed` from /server.
 *
 * Deliberately includes one malformed batch and a couple of invalid
 * records so the log table shows the full range of statuses (SUCCESS,
 * FAILED, and partial per-record failures) rather than an all-green board.
 */
require("dotenv").config();
const XLSX = require("xlsx");
const { connectDB, disconnectDB } = require("../config/db");
const { submitBatch } = require("../services/ingestionService");
const {
  listMockFiles,
  fetchMockFileContent,
} = require("../services/googleDriveMockService");
const pipelineQueue = require("../services/pipelineQueue");
const { SOURCE, FORMAT } = require("../config/constants");
const logger = require("../utils/logger");

function waitForQueueIdle({ pollMs = 150, timeoutMs = 30000 } = {}) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      if (pipelineQueue.pending === 0 && pipelineQueue.active === 0) {
        resolve();
        return;
      }
      if (Date.now() - start > timeoutMs) {
        reject(
          new Error(
            "Timed out waiting for seeded pipeline runs to finish processing",
          ),
        );
        return;
      }
      setTimeout(check, pollMs);
    };
    check();
  });
}

function buildSampleXLSXBuffer() {
  const rows = [
    {
      "Item Number": "TC-5001",
      "Item Name": "Weld Fixture Plate",
      Revision: "C",
      Quantity: 25,
      UOM: "EA",
      WorkCenter: "WC-WELD-02",
    },
    {
      "Item Number": "TC-5002",
      "Item Name": "Hydraulic Manifold",
      Revision: "A",
      Quantity: 8,
      UOM: "EA",
      WorkCenter: "WC-ASSY-03",
    },
    {
      "Item Number": "TC-5003",
      "Item Name": "Gasket Seal Kit",
      Revision: "B",
      Quantity: 150,
      UOM: "EA",
      WorkCenter: "WC-ASSY-03",
    },
    {
      "Item Number": "",
      "Item Name": "Unlabeled spare row",
      Revision: "-",
      Quantity: 5,
      UOM: "EA",
      WorkCenter: "WC-PRESS-01",
    },
  ];
  const sheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "ItemMaster");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

const SAMPLE_CSV = `itemId,itemName,revision,quantity,unitOfMeasure,workCenter
TC-6001,Conveyor Roller,A,40,EA,WC-ASSY-03
TC-6002,Motor Bracket,B,-5,EA,WC-PRESS-01
TC-6003,Sensor Mount,A,60,EA,WC-WELD-02
`;

const SAMPLE_JSON_BATCH = {
  records: [
    {
      itemId: "TC-4001",
      itemName: "Chassis Rail LH",
      revision: "D",
      itemType: "Part",
      quantity: 30,
      unitOfMeasure: "EA",
      workCenter: "WC-PRESS-01",
      routingOperation: "OP-10",
    },
    {
      itemId: "TC-4002",
      itemName: "Chassis Rail RH",
      revision: "D",
      itemType: "Part",
      quantity: 30,
      unitOfMeasure: "EA",
      workCenter: "WC-PRESS-01",
      routingOperation: "OP-10",
    },
    {
      itemId: "TC-4003",
      itemName: "Cross Member Assembly",
      revision: "B",
      itemType: "Assembly",
      quantity: 15,
      unitOfMeasure: "EA",
      workCenter: "WC-WELD-02",
      routingOperation: "OP-20",
    },
  ],
};

async function run() {
  await connectDB();
  logger.info("Seeding demo pipeline runs...");

  await submitBatch({
    source: SOURCE.API,
    format: FORMAT.JSON,
    fileName: null,
    rawInput: SAMPLE_JSON_BATCH,
  });
  await submitBatch({
    source: SOURCE.API,
    format: FORMAT.CSV,
    fileName: "motor_bracket_export.csv",
    rawInput: Buffer.from(SAMPLE_CSV),
  });
  await submitBatch({
    source: SOURCE.FOLDER_WATCHER,
    format: FORMAT.XLSX,
    fileName: "item_master_batch_14.xlsx",
    rawInput: buildSampleXLSXBuffer(),
  });

  // A batch that fails outright at the parse stage, to demonstrate FAILED.
  await submitBatch({
    source: SOURCE.FOLDER_WATCHER,
    format: FORMAT.XML,
    fileName: "corrupt_export.xml",
    rawInput: Buffer.from("<ItemExport><Item><ItemID>unclosed"),
  });

  const mockFiles = await listMockFiles();
  for (const file of mockFiles) {
    const mockFile = await fetchMockFileContent(file.fileId);
    // eslint-disable-next-line no-await-in-loop -- demo seeding, order matters for readability of the resulting log
    await submitBatch({
      source: SOURCE.GOOGLE_DRIVE_MOCK,
      format: mockFile.format,
      fileName: mockFile.fileName,
      rawInput: mockFile.content,
    });
  }

  logger.info(
    "All demo batches submitted, waiting for the pipeline queue to finish processing...",
  );
  await waitForQueueIdle();

  logger.info("Seeding complete.");
  await disconnectDB();
  process.exit(0);
}

run().catch((err) => {
  logger.error("Seed script failed:", err);
  process.exit(1);
});
