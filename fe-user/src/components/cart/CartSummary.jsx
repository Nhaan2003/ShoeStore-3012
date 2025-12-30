import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input } from '../ui';
import { formatCurrency } from '../../utils/formatters';

const CartSummary = ({
  cart,
  onApplyCoupon,
  onRemoveCoupon,
  loading,
}) => {
  const [couponCode, setCouponCode] = useState('');

  const subtotal = cart?.subtotal || 0;
  const discount = cart?.discount || 0;
  const shipping = cart?.shipping || 0;
  const total = cart?.total || subtotal - discount + shipping;

  const handleApplyCoupon = async () => {
    if (couponCode.trim()) {
      const success = await onApplyCoupon(couponCode.trim());
      if (success) {
        setCouponCode('');
      }
    }
  };

  return (
    <div className="bg-gray-50 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Tóm tắt đơn hàng
      </h3>

      {/* Coupon */}
      <div className="mb-4">
        {cart?.coupon ? (
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-green-800">
                Mã: {cart.coupon.code}
              </p>
              <p className="text-xs text-green-600">
                Giảm {formatCurrency(discount)}
              </p>
            </div>
            <button
              onClick={onRemoveCoupon}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Xóa
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              placeholder="Mã giảm giá"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              className="flex-grow"
            />
            <Button
              variant="outline"
              onClick={handleApplyCoupon}
              loading={loading}
              disabled={!couponCode.trim()}
            >
              Áp dụng
            </Button>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="space-y-3 border-t pt-4">
        <div className="flex justify-between text-gray-600">
          <span>Tạm tính</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Giảm giá</span>
            <span>-{formatCurrency(discount)}</span>
          </div>
        )}

        <div className="flex justify-between text-gray-600">
          <span>Phí vận chuyển</span>
          <span>{shipping > 0 ? formatCurrency(shipping) : 'Miễn phí'}</span>
        </div>

        <div className="flex justify-between text-lg font-semibold text-gray-900 border-t pt-3">
          <span>Tổng cộng</span>
          <span className="text-primary-600">{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Checkout button */}
      <Link to="/checkout">
        <Button className="w-full mt-6" size="lg">
          Tiến hành thanh toán
        </Button>
      </Link>

      {/* Continue shopping */}
      <Link
        to="/products"
        className="block text-center mt-4 text-sm text-gray-600 hover:text-primary-600"
      >
        Tiếp tục mua sắm
      </Link>
    </div>
  );
};

export default CartSummary;
