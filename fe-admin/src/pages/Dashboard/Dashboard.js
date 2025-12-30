import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
    FiDollarSign, FiShoppingCart, FiUsers, FiPackage, 
    FiTrendingUp, FiAlertCircle, FiArrowUp, FiArrowDown
} from 'react-icons/fi';
import { Line, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { dashboardAPI } from '../../services/api';
import './Dashboard.css';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [revenueData, setRevenueData] = useState(null);
    const [topProducts, setTopProducts] = useState([]);
    const [recentOrders, setRecentOrders] = useState([]);
    const [lowStock, setLowStock] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [statsRes, revenueRes, topRes, ordersRes, stockRes] = await Promise.all([
                dashboardAPI.getStats(),
                dashboardAPI.getRevenue({ period: 'week' }),
                dashboardAPI.getTopProducts({ limit: 5 }),
                dashboardAPI.getRecentOrders({ limit: 5 }),
                dashboardAPI.getLowStock({ limit: 5 })
            ]);

            setStats(statsRes.data.data);
            setRevenueData(revenueRes.data.data);
            setTopProducts(topRes.data.data);
            setRecentOrders(ordersRes.data.data);
            setLowStock(stockRes.data.data);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num?.toString() || '0';
    };

    const getStatusInfo = (status) => {
        const statusMap = {
            pending: { label: 'Chờ xác nhận', class: 'warning' },
            confirmed: { label: 'Đã xác nhận', class: 'info' },
            processing: { label: 'Đang xử lý', class: 'primary' },
            shipped: { label: 'Đang giao', class: 'info' },
            delivered: { label: 'Đã giao', class: 'success' },
            cancelled: { label: 'Đã hủy', class: 'danger' }
        };
        return statusMap[status] || { label: status, class: 'secondary' };
    };

    // Chart configurations
    const revenueChartData = {
        labels: revenueData?.labels || [],
        datasets: [{
            label: 'Doanh thu',
            data: revenueData?.values || [],
            fill: true,
            borderColor: '#3498db',
            backgroundColor: 'rgba(52, 152, 219, 0.1)',
            tension: 0.4
        }]
    };

    const revenueChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: (value) => formatNumber(value) + 'đ'
                }
            }
        }
    };

    const orderStatsData = {
        labels: ['Chờ xác nhận', 'Đang xử lý', 'Đang giao', 'Đã giao', 'Đã hủy'],
        datasets: [{
            data: [
                stats?.pendingOrders || 0,
                stats?.processingOrders || 0,
                stats?.shippedOrders || 0,
                stats?.deliveredOrders || 0,
                stats?.cancelledOrders || 0
            ],
            backgroundColor: ['#f39c12', '#3498db', '#9b59b6', '#27ae60', '#e74c3c']
        }]
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="dashboard-page">
            <div className="page-header">
                <h1 className="page-title">Dashboard</h1>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ backgroundColor: 'rgba(52, 152, 219, 0.1)', color: '#3498db' }}>
                        <FiDollarSign />
                    </div>
                    <div className="stat-value">{formatPrice(stats?.todayRevenue || 0)}</div>
                    <div className="stat-label">Doanh thu hôm nay</div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ backgroundColor: 'rgba(46, 204, 113, 0.1)', color: '#27ae60' }}>
                        <FiShoppingCart />
                    </div>
                    <div className="stat-value">{stats?.todayOrders || 0}</div>
                    <div className="stat-label">Đơn hàng hôm nay</div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ backgroundColor: 'rgba(155, 89, 182, 0.1)', color: '#9b59b6' }}>
                        <FiUsers />
                    </div>
                    <div className="stat-value">{formatNumber(stats?.totalCustomers)}</div>
                    <div className="stat-label">Tổng khách hàng</div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ backgroundColor: 'rgba(241, 196, 15, 0.1)', color: '#f1c40f' }}>
                        <FiPackage />
                    </div>
                    <div className="stat-value">{stats?.totalProducts || 0}</div>
                    <div className="stat-label">Sản phẩm</div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="charts-row">
                <div className="card chart-card">
                    <div className="card-header">
                        <h3 className="card-title">Doanh thu 7 ngày qua</h3>
                    </div>
                    <div className="card-body">
                        <div className="chart-container">
                            <Line data={revenueChartData} options={revenueChartOptions} />
                        </div>
                    </div>
                </div>

                <div className="card chart-card small">
                    <div className="card-header">
                        <h3 className="card-title">Trạng thái đơn hàng</h3>
                    </div>
                    <div className="card-body">
                        <div className="chart-container doughnut">
                            <Doughnut data={orderStatsData} options={{ maintainAspectRatio: false }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Tables Row */}
            <div className="tables-row">
                {/* Recent Orders */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Đơn hàng gần đây</h3>
                        <Link to="/orders" className="view-all">Xem tất cả →</Link>
                    </div>
                    <div className="card-body">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Mã đơn</th>
                                    <th>Khách hàng</th>
                                    <th>Tổng tiền</th>
                                    <th>Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentOrders.map(order => {
                                    const statusInfo = getStatusInfo(order.status);
                                    return (
                                        <tr key={order.id}>
                                            <td><Link to={`/orders/${order.id}`}>{order.orderCode}</Link></td>
                                            <td>{order.customerName}</td>
                                            <td>{formatPrice(order.finalAmount)}</td>
                                            <td><span className={`badge badge-${statusInfo.class}`}>{statusInfo.label}</span></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Top Products */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Sản phẩm bán chạy</h3>
                        <Link to="/products" className="view-all">Xem tất cả →</Link>
                    </div>
                    <div className="card-body">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Sản phẩm</th>
                                    <th>Đã bán</th>
                                    <th>Doanh thu</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topProducts.map(product => (
                                    <tr key={product.id}>
                                        <td>{product.name}</td>
                                        <td>{product.soldCount}</td>
                                        <td>{formatPrice(product.revenue)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Low Stock Alert */}
            {lowStock.length > 0 && (
                <div className="card alert-card">
                    <div className="card-header">
                        <h3 className="card-title">
                            <FiAlertCircle style={{ color: '#e74c3c' }} /> Sản phẩm sắp hết hàng
                        </h3>
                    </div>
                    <div className="card-body">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Sản phẩm</th>
                                    <th>Biến thể</th>
                                    <th>Tồn kho</th>
                                    <th>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lowStock.map((item, idx) => (
                                    <tr key={idx}>
                                        <td>{item.productName}</td>
                                        <td>{item.size} / {item.color}</td>
                                        <td><span className="badge badge-danger">{item.stock}</span></td>
                                        <td>
                                            <Link to={`/products/${item.productId}`} className="btn btn-sm btn-primary">
                                                Cập nhật
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
