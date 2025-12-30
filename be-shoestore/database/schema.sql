-- =============================================
-- Shoe Store E-commerce Database Schema
-- SQL Server Script
-- Created: 2025
-- =============================================

-- Create Database
USE master;
GO

IF EXISTS (SELECT name FROM sys.databases WHERE name = N'ShoeStore')
BEGIN
    ALTER DATABASE ShoeStore SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE ShoeStore;
END
GO

CREATE DATABASE ShoeStore;
GO

USE ShoeStore;
GO

-- =============================================
-- TABLE: Users
-- Description: Base user table for all user types (Customer, Admin, Staff)
-- =============================================
CREATE TABLE Users (
    user_id INT IDENTITY(1,1) PRIMARY KEY,
    email NVARCHAR(100) NOT NULL UNIQUE,
    password NVARCHAR(255) NOT NULL,
    full_name NVARCHAR(100) NOT NULL,
    phone NVARCHAR(20),
    address NVARCHAR(500),
    avatar NVARCHAR(255),
    role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('admin', 'staff', 'customer')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
    -- Customer specific fields
    date_of_birth DATE,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    -- Staff specific fields
    staff_permissions NVARCHAR(500),
    -- Authentication fields
    last_login DATETIME,
    reset_token NVARCHAR(255),
    reset_token_expires DATETIME,
    refresh_token NVARCHAR(500),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);
GO

-- Create index on email for faster lookups
CREATE INDEX IX_Users_Email ON Users(email);
CREATE INDEX IX_Users_Role ON Users(role);
CREATE INDEX IX_Users_Status ON Users(status);
GO

-- =============================================
-- TABLE: Categories
-- Description: Product categories with hierarchical support
-- =============================================
CREATE TABLE Categories (
    category_id INT IDENTITY(1,1) PRIMARY KEY,
    category_name NVARCHAR(100) NOT NULL,
    description NVARCHAR(500),
    parent_id INT NULL REFERENCES Categories(category_id),
    image_url NVARCHAR(255),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    sort_order INT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);
GO

CREATE INDEX IX_Categories_ParentId ON Categories(parent_id);
CREATE INDEX IX_Categories_Status ON Categories(status);
GO

-- =============================================
-- TABLE: Brands
-- Description: Product brands
-- =============================================
CREATE TABLE Brands (
    brand_id INT IDENTITY(1,1) PRIMARY KEY,
    brand_name NVARCHAR(100) NOT NULL UNIQUE,
    description NVARCHAR(500),
    logo NVARCHAR(255),
    website NVARCHAR(255),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at DATETIME DEFAULT GETDATE()
);
GO

CREATE INDEX IX_Brands_Status ON Brands(status);
GO

-- =============================================
-- TABLE: Products
-- Description: Main product information
-- =============================================
CREATE TABLE Products (
    product_id INT IDENTITY(1,1) PRIMARY KEY,
    product_name NVARCHAR(200) NOT NULL,
    description NVARCHAR(MAX),
    base_price DECIMAL(15, 2) NOT NULL CHECK (base_price >= 0),
    category_id INT NOT NULL REFERENCES Categories(category_id),
    brand_id INT NOT NULL REFERENCES Brands(brand_id),
    material NVARCHAR(100),
    gender VARCHAR(10) DEFAULT 'unisex' CHECK (gender IN ('male', 'female', 'unisex')),
    product_type NVARCHAR(50),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    view_count INT DEFAULT 0,
    sold_count INT DEFAULT 0,
    created_by INT REFERENCES Users(user_id),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);
GO

CREATE INDEX IX_Products_CategoryId ON Products(category_id);
CREATE INDEX IX_Products_BrandId ON Products(brand_id);
CREATE INDEX IX_Products_Status ON Products(status);
CREATE INDEX IX_Products_Gender ON Products(gender);
GO

-- =============================================
-- TABLE: ProductVariants
-- Description: Product variants by size and color
-- =============================================
CREATE TABLE ProductVariants (
    variant_id INT IDENTITY(1,1) PRIMARY KEY,
    product_id INT NOT NULL REFERENCES Products(product_id) ON DELETE CASCADE,
    size NVARCHAR(10) NOT NULL,
    color NVARCHAR(50) NOT NULL,
    color_code NVARCHAR(20),
    sku NVARCHAR(50) UNIQUE,
    price DECIMAL(15, 2),
    stock_quantity INT DEFAULT 0 CHECK (stock_quantity >= 0),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT UQ_ProductVariant UNIQUE (product_id, size, color)
);
GO

