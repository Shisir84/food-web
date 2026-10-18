import React, { useState } from 'react';
import { Star, Clock, ShoppingBag, Store } from 'lucide-react';
import { RestaurantProfile } from '../types/index.ts';

interface RestaurantCardProps {
  restaurant: RestaurantProfile;
  onClick: (id: string) => void;
}

export const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant, onClick }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      onClick={() => onClick(restaurant.id)}
      className="group cursor-pointer bg-[#151518] border border-[#2B2B30] rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-1.5 hover:border-[#FF7900]/60 hover:shadow-xl hover:shadow-[#FF7900]/10 flex flex-col justify-between"
    >
      <div>
        {/* Cover Image */}
        <div className="relative h-44 w-full overflow-hidden bg-[#0B0B0D]">
          {!imgError ? (
            <img
              src={restaurant.coverImage}
              alt={restaurant.name}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#151518] to-[#0B0B0D] text-[#B8B8C0]">
              <Store className="w-10 h-10 mb-2 text-stone-600" />
              <span className="text-xs font-medium text-[#B8B8C0]">{restaurant.name}</span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-[#151518] via-transparent to-transparent opacity-85" />

          {/* Delivery estimate badge */}
          <div className="absolute bottom-3 right-3 bg-[#0B0B0D]/85 backdrop-blur-md px-2.5 py-1 rounded-lg border border-[#2B2B30] text-xs font-semibold text-white flex items-center gap-1.5 tabular-nums">
            <Clock className="w-3.5 h-3.5 text-[#FF7900]" />
            <span>{restaurant.deliveryTimeEstimate}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-base text-white group-hover:text-[#FF9D00] transition-colors line-clamp-1">
              {restaurant.name}
            </h3>

            <div className="flex items-center gap-1 bg-[#FF7900]/10 px-2 py-0.5 rounded-md text-xs font-bold text-[#FF9D00] shrink-0 tabular-nums">
              <Star className="w-3.5 h-3.5 fill-[#FF9D00] stroke-none" />
              <span>{restaurant.rating.toFixed(1)}</span>
            </div>
          </div>

          {/* Zero-Pill Unboxed Cuisines Metadata with dot separators */}
          <div className="flex items-center gap-2 text-xs text-[#B8B8C0] flex-wrap">
            {restaurant.cuisineTypes.map((cuisine, idx) => (
              <React.Fragment key={cuisine}>
                <span>{cuisine}</span>
                {idx < restaurant.cuisineTypes.length - 1 && (
                  <span aria-hidden="true" className="text-stone-600">
                    ·
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>

          <p className="text-xs text-[#B8B8C0] line-clamp-1">
            {restaurant.address}, {restaurant.city}
          </p>
        </div>
      </div>

      {/* Footer Info */}
      <div className="px-5 pb-5 pt-0 border-t border-[#2B2B30]/60 mt-3 flex items-center justify-between text-xs text-[#B8B8C0]">
        <div className="flex items-center gap-1">
          <ShoppingBag className="w-3.5 h-3.5 text-stone-500" />
          <span>
            Min order:{' '}
            <strong className="text-white font-medium tabular-nums">
              ${restaurant.minOrder.toFixed(2)}
            </strong>
          </span>
        </div>

        <span className="text-[#FF7900] font-semibold group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
          View Menu →
        </span>
      </div>
    </div>
  );
};
