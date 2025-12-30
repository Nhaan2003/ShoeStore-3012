# ShoesShop - E-Commerce Shoe Store

## 📋 Giới thiệu

Hệ thống website bán giày hoàn chỉnh bao gồm:
- **Backend API** (Node.js/Express + SQL Server)
- **Frontend User** (React) - Port 3000
- **Frontend Admin** (React) - Port 3001
- **Database** (SQL Server)

## 🚀 Tính năng

### Cho khách hàng:
- ✅ Xem danh sách sản phẩm với bộ lọc (danh mục, thương hiệu, giá, size, màu)
- ✅ Xem chi tiết sản phẩm
- ✅ Đăng ký/Đăng nhập tài khoản
- ✅ Quản lý giỏ hàng
- ✅ Đặt hàng với mã giảm giá
- ✅ Theo dõi đơn hàng
- ✅ Quản lý thông tin cá nhân

### Cho Admin/Staff:
- ✅ Quản lý sản phẩm (CRUD, variants, images)
- ✅ Quản lý danh mục
- ✅ Quản lý thương hiệu
- ✅ Quản lý đơn hàng
- ✅ Quản lý người dùng
- ✅ Quản lý khuyến mãi
- ✅ Dashboard thống kê

## 🛠 Công nghệ sử dụng

### Backend:
- Node.js + Express
- SQL Server (mssql)
- JWT Authentication
- Multer (File upload)
- bcryptjs (Password hashing)

### Frontend:
- React 18
- React Router v6
- Axios
- React Icons
- React Toastify

## 📦 Cài đặt

### 1. Clone repository

```bash
git clone <repo-url>
cd shoe-store
```

### 2. Cài đặt Backend

```bash
cd be-shoestore
npm install
cp .env.example .env
# Chỉnh sửa file .env với thông tin database của bạn
npm start
```

### 3. Cài đặt Frontend

```bash
cd fe-user
npm install
cp .env.example .env
npm start
```

## 📁 Cấu trúc thư mục

```
shoe-store/
├── be-shoestore/           # Backend API
│   ├── src/
│   │   ├── config/         # Database config
│   │   ├── controllers/    # API Controllers
│   │   ├── middlewares/    # Auth, Upload, Validation
│   │   ├── routes/         # API Routes
│   │   └── server.js       # Entry point
│   ├── uploads/            # Uploaded files
│   └── package.json
│
├── fe-user/                # Frontend cho khách hàng
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── styles/         # Global styles
│   └── package.json
│
└── fe-admin/               # Frontend cho Admin (Coming soon)
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập (User)
- `POST /api/auth/admin/login` - Đăng nhập (Admin/Staff)
- `POST /api/auth/refresh-token` - Refresh token
- `GET /api/auth/me` - Lấy thông tin user hiện tại
- `PUT /api/auth/change-password` - Đổi mật khẩu

### Products
- `GET /api/products` - Danh sách sản phẩm
- `GET /api/products/:id` - Chi tiết sản phẩm
- `GET /api/products/:id/related` - Sản phẩm liên quan
- `POST /api/products` - Tạo sản phẩm (Admin)
- `PUT /api/products/:id` - Cập nhật sản phẩm (Admin)
- `DELETE /api/products/:id` - Xóa sản phẩm (Admin)

### Categories
- `GET /api/categories` - Danh sách danh mục (tree)
- `GET /api/categories/flat` - Danh sách phẳng
- `POST /api/categories` - Tạo danh mục (Admin)
- `PUT /api/categories/:id` - Cập nhật (Admin)
- `DELETE /api/categories/:id` - Xóa (Admin)

### Brands
- `GET /api/brands` - Danh sách thương hiệu
- `POST /api/brands` - Tạo thương hiệu (Admin)
- `PUT /api/brands/:id` - Cập nhật (Admin)
- `DELETE /api/brands/:id` - Xóa (Admin)

### Cart
- `GET /api/cart` - Lấy giỏ hàng
- `POST /api/cart/items` - Thêm vào giỏ
- `PUT /api/cart/items/:id` - Cập nhật số lượng
- `DELETE /api/cart/items/:id` - Xóa sản phẩm
- `DELETE /api/cart` - Xóa toàn bộ giỏ

### Orders
- `POST /api/orders` - Tạo đơn hàng
- `GET /api/orders` - Lấy đơn hàng của user
- `GET /api/orders/:id` - Chi tiết đơn hàng
- `PUT /api/orders/:id/cancel` - Hủy đơn hàng
- `GET /api/orders/admin/all` - Tất cả đơn hàng (Admin)
- `PUT /api/orders/:id/status` - Cập nhật trạng thái (Admin)

### Users
- `PUT /api/users/profile` - Cập nhật thông tin
- `GET /api/users` - Danh sách users (Admin)
- `GET /api/users/:id` - Chi tiết user (Admin)
- `POST /api/users/staff` - Tạo nhân viên (Admin)
- `PUT /api/users/:id/status` - Khóa/Mở khóa (Admin)

### Promotions
- `GET /api/promotions` - Khuyến mãi đang hoạt động
- `POST /api/promotions/verify` - Kiểm tra mã giảm giá
- `GET /api/promotions/admin` - Tất cả khuyến mãi (Admin)
- `POST /api/promotions` - Tạo khuyến mãi (Admin)

### Dashboard
- `GET /api/dashboard/stats` - Thống kê tổng quan
- `GET /api/dashboard/revenue` - Biểu đồ doanh thu
- `GET /api/dashboard/top-products` - Top sản phẩm bán chạy
- `GET /api/dashboard/low-stock` - Sản phẩm sắp hết hàng

## 🗄️ Database Schema

Cần tạo database SQL Server với các bảng sau:
- Users
- Categories
- Brands
- Products
- ProductVariants
- ProductImages
- Carts
- CartItems
- Orders
- OrderItems
- Reviews
- Promotions
- Notifications

(Xem file `database.sql` để biết chi tiết schema)

## 👥 Phân quyền

- **Guest**: Xem sản phẩm, tìm kiếm
- **Customer**: Tất cả quyền guest + Giỏ hàng, đặt hàng, đánh giá
- **Staff**: Quản lý đơn hàng, hỗ trợ khách hàng
- **Admin**: Full quyền quản lý

## 📝 License

MIT License