CREATE INDEX IX_ProductVariants_ProductId ON ProductVariants(product_id);
CREATE INDEX IX_ProductVariants_Status ON ProductVariants(status);
CREATE INDEX IX_ProductVariants_Size ON ProductVariants(size);
CREATE INDEX IX_ProductVariants_Color ON ProductVariants(color);
GO

-- =============================================
-- TABLE: ProductImages
-- Description: Product images
-- =============================================
CREATE TABLE ProductImages (
    image_id INT IDENTITY(1,1) PRIMARY KEY,
    product_id INT NOT NULL REFERENCES Products(product_id) ON DELETE CASCADE,
    image_url NVARCHAR(255) NOT NULL,
    is_primary BIT DEFAULT 0,
    sort_order INT DEFAULT 0,
    color NVARCHAR(50),
    created_at DATETIME DEFAULT GETDATE()
);
GO

CREATE INDEX IX_ProductImages_ProductId ON ProductImages(product_id);
GO

-- =============================================
-- TABLE: Carts
-- Description: Shopping carts
-- =============================================
CREATE TABLE Carts (
    cart_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL UNIQUE REFERENCES Users(user_id) ON DELETE CASCADE,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);
GO

CREATE INDEX IX_Carts_UserId ON Carts(user_id);
GO

-- =============================================
-- TABLE: CartItems
-- Description: Items in shopping cart
-- =============================================
CREATE TABLE CartItems (
    cart_item_id INT IDENTITY(1,1) PRIMARY KEY,
    cart_id INT NOT NULL REFERENCES Carts(cart_id) ON DELETE CASCADE,
    variant_id INT NOT NULL REFERENCES ProductVariants(variant_id),
    quantity INT NOT NULL CHECK (quantity > 0),
    added_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT UQ_CartItem UNIQUE (cart_id, variant_id)
);
GO

CREATE INDEX IX_CartItems_CartId ON CartItems(cart_id);
CREATE INDEX IX_CartItems_VariantId ON CartItems(variant_id);
GO

-- =============================================
-- TABLE: Promotions
-- Description: Promotion codes and discounts
-- =============================================
CREATE TABLE Promotions (
    promotion_id INT IDENTITY(1,1) PRIMARY KEY,
    code NVARCHAR(50) NOT NULL UNIQUE,
    name NVARCHAR(100) NOT NULL,
    description NVARCHAR(500),
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount', 'free_shipping')),
    discount_value DECIMAL(15, 2) NOT NULL,
    min_order_amount DECIMAL(15, 2) DEFAULT 0,
    max_discount_amount DECIMAL(15, 2),
    usage_limit INT,
    used_count INT DEFAULT 0,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
    created_by INT REFERENCES Users(user_id),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);
GO

CREATE INDEX IX_Promotions_Code ON Promotions(code);
CREATE INDEX IX_Promotions_Status ON Promotions(status);
GO

-- =============================================
-- TABLE: Orders
-- Description: Customer orders
-- =============================================
CREATE TABLE Orders (
    order_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL REFERENCES Users(user_id),
    order_code NVARCHAR(20) NOT NULL UNIQUE,
    total_amount DECIMAL(15, 2) NOT NULL,
    discount_amount DECIMAL(15, 2) DEFAULT 0,
    shipping_fee DECIMAL(15, 2) DEFAULT 0,
    final_amount DECIMAL(15, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned')),
    payment_method VARCHAR(20) DEFAULT 'COD' CHECK (payment_method IN ('COD', 'BANK_TRANSFER', 'VNPAY', 'MOMO', 'ZALOPAY', 'CREDIT_CARD')),
    payment_status VARCHAR(20) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'pending', 'completed', 'failed', 'refunded', 'cancelled')),
    shipping_name NVARCHAR(100) NOT NULL,
    shipping_phone NVARCHAR(20) NOT NULL,
    shipping_address NVARCHAR(500) NOT NULL,
    notes NVARCHAR(500),
    promotion_code NVARCHAR(50),
    confirmed_at DATETIME,
    shipped_at DATETIME,
    delivered_at DATETIME,
    cancelled_at DATETIME,
    cancel_reason NVARCHAR(500),
    processed_by INT REFERENCES Users(user_id),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);
