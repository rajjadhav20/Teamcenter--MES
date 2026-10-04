const { EventEmitter } = require('events');
const logger = require('../utils/logger');

/**
 * A deliberately small in-process queue. This app runs as a single Node
 * process, batches are demo/moderate-sized, and durability across process
 * restarts isn't a requirement here — so a Redis-backed queue (BullMQ etc.)
 * would be infrastructure the project doesn't need. If this ever has to
 * survive process restarts or scale across multiple workers, that's the
 * signal to graduate to BullMQ; the `enqueue(job)` call site below is the
 * only thing that would need to change.
 *
 * Jobs are plain async functions. Failures are caught here as a last
 * resort so one bad job can't crash the process — each job is expected to
 * handle its own status/error persistence (see ingestionService).
 */
class PipelineQueue extends EventEmitter {
  constructor({ concurrency = 2 } = {}) {
    super();
    this.concurrency = concurrency;
    this.queue = [];
    this.activeCount = 0;
  }

  get pending() {
    return this.queue.length;
  }

  get active() {
    return this.activeCount;
  }

  enqueue(job) {
    this.queue.push(job);
    this.emit('enqueued');
    this._drain();
    return this;
  }

  _drain() {
    while (this.activeCount < this.concurrency && this.queue.length > 0) {
      const job = this.queue.shift();
      this.activeCount += 1;
      this._runJob(job).finally(() => {
        this.activeCount -= 1;
        this._drain();
      });
    }
  }

  async _runJob(job) {
    try {
      await job();
    } catch (err) {
      logger.error('Unhandled error inside a pipeline job:', err);
    }
  }
}

const concurrency = Number(process.env.PIPELINE_CONCURRENCY) || 2;
module.exports = new PipelineQueue({ concurrency });
module.exports.PipelineQueue = PipelineQueue;
