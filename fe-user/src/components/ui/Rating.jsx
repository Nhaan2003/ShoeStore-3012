import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';

const Rating = ({
  value = 0,
  max = 5,
  size = 'md',
  showValue = false,
  onChange,
  readonly = true,
}) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const handleClick = (rating) => {
    if (!readonly && onChange) {
      onChange(rating);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {[...Array(max)].map((_, index) => {
        const rating = index + 1;
        const isFilled = rating <= value;

        return (
          <button
            key={index}
            type="button"
            onClick={() => handleClick(rating)}
            disabled={readonly}
            className={`
              ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}
              transition-transform
            `}
          >
            {isFilled ? (
              <StarIcon className={`${sizes[size]} text-yellow-400`} />
            ) : (
              <StarOutlineIcon className={`${sizes[size]} text-gray-300`} />
            )}
          </button>
        );
      })}
      {showValue && (
        <span className="ml-1 text-sm text-gray-600">
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default Rating;