GO

CREATE INDEX IX_Orders_UserId ON Orders(user_id);
CREATE INDEX IX_Orders_OrderCode ON Orders(order_code);
CREATE INDEX IX_Orders_Status ON Orders(status);
CREATE INDEX IX_Orders_CreatedAt ON Orders(created_at);
CREATE INDEX IX_Orders_ProcessedBy ON Orders(processed_by);
GO

-- =============================================
-- TABLE: OrderItems
-- Description: Items in an order
-- =============================================
CREATE TABLE OrderItems (
    order_item_id INT IDENTITY(1,1) PRIMARY KEY,
    order_id INT NOT NULL REFERENCES Orders(order_id) ON DELETE CASCADE,
    variant_id INT NOT NULL REFERENCES ProductVariants(variant_id),
    product_name NVARCHAR(200) NOT NULL,
    size NVARCHAR(10) NOT NULL,
    color NVARCHAR(50) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(15, 2) NOT NULL,
    subtotal DECIMAL(15, 2) NOT NULL,
    created_at DATETIME DEFAULT GETDATE()
);
GO

CREATE INDEX IX_OrderItems_OrderId ON OrderItems(order_id);
CREATE INDEX IX_OrderItems_VariantId ON OrderItems(variant_id);
GO

-- =============================================
-- TABLE: Reviews
-- Description: Product reviews from customers
-- =============================================
CREATE TABLE Reviews (
    review_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL REFERENCES Users(user_id),
    product_id INT NOT NULL REFERENCES Products(product_id) ON DELETE CASCADE,
    order_id INT REFERENCES Orders(order_id),
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title NVARCHAR(200),
    comment NVARCHAR(MAX),
    images NVARCHAR(MAX),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_reply NVARCHAR(MAX),
    replied_at DATETIME,
    replied_by INT REFERENCES Users(user_id),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT UQ_UserProductReview UNIQUE (user_id, product_id, order_id)
);
GO

CREATE INDEX IX_Reviews_ProductId ON Reviews(product_id);
CREATE INDEX IX_Reviews_UserId ON Reviews(user_id);
CREATE INDEX IX_Reviews_Status ON Reviews(status);
CREATE INDEX IX_Reviews_Rating ON Reviews(rating);
GO

-- =============================================
-- TABLE: ChatSessions
-- Description: Chat sessions for customer support
-- =============================================
CREATE TABLE ChatSessions (
    session_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT REFERENCES Users(user_id),
    session_token NVARCHAR(255) UNIQUE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'ended')),
    started_at DATETIME DEFAULT GETDATE(),
    ended_at DATETIME,
    created_at DATETIME DEFAULT GETDATE()
);
GO

CREATE INDEX IX_ChatSessions_UserId ON ChatSessions(user_id);
CREATE INDEX IX_ChatSessions_Status ON ChatSessions(status);
GO

-- =============================================
-- TABLE: ChatMessages
-- Description: Messages in chat sessions
-- =============================================
CREATE TABLE ChatMessages (
    message_id INT IDENTITY(1,1) PRIMARY KEY,
    session_id INT NOT NULL REFERENCES ChatSessions(session_id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('user', 'bot', 'admin')),
    message_text NVARCHAR(MAX) NOT NULL,
    intent NVARCHAR(100),
    entities NVARCHAR(MAX),
    timestamp DATETIME DEFAULT GETDATE()
);
GO

CREATE INDEX IX_ChatMessages_SessionId ON ChatMessages(session_id);
CREATE INDEX IX_ChatMessages_Timestamp ON ChatMessages(timestamp);
GO

-- =============================================
-- TABLE: StockHistory
-- Description: Track stock changes
-- =============================================
CREATE TABLE StockHistory (
    history_id INT IDENTITY(1,1) PRIMARY KEY,
    variant_id INT NOT NULL REFERENCES ProductVariants(variant_id),
    change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('increase', 'decrease', 'set', 'order', 'return', 'adjustment')),
    quantity_change INT NOT NULL,
    quantity_before INT NOT NULL,
    quantity_after INT NOT NULL,
    reason NVARCHAR(255),
    reference_type VARCHAR(20),
    reference_id INT,
    created_by INT REFERENCES Users(user_id),
    created_at DATETIME DEFAULT GETDATE()
);
GO

