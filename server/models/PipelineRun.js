const mongoose = require('mongoose');
const { RUN_STATUS, SOURCE, FORMAT, STAGE } = require('../config/constants');

const { Schema } = mongoose;

const pipelineRunSchema = new Schema(
  {
    source: {
      type: String,
      enum: Object.values(SOURCE),
      required: true,
      index: true,
    },
    format: {
      type: String,
      enum: Object.values(FORMAT),
      required: true,
    },
    fileName: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(RUN_STATUS),
      default: RUN_STATUS.PENDING,
      index: true,
    },
    stage: {
      type: String,
      enum: Object.values(STAGE),
      default: STAGE.RECEIVE,
    },
    recordCount: { type: Number, default: 0, min: 0 },
    successCount: { type: Number, default: 0, min: 0 },
    failedCount: { type: Number, default: 0, min: 0 },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    errorMessage: { type: String, default: null },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

pipelineRunSchema.index({ createdAt: -1 });

// Keep the wire shape stable and tidy — expose `id` instead of `_id`/`__v`.
pipelineRunSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

module.exports = mongoose.model('PipelineRun', pipelineRunSchema);
