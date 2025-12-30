const rateLimit = require('express-rate-limit');

// Tạm thời không dùng Redis store để tránh lỗi
// Comment out Redis-related code
// const RedisStore = require('rate-limit-redis');
// const redisClient = require('../config/redis');

// General rate limiter - sử dụng memory store
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth rate limiter (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true
});

// API rate limiter
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 requests per minute
  message: 'Too many API requests, please try again later.'
});

module.exports = {
  generalLimiter,
  authLimiter,
  apiLimiter
};