CREATE INDEX IX_StockHistory_VariantId ON StockHistory(variant_id);
CREATE INDEX IX_StockHistory_CreatedAt ON StockHistory(created_at);
GO

-- =============================================
-- TABLE: Notifications
-- Description: User notifications
-- =============================================
CREATE TABLE Notifications (
    notification_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('order', 'promotion', 'system', 'product')),
    title NVARCHAR(200) NOT NULL,
    message NVARCHAR(MAX) NOT NULL,
    data NVARCHAR(MAX),
    is_read BIT DEFAULT 0,
    read_at DATETIME,
    created_at DATETIME DEFAULT GETDATE()
);
GO

CREATE INDEX IX_Notifications_UserId ON Notifications(user_id);
CREATE INDEX IX_Notifications_IsRead ON Notifications(is_read);
GO

-- =============================================
-- TABLE: Wishlists
-- Description: User wishlists
-- =============================================
CREATE TABLE Wishlists (
    wishlist_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES Products(product_id) ON DELETE CASCADE,
    created_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT UQ_Wishlist UNIQUE (user_id, product_id)
);
GO

CREATE INDEX IX_Wishlists_UserId ON Wishlists(user_id);
GO

-- =============================================
-- SEQUENCE: OrderSequence
-- Description: For generating order codes
-- =============================================
CREATE SEQUENCE OrderSequence
    START WITH 1
    INCREMENT BY 1;
GO

-- =============================================
-- STORED PROCEDURES
-- =============================================

-- Generate Order Code
CREATE PROCEDURE sp_GenerateOrderCode
    @OrderCode NVARCHAR(20) OUTPUT
AS
BEGIN
    DECLARE @SeqNum BIGINT = NEXT VALUE FOR OrderSequence;
    SET @OrderCode = 'ORD' + FORMAT(GETDATE(), 'yyyyMMdd') + RIGHT('0000' + CAST(@SeqNum AS NVARCHAR), 4);
END
GO

-- Update Stock on Order
CREATE PROCEDURE sp_UpdateStockOnOrder
    @VariantId INT,
    @Quantity INT,
    @OrderId INT,
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @CurrentStock INT;
    SELECT @CurrentStock = stock_quantity FROM ProductVariants WHERE variant_id = @VariantId;

    IF @CurrentStock < @Quantity
    BEGIN
        RAISERROR('Insufficient stock', 16, 1);
        RETURN;
    END

    UPDATE ProductVariants
    SET stock_quantity = stock_quantity - @Quantity,
        updated_at = GETDATE()
    WHERE variant_id = @VariantId;

    INSERT INTO StockHistory (variant_id, change_type, quantity_change, quantity_before, quantity_after, reason, reference_type, reference_id, created_by)
    VALUES (@VariantId, 'order', -@Quantity, @CurrentStock, @CurrentStock - @Quantity, 'Order placed', 'order', @OrderId, @UserId);
END
GO

-- Restore Stock on Cancel
CREATE PROCEDURE sp_RestoreStockOnCancel
    @OrderId INT,
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Items TABLE (variant_id INT, quantity INT);
    INSERT INTO @Items SELECT variant_id, quantity FROM OrderItems WHERE order_id = @OrderId;

    DECLARE @VariantId INT, @Quantity INT, @CurrentStock INT;

    DECLARE item_cursor CURSOR FOR SELECT variant_id, quantity FROM @Items;
    OPEN item_cursor;
    FETCH NEXT FROM item_cursor INTO @VariantId, @Quantity;

    WHILE @@FETCH_STATUS = 0
    BEGIN
        SELECT @CurrentStock = stock_quantity FROM ProductVariants WHERE variant_id = @VariantId;

        UPDATE ProductVariants
        SET stock_quantity = stock_quantity + @Quantity,
            updated_at = GETDATE()
        WHERE variant_id = @VariantId;

        INSERT INTO StockHistory (variant_id, change_type, quantity_change, quantity_before, quantity_after, reason, reference_type, reference_id, created_by)
        VALUES (@VariantId, 'return', @Quantity, @CurrentStock, @CurrentStock + @Quantity, 'Order cancelled', 'order', @OrderId, @UserId);

        FETCH NEXT FROM item_cursor INTO @VariantId, @Quantity;
    END

    CLOSE item_cursor;
    DEALLOCATE item_cursor;
