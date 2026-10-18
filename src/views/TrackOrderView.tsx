import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  Bike,
  Store,
  MapPin,
  Phone,
  ShieldCheck,
  ChevronRight,
  Flame,
  PackageCheck,
  Truck,
  RotateCw,
} from 'lucide-react';
import { Order, OrderStatus } from '../types/index.ts';
import { api } from '../services/api.ts';

interface TrackOrderViewProps {
  orderId: string;
  onNavigate: (path: string) => void;
}

const ORDER_STAGES: { status: OrderStatus; label: string; description: string }[] = [
  { status: 'placed', label: 'Order Placed', description: 'Order sent to restaurant' },
  { status: 'restaurant_accepted', label: 'Restaurant Accepted', description: 'Kitchen confirmed order' },
  { status: 'preparing', label: 'Food Preparation', description: 'Chef is preparing your meal' },
  { status: 'ready_for_pickup', label: 'Ready for Pickup', description: 'Thermal meal packaged and ready' },
  { status: 'rider_assigned', label: 'Rider Assigned', description: 'Courier dispatched to restaurant' },
  { status: 'picked_up', label: 'Picked Up', description: 'Rider collected thermal package' },
  { status: 'out_for_delivery', label: 'Out for Delivery', description: 'Courier en route to your address' },
  { status: 'delivered', label: 'Delivered', description: 'Handed directly to you' },
];

