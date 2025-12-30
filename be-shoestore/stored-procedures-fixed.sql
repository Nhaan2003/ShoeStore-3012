-- =============================================
-- FIXED STORED PROCEDURES FOR SHOE STORE
-- =============================================

USE ShoeStore;
GO

-- =============================================
-- SP: Lấy danh sách sản phẩm với bộ lọc và phân trang (FIXED)
-- =============================================
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_GetProducts')
    DROP PROCEDURE sp_GetProducts;
GO

CREATE PROCEDURE sp_GetProducts
    @Page INT = 1,
    @Limit INT = 10,
    @Search NVARCHAR(100) = NULL,
    @CategoryId INT = NULL,
    @BrandId INT = NULL,
    @Gender NVARCHAR(10) = NULL,
    @MinPrice DECIMAL(18,2) = NULL,
    @MaxPrice DECIMAL(18,2) = NULL,
    @Status NVARCHAR(20) = NULL,
    @SortBy NVARCHAR(50) = 'created_at',
    @SortOrder NVARCHAR(4) = 'DESC'
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Offset INT = (@Page - 1) * @Limit;
    DECLARE @Total INT;
    
    -- Count total
    SELECT @Total = COUNT(*)
    FROM Products p
    WHERE (@Search IS NULL OR p.product_name LIKE '%' + @Search + '%')
      AND (@CategoryId IS NULL OR p.category_id = @CategoryId)
      AND (@BrandId IS NULL OR p.brand_id = @BrandId)
      AND (@Gender IS NULL OR p.gender = @Gender)
      AND (@MinPrice IS NULL OR p.base_price >= @MinPrice)
      AND (@MaxPrice IS NULL OR p.base_price <= @MaxPrice)
      AND (@Status IS NULL OR p.status = @Status);
    
    -- Get products using CTE to avoid subquery issues
    ;WITH ProductStats AS (
        SELECT 
            pv.product_id,
            ISNULL(SUM(pv.stock_quantity), 0) as totalStock,
            MIN(ISNULL(pv.price, 0)) as minVariantPrice,
            MAX(ISNULL(pv.price, 0)) as maxVariantPrice
        FROM ProductVariants pv
        GROUP BY pv.product_id
    ),
    ProductImages_Primary AS (
        SELECT product_id, image_url
        FROM (
            SELECT product_id, image_url, ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY is_primary DESC, sort_order) as rn
            FROM ProductImages
        ) t WHERE rn = 1
    ),
    ProductReviews AS (
        SELECT 
            product_id,
            AVG(CAST(rating AS DECIMAL(3,2))) as avgRating,
            COUNT(*) as reviewCount
        FROM Reviews 
        WHERE status = 'approved'
        GROUP BY product_id
    )
    SELECT 
        p.product_id as id,
        p.product_name as name,
        p.slug,
        p.description,
        p.base_price as basePrice,
        p.gender,
        p.view_count as viewCount,
        p.sold_count as soldCount,
        p.status,
        p.created_at as createdAt,
        c.category_id as [category.id],
        c.category_name as [category.name],
        b.brand_id as [brand.id],
        b.brand_name as [brand.name],
        pi.image_url as primaryImage,
        ISNULL(ps.totalStock, 0) as totalStock,
        CASE WHEN ps.minVariantPrice > 0 THEN ps.minVariantPrice ELSE p.base_price END as minPrice,
        CASE WHEN ps.maxVariantPrice > 0 THEN ps.maxVariantPrice ELSE p.base_price END as maxPrice,
        pr.avgRating,
        ISNULL(pr.reviewCount, 0) as reviewCount,
        @Total as totalCount
    FROM Products p
    LEFT JOIN Categories c ON p.category_id = c.category_id
    LEFT JOIN Brands b ON p.brand_id = b.brand_id
    LEFT JOIN ProductStats ps ON p.product_id = ps.product_id
    LEFT JOIN ProductImages_Primary pi ON p.product_id = pi.product_id
    LEFT JOIN ProductReviews pr ON p.product_id = pr.product_id
    WHERE (@Search IS NULL OR p.product_name LIKE '%' + @Search + '%')
      AND (@CategoryId IS NULL OR p.category_id = @CategoryId)
      AND (@BrandId IS NULL OR p.brand_id = @BrandId)
      AND (@Gender IS NULL OR p.gender = @Gender)
      AND (@MinPrice IS NULL OR p.base_price >= @MinPrice)
      AND (@MaxPrice IS NULL OR p.base_price <= @MaxPrice)
      AND (@Status IS NULL OR p.status = @Status)
    ORDER BY 
        CASE WHEN @SortBy = 'created_at' AND @SortOrder = 'DESC' THEN p.created_at END DESC,
        CASE WHEN @SortBy = 'created_at' AND @SortOrder = 'ASC' THEN p.created_at END ASC,
        CASE WHEN @SortBy = 'base_price' AND @SortOrder = 'DESC' THEN p.base_price END DESC,
        CASE WHEN @SortBy = 'base_price' AND @SortOrder = 'ASC' THEN p.base_price END ASC,
        CASE WHEN @SortBy = 'sold_count' AND @SortOrder = 'DESC' THEN p.sold_count END DESC,
        CASE WHEN @SortBy = 'sold_count' AND @SortOrder = 'ASC' THEN p.sold_count END ASC,
        CASE WHEN @SortBy = 'view_count' AND @SortOrder = 'DESC' THEN p.view_count END DESC,
        p.created_at DESC
    OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;
