const isProduction = process.env.NODE_ENV === 'production';

const logger = {
  info: (...args) => {
    if (!isProduction) {
      console.log('[INFO]', ...args);
    } else {
      console.log(JSON.stringify({ level: 'info', message: args.join(' '), timestamp: new Date().toISOString() }));
    }
  },
  warn: (...args) => {
    if (!isProduction) {
      console.warn('[WARN]', ...args);
    } else {
      console.warn(JSON.stringify({ level: 'warn', message: args.join(' '), timestamp: new Date().toISOString() }));
    }
  },
  error: (...args) => {
    if (!isProduction) {
      console.error('[ERROR]', ...args);
    } else {
      console.error(JSON.stringify({ level: 'error', message: args.join(' '), timestamp: new Date().toISOString() }));
    }
  },
};

module.exports = logger;