END
GO

-- Get Dashboard Statistics
CREATE PROCEDURE sp_GetDashboardStats
    @StartDate DATE = NULL,
    @EndDate DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @StartDate IS NULL SET @StartDate = DATEADD(DAY, -30, GETDATE());
    IF @EndDate IS NULL SET @EndDate = GETDATE();

    -- Total Revenue
    SELECT
        COUNT(order_id) as total_orders,
        SUM(CASE WHEN status = 'delivered' THEN final_amount ELSE 0 END) as total_revenue,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as completed_orders,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders
    FROM Orders
    WHERE created_at BETWEEN @StartDate AND @EndDate;

    -- New Customers
    SELECT COUNT(*) as new_customers
    FROM Users
    WHERE role = 'customer' AND created_at BETWEEN @StartDate AND @EndDate;

    -- Top Products
    SELECT TOP 10
        p.product_id,
        p.product_name,
        SUM(oi.quantity) as total_sold,
        SUM(oi.subtotal) as total_revenue
    FROM OrderItems oi
    JOIN ProductVariants pv ON oi.variant_id = pv.variant_id
    JOIN Products p ON pv.product_id = p.product_id
    JOIN Orders o ON oi.order_id = o.order_id
    WHERE o.status = 'delivered' AND o.created_at BETWEEN @StartDate AND @EndDate
    GROUP BY p.product_id, p.product_name
    ORDER BY total_sold DESC;
END
GO

-- =============================================
-- TRIGGERS
-- =============================================

-- Update product sold_count on order delivered
CREATE TRIGGER tr_UpdateSoldCount
ON Orders
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF UPDATE(status)
    BEGIN
        -- Update sold_count when order is delivered
        UPDATE p
        SET sold_count = sold_count + oi.quantity
        FROM Products p
        JOIN ProductVariants pv ON p.product_id = pv.product_id
        JOIN OrderItems oi ON pv.variant_id = oi.variant_id
        JOIN inserted i ON oi.order_id = i.order_id
        JOIN deleted d ON i.order_id = d.order_id
        WHERE i.status = 'delivered' AND d.status != 'delivered';
    END
END
GO

-- Auto update updated_at timestamp
CREATE TRIGGER tr_Users_UpdatedAt ON Users
AFTER UPDATE AS
BEGIN
    UPDATE Users SET updated_at = GETDATE()
    FROM Users u
    INNER JOIN inserted i ON u.user_id = i.user_id;
END
GO

CREATE TRIGGER tr_Products_UpdatedAt ON Products
AFTER UPDATE AS
BEGIN
    UPDATE Products SET updated_at = GETDATE()
    FROM Products p
    INNER JOIN inserted i ON p.product_id = i.product_id;
END
GO

CREATE TRIGGER tr_Orders_UpdatedAt ON Orders
AFTER UPDATE AS
BEGIN
    UPDATE Orders SET updated_at = GETDATE()
    FROM Orders o
    INNER JOIN inserted i ON o.order_id = i.order_id;
END
GO

-- =============================================
-- VIEWS
-- =============================================

-- Product Detail View with statistics
CREATE VIEW vw_ProductDetails AS
SELECT
    p.product_id,
    p.product_name,
    p.description,
    p.base_price,
    p.material,
    p.gender,
    p.product_type,
    p.status,
    p.view_count,
    p.sold_count,
    p.created_at,
    c.category_id,
    c.category_name,
    b.brand_id,
    b.brand_name,
    (SELECT MIN(price) FROM ProductVariants WHERE product_id = p.product_id AND status = 'active') as min_price,
    (SELECT MAX(price) FROM ProductVariants WHERE product_id = p.product_id AND status = 'active') as max_price,
    (SELECT SUM(stock_quantity) FROM ProductVariants WHERE product_id = p.product_id AND status = 'active') as total_stock,
    (SELECT AVG(CAST(rating AS FLOAT)) FROM Reviews WHERE product_id = p.product_id AND status = 'approved') as avg_rating,
    (SELECT COUNT(*) FROM Reviews WHERE product_id = p.product_id AND status = 'approved') as review_count
