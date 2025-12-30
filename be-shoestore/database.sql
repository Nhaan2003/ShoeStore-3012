-- =============================================
-- SHOE STORE DATABASE SCHEMA
-- SQL Server 2019+
-- =============================================

-- Tạo Database
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'ShoeStore')
BEGIN
    CREATE DATABASE ShoeStore;
END
GO

USE ShoeStore;
GO

-- =============================================
-- BẢNG USERS - Người dùng
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    CREATE TABLE Users (
        user_id INT IDENTITY(1,1) PRIMARY KEY,
        email NVARCHAR(255) NOT NULL UNIQUE,
        password_hash NVARCHAR(255) NOT NULL,
        full_name NVARCHAR(100) NOT NULL,
        phone NVARCHAR(20),
        avatar NVARCHAR(500),
        address NVARCHAR(500),
        date_of_birth DATE,
        gender NVARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
        role NVARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'staff', 'admin')),
        status NVARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'locked')),
        refresh_token NVARCHAR(500),
        permissions NVARCHAR(MAX), -- JSON array for staff permissions
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
    );
    
    CREATE INDEX IX_Users_Email ON Users(email);
    CREATE INDEX IX_Users_Role ON Users(role);
    CREATE INDEX IX_Users_Status ON Users(status);
END
GO

-- =============================================
-- BẢNG CATEGORIES - Danh mục sản phẩm
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Categories')
BEGIN
    CREATE TABLE Categories (
        category_id INT IDENTITY(1,1) PRIMARY KEY,
        category_name NVARCHAR(100) NOT NULL,
        slug NVARCHAR(100),
        description NVARCHAR(500),
        image NVARCHAR(500),
        parent_id INT NULL REFERENCES Categories(category_id),
        status NVARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        sort_order INT DEFAULT 0,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
    );
    
    CREATE INDEX IX_Categories_ParentId ON Categories(parent_id);
    CREATE INDEX IX_Categories_Status ON Categories(status);
END
GO

-- =============================================
-- BẢNG BRANDS - Thương hiệu
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Brands')
BEGIN
    CREATE TABLE Brands (
        brand_id INT IDENTITY(1,1) PRIMARY KEY,
        brand_name NVARCHAR(100) NOT NULL UNIQUE,
        slug NVARCHAR(100),
        logo NVARCHAR(500),
        description NVARCHAR(1000),
        website NVARCHAR(255),
        status NVARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
    );
    
    CREATE INDEX IX_Brands_Status ON Brands(status);
END
GO

-- =============================================
-- BẢNG PRODUCTS - Sản phẩm
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Products')
BEGIN
    CREATE TABLE Products (
        product_id INT IDENTITY(1,1) PRIMARY KEY,
        product_name NVARCHAR(255) NOT NULL,
        slug NVARCHAR(255),
        description NVARCHAR(MAX),
        base_price DECIMAL(18,2) NOT NULL,
        category_id INT NOT NULL REFERENCES Categories(category_id),
        brand_id INT NOT NULL REFERENCES Brands(brand_id),
        gender NVARCHAR(10) DEFAULT 'unisex' CHECK (gender IN ('male', 'female', 'unisex')),
        material NVARCHAR(100),
        origin NVARCHAR(100),
        warranty NVARCHAR(100),
        view_count INT DEFAULT 0,
        sold_count INT DEFAULT 0,
        status NVARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'out_of_stock')),
        is_featured BIT DEFAULT 0,
        created_by INT REFERENCES Users(user_id),
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
    );
    
    CREATE INDEX IX_Products_CategoryId ON Products(category_id);
    CREATE INDEX IX_Products_BrandId ON Products(brand_id);
    CREATE INDEX IX_Products_Status ON Products(status);
    CREATE INDEX IX_Products_Gender ON Products(gender);
    CREATE INDEX IX_Products_BasePrice ON Products(base_price);
END
GO

-- =============================================
-- BẢNG PRODUCT_VARIANTS - Biến thể sản phẩm (Size, Màu)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ProductVariants')
BEGIN
    CREATE TABLE ProductVariants (
        variant_id INT IDENTITY(1,1) PRIMARY KEY,
        product_id INT NOT NULL REFERENCES Products(product_id) ON DELETE CASCADE,
        sku NVARCHAR(50) UNIQUE,
        size NVARCHAR(20) NOT NULL,
        color NVARCHAR(50) NOT NULL,
        color_code NVARCHAR(20), -- Hex color code
        price DECIMAL(18,2), -- Giá riêng (nếu khác giá gốc)
        stock_quantity INT DEFAULT 0,
        status NVARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        
        CONSTRAINT UQ_ProductVariant UNIQUE (product_id, size, color)
    );
    
    CREATE INDEX IX_ProductVariants_ProductId ON ProductVariants(product_id);
    CREATE INDEX IX_ProductVariants_Size ON ProductVariants(size);
    CREATE INDEX IX_ProductVariants_Color ON ProductVariants(color);
    CREATE INDEX IX_ProductVariants_Stock ON ProductVariants(stock_quantity);
