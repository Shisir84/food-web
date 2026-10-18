import React, { useState } from 'react';
import {
  ShoppingBag,
  Trash2,
  ArrowRight,
  Tag,
  Store,
  ArrowLeft,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';

interface CartViewProps {
  onNavigate: (path: string) => void;
}

export const CartView: React.FC<CartViewProps> = ({ onNavigate }) => {
  const {
    items,
    restaurantName,
    restaurantId,
    subtotal,
    deliveryFee,
    discount,
    tax,
    total,
    appliedCoupon,
    updateQuantity,
    removeItem,
    clearCart,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const [couponCode, setCouponCode] = useState('');
  const [couponStatus, setCouponStatus] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setIsApplying(true);
    setCouponStatus(null);
    try {
      const result = await applyCoupon(couponCode.trim());
      setCouponStatus(result);
      if (result.success) {
        setCouponCode('');
      }
    } finally {
      setIsApplying(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-center mx-auto text-stone-600">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="font-display text-2xl font-bold text-white">Your Cart is Empty</h2>
        <p className="text-xs text-stone-400 max-w-sm mx-auto">
          Explore top-rated artisan kitchens in your city and add your favorite dishes to start an order.
        </p>
        <button
          onClick={() => onNavigate('/restaurants')}
          className="btn-primary mt-4 px-6 py-3 text-xs font-bold shadow-md shadow-[#FF7900]/20 inline-flex items-center gap-2"
        >
          <span>Explore Restaurants</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-stone-800">
        <div>
          <button
            onClick={() => (restaurantId ? onNavigate(`/restaurants/${restaurantId}`) : onNavigate('/restaurants'))}
            className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-white transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Continue Shopping</span>
          </button>
          <h1 className="font-display text-3xl font-extrabold text-white">Shopping Cart</h1>
          {restaurantName && (
            <div className="flex items-center gap-1.5 text-xs text-stone-400 mt-1">
              <Store className="w-3.5 h-3.5 text-orange-400" />
              <span>
                Ordering from: <strong className="text-stone-200">{restaurantName}</strong>
              </span>
            </div>
          )}
        </div>

        <button
          onClick={clearCart}
          className="text-xs text-stone-500 hover:text-rose-400 transition-colors flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Cart</span>
        </button>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Items List */}
        <div className="lg:col-span-8 space-y-4">
          {items.map(({ foodItem, quantity, itemTotal, selectedOptions }) => (
            <div
              key={foodItem.id}
              className="p-4 sm:p-5 rounded-2xl bg-[#121316] border border-stone-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-stone-900 border border-stone-800 shrink-0">
                  <img
                    src={foodItem.imageUrl}
                    alt={foodItem.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-stone-100">{foodItem.name}</h3>
                  <div className="text-xs text-stone-400 mt-0.5">
                    ${foodItem.price.toFixed(2)} each
                  </div>
                  {selectedOptions && Object.keys(selectedOptions).length > 0 && (
                    <div className="text-[11px] text-amber-500/90 mt-1">
                      {Object.entries(selectedOptions)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(' · ')}
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-800">
                {/* Quantity Controls */}
                <div className="flex items-center gap-2.5 bg-stone-900 border border-stone-800 rounded-xl p-1">
                  <button
                    onClick={() => updateQuantity(foodItem.id, quantity - 1)}
                    className="w-6 h-6 rounded-lg bg-stone-800 text-stone-300 hover:text-white flex items-center justify-center font-bold text-xs"
                  >
                    -
                  </button>
                  <span className="text-xs font-bold text-stone-100 tabular-nums px-1.5">
                    {quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(foodItem.id, quantity + 1)}
                    className="w-6 h-6 rounded-lg bg-stone-800 text-stone-300 hover:text-white flex items-center justify-center font-bold text-xs"
                  >
                    +
                  </button>
                </div>

                {/* Subtotal */}
                <div className="text-right min-w-[70px]">
                  <span className="font-bold text-stone-100 text-sm tabular-nums">
                    ${itemTotal.toFixed(2)}
                  </span>
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeItem(foodItem.id)}
                  className="text-stone-500 hover:text-rose-400 transition-colors p-1"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary & Voucher */}
        <div className="lg:col-span-4 space-y-6">
          {/* Promo code form */}
          <div className="p-5 rounded-2xl bg-[#121316] border border-stone-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-stone-200">
              <Tag className="w-4 h-4 text-orange-400" />
              <span>Apply Promo Voucher</span>
            </div>

            {appliedCoupon ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-orange-500/10 border border-orange-500/30">
                <div>
                  <div className="text-xs font-bold text-orange-400">{appliedCoupon.code}</div>
                  <div className="text-[11px] text-stone-300">{appliedCoupon.description}</div>
                </div>
                <button
                  onClick={removeCoupon}
                  className="text-xs text-rose-400 hover:text-rose-300 font-medium"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="E.g. NOVAFIRST"
                    className="w-full bg-[#18191E] border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-orange-500 uppercase tracking-wider"
                  />
                  <button
                    type="submit"
                    disabled={isApplying || !couponCode.trim()}
                    className="px-4 py-2 text-xs font-bold text-black bg-orange-500 rounded-xl hover:bg-orange-400 disabled:opacity-50 transition-colors shrink-0"
                  >
                    Apply
                  </button>
                </div>
                {couponStatus && (
                  <p
                    className={`text-xs ${
                      couponStatus.success ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {couponStatus.message}
                  </p>
                )}
                <div className="text-[11px] text-stone-500">
                  Tip: Try code <strong className="text-stone-300">NOVAFIRST</strong> or{' '}
                  <strong className="text-stone-300">SUPERNOVA</strong>
                </div>
              </form>
            )}
          </div>

          {/* Pricing Breakdown */}
          <div className="p-6 rounded-2xl bg-[#121316] border border-stone-800 space-y-4">
            <h2 className="font-display font-bold text-base text-stone-100">Order Summary</h2>

            <div className="space-y-2.5 text-xs text-stone-400 border-b border-stone-800/80 pb-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-stone-200 tabular-nums font-semibold">
                  ${subtotal.toFixed(2)}
                </span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Voucher Discount</span>
                  <span className="tabular-nums font-semibold">-${discount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Delivery Partner Fee</span>
                <span className="text-stone-200 tabular-nums font-semibold">
                  ${deliveryFee.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Estimated Tax & Service (8%)</span>
                <span className="text-stone-200 tabular-nums font-semibold">${tax.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <span className="text-sm font-bold text-stone-100">Total to Pay</span>
              <span className="font-display text-2xl font-extrabold text-orange-400 tabular-nums">
                ${total.toFixed(2)}
              </span>
            </div>

            <button
              onClick={() => onNavigate('/checkout')}
              className="btn-primary w-full py-3.5 text-xs font-bold shadow-lg shadow-[#FF7900]/20 flex items-center justify-center gap-2"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
