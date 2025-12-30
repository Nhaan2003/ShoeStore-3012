import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartAPI } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

export const CartProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [cart, setCart] = useState({
        items: [],
        totalItems: 0,
        totalAmount: 0
    });
    const [loading, setLoading] = useState(false);

    const fetchCart = useCallback(async () => {
        if (!isAuthenticated) {
            setCart({ items: [], totalItems: 0, totalAmount: 0 });
            return;
        }

        try {
            setLoading(true);
            const response = await cartAPI.get();
            setCart(response.data.data);
        } catch (error) {
            console.error('Fetch cart error:', error);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        fetchCart();
    }, [fetchCart]);

    const addToCart = async (variantId, quantity = 1) => {
        if (!isAuthenticated) {
            throw new Error('Vui lòng đăng nhập để thêm vào giỏ hàng');
        }

        try {
            await cartAPI.addItem({ variantId, quantity });
            await fetchCart();
            return true;
        } catch (error) {
            throw error;
        }
    };

    const updateQuantity = async (itemId, quantity) => {
        try {
            await cartAPI.updateItem(itemId, { quantity });
            await fetchCart();
            return true;
        } catch (error) {
            throw error;
        }
    };

    const removeItem = async (itemId) => {
        try {
            await cartAPI.removeItem(itemId);
            await fetchCart();
            return true;
        } catch (error) {
            throw error;
        }
    };

    const clearCart = async () => {
        try {
            await cartAPI.clear();
            setCart({ items: [], totalItems: 0, totalAmount: 0 });
            return true;
        } catch (error) {
            throw error;
        }
    };

    const getCartCount = async () => {
        if (!isAuthenticated) return 0;
        
        try {
            const response = await cartAPI.getCount();
            return response.data.data.count;
        } catch (error) {
            return 0;
        }
    };

    const value = {
        cart,
        loading,
        fetchCart,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        getCartCount
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};

export default CartContext;