END
GO

-- =============================================
-- BẢNG PRODUCT_IMAGES - Hình ảnh sản phẩm
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ProductImages')
BEGIN
    CREATE TABLE ProductImages (
        image_id INT IDENTITY(1,1) PRIMARY KEY,
        product_id INT NOT NULL REFERENCES Products(product_id) ON DELETE CASCADE,
        image_url NVARCHAR(500) NOT NULL,
        alt_text NVARCHAR(255),
        is_primary BIT DEFAULT 0,
        color NVARCHAR(50), -- Liên kết với màu cụ thể
        sort_order INT DEFAULT 0,
        created_at DATETIME DEFAULT GETDATE()
    );
    
    CREATE INDEX IX_ProductImages_ProductId ON ProductImages(product_id);
END
GO

-- =============================================
-- BẢNG CARTS - Giỏ hàng
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Carts')
BEGIN
    CREATE TABLE Carts (
        cart_id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL UNIQUE REFERENCES Users(user_id) ON DELETE CASCADE,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
    );
    
    CREATE INDEX IX_Carts_UserId ON Carts(user_id);
END
GO

-- =============================================
-- BẢNG CART_ITEMS - Chi tiết giỏ hàng
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CartItems')
BEGIN
    CREATE TABLE CartItems (
        cart_item_id INT IDENTITY(1,1) PRIMARY KEY,
        cart_id INT NOT NULL REFERENCES Carts(cart_id) ON DELETE CASCADE,
        variant_id INT NOT NULL REFERENCES ProductVariants(variant_id),
        quantity INT NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        
        CONSTRAINT UQ_CartItem UNIQUE (cart_id, variant_id)
    );
    
    CREATE INDEX IX_CartItems_CartId ON CartItems(cart_id);
END
GO

-- =============================================
-- BẢNG PROMOTIONS - Khuyến mãi
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Promotions')
BEGIN
    CREATE TABLE Promotions (
        promotion_id INT IDENTITY(1,1) PRIMARY KEY,
        code NVARCHAR(50) NOT NULL UNIQUE,
        name NVARCHAR(100) NOT NULL,
        description NVARCHAR(500),
        discount_type NVARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount', 'free_shipping')),
        discount_value DECIMAL(18,2) NOT NULL,
        min_order_amount DECIMAL(18,2) DEFAULT 0,
        max_discount_amount DECIMAL(18,2),
        usage_limit INT, -- Số lần sử dụng tối đa
        used_count INT DEFAULT 0,
        start_date DATETIME NOT NULL,
        end_date DATETIME NOT NULL,
        status NVARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        created_by INT REFERENCES Users(user_id),
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
    );
    
    CREATE INDEX IX_Promotions_Code ON Promotions(code);
    CREATE INDEX IX_Promotions_Status ON Promotions(status);
    CREATE INDEX IX_Promotions_Dates ON Promotions(start_date, end_date);
END
GO

-- =============================================
-- BẢNG ORDERS - Đơn hàng
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Orders')
BEGIN
    CREATE TABLE Orders (
        order_id INT IDENTITY(1,1) PRIMARY KEY,
        order_code NVARCHAR(20) NOT NULL UNIQUE,
        user_id INT NOT NULL REFERENCES Users(user_id),
        
        -- Thông tin giao hàng
        shipping_name NVARCHAR(100) NOT NULL,
        shipping_phone NVARCHAR(20) NOT NULL,
        shipping_address NVARCHAR(500) NOT NULL,
        shipping_city NVARCHAR(100),
        shipping_district NVARCHAR(100),
        shipping_ward NVARCHAR(100),
        
        -- Thông tin thanh toán
        total_amount DECIMAL(18,2) NOT NULL, -- Tổng tiền hàng
        shipping_fee DECIMAL(18,2) DEFAULT 0,
        discount_amount DECIMAL(18,2) DEFAULT 0,
        final_amount DECIMAL(18,2) NOT NULL, -- Tổng thanh toán
        
        promotion_id INT REFERENCES Promotions(promotion_id),
        promotion_code NVARCHAR(50),
        
        payment_method NVARCHAR(20) DEFAULT 'COD' CHECK (payment_method IN ('COD', 'BANK_TRANSFER', 'VNPAY', 'MOMO')),
        payment_status NVARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
        
        status NVARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned')),
        
        notes NVARCHAR(500),
        cancel_reason NVARCHAR(500),
        
        confirmed_at DATETIME,
        shipped_at DATETIME,
        delivered_at DATETIME,
        cancelled_at DATETIME,
        
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
    );
    
    CREATE INDEX IX_Orders_UserId ON Orders(user_id);
    CREATE INDEX IX_Orders_Status ON Orders(status);
    CREATE INDEX IX_Orders_OrderCode ON Orders(order_code);
    CREATE INDEX IX_Orders_CreatedAt ON Orders(created_at);