END
GO

-- =============================================
-- SP: Lấy chi tiết sản phẩm
-- =============================================
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_GetProductDetail')
    DROP PROCEDURE sp_GetProductDetail;
GO

CREATE PROCEDURE sp_GetProductDetail
    @ProductId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Tăng view count
    UPDATE Products SET view_count = view_count + 1 WHERE product_id = @ProductId;
    
    -- Product info
    SELECT 
        p.*,
        c.category_name,
        b.brand_name,
        b.logo as brand_logo
    FROM Products p
    LEFT JOIN Categories c ON p.category_id = c.category_id
    LEFT JOIN Brands b ON p.brand_id = b.brand_id
    WHERE p.product_id = @ProductId;
    
    -- Variants
    SELECT * FROM ProductVariants WHERE product_id = @ProductId AND status = 'active';
    
    -- Images
    SELECT * FROM ProductImages WHERE product_id = @ProductId ORDER BY is_primary DESC, sort_order;
    
    -- Reviews
    SELECT TOP 10 
        r.*,
        u.full_name as user_name
    FROM Reviews r
    LEFT JOIN Users u ON r.user_id = u.user_id
    WHERE r.product_id = @ProductId AND r.status = 'approved'
    ORDER BY r.created_at DESC;
END
GO

-- =============================================
-- SP: Lấy giỏ hàng chi tiết
-- =============================================
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_GetCartDetails')
    DROP PROCEDURE sp_GetCartDetails;
GO

CREATE PROCEDURE sp_GetCartDetails
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    ;WITH ProductImages_Primary AS (
        SELECT product_id, image_url
        FROM (
            SELECT product_id, image_url, ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY is_primary DESC, sort_order) as rn
            FROM ProductImages
        ) t WHERE rn = 1
    )
    SELECT 
        ci.cart_item_id as cartItemId,
        ci.quantity,
        pv.variant_id as variantId,
        pv.size,
        pv.color,
        pv.stock_quantity as stock,
        ISNULL(pv.price, p.base_price) as price,
        p.product_id as productId,
        p.product_name as productName,
        p.status as productStatus,
        pi.image_url as productImage,
        CASE WHEN pv.stock_quantity >= ci.quantity AND p.status = 'active' AND pv.status = 'active' THEN 1 ELSE 0 END as isAvailable
    FROM Carts c
    INNER JOIN CartItems ci ON c.cart_id = ci.cart_id
    INNER JOIN ProductVariants pv ON ci.variant_id = pv.variant_id
    INNER JOIN Products p ON pv.product_id = p.product_id
    LEFT JOIN ProductImages_Primary pi ON p.product_id = pi.product_id
    WHERE c.user_id = @UserId;
END
GO

-- =============================================
-- SP: Tạo đơn hàng mới (FIXED - removed LEAST function)
-- =============================================
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_CreateOrder')
    DROP PROCEDURE sp_CreateOrder;
GO

