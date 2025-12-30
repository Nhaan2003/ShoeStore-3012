import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { DashboardLayout, ProtectedRoute } from './components/layout';
import { LoginPage } from './pages/auth';
import {
  DashboardPage,
  ProductListPage,
  ProductCreatePage,
  OrderListPage,
  UserListPage,
} from './pages/admin';
import { StaffOrdersPage } from './pages/staff';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="products" element={<ProductListPage />} />
            <Route path="products/create" element={<ProductCreatePage />} />
            <Route path="products/:id/edit" element={<ProductCreatePage />} />
            <Route path="orders" element={<OrderListPage />} />
            <Route path="users" element={<UserListPage />} />
            <Route path="users/staff" element={<UserListPage />} />
            <Route path="categories" element={<div className="p-6"><h1 className="text-2xl font-bold">Quản lý danh mục</h1><p className="text-gray-500 mt-2">Tính năng đang phát triển...</p></div>} />
            <Route path="brands" element={<div className="p-6"><h1 className="text-2xl font-bold">Quản lý thương hiệu</h1><p className="text-gray-500 mt-2">Tính năng đang phát triển...</p></div>} />
          </Route>

          {/* Staff routes */}
          <Route
            path="/staff"
            element={
              <ProtectedRoute allowedRoles={['staff']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/staff/orders" replace />} />
            <Route path="orders" element={<StaffOrdersPage />} />
          </Route>

          {/* Settings - accessible by both admin and staff */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute allowedRoles={['admin', 'staff']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<div className="p-6"><h1 className="text-2xl font-bold">Cài đặt tài khoản</h1><p className="text-gray-500 mt-2">Tính năng đang phát triển...</p></div>} />
          </Route>

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            style: {
              background: '#10b981',
            },
          },
          error: {
            style: {
              background: '#ef4444',
            },
          },
        }}
      />
    </QueryClientProvider>
  );
}

export default App;
