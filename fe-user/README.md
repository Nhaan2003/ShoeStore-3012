# Shoe Store - User Frontend

Giao diện người dùng cho cửa hàng giày dép trực tuyến.

## Tính năng

- Trang chủ với sản phẩm nổi bật, hàng mới về
- Danh sách sản phẩm với bộ lọc (danh mục, thương hiệu, giá, size)
- Chi tiết sản phẩm với đánh giá
- Giỏ hàng và thanh toán
- Đăng ký, đăng nhập, quên mật khẩu
- Quản lý tài khoản (thông tin cá nhân, đơn hàng, yêu thích)

## Công nghệ sử dụng

- React 19 + Vite
- React Router DOM
- Tailwind CSS
- Axios
- React Hook Form
- React Hot Toast
- Headless UI
- Heroicons

## Cài đặt

```bash
# Cài đặt dependencies
npm install

# Chạy development server
npm run dev

# Build production
npm run build
```

## Cấu hình

Tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
```

Cấu hình các biến môi trường:

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_APP_NAME=Shoe Store
```

## Cấu trúc thư mục

```
src/
├── components/       # React components
│   ├── ui/          # UI components (Button, Input, Modal, etc.)
│   ├── layout/      # Layout components (Header, Footer)
│   ├── product/     # Product components
│   ├── cart/        # Cart components
│   └── auth/        # Auth components
├── pages/           # Page components
│   ├── auth/        # Auth pages (Login, Register, etc.)
│   ├── product/     # Product pages
│   └── user/        # User pages (Profile, Orders, etc.)
├── services/        # API services
├── contexts/        # React contexts (Auth, Cart)
├── hooks/           # Custom hooks
├── utils/           # Utility functions
└── assets/          # Static assets
```

## API Backend

Frontend này kết nối với backend tại: https://github.com/Nhaan2003/shoe-store-backend

### API Routes

- `/api/v1/auth` - Authentication
- `/api/v1/products` - Products
- `/api/v1/categories` - Categories
- `/api/v1/brands` - Brands
- `/api/v1/cart` - Shopping cart
- `/api/v1/orders` - Orders
- `/api/v1/reviews` - Reviews
- `/api/v1/users` - User profile