CREATE PROCEDURE sp_CreateOrder
    @UserId INT,
    @ShippingName NVARCHAR(100),
    @ShippingPhone NVARCHAR(20),
    @ShippingAddress NVARCHAR(500),
    @PaymentMethod NVARCHAR(20) = 'COD',
    @PromotionCode NVARCHAR(50) = NULL,
    @Notes NVARCHAR(500) = NULL,
    @OrderId INT OUTPUT,
    @OrderCode NVARCHAR(20) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Generate order code
        EXEC sp_GenerateOrderCode @OrderCode OUTPUT;
        
        DECLARE @TotalAmount DECIMAL(18,2) = 0;
        DECLARE @ShippingFee DECIMAL(18,2) = 30000;
        DECLARE @DiscountAmount DECIMAL(18,2) = 0;
        DECLARE @PromotionId INT = NULL;
        DECLARE @DiscountType NVARCHAR(20);
        DECLARE @DiscountValue DECIMAL(18,2);
        DECLARE @MaxDiscount DECIMAL(18,2);
        DECLARE @CalculatedDiscount DECIMAL(18,2);
        
        -- Tính tổng tiền từ giỏ hàng
        SELECT @TotalAmount = SUM(ci.quantity * ISNULL(pv.price, p.base_price))
        FROM Carts c
        INNER JOIN CartItems ci ON c.cart_id = ci.cart_id
        INNER JOIN ProductVariants pv ON ci.variant_id = pv.variant_id
        INNER JOIN Products p ON pv.product_id = p.product_id
        WHERE c.user_id = @UserId;
        
        -- Kiểm tra và áp dụng mã khuyến mãi
        IF @PromotionCode IS NOT NULL
        BEGIN
            SELECT 
                @PromotionId = promotion_id,
                @DiscountType = discount_type,
                @DiscountValue = discount_value,
                @MaxDiscount = max_discount_amount
            FROM Promotions
            WHERE code = @PromotionCode 
              AND status = 'active'
              AND GETDATE() BETWEEN start_date AND end_date
              AND (usage_limit IS NULL OR used_count < usage_limit)
              AND @TotalAmount >= min_order_amount;
            
            IF @PromotionId IS NOT NULL
            BEGIN
                -- Calculate discount based on type
                IF @DiscountType = 'percentage'
                BEGIN
                    SET @CalculatedDiscount = @TotalAmount * @DiscountValue / 100;
                    IF @MaxDiscount IS NOT NULL AND @CalculatedDiscount > @MaxDiscount
                        SET @DiscountAmount = @MaxDiscount;
                    ELSE
                        SET @DiscountAmount = @CalculatedDiscount;
                END
                ELSE IF @DiscountType = 'fixed_amount'
                BEGIN
                    SET @DiscountAmount = @DiscountValue;
                END
                ELSE IF @DiscountType = 'free_shipping'
                BEGIN
                    SET @ShippingFee = 0;
                END
                
                -- Cập nhật số lần sử dụng
                UPDATE Promotions SET used_count = used_count + 1 WHERE promotion_id = @PromotionId;
            END
        END
        
        -- Miễn phí ship cho đơn >= 1 triệu
        IF @TotalAmount >= 1000000 SET @ShippingFee = 0;
        
        -- Tạo đơn hàng
        INSERT INTO Orders (
            order_code, user_id, shipping_name, shipping_phone, shipping_address,
            total_amount, shipping_fee, discount_amount, final_amount,
            promotion_id, promotion_code, payment_method, notes
        )
        VALUES (
            @OrderCode, @UserId, @ShippingName, @ShippingPhone, @ShippingAddress,
            @TotalAmount, @ShippingFee, @DiscountAmount, @TotalAmount - @DiscountAmount + @ShippingFee,
            @PromotionId, @PromotionCode, @PaymentMethod, @Notes
        );
        
        SET @OrderId = SCOPE_IDENTITY();
        
        -- Tạo chi tiết đơn hàng từ giỏ hàng
        ;WITH ProductImages_Primary AS (
            SELECT product_id, image_url
            FROM (
                SELECT product_id, image_url, ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY is_primary DESC, sort_order) as rn
                FROM ProductImages
            ) t WHERE rn = 1
        )
        INSERT INTO OrderItems (order_id, variant_id, product_name, size, color, quantity, unit_price, subtotal, product_image)
        SELECT 
            @OrderId,
            pv.variant_id,
            p.product_name,
            pv.size,
            pv.color,
            ci.quantity,
            ISNULL(pv.price, p.base_price),
            ci.quantity * ISNULL(pv.price, p.base_price),
            pi.image_url
        FROM Carts c
        INNER JOIN CartItems ci ON c.cart_id = ci.cart_id
        INNER JOIN ProductVariants pv ON ci.variant_id = pv.variant_id
        INNER JOIN Products p ON pv.product_id = p.product_id
        LEFT JOIN ProductImages_Primary pi ON p.product_id = pi.product_id
        WHERE c.user_id = @UserId;
        
        -- Cập nhật tồn kho
        EXEC sp_UpdateStockOnOrder @OrderId;
        
        -- Xóa giỏ hàng
        DELETE ci FROM CartItems ci
        INNER JOIN Carts c ON ci.cart_id = c.cart_id
        WHERE c.user_id = @UserId;
        
        -- Ghi lịch sử trạng thái
        INSERT INTO OrderStatusHistory (order_id, status, note)
        VALUES (@OrderId, 'pending', N'Đơn hàng được tạo');
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- =============================================
-- SP: Lấy doanh thu theo thời gian (cho biểu đồ)
-- =============================================
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_GetRevenueStats')
    DROP PROCEDURE sp_GetRevenueStats;
GO

