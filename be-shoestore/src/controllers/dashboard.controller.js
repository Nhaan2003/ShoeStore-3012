const { getPool, sql } = require('../config/database');

// @desc    Lấy thống kê tổng quan dashboard
// @route   GET /api/dashboard/stats
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
    try {
        const pool = getPool();

        // Thống kê doanh thu hôm nay
        const todayResult = await pool.request().query(`
            SELECT 
                ISNULL(SUM(final_amount), 0) as today_revenue,
                COUNT(*) as today_orders
            FROM Orders
            WHERE CAST(created_at AS DATE) = CAST(GETDATE() AS DATE)
            AND status NOT IN ('cancelled', 'returned')
        `);

        // Thống kê tổng quan
        const overviewResult = await pool.request().query(`
            SELECT 
                (SELECT COUNT(*) FROM Orders WHERE status = 'pending') as pending_orders,
                (SELECT COUNT(*) FROM Orders WHERE status = 'processing') as processing_orders,
                (SELECT COUNT(*) FROM Orders WHERE status = 'shipped') as shipping_orders,
                (SELECT COUNT(*) FROM Users WHERE role = 'customer' AND status = 'active') as total_customers,
                (SELECT COUNT(*) FROM Products WHERE status = 'active') as total_products,
                (SELECT SUM(stock_quantity) FROM ProductVariants WHERE status = 'active') as total_stock,
                (SELECT COUNT(*) FROM ProductVariants WHERE stock_quantity <= 10 AND status = 'active') as low_stock_count
        `);

        // Thống kê tháng này
        const monthResult = await pool.request().query(`
            SELECT 
                ISNULL(SUM(CASE WHEN status = 'delivered' THEN final_amount ELSE 0 END), 0) as month_revenue,
                COUNT(CASE WHEN status = 'delivered' THEN 1 END) as month_completed_orders,
                COUNT(*) as month_total_orders
            FROM Orders
            WHERE MONTH(created_at) = MONTH(GETDATE()) 
            AND YEAR(created_at) = YEAR(GETDATE())
        `);

        // So sánh với tháng trước
        const lastMonthResult = await pool.request().query(`
            SELECT 
                ISNULL(SUM(CASE WHEN status = 'delivered' THEN final_amount ELSE 0 END), 0) as last_month_revenue
            FROM Orders
            WHERE MONTH(created_at) = MONTH(DATEADD(MONTH, -1, GETDATE())) 
            AND YEAR(created_at) = YEAR(DATEADD(MONTH, -1, GETDATE()))
        `);

        const today = todayResult.recordset[0];
        const overview = overviewResult.recordset[0];
        const month = monthResult.recordset[0];
        const lastMonth = lastMonthResult.recordset[0];

        // Tính % tăng trưởng
        const revenueGrowth = lastMonth.last_month_revenue > 0 
            ? ((month.month_revenue - lastMonth.last_month_revenue) / lastMonth.last_month_revenue * 100).toFixed(1)
            : 0;

        res.json({
            success: true,
            data: {
                today: {
                    revenue: today.today_revenue,
                    orders: today.today_orders
                },
                overview: {
                    pendingOrders: overview.pending_orders,
                    processingOrders: overview.processing_orders,
                    shippingOrders: overview.shipping_orders,
                    totalCustomers: overview.total_customers,
                    totalProducts: overview.total_products,
                    totalStock: overview.total_stock,
                    lowStockCount: overview.low_stock_count
                },
                month: {
                    revenue: month.month_revenue,
                    completedOrders: month.month_completed_orders,
                    totalOrders: month.month_total_orders,
                    revenueGrowth: parseFloat(revenueGrowth)
                }
            }
        });

    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

// @desc    Lấy doanh thu theo thời gian
// @route   GET /api/dashboard/revenue
// @access  Private/Admin
const getRevenueChart = async (req, res) => {
    try {
        const { period = '7days' } = req.query;
        const pool = getPool();

        let dateRange;
        let groupBy;

        switch (period) {
            case '7days':
                dateRange = 7;
                groupBy = 'day';
                break;
            case '30days':
                dateRange = 30;
                groupBy = 'day';
                break;
            case '12months':
                dateRange = 365;
                groupBy = 'month';
                break;
            default:
                dateRange = 7;
                groupBy = 'day';
        }

        let query;
        if (groupBy === 'day') {
            query = `
                SELECT 
                    CAST(created_at AS DATE) as date,
                    ISNULL(SUM(CASE WHEN status = 'delivered' THEN final_amount ELSE 0 END), 0) as revenue,
                    COUNT(CASE WHEN status = 'delivered' THEN 1 END) as orders
                FROM Orders
                WHERE created_at >= DATEADD(DAY, -${dateRange}, GETDATE())
                GROUP BY CAST(created_at AS DATE)
                ORDER BY date
            `;
        } else {
            query = `
                SELECT 
                    YEAR(created_at) as year,
                    MONTH(created_at) as month,
                    ISNULL(SUM(CASE WHEN status = 'delivered' THEN final_amount ELSE 0 END), 0) as revenue,
                    COUNT(CASE WHEN status = 'delivered' THEN 1 END) as orders
                FROM Orders
                WHERE created_at >= DATEADD(MONTH, -12, GETDATE())
                GROUP BY YEAR(created_at), MONTH(created_at)
                ORDER BY year, month
            `;
        }

        const result = await pool.request().query(query);

        res.json({
            success: true,
            data: result.recordset.map(r => ({
                date: groupBy === 'day' ? r.date : `${r.year}-${String(r.month).padStart(2, '0')}`,
                revenue: r.revenue,
                orders: r.orders
            }))
        });

    } catch (error) {
        console.error('Get revenue chart error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

// @desc    Lấy top sản phẩm bán chạy
// @route   GET /api/dashboard/top-products
// @access  Private/Admin
const getTopProducts = async (req, res) => {
    try {
        const { limit = 10, period = '30days' } = req.query;
        const pool = getPool();

        const result = await pool.request()
            .input('limit', sql.Int, parseInt(limit))
            .query(`
                SELECT TOP (@limit)
                    p.product_id,
                    p.product_name,
                    b.brand_name,
                    SUM(oi.quantity) as total_sold,
                    SUM(oi.subtotal) as total_revenue,
                    (SELECT TOP 1 image_url FROM ProductImages WHERE product_id = p.product_id AND is_primary = 1) as image
                FROM OrderItems oi
                JOIN ProductVariants pv ON oi.variant_id = pv.variant_id
                JOIN Products p ON pv.product_id = p.product_id
                JOIN Brands b ON p.brand_id = b.brand_id
                JOIN Orders o ON oi.order_id = o.order_id
                WHERE o.status = 'delivered'
                AND o.created_at >= DATEADD(DAY, -30, GETDATE())
                GROUP BY p.product_id, p.product_name, b.brand_name
                ORDER BY total_sold DESC
            `);

        res.json({
            success: true,
            data: result.recordset.map(p => ({
                id: p.product_id,
                name: p.product_name,
                brand: p.brand_name,
                totalSold: p.total_sold,
                totalRevenue: p.total_revenue,
                image: p.image
            }))
        });

    } catch (error) {
        console.error('Get top products error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

// @desc    Lấy đơn hàng gần đây
// @route   GET /api/dashboard/recent-orders
// @access  Private/Admin
const getRecentOrders = async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const pool = getPool();

        const result = await pool.request()
            .input('limit', sql.Int, parseInt(limit))
            .query(`
                SELECT TOP (@limit)
                    o.order_id,
                    o.order_code,
                    o.final_amount,
                    o.status,
                    o.created_at,
                    u.full_name as customer_name,
                    (SELECT COUNT(*) FROM OrderItems WHERE order_id = o.order_id) as item_count
                FROM Orders o
                JOIN Users u ON o.user_id = u.user_id
                ORDER BY o.created_at DESC
            `);

        res.json({
            success: true,
            data: result.recordset.map(o => ({
                id: o.order_id,
                orderCode: o.order_code,
                finalAmount: o.final_amount,
                status: o.status,
                customerName: o.customer_name,
                itemCount: o.item_count,
                createdAt: o.created_at
            }))
        });

    } catch (error) {
        console.error('Get recent orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

// @desc    Lấy sản phẩm sắp hết hàng
// @route   GET /api/dashboard/low-stock
// @access  Private/Admin
const getLowStockProducts = async (req, res) => {
    try {
        const { threshold = 10, limit = 20 } = req.query;
        const pool = getPool();

        const result = await pool.request()
            .input('threshold', sql.Int, parseInt(threshold))
            .input('limit', sql.Int, parseInt(limit))
            .query(`
                SELECT TOP (@limit)
                    p.product_id,
                    p.product_name,
                    pv.variant_id,
                    pv.size,
                    pv.color,
                    pv.stock_quantity,
                    pv.sku,
                    (SELECT TOP 1 image_url FROM ProductImages WHERE product_id = p.product_id AND is_primary = 1) as image
                FROM ProductVariants pv
                JOIN Products p ON pv.product_id = p.product_id
                WHERE pv.stock_quantity <= @threshold 
                AND pv.status = 'active'
                AND p.status = 'active'
                ORDER BY pv.stock_quantity ASC
            `);

        res.json({
            success: true,
            data: result.recordset.map(p => ({
                productId: p.product_id,
                productName: p.product_name,
                variantId: p.variant_id,
                size: p.size,
                color: p.color,
                stock: p.stock_quantity,
                sku: p.sku,
                image: p.image
            }))
        });

    } catch (error) {
        console.error('Get low stock products error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

// @desc    Thống kê đơn hàng theo trạng thái
// @route   GET /api/dashboard/order-stats
// @access  Private/Admin
const getOrderStats = async (req, res) => {
    try {
        const pool = getPool();

        const result = await pool.request().query(`
            SELECT 
                status,
                COUNT(*) as count,
                ISNULL(SUM(final_amount), 0) as total_amount
            FROM Orders
            GROUP BY status
        `);

        const stats = {};
        result.recordset.forEach(r => {
            stats[r.status] = {
                count: r.count,
                totalAmount: r.total_amount
            };
        });

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Get order stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

module.exports = {
    getDashboardStats,
    getRevenueChart,
    getTopProducts,
    getRecentOrders,
    getLowStockProducts,
    getOrderStats
};
