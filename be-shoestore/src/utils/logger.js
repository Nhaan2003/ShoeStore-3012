const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = 'logs';
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'shoe-store-api' },
  transports: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'error.log'), 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: path.join(logsDir, 'combined.log') 
    })
  ]
});

// Console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Fallback to console if winston fails
const log = {
  info: (message, ...args) => {
    try {
      logger.info(message, ...args);
    } catch (e) {
      console.log('[INFO]', message, ...args);
    }
  },
  error: (message, ...args) => {
    try {
      logger.error(message, ...args);
    } catch (e) {
      console.error('[ERROR]', message, ...args);
    }
  },
  warn: (message, ...args) => {
    try {
      logger.warn(message, ...args);
    } catch (e) {
      console.warn('[WARN]', message, ...args);
    }
  },
  debug: (message, ...args) => {
    try {
      logger.debug(message, ...args);
    } catch (e) {
      console.debug('[DEBUG]', message, ...args);
    }
  }
};

module.exports = log;