-- SP: Lấy danh sách sản phẩm với filter
CREATE PROCEDURE sp_GetProducts
    @CategoryId INT = NULL,
    @BrandId INT = NULL,
    @MinPrice DECIMAL(10,2) = NULL,
    @MaxPrice DECIMAL(10,2) = NULL,
    @Gender VARCHAR(20) = NULL,
    @SearchTerm NVARCHAR(255) = NULL,
    @PageNumber INT = 1,
    @PageSize INT = 12,
    @SortBy VARCHAR(50) = 'created_at',
    @SortOrder VARCHAR(4) = 'DESC'
AS
BEGIN
    WITH ProductCTE AS (
        SELECT 
            p.id,
            p.name,
            p.slug,
            p.base_price,
            p.sale_price,
            p.category_id,
            p.brand_id,
            p.gender,
            p.status,
            p.featured,
            p.rating_average,
            p.rating_count,
            c.name as category_name,
            b.name as brand_name,
            (SELECT TOP 1 image_url FROM ProductImages WHERE product_id = p.id AND is_primary = 1) as primary_image,
            ROW_NUMBER() OVER (
                ORDER BY 
                    CASE WHEN @SortBy = 'price' AND @SortOrder = 'ASC' THEN COALESCE(p.sale_price, p.base_price) END ASC,
                    CASE WHEN @SortBy = 'price' AND @SortOrder = 'DESC' THEN COALESCE(p.sale_price, p.base_price) END DESC,
                    CASE WHEN @SortBy = 'name' AND @SortOrder = 'ASC' THEN p.name END ASC,
                    CASE WHEN @SortBy = 'name' AND @SortOrder = 'DESC' THEN p.name END DESC,
                    CASE WHEN @SortBy = 'created_at' AND @SortOrder = 'DESC' THEN p.created_at END DESC,
                    CASE WHEN @SortBy = 'created_at' AND @SortOrder = 'ASC' THEN p.created_at END ASC
            ) AS RowNum
        FROM Products p
        INNER JOIN Categories c ON p.category_id = c.id
        INNER JOIN Brands b ON p.brand_id = b.id
        WHERE p.status = 'active'
            AND (@CategoryId IS NULL OR p.category_id = @CategoryId)
            AND (@BrandId IS NULL OR p.brand_id = @BrandId)
            AND (@MinPrice IS NULL OR COALESCE(p.sale_price, p.base_price) >= @MinPrice)
            AND (@MaxPrice IS NULL OR COALESCE(p.sale_price, p.base_price) <= @MaxPrice)
            AND (@Gender IS NULL OR p.gender = @Gender)
            AND (@SearchTerm IS NULL OR p.name LIKE '%' + @SearchTerm + '%')
    )
    SELECT 
        *,
        (SELECT COUNT(*) FROM ProductCTE) as TotalCount
    FROM ProductCTE
    WHERE RowNum BETWEEN ((@PageNumber - 1) * @PageSize + 1) AND (@PageNumber * @PageSize)
END;
GO

-- SP: Lấy chi tiết sản phẩm
CREATE PROCEDURE sp_GetProductDetail
    @ProductId INT
AS
BEGIN
    -- Lấy thông tin sản phẩm
    SELECT 
        p.*,
        c.name as category_name,
        b.name as brand_name
    FROM Products p
    INNER JOIN Categories c ON p.category_id = c.id
    INNER JOIN Brands b ON p.brand_id = b.id
    WHERE p.id = @ProductId;

    -- Lấy hình ảnh
    SELECT * FROM ProductImages 
    WHERE product_id = @ProductId 
    ORDER BY display_order;

    -- Lấy variants
    SELECT 
        pv.*,
        c.name as color_name,
        c.hex_value as color_hex,
        s.name as size_name
    FROM ProductVariants pv
    INNER JOIN Colors c ON pv.color_id = c.id
    INNER JOIN Sizes s ON pv.size_id = s.id
    WHERE pv.product_id = @ProductId
    ORDER BY s.display_order, c.name;

    -- Lấy variant images
    SELECT 
        vi.*,
        c.name as color_name
    FROM VariantImages vi
    INNER JOIN Colors c ON vi.color_id = c.id
    WHERE vi.product_id = @ProductId
    ORDER BY vi.display_order;

    -- Lấy reviews
    SELECT TOP 5
        r.*,
        u.full_name as user_name,
        u.avatar as user_avatar
    FROM Reviews r
    INNER JOIN Users u ON r.user_id = u.id
    WHERE r.product_id = @ProductId AND r.status = 'approved'
    ORDER BY r.created_at DESC;