export const TrackOrderView: React.FC<TrackOrderViewProps> = ({ orderId, onNavigate }) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdvancing, setIsAdvancing] = useState(false);

  const fetchOrder = async () => {
    try {
      const data = await api.getOrder(orderId);
      setOrder(data);
    } catch (err: any) {
      setError(err.message || 'Order not found');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 6000); // Polling for live status
    return () => clearInterval(interval);
  }, [orderId]);

  // Simulator for instant interactive demonstration of live order tracking
  const handleSimulateNextStage = async () => {
    if (!order) return;
    const currentIndex = ORDER_STAGES.findIndex((s) => s.status === order.status);
    if (currentIndex >= ORDER_STAGES.length - 1) return;

    const nextStage = ORDER_STAGES[currentIndex + 1];
    setIsAdvancing(true);

    try {
      // If advancing to rider assigned, auto-assign rider 1
      if (nextStage.status === 'rider_assigned') {
        await api.reassignOrderRider(order.id, 'rider_1');
      } else if (nextStage.status === 'picked_up') {
        // Can call rider pickup or restaurant status
        await api.pickupRiderOrder(order.id).catch(() => {});
      } else if (nextStage.status === 'delivered') {
        await api.deliverRiderOrder(order.id).catch(() => {});
      } else {
        await api.updateOrderStatusRestaurant(order.id, nextStage.status).catch(() => {});
      }
      await fetchOrder();
    } catch (e) {
      console.warn('Simulation advanced via direct refresh:', e);
      await fetchOrder();
    } finally {
      setIsAdvancing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-3">
        <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-stone-400">Locating your order GPS tracking details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-lg font-bold text-rose-400">Order Not Found</h2>
        <p className="text-xs text-stone-400">{error || `No active order found for ID ${orderId}`}</p>
        <button
          onClick={() => onNavigate('/customer/orders')}
          className="px-4 py-2 text-xs font-semibold text-black bg-orange-500 rounded-xl hover:bg-orange-400"
        >
          View Order History
        </button>
      </div>
    );
  }

  const currentStageIndex = ORDER_STAGES.findIndex((s) => s.status === order.status);
  const isDelivered = order.status === 'delivered';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-stone-900 via-[#18191E] to-stone-900 border border-stone-800 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
              Live Order Tracking
            </span>
            <span className="text-stone-500 text-xs">·</span>
            <span className="text-xs font-mono text-stone-300 font-bold">{order.orderNumber}</span>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
            {isDelivered ? 'Your Order Has Arrived!' : 'Preparing & Delivering Delicious Food'}
          </h1>

          <p className="text-xs text-stone-400">
            Estimated Delivery:{' '}
            <strong className="text-stone-200">
              {isDelivered ? 'Completed' : order.estimatedDeliveryTime || '25-35 minutes'}
            </strong>
          </p>
        </div>

        {/* Live Simulator button */}
        {!isDelivered && (
          <button
            onClick={handleSimulateNextStage}
            disabled={isAdvancing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500/15 border border-orange-500/40 text-orange-400 hover:bg-orange-500 hover:text-black transition-all text-xs font-bold active:scale-95"
            title="Advance the order lifecycle for testing"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isAdvancing ? 'animate-spin' : ''}`} />
            <span>Simulate Next Stage</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: 8-Stage Visual Progress Stepper */}
        <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl bg-[#121316] border border-stone-800 space-y-6">
          <h2 className="font-display font-bold text-base text-stone-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-400" />
            <span>Status Timeline</span>
          </h2>

          <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-stone-800">
            {ORDER_STAGES.map((stage, idx) => {
              const isPast = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;
              const isFuture = idx > currentStageIndex;

              return (
                <div key={stage.status} className="relative flex items-start gap-4">
                  {/* Indicator Dot */}
                  <div
                    className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                      isPast
                        ? 'bg-emerald-500 text-black shadow-sm shadow-emerald-500/30'
                        : isCurrent
                        ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/40 ring-4 ring-orange-500/20'
                        : 'bg-stone-800 border border-stone-700 text-stone-500'
                    }`}
                  >
                    {isPast ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : isCurrent ? (
                      <div className="w-2 h-2 rounded-full bg-black animate-ping" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-stone-600" />
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h3
                        className={`text-xs font-bold ${
                          isCurrent
                            ? 'text-orange-400 text-sm'
                            : isPast
                            ? 'text-stone-200'
                            : 'text-stone-500'
                        }`}
                      >
                        {stage.label}
                      </h3>
                      {isCurrent && (
                        <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-extrabold bg-orange-500/20 text-orange-400 rounded-md">
                          In Progress
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-400 leading-snug">{stage.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Assigned Rider Card (when stage >= rider_assigned) */}
          {order.riderName && (
            <div className="mt-8 pt-6 border-t border-stone-800/80">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 block mb-3">
                Assigned Delivery Courier
              </span>
              <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                    <Bike className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-white">{order.riderName}</h4>
                    <p className="text-[11px] text-stone-400">Insulated thermal food carrier</p>
                  </div>
                </div>

                {order.riderPhone && (
                  <a
                    href={`tel:${order.riderPhone}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs text-stone-200 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-orange-400" />
                    <span>Call Rider</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Order Details & Receipt */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-3xl bg-[#121316] border border-stone-800 space-y-5">
            <h2 className="font-display font-bold text-base text-white">Order Details</h2>

            {/* Restaurant Info */}
            <div className="flex items-start gap-3 pb-4 border-b border-stone-800">
              <Store className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <strong className="text-stone-200 block">{order.restaurantName}</strong>
                <span className="text-stone-400">{order.restaurantAddress}</span>
              </div>
            </div>

            {/* Delivery Destination */}
            <div className="flex items-start gap-3 pb-4 border-b border-stone-800">
              <MapPin className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-0.5">
                <strong className="text-stone-200 block">Deliver To</strong>
                <span className="text-stone-300">{order.deliveryAddress.street}</span>
                <span className="text-stone-500 block">
                  {order.deliveryAddress.city}, {order.deliveryAddress.postalCode}
                </span>
                {order.deliveryInstructions && (
                  <p className="text-[11px] text-amber-500/90 italic pt-1">
                    "{order.deliveryInstructions}"
                  </p>
                )}
              </div>
            </div>

            {/* Itemized Snapshot */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 block">
                Food Snapshot
              </span>
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-xs">
                  <span className="text-stone-300">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="tabular-nums font-semibold text-stone-200">
                    ${item.subtotal.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Price breakdown */}
            <div className="pt-3 border-t border-stone-800/80 space-y-1.5 text-xs text-stone-400">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-stone-200 tabular-nums">${order.subtotal.toFixed(2)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount</span>
                  <span className="tabular-nums">-${order.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span className="text-stone-200 tabular-nums">${order.deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span className="text-stone-200 tabular-nums">${order.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-stone-800 font-bold text-white text-sm">
                <span>Total</span>
                <span className="text-orange-400 tabular-nums">${order.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[11px] pt-1">
                <span className="text-stone-500">Payment:</span>
                <span className="text-stone-300 capitalize">
                  {order.paymentMethod.replace('_', ' ')} ({order.paymentStatus})
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
