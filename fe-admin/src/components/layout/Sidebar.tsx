import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  FolderTree,
  Tag,
  ClipboardList,
  Settings,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../../store';

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  roles: ('admin' | 'staff')[];
  children?: { name: string; path: string }[];
}

const navItems: NavItem[] = [
  {
    name: 'Dashboard',
    path: '/admin/dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
    roles: ['admin'],
  },
  {
    name: 'Sản phẩm',
    path: '/admin/products',
    icon: <Package className="w-5 h-5" />,
    roles: ['admin'],
    children: [
      { name: 'Danh sách', path: '/admin/products' },
      { name: 'Thêm mới', path: '/admin/products/create' },
    ],
  },
  {
    name: 'Đơn hàng',
    path: '/admin/orders',
    icon: <ShoppingCart className="w-5 h-5" />,
    roles: ['admin'],
  },
  {
    name: 'Người dùng',
    path: '/admin/users',
    icon: <Users className="w-5 h-5" />,
    roles: ['admin'],
    children: [
      { name: 'Tất cả', path: '/admin/users' },
      { name: 'Nhân viên', path: '/admin/users/staff' },
    ],
  },
  {
    name: 'Danh mục',
    path: '/admin/categories',
    icon: <FolderTree className="w-5 h-5" />,
    roles: ['admin'],
  },
  {
    name: 'Thương hiệu',
    path: '/admin/brands',
    icon: <Tag className="w-5 h-5" />,
    roles: ['admin'],
  },
  // Staff navigation
  {
    name: 'Quản lý đơn hàng',
    path: '/staff/orders',
    icon: <ClipboardList className="w-5 h-5" />,
    roles: ['staff'],
  },
  {
    name: 'Cài đặt',
    path: '/settings',
    icon: <Settings className="w-5 h-5" />,
    roles: ['admin', 'staff'],
  },
];

interface SidebarProps {
  isOpen: boolean;
}

export function Sidebar({ isOpen }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuthStore();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const filteredNavItems = navItems.filter(
    (item) => user && item.roles.includes(user.role as 'admin' | 'staff')
  );

  const toggleExpand = (path: string) => {
    setExpandedItems((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  const isActive = (path: string) => location.pathname === path;
  const isParentActive = (item: NavItem) =>
    item.children?.some((child) => location.pathname === child.path) ||
    location.pathname === item.path;

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-gray-900 text-white transition-all duration-300 z-40 ${
        isOpen ? 'w-64' : 'w-20'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-white" />
          </div>
          {isOpen && (
            <span className="font-bold text-lg">Shoe Admin</span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-1">
        {filteredNavItems.map((item) => (
          <div key={item.path}>
            {item.children ? (
              <>
                <button
                  onClick={() => toggleExpand(item.path)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                    isParentActive(item)
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    {isOpen && <span>{item.name}</span>}
                  </div>
                  {isOpen && (
                    expandedItems.includes(item.path) ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )
                  )}
                </button>
                {isOpen && expandedItems.includes(item.path) && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                          isActive(child.path)
                            ? 'bg-gray-800 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-gray-800'
                        }`}
                      >
                        {child.name}
                      </NavLink>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <NavLink
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                {item.icon}
                {isOpen && <span>{item.name}</span>}
              </NavLink>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}