END;
GO

-- SP: Tạo đơn hàng
CREATE PROCEDURE sp_CreateOrder
    @UserId INT,
    @FullName NVARCHAR(255),
    @Email VARCHAR(255),
    @Phone VARCHAR(20),
    @ShippingAddress NVARCHAR(500),
    @ShippingFee DECIMAL(10,2),
    @Subtotal DECIMAL(10,2),
    @DiscountAmount DECIMAL(10,2),
    @TotalAmount DECIMAL(10,2),
    @PaymentMethod VARCHAR(50),
    @Notes NVARCHAR(500),
    @OrderId INT OUTPUT
AS
BEGIN
    BEGIN TRANSACTION;
    BEGIN TRY
        -- Tạo mã đơn hàng
        DECLARE @OrderCode VARCHAR(50);
        SET @OrderCode = 'ORD' + FORMAT(GETDATE(), 'yyMMdd') + RIGHT('0000' + CAST((SELECT COUNT(*) + 1 FROM Orders WHERE CAST(created_at AS DATE) = CAST(GETDATE() AS DATE)) AS VARCHAR), 4);

        -- Tạo đơn hàng
        INSERT INTO Orders (
            order_code, user_id, full_name, email, phone,
            shipping_address, shipping_fee, subtotal, discount_amount,
            total_amount, payment_method, notes
        ) VALUES (
            @OrderCode, @UserId, @FullName, @Email, @Phone,
            @ShippingAddress, @ShippingFee, @Subtotal, @DiscountAmount,
            @TotalAmount, @PaymentMethod, @Notes
        );

        SET @OrderId = SCOPE_IDENTITY();

        -- Chuyển items từ giỏ hàng sang đơn hàng
        INSERT INTO OrderItems (order_id, product_variant_id, product_name, color_name, size_name, quantity, unit_price, subtotal)
        SELECT 
            @OrderId,
            ci.product_variant_id,
            p.name,
            c.name,
            s.name,
            ci.quantity,
            ci.price,
            ci.quantity * ci.price
        FROM CartItems ci
        INNER JOIN Carts cart ON ci.cart_id = cart.id
        INNER JOIN ProductVariants pv ON ci.product_variant_id = pv.id
        INNER JOIN Products p ON pv.product_id = p.id
        INNER JOIN Colors c ON pv.color_id = c.id
        INNER JOIN Sizes s ON pv.size_id = s.id
        WHERE cart.user_id = @UserId;

        -- Cập nhật số lượng reserved trong kho
        UPDATE pv
        SET pv.reserved_quantity = pv.reserved_quantity + ci.quantity
        FROM ProductVariants pv
        INNER JOIN CartItems ci ON pv.id = ci.product_variant_id
        INNER JOIN Carts cart ON ci.cart_id = cart.id
        WHERE cart.user_id = @UserId;

        -- Xóa giỏ hàng
        DELETE FROM CartItems WHERE cart_id IN (SELECT id FROM Carts WHERE user_id = @UserId);

        -- Tạo lịch sử trạng thái
        INSERT INTO OrderStatusHistory (order_id, to_status, changed_by, notes)
        VALUES (@OrderId, 'pending', @UserId, N'Đơn hàng được tạo');

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- SP: Cập nhật trạng thái đơn hàng
CREATE PROCEDURE sp_UpdateOrderStatus
    @OrderId INT,
    @NewStatus VARCHAR(50),
    @ChangedBy INT,
    @Notes NVARCHAR(500) = NULL
