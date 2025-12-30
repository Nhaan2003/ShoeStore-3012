import { Link } from 'react-router-dom';
import { TrashIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '../../utils/formatters';

const CartItem = ({ item, onUpdateQuantity, onRemove, loading }) => {
  const { id, product, variant, quantity } = item;
  const imageUrl = product?.images?.[0]?.url || '/placeholder-shoe.jpg';
  const price = variant?.price || product?.price;
  const subtotal = price * quantity;

  return (
    <div className="flex gap-4 py-4 border-b">
      {/* Image */}
      <Link
        to={`/products/${product?.slug || product?.id}`}
        className="flex-shrink-0"
      >
        <img
          src={imageUrl}
          alt={product?.name}
          className="w-24 h-24 object-cover rounded-lg"
        />
      </Link>

      {/* Info */}
      <div className="flex-grow min-w-0">
        <Link
          to={`/products/${product?.slug || product?.id}`}
          className="font-medium text-gray-900 hover:text-primary-600 line-clamp-1"
        >
          {product?.name}
        </Link>

        {/* Variant info */}
        <div className="mt-1 text-sm text-gray-500">
          {variant?.size && <span>Size: {variant.size}</span>}
          {variant?.color && (
            <>
              {variant?.size && <span className="mx-2">|</span>}
              <span>Màu: {variant.color}</span>
            </>
          )}
        </div>

        {/* Price */}
        <p className="mt-1 font-medium text-primary-600">
          {formatCurrency(price)}
        </p>

        {/* Quantity controls */}
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center border rounded-lg">
            <button
              onClick={() => onUpdateQuantity(id, Math.max(1, quantity - 1))}
              disabled={loading || quantity <= 1}
              className="p-2 hover:bg-gray-100 disabled:opacity-50"
            >
              <MinusIcon className="h-4 w-4" />
            </button>
            <span className="w-12 text-center font-medium">{quantity}</span>
            <button
              onClick={() => onUpdateQuantity(id, quantity + 1)}
              disabled={loading}
              className="p-2 hover:bg-gray-100 disabled:opacity-50"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={() => onRemove(id)}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-50"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Subtotal - Desktop */}
      <div className="hidden sm:block text-right">
        <p className="font-semibold text-gray-900">
          {formatCurrency(subtotal)}
        </p>
      </div>
    </div>
  );
};

export default CartItem;
