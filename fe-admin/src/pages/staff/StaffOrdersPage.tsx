import { useState, useEffect } from 'react';
import { Eye, Search, MessageSquare, XCircle } from 'lucide-react';
import {
  Button,
  Select,
  Table,
  Pagination,
  OrderStatusBadge,
  Card,
  Modal,
  Input,
} from '../../components/common';
import { staffOrderService } from '../../services';
import { Order } from '../../types';
import toast from 'react-hot-toast';

export function StaffOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [stats, setStats] = useState({
    total_orders: 0,
    pending_orders: 0,
    processing_orders: 0,
    completed_orders: 0,
  });

  useEffect(() => {
    loadOrders();
    loadStats();
  }, [page, statusFilter, search]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const response = await staffOrderService.getOrders({
        page,
        limit: 10,
        status: statusFilter || undefined,
        search: search || undefined,
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

  const loadStats = async () => {
    try {
      const response = await staffOrderService.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder || !newStatus) return;

    try {
      await staffOrderService.updateOrderStatus(selectedOrder.id, newStatus, statusNotes);
      toast.success('Cập nhật trạng thái thành công');
      setShowStatusModal(false);
      resetModals();
      loadOrders();
      loadStats();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Không thể cập nhật trạng thái');
    }
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder || !cancelReason) {
      toast.error('Vui lòng nhập lý do hủy đơn');
      return;
    }

    try {
      await staffOrderService.cancelOrder(selectedOrder.id, cancelReason);
      toast.success('Hủy đơn hàng thành công');
      setShowCancelModal(false);
      resetModals();
      loadOrders();
      loadStats();
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Không thể hủy đơn hàng');
    }
  };

  const handleAddNote = async () => {
    if (!selectedOrder || !orderNote) {
      toast.error('Vui lòng nhập ghi chú');
      return;
    }

    try {
      await staffOrderService.addOrderNote(selectedOrder.id, orderNote);
      toast.success('Thêm ghi chú thành công');
      setShowNoteModal(false);
      resetModals();
      loadOrders();
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Không thể thêm ghi chú');
    }
  };

  const resetModals = () => {
    setSelectedOrder(null);
    setNewStatus('');
    setStatusNotes('');
    setCancelReason('');
    setOrderNote('');
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
      key: 'address',
      title: 'Địa chỉ giao hàng',
      render: (order: Order) => (
        <p className="text-sm text-gray-600 max-w-xs truncate" title={order.shipping_address}>
          {order.shipping_address}
        </p>
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
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setSelectedOrder(order);
              setShowDetailModal(true);
            }}
            className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
            title="Xem chi tiết"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSelectedOrder(order);
              setShowNoteModal(true);
            }}
            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
            title="Thêm ghi chú"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
          {order.status !== 'cancelled' && order.status !== 'delivered' && (
            <button
              onClick={() => {
                setSelectedOrder(order);
                setShowCancelModal(true);
              }}
              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
              title="Hủy đơn"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
          {order.status !== 'cancelled' && order.status !== 'delivered' && (
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
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý đơn hàng</h1>
        <p className="text-gray-500 mt-1">Xử lý và theo dõi đơn hàng được phân công</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card padding="sm">
          <p className="text-sm text-gray-500">Tổng đơn</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total_orders}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-gray-500">Chờ xử lý</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending_orders}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-gray-500">Đang xử lý</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{stats.processing_orders}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-gray-500">Hoàn thành</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.completed_orders}</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm theo mã đơn, tên, SĐT..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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

      {/* Order detail modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedOrder(null);
        }}
        title={`Chi tiết đơn hàng #${selectedOrder?.id}`}
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Khách hàng</p>
                <p className="font-medium">{selectedOrder.shipping_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Số điện thoại</p>
                <p className="font-medium">{selectedOrder.shipping_phone}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Địa chỉ</p>
                <p className="font-medium">{selectedOrder.shipping_address}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phương thức thanh toán</p>
                <p className="font-medium capitalize">
                  {selectedOrder.payment_method === 'cod' ? 'COD' : selectedOrder.payment_method}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Trạng thái thanh toán</p>
                <p className={`font-medium ${selectedOrder.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {selectedOrder.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                </p>
              </div>
            </div>

            <hr />

            <div>
              <p className="text-sm text-gray-500 mb-2">Sản phẩm</p>
              {selectedOrder.items?.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg" />
                    <div>
                      <p className="font-medium">{item.product?.name || `Sản phẩm #${item.product_id}`}</p>
                      <p className="text-sm text-gray-500">
                        Size: {item.variant?.size} - Màu: {item.variant?.color} x {item.quantity}
                      </p>
                    </div>
                  </div>
                  <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>

            <hr />

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Tạm tính</span>
                <span>{formatCurrency(selectedOrder.total_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Phí vận chuyển</span>
                <span>{formatCurrency(selectedOrder.shipping_fee)}</span>
              </div>
              {selectedOrder.discount_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Giảm giá</span>
                  <span className="text-red-600">-{formatCurrency(selectedOrder.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold">
                <span>Tổng cộng</span>
                <span className="text-primary-600">{formatCurrency(selectedOrder.final_amount)}</span>
              </div>
            </div>

            {selectedOrder.notes && (
              <>
                <hr />
                <div>
                  <p className="text-sm text-gray-500">Ghi chú từ khách</p>
                  <p className="mt-1">{selectedOrder.notes}</p>
                </div>
              </>
            )}

            {selectedOrder.staff_notes && (
              <div>
                <p className="text-sm text-gray-500">Ghi chú nội bộ</p>
                <p className="mt-1 text-blue-600">{selectedOrder.staff_notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Status update modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => {
          setShowStatusModal(false);
          resetModals();
        }}
        title="Cập nhật trạng thái"
        size="md"
      >
        <div className="space-y-4">
          <Select
            label="Trạng thái mới"
            options={[
              { value: 'confirmed', label: 'Đã xác nhận' },
              { value: 'processing', label: 'Đang xử lý' },
              { value: 'shipped', label: 'Đang giao' },
              { value: 'delivered', label: 'Đã giao' },
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

      {/* Cancel order modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          resetModals();
        }}
        title="Hủy đơn hàng"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Bạn có chắc chắn muốn hủy đơn hàng <strong>#{selectedOrder?.id}</strong>?
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lý do hủy <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Nhập lý do hủy đơn hàng"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowCancelModal(false)}>
              Quay lại
            </Button>
            <Button variant="danger" onClick={handleCancelOrder}>
              Xác nhận hủy
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add note modal */}
      <Modal
        isOpen={showNoteModal}
        onClose={() => {
          setShowNoteModal(false);
          resetModals();
        }}
        title="Thêm ghi chú"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ghi chú <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              value={orderNote}
              onChange={(e) => setOrderNote(e.target.value)}
              placeholder="Nhập ghi chú cho đơn hàng"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowNoteModal(false)}>
              Hủy
            </Button>
            <Button onClick={handleAddNote}>Thêm ghi chú</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