END
GO

-- =============================================
-- BẢNG ORDER_ITEMS - Chi tiết đơn hàng
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'OrderItems')
BEGIN
    CREATE TABLE OrderItems (
        order_item_id INT IDENTITY(1,1) PRIMARY KEY,
        order_id INT NOT NULL REFERENCES Orders(order_id) ON DELETE CASCADE,
        variant_id INT NOT NULL REFERENCES ProductVariants(variant_id),
        product_name NVARCHAR(255) NOT NULL, -- Snapshot tên sản phẩm
        size NVARCHAR(20) NOT NULL,
        color NVARCHAR(50) NOT NULL,
        quantity INT NOT NULL,
        unit_price DECIMAL(18,2) NOT NULL,
        subtotal DECIMAL(18,2) NOT NULL,
        product_image NVARCHAR(500)
    );
    
    CREATE INDEX IX_OrderItems_OrderId ON OrderItems(order_id);
END
GO

-- =============================================
-- BẢNG REVIEWS - Đánh giá sản phẩm
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Reviews')
BEGIN
    CREATE TABLE Reviews (
        review_id INT IDENTITY(1,1) PRIMARY KEY,
        product_id INT NOT NULL REFERENCES Products(product_id),
        user_id INT NOT NULL REFERENCES Users(user_id),
        order_id INT NOT NULL REFERENCES Orders(order_id),
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment NVARCHAR(1000),
        images NVARCHAR(MAX), -- JSON array of image URLs
        status NVARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        admin_reply NVARCHAR(1000),
        replied_at DATETIME,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        
        CONSTRAINT UQ_Review UNIQUE (product_id, user_id, order_id)
    );
    
    CREATE INDEX IX_Reviews_ProductId ON Reviews(product_id);
    CREATE INDEX IX_Reviews_UserId ON Reviews(user_id);
    CREATE INDEX IX_Reviews_Status ON Reviews(status);
END
GO

-- =============================================
-- BẢNG NOTIFICATIONS - Thông báo
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Notifications')
BEGIN
    CREATE TABLE Notifications (
        notification_id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
        title NVARCHAR(200) NOT NULL,
        message NVARCHAR(500) NOT NULL,
        type NVARCHAR(50) DEFAULT 'system' CHECK (type IN ('system', 'order', 'promotion', 'review')),
        reference_id INT, -- ID liên quan (order_id, promotion_id, etc.)
        is_read BIT DEFAULT 0,
        created_at DATETIME DEFAULT GETDATE()
    );
    
    CREATE INDEX IX_Notifications_UserId ON Notifications(user_id);
    CREATE INDEX IX_Notifications_IsRead ON Notifications(is_read);
END
GO

-- =============================================
-- BẢNG ORDER_STATUS_HISTORY - Lịch sử trạng thái đơn hàng
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'OrderStatusHistory')
BEGIN
    CREATE TABLE OrderStatusHistory (
        history_id INT IDENTITY(1,1) PRIMARY KEY,
        order_id INT NOT NULL REFERENCES Orders(order_id) ON DELETE CASCADE,
        status NVARCHAR(20) NOT NULL,
        note NVARCHAR(500),
        changed_by INT REFERENCES Users(user_id),
        created_at DATETIME DEFAULT GETDATE()
    );
    
    CREATE INDEX IX_OrderStatusHistory_OrderId ON OrderStatusHistory(order_id);
END
GO

-- =============================================
-- STORED PROCEDURES
-- =============================================

-- SP: Tạo mã đơn hàng
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_GenerateOrderCode')
    DROP PROCEDURE sp_GenerateOrderCode;
GO

