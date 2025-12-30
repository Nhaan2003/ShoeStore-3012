import { useEffect, useState } from 'react';
import {
  ShoppingCart,
  DollarSign,
  Users,
  Package,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { StatCard, Card } from '../../components/common';
import { dashboardService } from '../../services';
import { DashboardStats, SalesChartData, TopProduct } from '../../types';

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [salesData, setSalesData] = useState<SalesChartData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [period]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, salesRes, productsRes] = await Promise.all([
        dashboardService.getStatistics(),
        dashboardService.getSalesChart(period),
        dashboardService.getTopProducts(5),
      ]);

      setStats(statsRes.data);
      setSalesData(salesRes.data);
      setTopProducts(productsRes.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
              <div className="h-8 bg-gray-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Tổng quan về hoạt động kinh doanh</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Tổng doanh thu"
          value={formatCurrency(stats?.total_revenue || 0)}
          icon={<DollarSign className="w-6 h-6 text-primary-600" />}
          trend={
            stats?.revenue_growth
              ? { value: stats.revenue_growth, isPositive: stats.revenue_growth > 0 }
              : undefined
          }
        />
        <StatCard
          title="Tổng đơn hàng"
          value={stats?.total_orders.toLocaleString() || '0'}
          icon={<ShoppingCart className="w-6 h-6 text-primary-600" />}
          trend={
            stats?.orders_growth
              ? { value: stats.orders_growth, isPositive: stats.orders_growth > 0 }
              : undefined
          }
        />
        <StatCard
          title="Khách hàng"
          value={stats?.total_customers.toLocaleString() || '0'}
          icon={<Users className="w-6 h-6 text-primary-600" />}
        />
        <StatCard
          title="Sản phẩm"
          value={stats?.total_products.toLocaleString() || '0'}
          icon={<Package className="w-6 h-6 text-primary-600" />}
        />
      </div>

      {/* Order status cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Đơn chờ xử lý</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">
                {stats?.pending_orders || 0}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-xl">
              <TrendingUp className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Đơn đang xử lý</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">
                {stats?.processing_orders || 0}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <TrendingDown className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales chart */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Biểu đồ doanh thu</h3>
            <div className="flex gap-2">
              {(['week', 'month', 'year'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    period === p
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {p === 'week' ? 'Tuần' : p === 'month' ? 'Tháng' : 'Năm'}
                </button>
              ))}
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), 'Doanh thu']}
                  labelFormatter={(label) => `Ngày: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ fill: '#2563eb', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Top products */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Sản phẩm bán chạy</h3>
          <div className="space-y-4">
            {topProducts.length > 0 ? (
              topProducts.map((product, index) => (
                <div key={product.id} className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.sold_count} đã bán</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">Chưa có dữ liệu</p>
            )}
          </div>
        </Card>
      </div>

      {/* Orders chart */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Số lượng đơn hàng</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip formatter={(value: number) => [value, 'Đơn hàng']} />
              <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
