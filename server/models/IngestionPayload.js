const mongoose = require('mongoose');

const { Schema } = mongoose;

const bomLineSchema = new Schema(
  {
    componentId: { type: String },
    quantity: { type: Number },
    unitOfMeasure: { type: String },
  },
  { _id: false },
);

/**
 * IngestionPayload is the unified standard JSON schema every incoming
 * record — regardless of whether it arrived as JSON, XML, or XLSX rows —
 * is normalized into before it is considered ready for MES.
 */
const ingestionPayloadSchema = new Schema(
  {
    pipelineRunId: {
      type: Schema.Types.ObjectId,
      ref: 'PipelineRun',
      required: true,
      index: true,
    },
    sourceRecordId: { type: String, required: true, trim: true },
    itemName: { type: String, required: true, trim: true },
    revision: { type: String, default: null },
    itemType: { type: String, default: null },
    description: { type: String, default: null },
    quantity: { type: Number, default: null },
    unitOfMeasure: { type: String, default: null },
    workCenter: { type: String, default: null },
    routingOperation: { type: String, default: null },
    bomLines: { type: [bomLineSchema], default: [] },
    sourceSystem: { type: String, default: 'Teamcenter' },
    targetSystem: { type: String, default: 'MES' },
    // Original record, kept verbatim for traceability/audit back to source.
    rawSnapshot: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

ingestionPayloadSchema.index({ pipelineRunId: 1, sourceRecordId: 1 });

ingestionPayloadSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

module.exports = mongoose.model('IngestionPayload', ingestionPayloadSchema);