FROM Products p
LEFT JOIN Categories c ON p.category_id = c.category_id
LEFT JOIN Brands b ON p.brand_id = b.brand_id;
GO

-- Order Summary View
CREATE VIEW vw_OrderSummary AS
SELECT
    o.order_id,
    o.order_code,
    o.total_amount,
    o.discount_amount,
    o.shipping_fee,
    o.final_amount,
    o.status,
    o.payment_method,
    o.payment_status,
    o.shipping_name,
    o.shipping_phone,
    o.shipping_address,
    o.created_at,
    u.user_id,
    u.full_name as customer_name,
    u.email as customer_email,
    u.phone as customer_phone,
    (SELECT COUNT(*) FROM OrderItems WHERE order_id = o.order_id) as item_count,
    processor.full_name as processed_by_name
FROM Orders o
LEFT JOIN Users u ON o.user_id = u.user_id
LEFT JOIN Users processor ON o.processed_by = processor.user_id;
GO

-- =============================================
-- SAMPLE DATA
-- =============================================

-- Insert Admin User (password: admin123)
INSERT INTO Users (email, password, full_name, phone, role, status)
VALUES ('admin@shoestore.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrator', '0901234567', 'admin', 'active');

-- Insert Staff User (password: staff123)
INSERT INTO Users (email, password, full_name, phone, role, status)
VALUES ('staff@shoestore.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Staff Member', '0901234568', 'staff', 'active');

-- Insert Categories
INSERT INTO Categories (category_name, description, status) VALUES
(N'Sneakers', N'Giày thể thao sneaker', 'active'),
(N'Running Shoes', N'Giày chạy bộ', 'active'),
(N'Basketball Shoes', N'Giày bóng rổ', 'active'),
(N'Sandals', N'Dép sandal', 'active'),
(N'Boots', N'Giày boot', 'active'),
(N'Casual Shoes', N'Giày casual', 'active');

-- Insert Brands
INSERT INTO Brands (brand_name, description, status) VALUES
('Nike', N'Thương hiệu giày thể thao hàng đầu thế giới', 'active'),
('Adidas', N'Thương hiệu giày thể thao Đức', 'active'),
('Converse', N'Giày sneaker cổ điển', 'active'),
('Vans', N'Giày skateboard và lifestyle', 'active'),
('Puma', N'Thương hiệu giày thể thao', 'active'),
('New Balance', N'Giày chạy bộ chất lượng cao', 'active'),
('Reebok', N'Giày fitness và lifestyle', 'active');

-- Insert Sample Products
INSERT INTO Products (product_name, description, base_price, category_id, brand_id, material, gender, status) VALUES
(N'Nike Air Max 90', N'Giày Nike Air Max 90 với đệm Air đặc trưng', 3500000, 1, 1, N'Da tổng hợp, vải mesh', 'unisex', 'active'),
(N'Adidas Ultraboost 22', N'Giày chạy bộ với công nghệ Boost', 4200000, 2, 2, N'Primeknit', 'unisex', 'active'),
(N'Converse Chuck Taylor All Star', N'Giày Converse cổ điển', 1500000, 1, 3, N'Canvas', 'unisex', 'active'),
(N'Vans Old Skool', N'Giày Vans Old Skool iconic', 1800000, 1, 4, N'Canvas, da lộn', 'unisex', 'active'),
(N'Nike Air Jordan 1', N'Giày bóng rổ huyền thoại', 4500000, 3, 1, N'Da thật', 'male', 'active'),
(N'Adidas Stan Smith', N'Giày tennis cổ điển', 2200000, 6, 2, N'Da thật', 'unisex', 'active'),
(N'New Balance 574', N'Giày lifestyle đa năng', 2500000, 6, 6, N'Da lộn, mesh', 'unisex', 'active'),
(N'Puma RS-X', N'Giày chunky sneaker', 2800000, 1, 5, N'Da tổng hợp, mesh', 'unisex', 'active');

