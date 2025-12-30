const crypto = require('crypto');

const getPagination = (page, limit) => {
  const pageNum = page ? parseInt(page) : 1;
  const limitNum = limit ? parseInt(limit) : 10;
  const offset = (pageNum - 1) * limitNum;

  return { limit: limitNum, offset };
};

const getPaginationMeta = (totalItems, page, limit) => {
  const currentPage = page ? parseInt(page) : 1;
  const itemsPerPage = limit ? parseInt(limit) : 10;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return {
    totalItems,
    itemsPerPage,
    currentPage,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1
  };
};

const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

const generateOTP = (length = 6) => {
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10);
  }
  return otp;
};

const generateOrderCode = () => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD${year}${month}${day}${random}`;
};

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

const isValidPhoneNumber = (phone) => {
  // Vietnamese phone number format
  const phoneRegex = /^(\+84|84|0)(3|5|7|8|9)[0-9]{8}$/;
  return phoneRegex.test(phone.replace(/\s|-/g, ''));
};

const normalizePhoneNumber = (phone) => {
  if (!phone) return phone;

  // Remove spaces and dashes
  let normalized = phone.replace(/\s|-/g, '');

  // Convert to +84 format
  if (normalized.startsWith('0')) {
    normalized = '+84' + normalized.slice(1);
  } else if (normalized.startsWith('84')) {
    normalized = '+' + normalized;
  } else if (!normalized.startsWith('+84')) {
    normalized = '+84' + normalized;
  }

  return normalized;
};

const formatCurrency = (amount, currency = 'VND') => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

const formatDate = (date, format = 'vi-VN') => {
  return new Date(date).toLocaleDateString(format, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/<[^>]*>/g, '');
};

const calculateDiscount = (originalPrice, discountPercent) => {
  return originalPrice - (originalPrice * discountPercent / 100);
};

module.exports = {
  getPagination,
  getPaginationMeta,
  generateToken,
  generateOTP,
  generateOrderCode,
  slugify,
  isValidPhoneNumber,
  normalizePhoneNumber,
  formatCurrency,
  formatDate,
  isValidEmail,
  sanitizeInput,
  calculateDiscount
};
