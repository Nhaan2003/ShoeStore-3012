import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Filter, Search } from 'lucide-react';
import {
  Button,
  Select,
  Table,
  Pagination,
  OrderStatusBadge,
  Card,
  Modal,
} from '../../components/common';
import { orderAdminService, userAdminService } from '../../services';
import { Order, User } from '../../types';
import toast from 'react-hot-toast';

export function OrderListPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [staffList, setStaffList] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');

  useEffect(() => {
    loadOrders();
    loadStaffList();
  }, [page, statusFilter]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const response = await orderAdminService.getOrders({
        page,
        limit: 10,
        status: statusFilter || undefined,
      });
      setOrders(response.data);
      setTotalPages(response.pagination.total_pages);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Không thể tải danh sách đơn hàng');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStaffList = async () => {
    try {
      const response = await userAdminService.getUsers({ role: 'staff', status: 'active' });
      setStaffList(response.data);
    } catch (error) {
      console.error('Error loading staff:', error);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder || !newStatus) return;

    try {
      await orderAdminService.updateOrderStatus(selectedOrder.id, newStatus, statusNotes);
      toast.success('Cập nhật trạng thái thành công');
      setShowStatusModal(false);
      setSelectedOrder(null);
      setNewStatus('');
      setStatusNotes('');
      loadOrders();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Không thể cập nhật trạng thái');
    }
  };

  const handleAssignStaff = async () => {
    if (!selectedOrder || !selectedStaffId) return;

    try {
      await orderAdminService.assignStaff(selectedOrder.id, parseInt(selectedStaffId));
      toast.success('Phân công nhân viên thành công');
      setShowAssignModal(false);
      setSelectedOrder(null);
      setSelectedStaffId('');
      loadOrders();
    } catch (error) {
      console.error('Error assigning staff:', error);
      toast.error('Không thể phân công nhân viên');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const columns = [
    {
      key: 'id',
      title: 'Mã đơn',
      render: (order: Order) => (
        <span className="font-medium text-primary-600">#{order.id}</span>
      ),
    },
    {
      key: 'customer',
      title: 'Khách hàng',
      render: (order: Order) => (
        <div>
          <p className="font-medium">{order.shipping_name}</p>
          <p className="text-sm text-gray-500">{order.shipping_phone}</p>
        </div>
      ),
    },
    {
      key: 'total',
      title: 'Tổng tiền',
      render: (order: Order) => (
        <span className="font-medium">{formatCurrency(order.final_amount)}</span>
      ),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (order: Order) => <OrderStatusBadge status={order.status} />,
    },
    {
      key: 'payment',
      title: 'Thanh toán',
      render: (order: Order) => (
        <div className="text-sm">
          <p className="capitalize">{order.payment_method === 'cod' ? 'COD' : order.payment_method}</p>
          <p className={order.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'}>
            {order.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
          </p>
        </div>
      ),
    },
    {
      key: 'date',
      title: 'Ngày đặt',
      render: (order: Order) => (
        <span className="text-sm text-gray-500">{formatDate(order.created_at)}</span>
      ),
    },
    {
      key: 'actions',
      title: 'Thao tác',
      render: (order: Order) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/admin/orders/${order.id}`)}
            className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
            title="Xem chi tiết"
          >
            <Eye className="w-4 h-4" />
          </button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setSelectedOrder(order);
              setNewStatus(order.status);
              setShowStatusModal(true);
            }}
          >
            Cập nhật
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý đơn hàng</h1>
        <p className="text-gray-500 mt-1">Xem và quản lý tất cả đơn hàng</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {['pending', 'confirmed', 'processing', 'shipped'].map((status) => {
          const count = orders.filter((o) => o.status === status).length;
          const labels: Record<string, string> = {
            pending: 'Chờ xác nhận',
            confirmed: 'Đã xác nhận',
            processing: 'Đang xử lý',
            shipped: 'Đang giao',
          };
          return (
            <Card key={status} padding="sm">
              <p className="text-sm text-gray-500">{labels[status]}</p>
              <p className="text-2xl font-bold mt-1">{count}</p>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm theo mã đơn, tên khách..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
          </div>
          <Select
            options={[
              { value: '', label: 'Tất cả trạng thái' },
              { value: 'pending', label: 'Chờ xác nhận' },
              { value: 'confirmed', label: 'Đã xác nhận' },
              { value: 'processing', label: 'Đang xử lý' },
              { value: 'shipped', label: 'Đang giao' },
              { value: 'delivered', label: 'Đã giao' },
              { value: 'cancelled', label: 'Đã hủy' },
            ]}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Orders table */}
      <Table columns={columns} data={orders} isLoading={isLoading} emptyMessage="Không có đơn hàng nào" />

      {/* Pagination */}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Status update modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="Cập nhật trạng thái đơn hàng"
        size="md"
      >
        <div className="space-y-4">
          <Select
            label="Trạng thái mới"
            options={[
              { value: 'pending', label: 'Chờ xác nhận' },
              { value: 'confirmed', label: 'Đã xác nhận' },
              { value: 'processing', label: 'Đang xử lý' },
              { value: 'shipped', label: 'Đang giao' },
              { value: 'delivered', label: 'Đã giao' },
              { value: 'cancelled', label: 'Đã hủy' },
            ]}
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              value={statusNotes}
              onChange={(e) => setStatusNotes(e.target.value)}
              placeholder="Thêm ghi chú (không bắt buộc)"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
              Hủy
            </Button>
            <Button onClick={handleUpdateStatus}>Cập nhật</Button>
          </div>
        </div>
      </Modal>

      {/* Assign staff modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Phân công nhân viên"
        size="sm"
      >
        <div className="space-y-4">
          <Select
            label="Chọn nhân viên"
            options={staffList.map((s) => ({ value: s.id, label: s.full_name }))}
            value={selectedStaffId}
            onChange={(e) => setSelectedStaffId(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowAssignModal(false)}>
              Hủy
            </Button>
            <Button onClick={handleAssignStaff}>Phân công</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
