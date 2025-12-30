import { Link } from 'react-router-dom';
import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { formatCurrency, calculateDiscount } from '../../utils/formatters';
import { Rating } from '../ui';

const ProductCard = ({
  product,
  isWishlisted = false,
  onWishlistToggle,
}) => {
  const {
    id,
    name,
    slug,
    images,
    price,
    salePrice,
    rating,
    reviewCount,
    brand,
    isNew,
    isSale,
  } = product;

  const discount = calculateDiscount(price, salePrice);
  const displayPrice = salePrice || price;
  const imageUrl = images?.[0]?.url || '/placeholder-shoe.jpg';

  return (
    <div className="card group relative overflow-hidden">
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
        {isNew && (
          <span className="px-2 py-1 text-xs font-semibold text-white bg-green-500 rounded">
            Mới
          </span>
        )}
        {discount > 0 && (
          <span className="px-2 py-1 text-xs font-semibold text-white bg-red-500 rounded">
            -{discount}%
          </span>
        )}
      </div>

      {/* Wishlist button */}
      {onWishlistToggle && (
        <button
          onClick={(e) => {
            e.preventDefault();
            onWishlistToggle(id);
          }}
          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/80 hover:bg-white shadow-sm transition-colors"
        >
          {isWishlisted ? (
            <HeartSolidIcon className="h-5 w-5 text-red-500" />
          ) : (
            <HeartIcon className="h-5 w-5 text-gray-600" />
          )}
        </button>
      )}

      {/* Image */}
      <Link to={`/products/${slug || id}`}>
        <div className="aspect-square overflow-hidden bg-gray-100">
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      </Link>

      {/* Info */}
      <div className="p-4">
        {/* Brand */}
        {brand && (
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            {brand.name}
          </p>
        )}

        {/* Name */}
        <Link to={`/products/${slug || id}`}>
          <h3 className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2 min-h-[48px]">
            {name}
          </h3>
        </Link>

        {/* Rating */}
        {rating > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <Rating value={rating} size="sm" />
            <span className="text-xs text-gray-500">
              ({reviewCount || 0})
            </span>
          </div>
        )}

        {/* Price */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-lg font-bold text-primary-600">
            {formatCurrency(displayPrice)}
          </span>
          {salePrice && price > salePrice && (
            <span className="text-sm text-gray-400 line-through">
              {formatCurrency(price)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
