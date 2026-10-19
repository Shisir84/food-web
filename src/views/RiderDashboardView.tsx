import React, { useState, useEffect } from 'react';
import {
  Bike,
  Power,
  DollarSign,
  PackageCheck,
  Star,
  MapPin,
  Clock,
  Phone,
  CheckCircle2,
  AlertCircle,
  Truck,
  RotateCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { Order, RiderProfile } from '../types/index.ts';

interface RiderDashboardViewProps {
  onNavigate: (path: string) => void;
}

export const RiderDashboardView: React.FC<RiderDashboardViewProps> = ({ onNavigate }) => {
  const { riderProfile, user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<RiderProfile | null>(riderProfile);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [myDeliveries, setMyDeliveries] = useState<Order[]>([]);
  const [isToggling, setIsToggling] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // If rider is not approved, redirect immediately to pending screen
  useEffect(() => {
    if (profile && profile.status !== 'approved') {
      onNavigate('/rider/pending');
    }
  }, [profile, onNavigate]);

  const loadRiderData = async () => {
    try {
      const [prof, available, my] = await Promise.all([
        api.getRiderProfile(),
        api.getRiderAvailableOrders().catch(() => []),
        api.getRiderDeliveries().catch(() => []),
      ]);
      setProfile(prof);
      setAvailableOrders(available);
      setMyDeliveries(my);
    } catch (err: any) {
      console.warn('Rider data error:', err);
      if (err.message?.includes('status is')) {
        onNavigate('/rider/pending');
      }
    }
  };

  useEffect(() => {
    loadRiderData();
    const interval = setInterval(loadRiderData, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleOnline = async () => {
    setIsToggling(true);
    setErrorMessage(null);
    try {
      const res = await api.toggleRiderOnline();
      setProfile((prev) => (prev ? { ...prev, isOnline: res.isOnline } : null));
      await loadRiderData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to toggle availability status');
      if (err.message?.includes('not approved')) {
        onNavigate('/rider/pending');
      }
    } finally {
      setIsToggling(false);
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    try {
      await api.acceptRiderOrder(orderId);
      setActionSuccess(`Accepted delivery assignment for order ${orderId}`);
      setTimeout(() => setActionSuccess(null), 3000);
      await loadRiderData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not claim delivery');
    }
  };

  const handlePickupOrder = async (orderId: string) => {
    try {
      await api.pickupRiderOrder(orderId);
      setActionSuccess('Order picked up from kitchen! En route to customer.');
      setTimeout(() => setActionSuccess(null), 3000);
      await loadRiderData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not confirm pickup');
    }
  };

  const handleDeliverOrder = async (orderId: string) => {
    try {
      await api.deliverRiderOrder(orderId);
      setActionSuccess('Delivery completed! Earnings credited to your rider account.');
      setTimeout(() => setActionSuccess(null), 3000);
      await loadRiderData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not confirm delivery');
    }
  };

  // Active delivery (assigned or picked up)
  const activeDelivery = myDeliveries.find((d) =>
    ['rider_assigned', 'picked_up', 'out_for_delivery'].includes(d.status)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Rider Header & Availability Toggle */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#121316] border border-stone-800 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center">
            <Bike className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold text-white">
                {profile?.fullName || user?.name}
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                Approved Rider
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              {profile?.city} · {profile?.vehicleType.toUpperCase()} ({profile?.vehicleRegNumber})
            </p>
          </div>
        </div>

        {/* Online / Offline switch */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-stone-400 block">
              Duty Status
            </span>
            <span
              className={`text-xs font-bold ${
                profile?.isOnline ? 'text-emerald-400' : 'text-stone-500'
              }`}
            >
              {profile?.isOnline ? 'Online & Receiving Jobs' : 'Offline'}
            </span>
          </div>

          <button
            onClick={handleToggleOnline}
            disabled={isToggling}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs transition-all active:scale-95 shadow-lg ${
              profile?.isOnline
                ? 'bg-emerald-500 text-black shadow-emerald-500/20 hover:bg-emerald-400'
                : 'bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{profile?.isOnline ? 'Go Offline' : 'Go Online'}</span>
          </button>
        </div>
      </div>

      {/* Status feedback alerts */}
      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Earnings & Performance KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#121316] border border-stone-800 space-y-1">
          <span className="text-[11px] text-stone-400 font-medium">Today's Earnings</span>
          <div className="font-display text-2xl font-extrabold text-white tabular-nums">
            ${(profile?.todayEarnings || 0).toFixed(2)}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#121316] border border-stone-800 space-y-1">
          <span className="text-[11px] text-stone-400 font-medium">This Week</span>
          <div className="font-display text-2xl font-extrabold text-white tabular-nums">
            ${(profile?.weekEarnings || 0).toFixed(2)}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#121316] border border-stone-800 space-y-1">
          <span className="text-[11px] text-stone-400 font-medium">Completed Deliveries</span>
          <div className="font-display text-2xl font-extrabold text-white tabular-nums">
            {profile?.totalDeliveries || 0}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#121316] border border-stone-800 space-y-1">
          <span className="text-[11px] text-stone-400 font-medium">Rider Rating</span>
          <div className="font-display text-2xl font-extrabold text-amber-400 tabular-nums flex items-center gap-1.5">
            <Star className="w-5 h-5 fill-amber-400 stroke-none" />
            <span>{(profile?.rating || 5.0).toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* ACTIVE DELIVERY ASSIGNMENT (If in progress) */}
      {activeDelivery && (
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-stone-900 to-[#18191E] border border-orange-500/40 shadow-2xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping" />
              <h2 className="font-display text-xl font-bold text-white">Active Delivery Job</h2>
            </div>
            <span className="text-xs font-mono font-bold text-orange-400">
              #{activeDelivery.orderNumber}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Step 1: Restaurant Pickup */}
            <div className="p-5 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-400 uppercase font-bold text-[10px]">Step 1: Pickup</span>
                <span className="text-orange-400 font-semibold">{activeDelivery.restaurantName}</span>
              </div>
              <p className="text-xs text-stone-300 font-medium">
                {activeDelivery.restaurantAddress || 'Downtown Central'}
              </p>
              <div className="text-[11px] text-stone-400">
                Package: {activeDelivery.items.reduce((s, i) => s + i.quantity, 0)} meal items
              </div>

              {activeDelivery.status === 'rider_assigned' && (
                <button
                  onClick={() => handlePickupOrder(activeDelivery.id)}
                  className="w-full py-2.5 text-xs font-bold text-black bg-orange-500 rounded-xl hover:bg-orange-400 transition-colors shadow-md shadow-orange-500/20"
                >
                  Confirm Order Picked Up
                </button>
              )}
            </div>

            {/* Step 2: Customer Drop-off */}
            <div className="p-5 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-400 uppercase font-bold text-[10px]">Step 2: Drop-off</span>
                <span className="text-emerald-400 font-semibold">{activeDelivery.customerName}</span>
              </div>
              <p className="text-xs text-stone-300 font-medium">
                {activeDelivery.deliveryAddress.street}, {activeDelivery.deliveryAddress.city}
              </p>
              {activeDelivery.deliveryInstructions && (
                <div className="text-[11px] text-amber-400 italic">
                  Note: "{activeDelivery.deliveryInstructions}"
                </div>
              )}

              {activeDelivery.status === 'out_for_delivery' && (
                <button
                  onClick={() => handleDeliverOrder(activeDelivery.id)}
                  className="w-full py-2.5 text-xs font-bold text-black bg-emerald-500 rounded-xl hover:bg-emerald-400 transition-colors shadow-md shadow-emerald-500/20"
                >
                  Confirm Delivered to Customer
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Available Delivery Requests Pool */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-white">Available Deliveries Pool</h2>
            <p className="text-xs text-stone-400">
              Kitchens with ready food awaiting courier dispatch in your delivery zone.
            </p>
          </div>
          <button
            onClick={loadRiderData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs text-stone-300"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        {!profile?.isOnline ? (
          <div className="p-10 rounded-2xl bg-[#121316] border border-stone-800 text-center space-y-3">
            <Power className="w-8 h-8 text-stone-600 mx-auto" />
            <h3 className="text-sm font-bold text-stone-300">You are currently Offline</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Turn your availability status to Online above to see and claim live delivery orders.
            </p>
          </div>
        ) : availableOrders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableOrders.map((order, idx) => (
              <div
                key={`${order.id}-${idx}`}
                className="p-5 rounded-2xl bg-[#121316] border border-stone-800 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-stone-200">{order.restaurantName}</span>
                    <span className="text-emerald-400 font-bold tabular-nums">+$5.50 Payout</span>
                  </div>
                  <div className="text-xs text-stone-400 mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                    <span className="truncate">To: {order.deliveryAddress.street}</span>
                  </div>
                  <div className="text-[11px] text-stone-500 mt-2">
                    {order.items.length} items · Est. 15 min trip
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-stone-800">
                  <button
                    onClick={() => handleAcceptOrder(order.id)}
                    className="w-full py-2.5 text-xs font-bold text-black bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl hover:opacity-95 transition-all shadow-md shadow-orange-500/20"
                  >
                    Accept Delivery
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 rounded-2xl bg-[#121316] border border-stone-800 text-center text-xs text-stone-400">
            No unclaimed deliveries right now. You are online and will receive an alert as soon as kitchens prepare orders.
          </div>
        )}
      </div>

      {/* Recent delivery history */}
      <div className="space-y-4 pt-6 border-t border-stone-800">
        <h2 className="font-display text-xl font-bold text-white">Your Delivery History</h2>
        {myDeliveries.filter((d) => d.status === 'delivered').length > 0 ? (
          <div className="divide-y divide-stone-800 rounded-2xl bg-[#121316] border border-stone-800 overflow-hidden">
            {myDeliveries
              .filter((d) => d.status === 'delivered')
              .map((d) => (
                <div key={d.id} className="p-4 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono text-stone-200 font-bold">{d.orderNumber}</span>
                    <span className="text-stone-400 block">{d.restaurantName}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-400 font-bold tabular-nums">+$5.50</span>
                    <span className="text-stone-500 block text-[11px]">Completed</span>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-xs text-stone-500">No completed deliveries yet today.</p>
        )}
      </div>
    </div>
  );
};
