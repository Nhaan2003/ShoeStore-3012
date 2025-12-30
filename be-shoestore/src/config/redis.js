const logger = require('../utils/logger');

// Tạm thời mock Redis client nếu chưa cài Redis
const redisClient = {
  get: async (key) => null,
  set: async (key, value) => true,
  setex: async (key, ttl, value) => true,
  del: async (...keys) => true,
  keys: async (pattern) => [],
  on: (event, callback) => {},
  connect: async () => {
    logger.info('Redis mock client connected');
  }
};

module.exports = redisClient;