AS
BEGIN
    BEGIN TRANSACTION;
    BEGIN TRY
        DECLARE @CurrentStatus VARCHAR(50);
        SELECT @CurrentStatus = order_status FROM Orders WHERE id = @OrderId;

        -- Cập nhật trạng thái
        UPDATE Orders 
        SET 
            order_status = @NewStatus,
            updated_at = GETDATE(),
            staff_id = CASE WHEN @NewStatus = 'confirmed' THEN @ChangedBy ELSE staff_id END,
            delivered_at = CASE WHEN @NewStatus = 'delivered' THEN GETDATE() ELSE delivered_at END
        WHERE id = @OrderId;

        -- Lưu lịch sử
        INSERT INTO OrderStatusHistory (order_id, from_status, to_status, changed_by, notes)
        VALUES (@OrderId, @CurrentStatus, @NewStatus, @ChangedBy, @Notes);

        -- Xử lý kho khi hủy đơn
        IF @NewStatus = 'cancelled'
        BEGIN
            UPDATE pv
            SET pv.reserved_quantity = pv.reserved_quantity - oi.quantity
            FROM ProductVariants pv
            INNER JOIN OrderItems oi ON pv.id = oi.product_variant_id
            WHERE oi.order_id = @OrderId;

            UPDATE Orders
            SET cancelled_by = @ChangedBy, cancelled_at = GETDATE(), cancelled_reason = @Notes
            WHERE id = @OrderId;
        END

        -- Xử lý kho khi giao hàng thành công
        IF @NewStatus = 'delivered'
        BEGIN
            UPDATE pv
            SET 
                pv.stock_quantity = pv.stock_quantity - oi.quantity,
                pv.reserved_quantity = pv.reserved_quantity - oi.quantity
            FROM ProductVariants pv
            INNER JOIN OrderItems oi ON pv.id = oi.product_variant_id
            WHERE oi.order_id = @OrderId;

            -- Cập nhật số lượng bán
            UPDATE p
            SET p.sold_count = p.sold_count + oi.quantity
            FROM Products p
            INNER JOIN ProductVariants pv ON p.id = pv.product_id
            INNER JOIN OrderItems oi ON pv.id = oi.product_variant_id
            WHERE oi.order_id = @OrderId;
        END

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- SP: Thống kê dashboard
CREATE PROCEDURE sp_GetDashboardStats
    @StartDate DATETIME = NULL,
    @EndDate DATETIME = NULL
AS
BEGIN
    IF @StartDate IS NULL SET @StartDate = DATEADD(MONTH, -1, GETDATE());
    IF @EndDate IS NULL SET @EndDate = GETDATE();

    -- Tổng doanh thu
    SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN order_status = 'delivered' THEN total_amount ELSE 0 END) as total_revenue,
        SUM(CASE WHEN order_status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN order_status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders
    FROM Orders
    WHERE created_at BETWEEN @StartDate AND @EndDate;

    -- Top sản phẩm bán chạy
    SELECT TOP 10
        p.id,
        p.name,
        SUM(oi.quantity) as total_sold,
        SUM(oi.subtotal) as total_revenue
    FROM OrderItems oi
    INNER JOIN Orders o ON oi.order_id = o.id
    INNER JOIN ProductVariants pv ON oi.product_variant_id = pv.id
    INNER JOIN Products p ON pv.product_id = p.id
    WHERE o.order_status = 'delivered' 
        AND o.created_at BETWEEN @StartDate AND @EndDate
    GROUP BY p.id, p.name
    ORDER BY total_sold DESC;

    -- Doanh thu theo ngày
    SELECT 
        CAST(created_at AS DATE) as order_date,
        COUNT(*) as order_count,
        SUM(CASE WHEN order_status = 'delivered' THEN total_amount ELSE 0 END) as revenue
    FROM Orders
    WHERE created_at BETWEEN @StartDate AND @EndDate
    GROUP BY CAST(created_at AS DATE)
    ORDER BY order_date;
END;
GO