CREATE PROCEDURE sp_GenerateOrderCode
    @OrderCode NVARCHAR(20) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @DatePart NVARCHAR(8) = FORMAT(GETDATE(), 'yyyyMMdd');
    DECLARE @Sequence INT;
    
    -- Lấy số thứ tự trong ngày
    SELECT @Sequence = ISNULL(MAX(CAST(RIGHT(order_code, 4) AS INT)), 0) + 1
    FROM Orders
    WHERE order_code LIKE 'ORD' + @DatePart + '%';
    
    SET @OrderCode = 'ORD' + @DatePart + RIGHT('0000' + CAST(@Sequence AS NVARCHAR), 4);
END
GO

-- SP: Cập nhật tồn kho khi đặt hàng
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_UpdateStockOnOrder')
    DROP PROCEDURE sp_UpdateStockOnOrder;
GO

CREATE PROCEDURE sp_UpdateStockOnOrder
    @OrderId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Giảm tồn kho
        UPDATE pv
        SET pv.stock_quantity = pv.stock_quantity - oi.quantity,
            pv.updated_at = GETDATE()
        FROM ProductVariants pv
        INNER JOIN OrderItems oi ON pv.variant_id = oi.variant_id
        WHERE oi.order_id = @OrderId;
        
        -- Tăng số lượng đã bán của sản phẩm
        UPDATE p
        SET p.sold_count = p.sold_count + sub.total_qty,
            p.updated_at = GETDATE()
        FROM Products p
        INNER JOIN (
            SELECT pv.product_id, SUM(oi.quantity) as total_qty
            FROM OrderItems oi
            INNER JOIN ProductVariants pv ON oi.variant_id = pv.variant_id
            WHERE oi.order_id = @OrderId
            GROUP BY pv.product_id
        ) sub ON p.product_id = sub.product_id;
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- SP: Khôi phục tồn kho khi hủy đơn hàng
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_RestoreStockOnCancel')
    DROP PROCEDURE sp_RestoreStockOnCancel;
GO

CREATE PROCEDURE sp_RestoreStockOnCancel
    @OrderId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Khôi phục tồn kho
        UPDATE pv
        SET pv.stock_quantity = pv.stock_quantity + oi.quantity,
            pv.updated_at = GETDATE()
        FROM ProductVariants pv
        INNER JOIN OrderItems oi ON pv.variant_id = oi.variant_id
        WHERE oi.order_id = @OrderId;
        
        -- Giảm số lượng đã bán
        UPDATE p
        SET p.sold_count = p.sold_count - sub.total_qty,
            p.updated_at = GETDATE()
        FROM Products p
        INNER JOIN (
            SELECT pv.product_id, SUM(oi.quantity) as total_qty
            FROM OrderItems oi
            INNER JOIN ProductVariants pv ON oi.variant_id = pv.variant_id
            WHERE oi.order_id = @OrderId
            GROUP BY pv.product_id
        ) sub ON p.product_id = sub.product_id;
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- SP: Lấy thống kê dashboard
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_GetDashboardStats')
    DROP PROCEDURE sp_GetDashboardStats;
GO

CREATE PROCEDURE sp_GetDashboardStats
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Thống kê hôm nay
    SELECT 
        ISNULL(SUM(CASE WHEN CAST(created_at AS DATE) = CAST(GETDATE() AS DATE) AND status NOT IN ('cancelled', 'returned') THEN final_amount ELSE 0 END), 0) as today_revenue,
        COUNT(CASE WHEN CAST(created_at AS DATE) = CAST(GETDATE() AS DATE) THEN 1 END) as today_orders,
        
        -- Thống kê đơn hàng theo trạng thái
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_orders,
        COUNT(CASE WHEN status = 'shipped' THEN 1 END) as shipped_orders,
        
        -- Thống kê tháng này
        ISNULL(SUM(CASE WHEN MONTH(created_at) = MONTH(GETDATE()) AND YEAR(created_at) = YEAR(GETDATE()) AND status = 'delivered' THEN final_amount ELSE 0 END), 0) as month_revenue,
        COUNT(CASE WHEN MONTH(created_at) = MONTH(GETDATE()) AND YEAR(created_at) = YEAR(GETDATE()) AND status = 'delivered' THEN 1 END) as month_delivered_orders
    FROM Orders;
    
    -- Thống kê khách hàng và sản phẩm
    SELECT 
        (SELECT COUNT(*) FROM Users WHERE role = 'customer' AND status = 'active') as total_customers,
        (SELECT COUNT(*) FROM Products WHERE status = 'active') as total_products,
        (SELECT ISNULL(SUM(stock_quantity), 0) FROM ProductVariants WHERE status = 'active') as total_stock,
        (SELECT COUNT(*) FROM ProductVariants WHERE stock_quantity <= 10 AND status = 'active') as low_stock_count;
