const mongoose = require('mongoose');
const { LOG_LEVEL, STAGE } = require('../config/constants');

const { Schema } = mongoose;

const ingestionLogSchema = new Schema(
  {
    pipelineRunId: {
      type: Schema.Types.ObjectId,
      ref: 'PipelineRun',
      required: true,
      index: true,
    },
    level: {
      type: String,
      enum: Object.values(LOG_LEVEL),
      default: LOG_LEVEL.INFO,
    },
    stage: {
      type: String,
      enum: [...Object.values(STAGE), null],
      default: null,
    },
    message: { type: String, required: true },
    meta: { type: Schema.Types.Mixed, default: undefined },
  },
  { timestamps: true },
);

ingestionLogSchema.index({ pipelineRunId: 1, createdAt: 1 });

ingestionLogSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

module.exports = mongoose.model('IngestionLog', ingestionLogSchema);
