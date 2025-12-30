import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import Sidebar from './components/Sidebar/Sidebar';

// Pages
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Products from './pages/Products/Products';
import Categories from './pages/Categories/Categories';
import Brands from './pages/Brands/Brands';
import Orders from './pages/Orders/Orders';
import Users from './pages/Users/Users';
import Reviews from './pages/Reviews/Reviews';
import Promotions from './pages/Promotions/Promotions';

import './styles/global.css';

// Protected Route
const ProtectedRoute = ({ children, adminOnly = false }) => {
    const { isAuthenticated, loading, isAdmin } = useAuth();

    if (loading) {
        return (
            <div className="loading-container" style={{ minHeight: '100vh' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (adminOnly && !isAdmin) {
        return <Navigate to="/" replace />;
    }

    return children;
};

// Layout with Sidebar
const AdminLayout = ({ children }) => {
    return (
        <div className="admin-layout">
            <Sidebar />
            <main className="main-content">
                {children}
            </main>
        </div>
    );
};

function AppRoutes() {
    const { isAuthenticated } = useAuth();

    return (
        <Routes>
            <Route path="/login" element={
                isAuthenticated ? <Navigate to="/" replace /> : <Login />
            } />
            
            <Route path="/" element={
                <ProtectedRoute>
                    <AdminLayout><Dashboard /></AdminLayout>
                </ProtectedRoute>
            } />
            
            <Route path="/products" element={
                <ProtectedRoute adminOnly>
                    <AdminLayout><Products /></AdminLayout>
                </ProtectedRoute>
            } />
            
            <Route path="/categories" element={
                <ProtectedRoute adminOnly>
                    <AdminLayout><Categories /></AdminLayout>
                </ProtectedRoute>
            } />
            
            <Route path="/brands" element={
                <ProtectedRoute adminOnly>
                    <AdminLayout><Brands /></AdminLayout>
                </ProtectedRoute>
            } />
            
            <Route path="/orders" element={
                <ProtectedRoute>
                    <AdminLayout><Orders /></AdminLayout>
                </ProtectedRoute>
            } />
            
            <Route path="/users" element={
                <ProtectedRoute adminOnly>
                    <AdminLayout><Users /></AdminLayout>
                </ProtectedRoute>
            } />
            
            <Route path="/reviews" element={
                <ProtectedRoute>
                    <AdminLayout><Reviews /></AdminLayout>
                </ProtectedRoute>
            } />
            
            <Route path="/promotions" element={
                <ProtectedRoute adminOnly>
                    <AdminLayout><Promotions /></AdminLayout>
                </ProtectedRoute>
            } />
            
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

function App() {
    return (
        <Router>
            <AuthProvider>
                <AppRoutes />
                <ToastContainer
                    position="top-right"
                    autoClose={3000}
                    hideProgressBar={false}
                    newestOnTop
                    closeOnClick
                    pauseOnHover
                    theme="light"
                />
            </AuthProvider>
        </Router>
    );
}

export default App;
