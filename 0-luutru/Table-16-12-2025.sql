-- Tạo database
CREATE DATABASE ShoeStoreDB;
GO

USE ShoeStoreDB;
GO

-- 1. Bảng Users (Người dùng)
CREATE TABLE Users (
    id INT PRIMARY KEY IDENTITY(1,1),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name NVARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address NVARCHAR(500),
    role VARCHAR(20) CHECK (role IN ('customer', 'admin', 'staff')) DEFAULT 'customer',
    status VARCHAR(20) CHECK (status IN ('active', 'inactive', 'blocked')) DEFAULT 'active',
    avatar VARCHAR(500),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    last_login DATETIME,
    reset_token VARCHAR(255),
    reset_token_expires DATETIME
);

-- 2. Bảng Categories (Danh mục)
CREATE TABLE Categories (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description NVARCHAR(500),
    parent_id INT,
    image VARCHAR(500),
    status VARCHAR(20) CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
    display_order INT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (parent_id) REFERENCES Categories(id)
);

-- 3. Bảng Brands (Thương hiệu)
CREATE TABLE Brands (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description NVARCHAR(500),
    logo VARCHAR(500),
    status VARCHAR(20) CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
    country NVARCHAR(100),
    website VARCHAR(255),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);

-- 4. Bảng Products (Sản phẩm)
CREATE TABLE Products (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description NVARCHAR(MAX),
    base_price DECIMAL(10,2) NOT NULL,
    sale_price DECIMAL(10,2),
    category_id INT NOT NULL,
    brand_id INT NOT NULL,
    material NVARCHAR(255),
    gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'unisex')),
    status VARCHAR(20) CHECK (status IN ('active', 'inactive', 'out_of_stock')) DEFAULT 'active',
    featured BIT DEFAULT 0,
    view_count INT DEFAULT 0,
    sold_count INT DEFAULT 0,
    rating_average DECIMAL(2,1) DEFAULT 0,
    rating_count INT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (category_id) REFERENCES Categories(id),
    FOREIGN KEY (brand_id) REFERENCES Brands(id)
);

-- 5. Bảng ProductImages (Hình ảnh sản phẩm)
CREATE TABLE ProductImages (
    id INT PRIMARY KEY IDENTITY(1,1),
    product_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    is_primary BIT DEFAULT 0,
    display_order INT DEFAULT 0,
    alt_text NVARCHAR(255),
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (product_id) REFERENCES Products(id) ON DELETE CASCADE
);

-- 6. Bảng Colors (Màu sắc)
CREATE TABLE Colors (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(50) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    hex_value VARCHAR(7),
    created_at DATETIME DEFAULT GETDATE()
);

-- 7. Bảng Sizes (Kích thước)
CREATE TABLE Sizes (
    id INT PRIMARY KEY IDENTITY(1,1),
    name VARCHAR(10) NOT NULL,
    size_type VARCHAR(20) CHECK (size_type IN ('US', 'EU', 'UK', 'CM')),
    display_order INT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE()
);

-- 8. Bảng ProductVariants (Biến thể sản phẩm)
CREATE TABLE ProductVariants (
    id INT PRIMARY KEY IDENTITY(1,1),
    product_id INT NOT NULL,
    color_id INT NOT NULL,
    size_id INT NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    stock_quantity INT DEFAULT 0,
    reserved_quantity INT DEFAULT 0,
    additional_price DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (product_id) REFERENCES Products(id) ON DELETE CASCADE,
    FOREIGN KEY (color_id) REFERENCES Colors(id),
    FOREIGN KEY (size_id) REFERENCES Sizes(id),
    UNIQUE(product_id, color_id, size_id)
);

-- 9. Bảng VariantImages (Hình ảnh theo màu sắc)
CREATE TABLE VariantImages (
    id INT PRIMARY KEY IDENTITY(1,1),
    product_id INT NOT NULL,
    color_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    display_order INT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (product_id) REFERENCES Products(id) ON DELETE CASCADE,
    FOREIGN KEY (color_id) REFERENCES Colors(id)
);

-- 10. Bảng Promotions (Khuyến mãi)
CREATE TABLE Promotions (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(500),
    discount_type VARCHAR(20) CHECK (discount_type IN ('percentage', 'fixed_amount')),
    discount_value DECIMAL(10,2) NOT NULL,
    min_order_value DECIMAL(10,2) DEFAULT 0,
    max_discount_amount DECIMAL(10,2),
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    usage_limit INT,
    used_count INT DEFAULT 0,
    status VARCHAR(20) CHECK (status IN ('active', 'inactive', 'expired')) DEFAULT 'active',
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);

