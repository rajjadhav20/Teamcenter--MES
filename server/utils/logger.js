/* eslint-disable no-console */
const LEVELS = ['error', 'warn', 'info', 'debug'];
const currentLevel = LEVELS.includes(process.env.LOG_LEVEL) ? process.env.LOG_LEVEL : 'info';
const currentIdx = LEVELS.indexOf(currentLevel);

function timestamp() {
  return new Date().toISOString();
}

function build(level, idx) {
  return (...args) => {
    if (idx > currentIdx) return;
    const prefix = `[${timestamp()}] [${level.toUpperCase()}]`;
    if (level === 'error') console.error(prefix, ...args);
    else if (level === 'warn') console.warn(prefix, ...args);
    else console.log(prefix, ...args);
  };
}

module.exports = {
  error: build('error', 0),
  warn: build('warn', 1),
  info: build('info', 2),
  debug: build('debug', 3),
};