CREATE PROCEDURE sp_GetRevenueStats
    @Period NVARCHAR(20) = 'week' -- week, month, year
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @Period = 'week'
    BEGIN
        SELECT 
            CONVERT(DATE, created_at) as date,
            FORMAT(created_at, 'dd/MM') as label,
            SUM(final_amount) as revenue,
            COUNT(*) as orders
        FROM Orders
        WHERE created_at >= DATEADD(DAY, -7, GETDATE())
          AND status NOT IN ('cancelled', 'returned')
        GROUP BY CONVERT(DATE, created_at), FORMAT(created_at, 'dd/MM')
        ORDER BY date;
    END
    ELSE IF @Period = 'month'
    BEGIN
        SELECT 
            CONVERT(DATE, created_at) as date,
            FORMAT(created_at, 'dd/MM') as label,
            SUM(final_amount) as revenue,
            COUNT(*) as orders
        FROM Orders
        WHERE created_at >= DATEADD(DAY, -30, GETDATE())
          AND status NOT IN ('cancelled', 'returned')
        GROUP BY CONVERT(DATE, created_at), FORMAT(created_at, 'dd/MM')
        ORDER BY date;
    END
    ELSE -- year
    BEGIN
        SELECT 
            MONTH(created_at) as month,
            FORMAT(created_at, 'MM/yyyy') as label,
            SUM(final_amount) as revenue,
            COUNT(*) as orders
        FROM Orders
        WHERE YEAR(created_at) = YEAR(GETDATE())
          AND status NOT IN ('cancelled', 'returned')
        GROUP BY MONTH(created_at), FORMAT(created_at, 'MM/yyyy')
        ORDER BY month;
    END
END
GO

-- =============================================
-- SP: Lấy top sản phẩm bán chạy (FIXED)
-- =============================================
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_GetTopProducts')
    DROP PROCEDURE sp_GetTopProducts;
GO

CREATE PROCEDURE sp_GetTopProducts
    @Limit INT = 10,
    @Days INT = 30
AS
BEGIN
    SET NOCOUNT ON;
    
    ;WITH ProductImages_Primary AS (
        SELECT product_id, image_url
        FROM (
            SELECT product_id, image_url, ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY is_primary DESC, sort_order) as rn
            FROM ProductImages
        ) t WHERE rn = 1
    )
    SELECT TOP (@Limit)
        p.product_id as id,
        p.product_name as name,
        p.sold_count as soldCount,
        ISNULL(SUM(oi.subtotal), 0) as revenue,
        pi.image_url as image
    FROM Products p
    LEFT JOIN ProductVariants pv ON p.product_id = pv.product_id
    LEFT JOIN OrderItems oi ON pv.variant_id = oi.variant_id
    LEFT JOIN Orders o ON oi.order_id = o.order_id AND o.created_at >= DATEADD(DAY, -@Days, GETDATE()) AND o.status NOT IN ('cancelled', 'returned')
    LEFT JOIN ProductImages_Primary pi ON p.product_id = pi.product_id
    GROUP BY p.product_id, p.product_name, p.sold_count, pi.image_url
    ORDER BY p.sold_count DESC;
END
GO

-- =============================================
-- SP: Lấy sản phẩm sắp hết hàng
-- =============================================
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_GetLowStockProducts')
    DROP PROCEDURE sp_GetLowStockProducts;
GO

CREATE PROCEDURE sp_GetLowStockProducts
    @Threshold INT = 10,
    @Limit INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP (@Limit)
        p.product_id as productId,
        p.product_name as productName,
        pv.variant_id as variantId,
        pv.size,
        pv.color,
        pv.stock_quantity as stock
    FROM ProductVariants pv
    INNER JOIN Products p ON pv.product_id = p.product_id
    WHERE pv.stock_quantity <= @Threshold
      AND pv.status = 'active'
      AND p.status = 'active'
    ORDER BY pv.stock_quantity ASC;
END
GO

-- =============================================
-- SP: Tìm kiếm tổng hợp
-- =============================================
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_SearchAll')
    DROP PROCEDURE sp_SearchAll;
GO

CREATE PROCEDURE sp_SearchAll
    @Keyword NVARCHAR(100),
    @Limit INT = 5
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Products
    SELECT TOP (@Limit) 'product' as type, product_id as id, product_name as name
    FROM Products WHERE product_name LIKE '%' + @Keyword + '%' AND status = 'active';
    
    -- Categories
    SELECT TOP (@Limit) 'category' as type, category_id as id, category_name as name
    FROM Categories WHERE category_name LIKE '%' + @Keyword + '%' AND status = 'active';
    
    -- Brands
    SELECT TOP (@Limit) 'brand' as type, brand_id as id, brand_name as name
    FROM Brands WHERE brand_name LIKE '%' + @Keyword + '%' AND status = 'active';
END
GO

PRINT 'All stored procedures created successfully!';
GO