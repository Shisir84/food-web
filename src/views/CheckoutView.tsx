import React, { useState, useEffect } from 'react';
import {
  MapPin,
  CreditCard,
  Banknote,
  ShieldCheck,
  ArrowLeft,
  Check,
  Plus,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useCart } from '../context/CartContext.tsx';
import { api } from '../services/api.ts';
import { Address } from '../types/index.ts';

interface CheckoutViewProps {
  onNavigate: (path: string) => void;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({ onNavigate }) => {
  const { user, refreshUser } = useAuth();
  const {
    items,
    restaurantId,
    restaurantName,
    subtotal,
    deliveryFee,
    discount,
    appliedCoupon,
    tax,
    total,
    clearCart,
  } = useCart();

  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newStreet, setNewStreet] = useState('');
  const [newCity, setNewCity] = useState('Metropolis');
  const [newPostal, setNewPostal] = useState('10001');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash_on_delivery' | 'card_online'>(
    'cash_on_delivery'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user?.savedAddresses && user.savedAddresses.length > 0) {
      const def = user.savedAddresses.find((a) => a.isDefault) || user.savedAddresses[0];
      setSelectedAddressId(def.id);
    } else {
      setIsAddingAddress(true);
    }
  }, [user]);

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Your cart is empty</h2>
        <p className="text-xs text-stone-400">Please add food items before checking out.</p>
        <button
          onClick={() => onNavigate('/restaurants')}
          className="px-5 py-2.5 text-xs font-bold text-black bg-orange-500 rounded-xl hover:bg-orange-400"
        >
          Browse Restaurants
        </button>
      </div>
    );
  }

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStreet.trim()) return;

    try {
      const res = await api.addAddress({
        street: newStreet.trim(),
        city: newCity.trim(),
        postalCode: newPostal.trim(),
        deliveryInstructions: deliveryInstructions.trim(),
        isDefault: true,
      });
      await refreshUser();
      setSelectedAddressId(res.newAddress.id);
      setIsAddingAddress(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save address');
    }
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      onNavigate('/login?redirect=checkout');
      return;
    }

    let activeAddress: Address | undefined;
    if (user.savedAddresses) {
      activeAddress = user.savedAddresses.find((a) => a.id === selectedAddressId);
    }

    if (!activeAddress && !newStreet.trim()) {
      setErrorMessage('Please provide or select a valid delivery address.');
      return;
    }

    if (!activeAddress) {
      activeAddress = {
        id: `addr_temp_${Date.now()}`,
        label: 'Delivery Location',
        street: newStreet.trim(),
        city: newCity.trim(),
        postalCode: newPostal.trim(),
        deliveryInstructions: deliveryInstructions.trim(),
      };
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const orderPayload = {
        restaurantId,
        items: items.map((i) => ({
          foodId: i.foodItem.id,
          quantity: i.quantity,
          selectedOptions: i.selectedOptions,
        })),
        deliveryAddress: activeAddress,
        deliveryInstructions: deliveryInstructions || activeAddress.deliveryInstructions,
        paymentMethod,
        couponCode: appliedCoupon?.code,
      };

      const createdOrder = await api.createOrder(orderPayload);
      clearCart();
      onNavigate(`/track-order/${createdOrder.id}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to place order. Please review your cart.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <button
        onClick={() => onNavigate('/cart')}
        className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Cart</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Delivery Address & Payment Method */}
        <div className="lg:col-span-8 space-y-8">
          {/* 1. Delivery Address Section */}
          <div className="p-6 rounded-2xl bg-[#121316] border border-stone-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-400" />
                <h2 className="font-display font-bold text-base text-white">Delivery Address</h2>
              </div>

              {user && !isAddingAddress && (
                <button
                  type="button"
                  onClick={() => setIsAddingAddress(true)}
                  className="text-xs text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Address</span>
                </button>
              )}
            </div>

            {user?.savedAddresses && user.savedAddresses.length > 0 && !isAddingAddress ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {user.savedAddresses.map((addr) => {
                  const isSelected = selectedAddressId === addr.id;
                  return (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`cursor-pointer p-4 rounded-xl border text-xs transition-all ${
                        isSelected
                          ? 'bg-amber-500/10 border-orange-500 text-stone-100'
                          : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:border-stone-700'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-stone-200 mb-1">
                        <span>{addr.label}</span>
                        {isSelected && <Check className="w-4 h-4 text-orange-400" />}
                      </div>
                      <p className="line-clamp-2">{addr.street}</p>
                      <p className="text-stone-500 text-[11px] mt-1">
                        {addr.city}, {addr.postalCode}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Add new address inline form */
              <form onSubmit={handleCreateAddress} className="space-y-3 pt-2">
                <div>
                  <label className="text-[11px] font-semibold text-stone-400 block mb-1">
                    Street Address & Apartment / Suite
                  </label>
                  <input
                    type="text"
                    required
                    value={newStreet}
                    onChange={(e) => setNewStreet(e.target.value)}
                    placeholder="e.g. 742 Evergreen Terrace, Apt 4B"
                    className="w-full bg-[#18191E] border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-stone-400 block mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      required
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                      className="w-full bg-[#18191E] border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-stone-100 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-stone-400 block mb-1">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      required
                      value={newPostal}
                      onChange={(e) => setNewPostal(e.target.value)}
                      className="w-full bg-[#18191E] border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-stone-100 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                {user && user.savedAddresses && user.savedAddresses.length > 0 && (
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingAddress(false)}
                      className="px-3 py-1.5 text-xs text-stone-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-xs font-bold text-black bg-orange-500 rounded-lg hover:bg-orange-400"
                    >
                      Save Address
                    </button>
                  </div>
                )}
              </form>
            )}

            {/* Delivery Instructions */}
            <div className="pt-3 border-t border-stone-800/80">
              <label className="text-[11px] font-semibold text-stone-400 block mb-1">
                Drop-off & Gate Instructions (Optional)
              </label>
              <input
                type="text"
                value={deliveryInstructions}
                onChange={(e) => setDeliveryInstructions(e.target.value)}
                placeholder="e.g. Ring doorbell, leave on front porch, call upon arrival"
                className="w-full bg-[#18191E] border border-stone-800 rounded-xl px-3.5 py-2 text-xs text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* 2. Payment Method Section */}
          <div className="p-6 rounded-2xl bg-[#121316] border border-stone-800 space-y-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-orange-400" />
              <h2 className="font-display font-bold text-base text-white">Payment Method</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Cash on Delivery */}
              <div
                onClick={() => setPaymentMethod('cash_on_delivery')}
                className={`cursor-pointer p-4 rounded-xl border flex items-start gap-3 transition-all ${
                  paymentMethod === 'cash_on_delivery'
                    ? 'bg-amber-500/10 border-orange-500 text-stone-100'
                    : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:border-stone-700'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-stone-800 flex items-center justify-center text-emerald-400 shrink-0">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-stone-200">Cash on Delivery (COD)</div>
                  <p className="text-[11px] text-stone-400 mt-0.5 leading-snug">
                    Pay directly in cash or mobile QR to the rider upon delivery.
                  </p>
                </div>
              </div>

              {/* Online Card */}
              <div
                onClick={() => setPaymentMethod('card_online')}
                className={`cursor-pointer p-4 rounded-xl border flex items-start gap-3 transition-all ${
                  paymentMethod === 'card_online'
                    ? 'bg-amber-500/10 border-orange-500 text-stone-100'
                    : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:border-stone-700'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-stone-800 flex items-center justify-center text-orange-400 shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-stone-200">Card / Digital Wallet</div>
                  <p className="text-[11px] text-stone-400 mt-0.5 leading-snug">
                    Instant secure gateway verification (Demo auto-cleared).
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-stone-500 pt-1">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>256-bit SSL encrypted. Raw payment credentials are never stored.</span>
            </div>
          </div>
        </div>

        {/* Right Column: Order Confirmation Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-2xl bg-[#121316] border border-stone-800 space-y-4">
            <h2 className="font-display font-bold text-base text-white">Review Order</h2>

            <div className="text-xs text-stone-400 pb-2 border-b border-stone-800">
              Kitchen: <strong className="text-stone-200">{restaurantName}</strong>
            </div>

            {/* Compact items list */}
            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
              {items.map(({ foodItem, quantity, itemTotal }) => (
                <div key={foodItem.id} className="flex justify-between text-xs">
                  <span className="text-stone-300">
                    {quantity}x {foodItem.name}
                  </span>
                  <span className="tabular-nums font-semibold text-stone-200">
                    ${itemTotal.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="pt-3 border-t border-stone-800/80 space-y-2 text-xs text-stone-400">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-stone-200 tabular-nums">${subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount ({appliedCoupon?.code})</span>
                  <span className="tabular-nums">-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span className="text-stone-200 tabular-nums">${deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Tax</span>
                <span className="text-stone-200 tabular-nums">${tax.toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-800 flex items-baseline justify-between">
              <span className="text-sm font-bold text-white">Final Amount</span>
              <span className="font-display text-2xl font-extrabold text-orange-400 tabular-nums">
                ${total.toFixed(2)}
              </span>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {errorMessage}
              </div>
            )}

            <button
              onClick={handlePlaceOrder}
              disabled={isSubmitting}
              className="w-full py-4 text-xs font-bold text-black bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 rounded-xl hover:opacity-95 active:scale-95 disabled:opacity-50 transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span>Placing Your Order...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Confirm & Place Order</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
