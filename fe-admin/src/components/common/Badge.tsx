import { ReactNode } from 'react';

type BadgeVariant = 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  gray: 'bg-gray-100 text-gray-800',
  blue: 'bg-blue-100 text-blue-800',
  green: 'bg-green-100 text-green-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  red: 'bg-red-100 text-red-800',
  purple: 'bg-purple-100 text-purple-800',
};

export function Badge({ variant = 'gray', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

// Status badge helpers
export function OrderStatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { variant: BadgeVariant; label: string }> = {
    pending: { variant: 'yellow', label: 'Chờ xác nhận' },
    confirmed: { variant: 'blue', label: 'Đã xác nhận' },
    processing: { variant: 'purple', label: 'Đang xử lý' },
    shipped: { variant: 'blue', label: 'Đang giao' },
    delivered: { variant: 'green', label: 'Đã giao' },
    cancelled: { variant: 'red', label: 'Đã hủy' },
  };

  const config = statusConfig[status] || { variant: 'gray' as BadgeVariant, label: status };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function UserStatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { variant: BadgeVariant; label: string }> = {
    active: { variant: 'green', label: 'Hoạt động' },
    inactive: { variant: 'gray', label: 'Không hoạt động' },
    banned: { variant: 'red', label: 'Bị cấm' },
  };

  const config = statusConfig[status] || { variant: 'gray' as BadgeVariant, label: status };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function ProductStatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { variant: BadgeVariant; label: string }> = {
    active: { variant: 'green', label: 'Đang bán' },
    inactive: { variant: 'gray', label: 'Ngừng bán' },
    out_of_stock: { variant: 'red', label: 'Hết hàng' },
  };

  const config = statusConfig[status] || { variant: 'gray' as BadgeVariant, label: status };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function RoleBadge({ role }: { role: string }) {
  const roleConfig: Record<string, { variant: BadgeVariant; label: string }> = {
    admin: { variant: 'purple', label: 'Admin' },
    staff: { variant: 'blue', label: 'Nhân viên' },
    customer: { variant: 'gray', label: 'Khách hàng' },
  };

  const config = roleConfig[role] || { variant: 'gray' as BadgeVariant, label: role };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
