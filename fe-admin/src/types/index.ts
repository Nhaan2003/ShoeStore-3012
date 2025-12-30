// User types
export interface User {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  role: 'admin' | 'staff' | 'customer';
  status: 'active' | 'inactive' | 'banned';
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    access_token: string;
    refresh_token: string;
  };
}

// Product types
export interface ProductVariant {
  id: number;
  product_id: number;
  size: string;
  color: string;
  sku: string;
  stock_quantity: number;
  price: number;
  images?: string[];
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  sale_price?: number;
  category_id: number;
  brand_id: number;
  gender: 'male' | 'female' | 'unisex';
  status: 'active' | 'inactive' | 'out_of_stock';
  featured: boolean;
  view_count: number;
  sold_count: number;
  images: string[];
  variants?: ProductVariant[];
  category?: Category;
  brand?: Brand;
  created_at: string;
  updated_at: string;
}

export interface CreateProductInput {
  name: string;
  description: string;
  price: number;
  sale_price?: number;
  category_id: number;
  brand_id: number;
  gender: 'male' | 'female' | 'unisex';
  status?: 'active' | 'inactive';
  featured?: boolean;
  variants?: Omit<ProductVariant, 'id' | 'product_id'>[];
}

// Category types
export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parent_id?: number;
  image_url?: string;
  status: 'active' | 'inactive';
  children?: Category[];
  created_at: string;
  updated_at: string;
}

// Brand types
export interface Brand {
  id: number;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

// Order types
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  variant_id: number;
  quantity: number;
  price: number;
  product?: Product;
  variant?: ProductVariant;
}

export interface Order {
  id: number;
  user_id: number;
  status: OrderStatus;
  total_amount: number;
  shipping_fee: number;
  discount_amount: number;
  final_amount: number;
  shipping_address: string;
  shipping_name: string;
  shipping_phone: string;
  payment_method: 'cod' | 'bank_transfer' | 'credit_card';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  notes?: string;
  staff_notes?: string;
  assigned_staff_id?: number;
  user?: User;
  items?: OrderItem[];
  created_at: string;
  updated_at: string;
}

// Review types
export interface Review {
  id: number;
  user_id: number;
  product_id: number;
  order_id: number;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  user?: User;
  product?: Product;
  created_at: string;
  updated_at: string;
}

// Dashboard types
export interface DashboardStats {
  total_orders: number;
  total_revenue: number;
  total_customers: number;
  total_products: number;
  pending_orders: number;
  processing_orders: number;
  revenue_growth: number;
  orders_growth: number;
}

export interface SalesChartData {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  id: number;
  name: string;
  sold_count: number;
  revenue: number;
  image_url: string;
}

// Pagination types
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
