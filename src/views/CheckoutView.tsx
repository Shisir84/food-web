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
  User,
  Mail,
  Phone,
  AlertCircle,
  LogIn,
  Store,
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

  // Contact info (used for guest or pre-filled from user)
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');

  // Address info
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newStreet, setNewStreet] = useState('');
  const [newCity, setNewCity] = useState('Metropolis');
  const [newPostal, setNewPostal] = useState('10001');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<'cash_on_delivery' | 'card_online'>(
    'cash_on_delivery'
  );

  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState(false);

  useEffect(() => {
    if (user) {
      setCustomerName(user.name);
      setCustomerEmail(user.email);
      if (user.phone) setCustomerPhone(user.phone);

      if (user.savedAddresses && user.savedAddresses.length > 0) {
        const def = user.savedAddresses.find((a) => a.isDefault) || user.savedAddresses[0];
        setSelectedAddressId(def.id);
        setIsAddingAddress(false);
      } else {
        setIsAddingAddress(true);
      }
    } else {
      setIsAddingAddress(true);
    }
  }, [user]);

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-[#151518] border border-[#2B2B30] flex items-center justify-center mx-auto text-[#FF7900]">
          <Store className="w-8 h-8" />
        </div>
        <h2 className="font-display text-2xl font-bold text-white">Your Cart is Empty</h2>
        <p className="text-xs text-[#B8B8C0]">
          Please browse restaurants and add items to your cart before proceeding to checkout.
        </p>
        <button
          onClick={() => onNavigate('/restaurants')}
          className="btn-primary mt-4 px-6 py-3 text-xs font-bold inline-flex items-center gap-2"
        >
          Explore Restaurants
        </button>
      </div>
    );
  }

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStreet.trim()) return;

    if (user) {
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
        setErrorMessage(
          err.message && err.message.includes('Unauthorized')
            ? 'Your session has expired. You can continue as a guest or sign in again.'
            : (err.message || 'Unable to save address')
        );
      }
    } else {
      setIsAddingAddress(false);
    }
  };

  const handlePlaceOrder = async () => {
    setErrorMessage(null);
    setSessionExpiredNotice(false);

    // 1. Validate Customer Info
    const trimmedName = (user?.name || customerName).trim();
    const trimmedEmail = (user?.email || customerEmail).trim().toLowerCase();
    const trimmedPhone = (user?.phone || customerPhone).trim();

    if (!trimmedName || trimmedName.length < 2) {
      setErrorMessage('Please provide your full name for order delivery.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setErrorMessage('Please provide a valid email address to receive your order receipt.');
      return;
    }

    if (!trimmedPhone || trimmedPhone.length < 7) {
      setErrorMessage('Please provide a valid contact phone number for the delivery courier.');
      return;
    }

    // 2. Validate Delivery Address
    let activeAddress: Address | undefined;
    if (user && user.savedAddresses && user.savedAddresses.length > 0 && !isAddingAddress) {
      activeAddress = user.savedAddresses.find((a) => a.id === selectedAddressId);
    }

    if (!activeAddress) {
      if (!newStreet.trim() || !newCity.trim()) {
        setErrorMessage('Please enter your complete delivery street address and city.');
        return;
      }
      activeAddress = {
        id: `addr_${Date.now()}`,
        label: 'Delivery Address',
        street: newStreet.trim(),
        city: newCity.trim(),
        postalCode: newPostal.trim() || '10001',
        deliveryInstructions: deliveryInstructions.trim(),
      };
    }

    setIsSubmitting(true);

    try {
      const orderPayload = {
        restaurantId,
        items: items.map((i) => ({
          foodId: i.foodItem.id,
          quantity: i.quantity,
          selectedOptions: i.selectedOptions,
        })),
        deliveryAddress: activeAddress,
        deliveryInstructions: deliveryInstructions || activeAddress.deliveryInstructions || '',
        paymentMethod,
        couponCode: appliedCoupon?.code,
        customerName: trimmedName,
        customerEmail: trimmedEmail,
        customerPhone: trimmedPhone,
      };

      const createdOrder = await api.createOrder(orderPayload);
      clearCart();
      onNavigate(`/track-order/${createdOrder.id}`);
    } catch (err: any) {
      console.error('Checkout error:', err);
      const errMsg = err.message || '';

      if (
        errMsg.includes('Unauthorized') ||
        errMsg.includes('Valid session token required') ||
        errMsg.includes('SESSION_EXPIRED') ||
        errMsg.includes('expired')
      ) {
        setSessionExpiredNotice(true);
        setErrorMessage(
          'Your saved session has expired. You can complete this order immediately using Guest Checkout below, or sign in again.'
        );
        // Clear stale token so guest submission succeeds immediately
        api.clearToken();
      } else {
        setErrorMessage(errMsg || 'Failed to complete order. Please review your cart and details.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <button
        onClick={() => onNavigate('/cart')}
        className="flex items-center gap-1.5 text-xs text-[#B8B8C0] hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Cart</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Contact, Address & Payment */}
        <div className="lg:col-span-8 space-y-6">
          {/* Notice if session expired */}
          {sessionExpiredNotice && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-200">
              <AlertCircle className="w-5 h-5 text-[#FF9D00] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-white block">Session Notice</span>
                <p>
                  Your previous login session has expired. You can continue below with{' '}
                  <strong className="text-white">Instant Guest Checkout</strong>, or{' '}
                  <button
                    onClick={() => onNavigate('/login?redirect=checkout')}
                    className="underline text-[#FF9D00] hover:text-white font-semibold"
                  >
                    click here to sign in
                  </button>
                  .
                </p>
              </div>
            </div>
          )}

          {/* 1. Customer Contact Details */}
          <div className="p-6 rounded-2xl bg-[#151518] border border-[#2B2B30] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-[#FF7900]" />
                <h2 className="font-display font-bold text-base text-white">Contact Information</h2>
              </div>

              {!user && (
                <button
                  type="button"
                  onClick={() => onNavigate('/login?redirect=checkout')}
                  className="text-xs text-[#FF9D00] hover:text-white font-semibold flex items-center gap-1 transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In for Saved Addresses</span>
                </button>
              )}

              {user && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-semibold text-emerald-400">
                  <Check className="w-3 h-3" />
                  <span>Authenticated Customer</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="text-[11px] font-semibold text-[#B8B8C0] block mb-1">
                  Full Name <span className="text-[#FF7900]">*</span>
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Elena Rostova"
                    className="w-full bg-[#0B0B0D] border border-[#2B2B30] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-stone-600 focus:outline-none focus:border-[#FF7900]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#B8B8C0] block mb-1">
                  Email Address <span className="text-[#FF7900]">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-[#0B0B0D] border border-[#2B2B30] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-stone-600 focus:outline-none focus:border-[#FF7900]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#B8B8C0] block mb-1">
                  Mobile Phone <span className="text-[#FF7900]">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-[#0B0B0D] border border-[#2B2B30] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-stone-600 focus:outline-none focus:border-[#FF7900]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Delivery Address Section */}
          <div className="p-6 rounded-2xl bg-[#151518] border border-[#2B2B30] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#FF7900]" />
                <h2 className="font-display font-bold text-base text-white">Delivery Address</h2>
              </div>

              {user?.savedAddresses && user.savedAddresses.length > 0 && !isAddingAddress && (
                <button
                  type="button"
                  onClick={() => setIsAddingAddress(true)}
                  className="text-xs text-[#FF9D00] hover:text-white font-semibold flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Use Another Address</span>
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
                          ? 'bg-[#FF7900]/10 border-[#FF7900] text-white shadow-md shadow-[#FF7900]/10'
                          : 'bg-[#0B0B0D] border-[#2B2B30] text-[#B8B8C0] hover:border-[#FF7900]/40'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-white mb-1">
                        <span>{addr.label || 'Saved Location'}</span>
                        {isSelected && <Check className="w-4 h-4 text-[#FF7900]" />}
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
              /* Inline Address Form */
              <form onSubmit={handleSaveAddress} className="space-y-3 pt-1">
                <div>
                  <label className="text-[11px] font-semibold text-[#B8B8C0] block mb-1">
                    Street Address & Apartment / Suite <span className="text-[#FF7900]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newStreet}
                    onChange={(e) => setNewStreet(e.target.value)}
                    placeholder="e.g. 742 Evergreen Terrace, Apt 4B"
                    className="w-full bg-[#0B0B0D] border border-[#2B2B30] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-stone-600 focus:outline-none focus:border-[#FF7900]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-[#B8B8C0] block mb-1">
                      City <span className="text-[#FF7900]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                      className="w-full bg-[#0B0B0D] border border-[#2B2B30] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#FF7900]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#B8B8C0] block mb-1">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      value={newPostal}
                      onChange={(e) => setNewPostal(e.target.value)}
                      className="w-full bg-[#0B0B0D] border border-[#2B2B30] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#FF7900]"
                    />
                  </div>
                </div>

                {user && user.savedAddresses && user.savedAddresses.length > 0 && (
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingAddress(false)}
                      className="px-3 py-1.5 text-xs text-[#B8B8C0] hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary px-4 py-1.5 text-xs font-bold"
                    >
                      Save to My Profile
                    </button>
                  </div>
                )}
              </form>
            )}

            {/* Delivery Instructions */}
            <div className="pt-3 border-t border-[#2B2B30]">
              <label className="text-[11px] font-semibold text-[#B8B8C0] block mb-1">
                Drop-off & Gate Instructions (Optional)
              </label>
              <input
                type="text"
                value={deliveryInstructions}
                onChange={(e) => setDeliveryInstructions(e.target.value)}
                placeholder="e.g. Ring bell 4B, leave by door, call upon arrival"
                className="w-full bg-[#0B0B0D] border border-[#2B2B30] rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-stone-600 focus:outline-none focus:border-[#FF7900]"
              />
            </div>
          </div>

          {/* 3. Payment Method Section */}
          <div className="p-6 rounded-2xl bg-[#151518] border border-[#2B2B30] space-y-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#FF7900]" />
              <h2 className="font-display font-bold text-base text-white">Payment Method</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Cash on Delivery */}
              <div
                onClick={() => setPaymentMethod('cash_on_delivery')}
                className={`cursor-pointer p-4 rounded-xl border flex items-start gap-3 transition-all ${
                  paymentMethod === 'cash_on_delivery'
                    ? 'bg-[#FF7900]/10 border-[#FF7900] text-white shadow-md shadow-[#FF7900]/10'
                    : 'bg-[#0B0B0D] border-[#2B2B30] text-[#B8B8C0] hover:border-[#FF7900]/40'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-[#151518] flex items-center justify-center text-emerald-400 shrink-0 border border-[#2B2B30]">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-white">Cash on Delivery (COD)</div>
                  <p className="text-[11px] text-[#B8B8C0] mt-0.5 leading-snug">
                    Pay safely in cash or mobile QR to the rider upon meal delivery.
                  </p>
                </div>
              </div>

              {/* Online Card */}
              <div
                onClick={() => setPaymentMethod('card_online')}
                className={`cursor-pointer p-4 rounded-xl border flex items-start gap-3 transition-all ${
                  paymentMethod === 'card_online'
                    ? 'bg-[#FF7900]/10 border-[#FF7900] text-white shadow-md shadow-[#FF7900]/10'
                    : 'bg-[#0B0B0D] border-[#2B2B30] text-[#B8B8C0] hover:border-[#FF7900]/40'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-[#151518] flex items-center justify-center text-[#FF7900] shrink-0 border border-[#2B2B30]">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-white">Card / Digital Wallet</div>
                  <p className="text-[11px] text-[#B8B8C0] mt-0.5 leading-snug">
                    Secure 256-bit encrypted gateway verification (Instant authorization).
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-stone-500 pt-1">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>SSL 256-bit encrypted. Payment details are handled securely.</span>
            </div>
          </div>
        </div>

        {/* Right Column: Order Confirmation Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-2xl bg-[#151518] border border-[#2B2B30] space-y-4 sticky top-28">
            <h2 className="font-display font-bold text-base text-white">Review Order</h2>

            <div className="text-xs text-[#B8B8C0] pb-2 border-b border-[#2B2B30]">
              Kitchen: <strong className="text-white">{restaurantName}</strong>
            </div>

            {/* Compact items list */}
            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
              {items.map(({ foodItem, quantity, itemTotal }) => (
                <div key={foodItem.id} className="flex justify-between text-xs">
                  <span className="text-stone-300">
                    {quantity}x {foodItem.name}
                  </span>
                  <span className="tabular-nums font-semibold text-white">
                    ${itemTotal.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Pricing Calculations */}
            <div className="pt-3 border-t border-[#2B2B30] space-y-2 text-xs text-[#B8B8C0]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-white tabular-nums">${subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Voucher Discount ({appliedCoupon?.code})</span>
                  <span className="tabular-nums">-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery Partner Fee</span>
                <span className="text-white tabular-nums">${deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Tax (8%)</span>
                <span className="text-white tabular-nums">${tax.toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-[#2B2B30] flex items-baseline justify-between">
              <span className="text-sm font-bold text-white">Final Amount</span>
              <span className="font-display text-2xl font-extrabold text-[#FF7900] tabular-nums">
                ${total.toFixed(2)}
              </span>
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              onClick={handlePlaceOrder}
              disabled={isSubmitting}
              className="btn-primary w-full py-4 text-xs font-bold shadow-lg shadow-[#FF7900]/20 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  <span>Confirming Order...</span>
                </div>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Confirm & Place Order</span>
                </>
              )}
            </button>

            <p className="text-[11px] text-stone-500 text-center">
              By confirming, you agree to Nova Hunger Food&apos;s delivery terms.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
