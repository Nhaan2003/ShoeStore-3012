module.exports = {
  CACHE_TTL: {
    PRODUCTS: 3600, // 1 hour
    CATEGORIES: 86400, // 24 hours
    BRANDS: 86400, // 24 hours
    USER_SESSION: 86400 // 24 hours
  },
  
  ORDER_STATUS: {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
    RETURNED: 'returned'
  },
  
  PAYMENT_METHOD: {
    COD: 'COD',
    BANK_TRANSFER: 'BANK_TRANSFER',
    VNPAY: 'VNPAY',
    MOMO: 'MOMO',
    ZALOPAY: 'ZALOPAY',
    CREDIT_CARD: 'CREDIT_CARD'
  },
  
  PAYMENT_STATUS: {
    UNPAID: 'unpaid',
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
    REFUNDED: 'refunded',
    CANCELLED: 'cancelled'
  },
  
  USER_ROLES: {
    ADMIN: 'admin',
    STAFF: 'staff',
    CUSTOMER: 'customer'
  },
  
  USER_STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    BANNED: 'banned',
    PENDING: 'pending'
  },
  
  PRODUCT_STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    OUT_OF_STOCK: 'out_of_stock'
  },
  
  VARIANT_STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    OUT_OF_STOCK: 'out_of_stock'
  },
  
  REVIEW_STATUS: {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected'
  },
  
  PROMOTION_TYPE: {
    PERCENTAGE: 'percentage',
    FIXED_AMOUNT: 'fixed_amount',
    FREE_SHIPPING: 'free_shipping'
  },
  
  PROMOTION_STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    EXPIRED: 'expired'
  },
  
  NOTIFICATION_TYPE: {
    ORDER: 'order',
    PROMOTION: 'promotion',
    SYSTEM: 'system',
    PRODUCT: 'product'
  },
  
  GENDER: {
    MALE: 'male',
    FEMALE: 'female',
    UNISEX: 'unisex'
  },
  
  STOCK_ADJUSTMENT_TYPE: {
    SET: 'set',
    INCREASE: 'increase',
    DECREASE: 'decrease'
  },
  
  CHAT_INTENT: {
    GREETING: 'greeting',
    PRODUCT_SEARCH: 'product_search',
    PRODUCT_INFO: 'product_info',
    SIZE_GUIDE: 'size_guide',
    ORDER_STATUS: 'order_status',
    ORDER_TRACKING: 'order_tracking',
    RETURN_POLICY: 'return_policy',
    PAYMENT_INFO: 'payment_info',
    SHIPPING_INFO: 'shipping_info',
    STORE_LOCATION: 'store_location',
    WORKING_HOURS: 'working_hours',
    PRICE_INQUIRY: 'price_inquiry',
    AVAILABILITY_CHECK: 'availability_check',
    RECOMMENDATION: 'recommendation',
    COMPLAINT: 'complaint',
    FEEDBACK: 'feedback',
    THANK_YOU: 'thank_you',
    GOODBYE: 'goodbye',
    OTHER: 'other'
  }
};