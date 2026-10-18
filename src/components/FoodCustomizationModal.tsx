import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { FoodItem } from '../types/index.ts';

interface FoodCustomizationModalProps {
  foodItem: FoodItem;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (quantity: number, selectedOptions: Record<string, string>) => void;
}

export const FoodCustomizationModal: React.FC<FoodCustomizationModalProps> = ({
  foodItem,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    if (foodItem.customizations) {
      for (const group of foodItem.customizations) {
        if (group.required && group.options.length > 0) {
          initial[group.title] = group.options[0].name;
        }
      }
    }
    return initial;
  });

  if (!isOpen) return null;

  // Calculate dynamic price
  let currentUnitPrice = foodItem.price;
  if (foodItem.customizations) {
    for (const [title, choice] of Object.entries(selectedOptions)) {
      const group = foodItem.customizations.find((c) => c.title === title);
      if (group) {
        const opt = group.options.find((o) => o.name === choice);
        if (opt) currentUnitPrice += opt.priceModifier;
      }
    }
  }

  const calculatedTotal = parseFloat((currentUnitPrice * quantity).toFixed(2));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#121316] border border-stone-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="relative h-44 overflow-hidden bg-stone-900">
          <img
            src={foodItem.imageUrl}
            alt={foodItem.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#121316] via-transparent to-black/40" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-stone-200 hover:text-white hover:bg-black/80 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-3 left-4 right-4">
            <span className="text-xs font-semibold text-orange-400 uppercase tracking-wider">
              {foodItem.category}
            </span>
            <h3 className="text-lg font-bold text-white leading-snug">{foodItem.name}</h3>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          <p className="text-xs text-stone-400 leading-relaxed">{foodItem.description}</p>

          {foodItem.customizations &&
            foodItem.customizations.map((group) => (
              <div key={group.title} className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-stone-200">{group.title}</span>
                  {group.required ? (
                    <span className="text-[10px] text-amber-500 font-medium">Required</span>
                  ) : (
                    <span className="text-[10px] text-stone-500">Optional</span>
                  )}
                </div>

                <div className="space-y-1.5">
                  {group.options.map((option) => {
                    const isSelected = selectedOptions[group.title] === option.name;
                    return (
                      <button
                        key={option.name}
                        type="button"
                        onClick={() => {
                          setSelectedOptions((prev) => {
                            if (isSelected && !group.required) {
                              const next = { ...prev };
                              delete next[group.title];
                              return next;
                            }
                            return { ...prev, [group.title]: option.name };
                          });
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs text-left transition-all ${
                          isSelected
                            ? 'bg-amber-500/10 border-orange-500 text-stone-100'
                            : 'bg-stone-900/60 border-stone-800 text-stone-300 hover:border-stone-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-4 h-4 rounded-full flex items-center justify-center border transition-colors ${
                              isSelected
                                ? 'bg-orange-500 border-orange-500 text-black'
                                : 'border-stone-700'
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                          <span>{option.name}</span>
                        </div>
                        <span className="tabular-nums font-semibold text-stone-300">
                          {option.priceModifier > 0
                            ? `+$${option.priceModifier.toFixed(2)}`
                            : 'Free'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

          {/* Quantity Controls */}
          <div className="pt-2 flex items-center justify-between border-t border-stone-800/80">
            <span className="text-xs font-semibold text-stone-300">Quantity</span>
            <div className="flex items-center gap-3 bg-stone-900 border border-stone-800 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-7 h-7 rounded-lg bg-stone-800 text-stone-300 hover:text-white flex items-center justify-center font-bold text-sm"
              >
                -
              </button>
              <span className="text-xs font-bold text-stone-100 tabular-nums px-2">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-7 h-7 rounded-lg bg-stone-800 text-stone-300 hover:text-white flex items-center justify-center font-bold text-sm"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 bg-stone-950 border-t border-stone-800 flex items-center justify-between gap-4">
          <div>
            <span className="text-[11px] text-stone-400 block">Total Price</span>
            <span className="text-base font-bold text-orange-400 tabular-nums">
              ${calculatedTotal.toFixed(2)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              onConfirm(quantity, selectedOptions);
              onClose();
            }}
            className="px-6 py-2.5 text-xs font-bold text-stone-950 bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl hover:opacity-95 active:scale-95 transition-all shadow-md shadow-orange-500/20"
          >
            Add to Order
          </button>
        </div>
      </div>
    </div>
  );
};
