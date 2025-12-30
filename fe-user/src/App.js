import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';

import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';

// Pages
import Home from './pages/Home/Home';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';

// Lazy load other pages
const Products = React.lazy(() => import('./pages/Products/Products'));
const ProductDetail = React.lazy(() => import('./pages/ProductDetail/ProductDetail'));
const Cart = React.lazy(() => import('./pages/Cart/Cart'));
const Checkout = React.lazy(() => import('./pages/Checkout/Checkout'));
const Orders = React.lazy(() => import('./pages/Orders/Orders'));
const OrderDetail = React.lazy(() => import('./pages/OrderDetail/OrderDetail'));
const Profile = React.lazy(() => import('./pages/Profile/Profile'));

import './styles/global.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading-container" style={{ minHeight: '50vh' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

// Guest Route Component (redirect if logged in)
const GuestRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading-container" style={{ minHeight: '50vh' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return children;
};

// Loading Component
const LoadingFallback = () => (
    <div className="loading-container" style={{ minHeight: '50vh' }}>
        <div className="spinner"></div>
    </div>
);

function AppContent() {
    return (
        <div className="app">
            <Header />
            <main className="main-content">
                <React.Suspense fallback={<LoadingFallback />}>
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/" element={<Home />} />
                        <Route path="/products" element={<Products />} />
                        <Route path="/products/:id" element={<ProductDetail />} />
                        
                        {/* Guest Routes */}
                        <Route path="/login" element={
                            <GuestRoute><Login /></GuestRoute>
                        } />
                        <Route path="/register" element={
                            <GuestRoute><Register /></GuestRoute>
                        } />
                        
                        {/* Protected Routes */}
                        <Route path="/cart" element={
                            <ProtectedRoute><Cart /></ProtectedRoute>
                        } />
                        <Route path="/checkout" element={
                            <ProtectedRoute><Checkout /></ProtectedRoute>
                        } />
                        <Route path="/orders" element={
                            <ProtectedRoute><Orders /></ProtectedRoute>
                        } />
                        <Route path="/orders/:id" element={
                            <ProtectedRoute><OrderDetail /></ProtectedRoute>
                        } />
                        <Route path="/profile" element={
                            <ProtectedRoute><Profile /></ProtectedRoute>
                        } />
                        
                        {/* 404 */}
                        <Route path="*" element={
                            <div className="container" style={{ textAlign: 'center', padding: '50px 0' }}>
                                <h1>404 - Trang không tồn tại</h1>
                                <p>Trang bạn tìm kiếm không tồn tại.</p>
                            </div>
                        } />
                    </Routes>
                </React.Suspense>
            </main>
            <Footer />
            
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
            />
        </div>
    );
}

function App() {
    return (
        <Router>
            <AuthProvider>
                <CartProvider>
                    <AppContent />
                </CartProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;
