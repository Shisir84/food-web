import React, { createContext, useContext, useState, useEffect } from 'react';
import { FoodItem, CartItem, Coupon } from '../types/index.ts';
import { api } from '../services/api.ts';

interface CartContextType {
  items: CartItem[];
  restaurantId: string | null;
  restaurantName: string | null;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  tax: number;
  total: number;
  appliedCoupon: Coupon | null;
  addItem: (foodItem: FoodItem, quantity?: number, selectedOptions?: Record<string, string>) => void;
  removeItem: (foodId: string) => void;
  updateQuantity: (foodId: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'nove_cart_state';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load cart from storage:', e);
    }
    return [];
  });

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save cart:', e);
    }
  }, [items]);

  const restaurantId = items.length > 0 ? items[0].foodItem.restaurantId : null;
  const restaurantName = items.length > 0 ? items[0].foodItem.restaurantName || null : null;

  const subtotal = items.reduce((sum, item) => sum + item.itemTotal, 0);
  const deliveryFee = items.length > 0 ? 3.99 : 0;

  let discount = 0;
  if (appliedCoupon && subtotal >= appliedCoupon.minOrder) {
    discount = (subtotal * appliedCoupon.discountPercent) / 100;
    if (appliedCoupon.maxDiscount && discount > appliedCoupon.maxDiscount) {
      discount = appliedCoupon.maxDiscount;
    }
  }

  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = items.length > 0 ? parseFloat((taxableAmount * 0.08).toFixed(2)) : 0;
  const total = parseFloat((subtotal + deliveryFee - discount + tax).toFixed(2));

  const addItem = (
    foodItem: FoodItem,
    quantity = 1,
    selectedOptions?: Record<string, string>
  ) => {
    setItems((prev) => {
      // If adding from a different restaurant, clear previous items to maintain single-restaurant order integrity
      if (prev.length > 0 && prev[0].foodItem.restaurantId !== foodItem.restaurantId) {
        const confirmed = window.confirm(
          `Your cart contains items from "${prev[0].foodItem.restaurantName || 'another restaurant'}". Would you like to clear your cart and start a new order from "${foodItem.restaurantName || 'this restaurant'}"?`
        );
        if (!confirmed) return prev;
        prev = [];
      }

      // Calculate unit price with options
      let unitPrice = foodItem.price;
      if (selectedOptions && foodItem.customizations) {
        for (const [title, choice] of Object.entries(selectedOptions)) {
          const group = foodItem.customizations.find((c) => c.title === title);
          if (group) {
            const opt = group.options.find((o) => o.name === choice);
            if (opt) unitPrice += opt.priceModifier;
          }
        }
      }

      const existingIndex = prev.findIndex((i) => i.foodItem.id === foodItem.id);
      if (existingIndex > -1) {
        const next = [...prev];
        const newQty = next[existingIndex].quantity + quantity;
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: newQty,
          selectedOptions: selectedOptions || next[existingIndex].selectedOptions,
          itemTotal: parseFloat((unitPrice * newQty).toFixed(2)),
        };
        return next;
      } else {
        return [
          ...prev,
          {
            foodItem,
            quantity,
            selectedOptions,
            itemTotal: parseFloat((unitPrice * quantity).toFixed(2)),
          },
        ];
      }
    });
  };

  const removeItem = (foodId: string) => {
    setItems((prev) => prev.filter((i) => i.foodItem.id !== foodId));
  };

  const updateQuantity = (foodId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(foodId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.foodItem.id === foodId) {
          const unitPrice = item.itemTotal / item.quantity;
          return {
            ...item,
            quantity,
            itemTotal: parseFloat((unitPrice * quantity).toFixed(2)),
          };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
  };

  const applyCoupon = async (code: string) => {
    try {
      const res = await api.validateCoupon(code, subtotal);
      if (res.valid) {
        setAppliedCoupon({
          code: res.code,
          discountPercent: 0,
          maxDiscount: res.discount,
          minOrder: 0,
          description: res.description,
          isActive: true,
        });
        return { success: true, message: `Promo code ${res.code} applied successfully!` };
      }
      return { success: false, message: 'Invalid coupon' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to apply coupon' };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        restaurantId,
        restaurantName,
        subtotal: parseFloat(subtotal.toFixed(2)),
        deliveryFee,
        discount: parseFloat(discount.toFixed(2)),
        tax,
        total,
        appliedCoupon,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        applyCoupon,
        removeCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
