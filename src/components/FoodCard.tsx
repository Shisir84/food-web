import React, { useState } from 'react';
import { Plus, Check, Star, Utensils } from 'lucide-react';
import { FoodItem } from '../types/index.ts';
import { useCart } from '../context/CartContext.tsx';
import { FoodCustomizationModal } from './FoodCustomizationModal.tsx';

interface FoodCardProps {
  item: FoodItem;
  onNavigateRestaurant?: (restaurantId: string) => void;
}

export const FoodCard: React.FC<FoodCardProps> = ({ item, onNavigateRestaurant }) => {
  const { addItem } = useCart();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddedFeedback, setIsAddedFeedback] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleQuickAdd = () => {
    if (item.customizations && item.customizations.length > 0) {
      setIsModalOpen(true);
      return;
    }
    addItem(item, 1);
    setIsAddedFeedback(true);
    setTimeout(() => setIsAddedFeedback(false), 1200);
  };

  const handleCustomConfirm = (quantity: number, selectedOptions: Record<string, string>) => {
    addItem(item, quantity, selectedOptions);
    setIsAddedFeedback(true);
    setTimeout(() => setIsAddedFeedback(false), 1200);
  };

  return (
    <>
      <div className="group relative bg-[#151518] border border-[#2B2B30] rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-1.5 hover:border-[#FF7900]/60 hover:shadow-xl hover:shadow-[#FF7900]/10 flex flex-col justify-between">
        <div>
          {/* Card Image Slot with Fallback */}
          <div className="relative h-48 w-full overflow-hidden bg-[#0B0B0D]">
            {!imgError ? (
              <img
                src={item.imageUrl}
                alt={item.name}
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#151518] to-[#0B0B0D] text-[#B8B8C0]">
                <Utensils className="w-8 h-8 mb-2 text-stone-600" />
                <span className="text-xs font-medium text-[#B8B8C0]">{item.name}</span>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-[#151518] via-transparent to-transparent opacity-85" />

            {/* Diet marker (Veg vs Non-Veg indicator) */}
            <div className="absolute top-3 left-3 bg-[#0B0B0D]/80 backdrop-blur-md p-1.5 rounded-md border border-[#2B2B30]">
              <div
                className={`w-3 h-3 rounded-sm border flex items-center justify-center ${
                  item.isVeg ? 'border-emerald-500' : 'border-rose-500'
                }`}
                title={item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    item.isVeg ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                />
              </div>
            </div>

            {/* Prep time badge */}
            <div className="absolute top-3 right-3 bg-[#0B0B0D]/80 backdrop-blur-md px-2 py-0.5 rounded-md border border-[#2B2B30] text-[11px] font-medium text-[#B8B8C0] tabular-nums">
              {item.preparationTimeMinutes} min
            </div>
          </div>

          {/* Card Info */}
          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-[#B8B8C0]">
              <span className="uppercase tracking-wider font-semibold text-[#FF7900] text-[10px]">
                {item.category}
              </span>
              {item.rating && (
                <div className="flex items-center gap-1 text-[#FF9D00] font-semibold tabular-nums text-[11px]">
                  <Star className="w-3 h-3 fill-[#FF9D00] stroke-none" />
                  <span>{item.rating.toFixed(1)}</span>
                </div>
              )}
            </div>

            <h3 className="font-bold text-white text-sm leading-snug group-hover:text-[#FF9D00] transition-colors line-clamp-1">
              {item.name}
            </h3>

            {item.restaurantName && onNavigateRestaurant && (
              <button
                type="button"
                onClick={() => onNavigateRestaurant(item.restaurantId)}
                className="text-[11px] text-[#B8B8C0] hover:text-[#FF9D00] transition-colors block truncate text-left"
              >
                {item.restaurantName}
              </button>
            )}

            <p className="text-xs text-[#B8B8C0] line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          </div>
        </div>

        {/* Card Footer with Price and Action */}
        <div className="p-4 pt-0 mt-2 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-stone-500 uppercase tracking-wider block">Price</span>
            <span className="text-base font-bold text-white tabular-nums">
              ${item.price.toFixed(2)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleQuickAdd}
            disabled={!item.isAvailable}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 ${
              !item.isAvailable
                ? 'bg-[#2B2B30] text-stone-500 cursor-not-allowed'
                : isAddedFeedback
                ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                : 'bg-[#0B0B0D] border border-[#2B2B30] text-white hover:border-[#FF7900] hover:text-[#FF9D00] hover:scale-[1.02] hover:shadow-md hover:shadow-[#FF7900]/15'
            }`}
          >
            {isAddedFeedback ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Added</span>
              </>
            ) : !item.isAvailable ? (
              <span>Sold Out</span>
            ) : item.customizations && item.customizations.length > 0 ? (
              <>
                <Plus className="w-3.5 h-3.5 text-[#FF7900]" />
                <span>Customize</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5 text-[#FF7900]" />
                <span>Add</span>
              </>
            )}
          </button>
        </div>
      </div>

      <FoodCustomizationModal
        foodItem={item}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleCustomConfirm}
      />
    </>
  );
};