-- 11. Bảng PromotionProducts (Sản phẩm áp dụng khuyến mãi)
CREATE TABLE PromotionProducts (
    promotion_id INT NOT NULL,
    product_id INT NOT NULL,
    PRIMARY KEY (promotion_id, product_id),
    FOREIGN KEY (promotion_id) REFERENCES Promotions(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Products(id) ON DELETE CASCADE
);

-- 12. Bảng Carts (Giỏ hàng)
CREATE TABLE Carts (
    id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- 13. Bảng CartItems (Chi tiết giỏ hàng)
CREATE TABLE CartItems (
    id INT PRIMARY KEY IDENTITY(1,1),
    cart_id INT NOT NULL,
    product_variant_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    price DECIMAL(10,2) NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (cart_id) REFERENCES Carts(id) ON DELETE CASCADE,
    FOREIGN KEY (product_variant_id) REFERENCES ProductVariants(id)
);

-- 14. Bảng Orders (Đơn hàng)
CREATE TABLE Orders (
    id INT PRIMARY KEY IDENTITY(1,1),
    order_code VARCHAR(50) UNIQUE NOT NULL,
    user_id INT NOT NULL,
    staff_id INT,
    full_name NVARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    shipping_address NVARCHAR(500) NOT NULL,
    shipping_fee DECIMAL(10,2) DEFAULT 0,
    subtotal DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'COD',
    payment_status VARCHAR(20) CHECK (payment_status IN ('pending', 'paid', 'failed')) DEFAULT 'pending',
    order_status VARCHAR(50) CHECK (order_status IN ('pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled', 'returned')) DEFAULT 'pending',
    notes NVARCHAR(500),
    cancelled_reason NVARCHAR(500),
    cancelled_by INT,
    cancelled_at DATETIME,
    delivered_at DATETIME,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES Users(id),
    FOREIGN KEY (staff_id) REFERENCES Users(id),
    FOREIGN KEY (cancelled_by) REFERENCES Users(id)
);

-- 15. Bảng OrderItems (Chi tiết đơn hàng)
CREATE TABLE OrderItems (
    id INT PRIMARY KEY IDENTITY(1,1),
    order_id INT NOT NULL,
    product_variant_id INT NOT NULL,
    product_name NVARCHAR(255) NOT NULL,
    color_name NVARCHAR(50) NOT NULL,
    size_name VARCHAR(10) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (order_id) REFERENCES Orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_variant_id) REFERENCES ProductVariants(id)
);

-- 16. Bảng OrderStatusHistory (Lịch sử trạng thái đơn hàng)
CREATE TABLE OrderStatusHistory (
    id INT PRIMARY KEY IDENTITY(1,1),
    order_id INT NOT NULL,
    from_status VARCHAR(50),
    to_status VARCHAR(50) NOT NULL,
    changed_by INT NOT NULL,
    notes NVARCHAR(500),
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (order_id) REFERENCES Orders(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES Users(id)
);

-- 17. Bảng Reviews (Đánh giá sản phẩm)
CREATE TABLE Reviews (
    id INT PRIMARY KEY IDENTITY(1,1),
    product_id INT NOT NULL,
    user_id INT NOT NULL,
    order_item_id INT NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    title NVARCHAR(255),
    comment NVARCHAR(1000),
    is_verified_purchase BIT DEFAULT 1,
    helpful_count INT DEFAULT 0,
    status VARCHAR(20) CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (product_id) REFERENCES Products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(id),
    FOREIGN KEY (order_item_id) REFERENCES OrderItems(id)
);

-- 18. Bảng ReviewImages (Hình ảnh đánh giá)
CREATE TABLE ReviewImages (
    id INT PRIMARY KEY IDENTITY(1,1),
    review_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (review_id) REFERENCES Reviews(id) ON DELETE CASCADE
);

-- 19. Bảng StockMovements (Lịch sử kho)
CREATE TABLE StockMovements (
    id INT PRIMARY KEY IDENTITY(1,1),
    product_variant_id INT NOT NULL,
    type VARCHAR(20) CHECK (type IN ('in', 'out', 'adjustment')),
    quantity INT NOT NULL,
    before_quantity INT NOT NULL,
    after_quantity INT NOT NULL,
    reference_type VARCHAR(50),
    reference_id INT,
    notes NVARCHAR(500),
    created_by INT NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (product_variant_id) REFERENCES ProductVariants(id),
    FOREIGN KEY (created_by) REFERENCES Users(id)
);

-- 20. Bảng ActivityLogs (Nhật ký hoạt động)
CREATE TABLE ActivityLogs (
    id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INT,
    old_values NVARCHAR(MAX),
    new_values NVARCHAR(MAX),
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES Users(id)
);

-- 21. Bảng WishlistItems (Sản phẩm yêu thích)
CREATE TABLE WishlistItems (
    id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Products(id) ON DELETE CASCADE,
    UNIQUE(user_id, product_id)
);

-- 22. Bảng Notifications (Thông báo)
CREATE TABLE Notifications (
    id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,
    title NVARCHAR(255) NOT NULL,
    message NVARCHAR(500) NOT NULL,
    type VARCHAR(50),
    is_read BIT DEFAULT 0,
    reference_type VARCHAR(50),
    reference_id INT,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- Tạo các Index để tối ưu hiệu suất
CREATE INDEX idx_products_category ON Products(category_id);
CREATE INDEX idx_products_brand ON Products(brand_id);
CREATE INDEX idx_products_status ON Products(status);
CREATE INDEX idx_productvariants_product ON ProductVariants(product_id);
CREATE INDEX idx_orders_user ON Orders(user_id);
CREATE INDEX idx_orders_status ON Orders(order_status);
CREATE INDEX idx_orders_created ON Orders(created_at);
CREATE INDEX idx_cartitems_cart ON CartItems(cart_id);
CREATE INDEX idx_reviews_product ON Reviews(product_id);
CREATE INDEX idx_reviews_user ON Reviews(user_id);

-- Thêm dữ liệu mẫu
-- Màu sắc
INSERT INTO Colors (name, code, hex_value) VALUES
(N'Đen', 'black', '#000000'),
(N'Trắng', 'white', '#FFFFFF'),
(N'Xám', 'gray', '#808080'),
(N'Đỏ', 'red', '#FF0000'),
(N'Xanh dương', 'blue', '#0000FF'),
(N'Xanh lá', 'green', '#00FF00'),
(N'Vàng', 'yellow', '#FFFF00'),
(N'Cam', 'orange', '#FFA500'),
(N'Hồng', 'pink', '#FFC0CB'),
(N'Tím', 'purple', '#800080'),
(N'Nâu', 'brown', '#A52A2A'),
(N'Be', 'beige', '#F5F5DC');

-- Kích thước
INSERT INTO Sizes (name, size_type, display_order) VALUES
('35', 'EU', 1),
('36', 'EU', 2),
('37', 'EU', 3),
('38', 'EU', 4),
('39', 'EU', 5),
('40', 'EU', 6),
('41', 'EU', 7),
('42', 'EU', 8),
('43', 'EU', 9),
('44', 'EU', 10),
('45', 'EU', 11),
('46', 'EU', 12);

-- Danh mục
INSERT INTO Categories (name, slug, description, parent_id, display_order) VALUES
(N'Giày thể thao', 'giay-the-thao', N'Giày thể thao các loại', NULL, 1),
(N'Giày chạy bộ', 'giay-chay-bo', N'Giày chuyên dụng cho chạy bộ', 1, 1),
(N'Giày bóng rổ', 'giay-bong-ro', N'Giày chuyên dụng cho bóng rổ', 1, 2),
(N'Giày tennis', 'giay-tennis', N'Giày chuyên dụng cho tennis', 1, 3),
(N'Sneakers', 'sneakers', N'Giày sneakers thời trang', NULL, 2),
(N'Giày cao gót', 'giay-cao-got', N'Giày cao gót nữ', NULL, 3),
(N'Sandal', 'sandal', N'Sandal và dép', NULL, 4),
(N'Boot', 'boot', N'Giày boot nam nữ', NULL, 5);

-- Thương hiệu
INSERT INTO Brands (name, slug, description, country) VALUES
('Nike', 'nike', N'Thương hiệu giày thể thao hàng đầu', 'USA'),
('Adidas', 'adidas', N'Thương hiệu thể thao Đức', 'Germany'),
('Puma', 'puma', N'Thương hiệu thể thao Đức', 'Germany'),
('Vans', 'vans', N'Thương hiệu giày skateboard', 'USA'),
('Converse', 'converse', N'Thương hiệu giày canvas', 'USA'),
('New Balance', 'new-balance', N'Thương hiệu giày chạy bộ', 'USA'),
('Reebok', 'reebok', N'Thương hiệu thể thao', 'UK'),
('ASICS', 'asics', N'Thương hiệu giày chạy Nhật Bản', 'Japan');

-- Tạo admin mẫu (password: admin123)
INSERT INTO Users (email, password, full_name, phone, role, status) VALUES
('admin@shoestore.com', '$2a$10$YourHashedPasswordHere', N'Quản trị viên', '0123456789', 'admin', 'active'),
('staff@shoestore.com', '$2a$10$YourHashedPasswordHere', N'Nhân viên', '0987654321', 'staff', 'active');