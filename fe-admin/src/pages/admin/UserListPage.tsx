import { useState, useEffect } from 'react';
import { Eye, UserPlus, Search, Ban, CheckCircle } from 'lucide-react';
import {
  Button,
  Select,
  Table,
  Pagination,
  UserStatusBadge,
  RoleBadge,
  Modal,
  Input,
} from '../../components/common';
import { userAdminService } from '../../services';
import { User } from '../../types';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const staffSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  full_name: z.string().min(1, 'Họ tên là bắt buộc'),
  phone: z.string().regex(/^(0[3|5|7|8|9])+([0-9]{8})$/, 'Số điện thoại không hợp lệ'),
});

type StaffForm = z.infer<typeof staffSchema>;

export function UserListPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ role: '', status: '' });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newStatus, setNewStatus] = useState<'active' | 'inactive' | 'banned'>('active');
  const [statusReason, setStatusReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StaffForm>({
    resolver: zodResolver(staffSchema),
  });

  useEffect(() => {
    loadUsers();
  }, [page, filters]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const response = await userAdminService.getUsers({
        page,
        limit: 10,
        role: filters.role as 'admin' | 'staff' | 'customer' | undefined,
        status: filters.status as 'active' | 'inactive' | 'banned' | undefined,
      });
      setUsers(response.data);
      setTotalPages(response.pagination.total_pages);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Không thể tải danh sách người dùng');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateStaff = async (data: StaffForm) => {
    setIsSubmitting(true);
    try {
      await userAdminService.createStaff(data);
      toast.success('Tạo tài khoản nhân viên thành công');
      setShowCreateModal(false);
      reset();
      loadUsers();
    } catch (error) {
      console.error('Error creating staff:', error);
      toast.error('Không thể tạo tài khoản');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedUser) return;

    try {
      await userAdminService.updateUserStatus(selectedUser.id, newStatus, statusReason);
      toast.success('Cập nhật trạng thái thành công');
      setShowStatusModal(false);
      setSelectedUser(null);
      setStatusReason('');
      loadUsers();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Không thể cập nhật trạng thái');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN');
  };

  const columns = [
    {
      key: 'user',
      title: 'Người dùng',
      render: (user: User) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.full_name} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <span className="text-primary-600 font-medium">
                {user.full_name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900">{user.full_name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      title: 'Số điện thoại',
      render: (user: User) => user.phone || '-',
    },
    {
      key: 'role',
      title: 'Vai trò',
      render: (user: User) => <RoleBadge role={user.role} />,
    },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (user: User) => <UserStatusBadge status={user.status} />,
    },
    {
      key: 'created_at',
      title: 'Ngày tạo',
      render: (user: User) => formatDate(user.created_at),
    },
    {
      key: 'actions',
      title: 'Thao tác',
      render: (user: User) => (
        <div className="flex items-center gap-2">
          <button
            className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
            title="Xem chi tiết"
          >
            <Eye className="w-4 h-4" />
          </button>
          {user.status === 'active' ? (
            <button
              onClick={() => {
                setSelectedUser(user);
                setNewStatus('banned');
                setShowStatusModal(true);
              }}
              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
              title="Khóa tài khoản"
            >
              <Ban className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => {
                setSelectedUser(user);
                setNewStatus('active');
                setShowStatusModal(true);
              }}
              className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg"
              title="Kích hoạt tài khoản"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý người dùng</h1>
          <p className="text-gray-500 mt-1">Quản lý tài khoản người dùng trong hệ thống</p>
        </div>
        <Button
          leftIcon={<UserPlus className="w-4 h-4" />}
          onClick={() => setShowCreateModal(true)}
        >
          Thêm nhân viên
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
          </div>
          <Select
            options={[
              { value: '', label: 'Tất cả vai trò' },
              { value: 'admin', label: 'Admin' },
              { value: 'staff', label: 'Nhân viên' },
              { value: 'customer', label: 'Khách hàng' },
            ]}
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
          />
          <Select
            options={[
              { value: '', label: 'Tất cả trạng thái' },
              { value: 'active', label: 'Hoạt động' },
              { value: 'inactive', label: 'Không hoạt động' },
              { value: 'banned', label: 'Bị cấm' },
            ]}
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          />
        </div>
      </div>

      {/* Users table */}
      <Table columns={columns} data={users} isLoading={isLoading} emptyMessage="Không có người dùng nào" />

      {/* Pagination */}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Create staff modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          reset();
        }}
        title="Thêm nhân viên mới"
        size="md"
      >
        <form onSubmit={handleSubmit(handleCreateStaff)} className="space-y-4">
          <Input
            label="Họ và tên"
            placeholder="Nhập họ và tên"
            error={errors.full_name?.message}
            {...register('full_name')}
          />
          <Input
            label="Email"
            type="email"
            placeholder="Nhập email"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Số điện thoại"
            placeholder="Nhập số điện thoại"
            error={errors.phone?.message}
            {...register('phone')}
          />
          <Input
            label="Mật khẩu"
            type="password"
            placeholder="Nhập mật khẩu"
            error={errors.password?.message}
            {...register('password')}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)}>
              Hủy
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Tạo tài khoản
            </Button>
          </div>
        </form>
      </Modal>

      {/* Update status modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title={newStatus === 'banned' ? 'Khóa tài khoản' : 'Kích hoạt tài khoản'}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Bạn có chắc chắn muốn {newStatus === 'banned' ? 'khóa' : 'kích hoạt'} tài khoản của{' '}
            <strong>{selectedUser?.full_name}</strong>?
          </p>
          {newStatus === 'banned' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lý do</label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="Nhập lý do khóa tài khoản"
              />
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
              Hủy
            </Button>
            <Button variant={newStatus === 'banned' ? 'danger' : 'primary'} onClick={handleUpdateStatus}>
              {newStatus === 'banned' ? 'Khóa tài khoản' : 'Kích hoạt'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
