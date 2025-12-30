import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartService } from '../services/cartService';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

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
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [itemCount, setItemCount] = useState(0);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(null);
      setItemCount(0);
      return;
    }

    try {
      setLoading(true);
      const cartData = await cartService.getCart();
      setCart(cartData);
      setItemCount(cartData?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0);
    } catch (err) {
      console.error('Failed to fetch cart:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (productId, variantId, quantity = 1) => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thêm vào giỏ hàng');
      return false;
    }

    try {
      setLoading(true);
      const updatedCart = await cartService.addToCart(productId, variantId, quantity);
      setCart(updatedCart);
      setItemCount(updatedCart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0);
      toast.success('Đã thêm vào giỏ hàng');
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Thêm vào giỏ hàng thất bại');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    try {
      setLoading(true);
      const updatedCart = await cartService.updateCartItem(itemId, quantity);
      setCart(updatedCart);
      setItemCount(updatedCart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cập nhật số lượng thất bại');
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId) => {
    try {
      setLoading(true);
      const updatedCart = await cartService.removeFromCart(itemId);
      setCart(updatedCart);
      setItemCount(updatedCart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0);
      toast.success('Đã xóa khỏi giỏ hàng');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xóa sản phẩm thất bại');
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      setLoading(true);
      await cartService.clearCart();
      setCart(null);
      setItemCount(0);
    } catch (err) {
      toast.error('Xóa giỏ hàng thất bại');
    } finally {
      setLoading(false);
    }
  };

  const applyCoupon = async (code) => {
    try {
      setLoading(true);
      const updatedCart = await cartService.applyCoupon(code);
      setCart(updatedCart);
      toast.success('Áp dụng mã giảm giá thành công');
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Mã giảm giá không hợp lệ');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removeCoupon = async () => {
    try {
      setLoading(true);
      const updatedCart = await cartService.removeCoupon();
      setCart(updatedCart);
    } catch (err) {
      toast.error('Xóa mã giảm giá thất bại');
    } finally {
      setLoading(false);
    }
  };

  const value = {
    cart,
    loading,
    itemCount,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    applyCoupon,
    removeCoupon,
    refreshCart: fetchCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