END
GO

-- SP: Tính rating trung bình sản phẩm
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_UpdateProductRating')
    DROP PROCEDURE sp_UpdateProductRating;
GO

CREATE PROCEDURE sp_UpdateProductRating
    @ProductId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Có thể thêm cột avg_rating vào bảng Products nếu cần cache
    -- UPDATE Products 
    -- SET avg_rating = (SELECT AVG(CAST(rating AS DECIMAL(3,2))) FROM Reviews WHERE product_id = @ProductId AND status = 'approved')
    -- WHERE product_id = @ProductId;
    
    SELECT 
        AVG(CAST(rating AS DECIMAL(3,2))) as avg_rating,
        COUNT(*) as total_reviews
    FROM Reviews 
    WHERE product_id = @ProductId AND status = 'approved';
END
GO

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger: Tự động tạo cart khi tạo user customer
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_CreateCartForNewUser')
    DROP TRIGGER trg_CreateCartForNewUser;
GO

CREATE TRIGGER trg_CreateCartForNewUser
ON Users
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO Carts (user_id)
    SELECT user_id FROM inserted WHERE role = 'customer';
END
GO

-- Trigger: Cập nhật thời gian updated_at
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_UpdateTimestamp_Users')
    DROP TRIGGER trg_UpdateTimestamp_Users;
GO

CREATE TRIGGER trg_UpdateTimestamp_Users
ON Users
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Users SET updated_at = GETDATE() 
    WHERE user_id IN (SELECT user_id FROM inserted);
END
GO

-- =============================================
-- DỮ LIỆU MẪU (SEED DATA)
-- =============================================

-- Tạo Admin mặc định (password: admin123)
IF NOT EXISTS (SELECT * FROM Users WHERE email = 'admin@shoesshop.com')
BEGIN
    INSERT INTO Users (email, password_hash, full_name, role, status)
    VALUES ('admin@shoesshop.com', '$2a$10$rQHC3O8P1kR7YT5W9Z6qLuJ8mN4pQvXsYbKfTgHjIcM2NlOaWdEvy', N'Administrator', 'admin', 'active');
END

-- Tạo danh mục mẫu
IF NOT EXISTS (SELECT * FROM Categories WHERE category_name = N'Giày thể thao')
BEGIN
    INSERT INTO Categories (category_name, slug, description) VALUES 
    (N'Giày thể thao', 'giay-the-thao', N'Giày thể thao các loại'),
    (N'Giày chạy bộ', 'giay-chay-bo', N'Giày chạy bộ chuyên dụng'),
    (N'Giày đá bóng', 'giay-da-bong', N'Giày đá bóng sân cỏ'),
    (N'Giày casual', 'giay-casual', N'Giày đi hàng ngày'),
    (N'Sandal & Dép', 'sandal-dep', N'Sandal và dép các loại');
END

-- Tạo thương hiệu mẫu
IF NOT EXISTS (SELECT * FROM Brands WHERE brand_name = 'Nike')
BEGIN
    INSERT INTO Brands (brand_name, slug, description) VALUES 
    ('Nike', 'nike', N'Thương hiệu thể thao hàng đầu thế giới'),
    ('Adidas', 'adidas', N'Thương hiệu thể thao Đức'),
    ('Puma', 'puma', N'Thương hiệu thể thao toàn cầu'),
    ('New Balance', 'new-balance', N'Thương hiệu giày chạy bộ'),
    ('Converse', 'converse', N'Thương hiệu giày classic'),
    ('Vans', 'vans', N'Thương hiệu giày skateboard');
END

-- Tạo khuyến mãi mẫu
IF NOT EXISTS (SELECT * FROM Promotions WHERE code = 'WELCOME10')
BEGIN
    INSERT INTO Promotions (code, name, description, discount_type, discount_value, min_order_amount, start_date, end_date) VALUES 
    ('WELCOME10', N'Chào mừng khách mới', N'Giảm 10% cho đơn hàng đầu tiên', 'percentage', 10, 500000, GETDATE(), DATEADD(YEAR, 1, GETDATE())),
    ('FREESHIP', N'Miễn phí vận chuyển', N'Miễn phí vận chuyển cho đơn từ 1 triệu', 'free_shipping', 0, 1000000, GETDATE(), DATEADD(YEAR, 1, GETDATE())),
    ('SALE20', N'Giảm 20%', N'Giảm 20% tối đa 200K', 'percentage', 20, 1000000, GETDATE(), DATEADD(MONTH, 3, GETDATE()));
END

PRINT 'Database ShoeStore created successfully!';
GO