-- Insert Product Variants
INSERT INTO ProductVariants (product_id, size, color, sku, price, stock_quantity, status) VALUES
-- Nike Air Max 90
(1, '39', N'Trắng', 'NIKE-AM90-39-WHT', 3500000, 10, 'active'),
(1, '40', N'Trắng', 'NIKE-AM90-40-WHT', 3500000, 15, 'active'),
(1, '41', N'Trắng', 'NIKE-AM90-41-WHT', 3500000, 12, 'active'),
(1, '42', N'Trắng', 'NIKE-AM90-42-WHT', 3500000, 8, 'active'),
(1, '39', N'Đen', 'NIKE-AM90-39-BLK', 3500000, 10, 'active'),
(1, '40', N'Đen', 'NIKE-AM90-40-BLK', 3500000, 15, 'active'),
(1, '41', N'Đen', 'NIKE-AM90-41-BLK', 3500000, 12, 'active'),
-- Adidas Ultraboost 22
(2, '40', N'Đen', 'ADI-UB22-40-BLK', 4200000, 10, 'active'),
(2, '41', N'Đen', 'ADI-UB22-41-BLK', 4200000, 12, 'active'),
(2, '42', N'Đen', 'ADI-UB22-42-BLK', 4200000, 8, 'active'),
(2, '40', N'Trắng', 'ADI-UB22-40-WHT', 4200000, 10, 'active'),
(2, '41', N'Trắng', 'ADI-UB22-41-WHT', 4200000, 12, 'active'),
-- Converse Chuck Taylor
(3, '38', N'Đen', 'CON-CT-38-BLK', 1500000, 20, 'active'),
(3, '39', N'Đen', 'CON-CT-39-BLK', 1500000, 25, 'active'),
(3, '40', N'Đen', 'CON-CT-40-BLK', 1500000, 20, 'active'),
(3, '38', N'Trắng', 'CON-CT-38-WHT', 1500000, 20, 'active'),
(3, '39', N'Trắng', 'CON-CT-39-WHT', 1500000, 25, 'active'),
(3, '40', N'Trắng', 'CON-CT-40-WHT', 1500000, 20, 'active'),
-- Vans Old Skool
(4, '39', N'Đen/Trắng', 'VANS-OS-39-BW', 1800000, 15, 'active'),
(4, '40', N'Đen/Trắng', 'VANS-OS-40-BW', 1800000, 18, 'active'),
(4, '41', N'Đen/Trắng', 'VANS-OS-41-BW', 1800000, 15, 'active'),
-- Nike Air Jordan 1
(5, '40', N'Đỏ/Đen', 'NIKE-AJ1-40-RB', 4500000, 5, 'active'),
(5, '41', N'Đỏ/Đen', 'NIKE-AJ1-41-RB', 4500000, 8, 'active'),
(5, '42', N'Đỏ/Đen', 'NIKE-AJ1-42-RB', 4500000, 6, 'active'),
(5, '43', N'Đỏ/Đen', 'NIKE-AJ1-43-RB', 4500000, 4, 'active');

-- Insert Product Images
INSERT INTO ProductImages (product_id, image_url, is_primary, sort_order) VALUES
(1, '/uploads/products/nike-airmax90-1.jpg', 1, 0),
(1, '/uploads/products/nike-airmax90-2.jpg', 0, 1),
(2, '/uploads/products/adidas-ultraboost-1.jpg', 1, 0),
(2, '/uploads/products/adidas-ultraboost-2.jpg', 0, 1),
(3, '/uploads/products/converse-chuck-1.jpg', 1, 0),
(4, '/uploads/products/vans-oldskool-1.jpg', 1, 0),
(5, '/uploads/products/nike-jordan1-1.jpg', 1, 0),
(6, '/uploads/products/adidas-stansmith-1.jpg', 1, 0),
(7, '/uploads/products/newbalance-574-1.jpg', 1, 0),
(8, '/uploads/products/puma-rsx-1.jpg', 1, 0);

-- Insert Sample Promotion
INSERT INTO Promotions (code, name, description, discount_type, discount_value, min_order_amount, start_date, end_date, status) VALUES
('WELCOME10', N'Chào mừng khách hàng mới', N'Giảm 10% cho đơn hàng đầu tiên', 'percentage', 10, 500000, '2025-01-01', '2025-12-31', 'active'),
('FREESHIP', N'Miễn phí vận chuyển', N'Miễn phí vận chuyển cho đơn từ 1 triệu', 'free_shipping', 0, 1000000, '2025-01-01', '2025-12-31', 'active');

PRINT 'Database schema created successfully!';
GO
