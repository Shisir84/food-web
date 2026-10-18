import React, { useState, useEffect } from 'react';
import { MapPin, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { Order, Address } from '../types/index.ts';
import { OrderHistory } from '../components/OrderHistory.tsx';

interface CustomerDashboardViewProps {
  onNavigate: (path: string) => void;
}

export const CustomerDashboardView: React.FC<CustomerDashboardViewProps> = ({ onNavigate }) => {
  const { user, refreshUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'addresses'>('orders');

  // Address modal
  const [isAddingAddr, setIsAddingAddr] = useState(false);
  const [label, setLabel] = useState('Home');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('Metropolis');
  const [postalCode, setPostalCode] = useState('10001');
  const [instructions, setInstructions] = useState('');
  const [addrError, setAddrError] = useState<string | null>(null);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const data = await api.getMyOrders();
      setOrders(data);
    } catch (err) {
      console.warn('Failed to load user orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!street.trim()) return;
    setAddrError(null);

    try {
      await api.addAddress({
        label,
        street: street.trim(),
        city: city.trim(),
        postalCode: postalCode.trim(),
        deliveryInstructions: instructions.trim(),
        isDefault: false,
      });
      await refreshUser();
      setIsAddingAddr(false);
      setStreet('');
    } catch (e: any) {
      setAddrError(e.message || 'Failed to save address');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#121316] border border-stone-800 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center font-bold text-xl uppercase">
            {user?.name.charAt(0) || 'C'}
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-white">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-xs text-stone-400 mt-0.5">
              {user?.email} · {user?.phone || 'Customer Account'}
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('/restaurants')}
          className="px-5 py-3 text-xs font-bold text-black bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl hover:opacity-95 transition-all shadow-md shadow-orange-500/20 shrink-0"
        >
          Explore Restaurants
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-800 text-xs">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 font-semibold transition-colors relative mr-6 ${
            activeTab === 'orders' ? 'text-orange-400' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          My Orders ({orders.length})
          {activeTab === 'orders' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('addresses')}
          className={`pb-3 font-semibold transition-colors relative ${
            activeTab === 'addresses' ? 'text-orange-400' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          Saved Addresses ({user?.savedAddresses?.length || 0})
          {activeTab === 'addresses' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
          )}
        </button>
      </div>

      {/* ORDERS TAB (ORDER HISTORY COMPONENT) */}
      {activeTab === 'orders' && (
        <OrderHistory
          orders={orders}
          isLoading={isLoading}
          onNavigate={onNavigate}
          onRefreshOrders={loadOrders}
        />
      )}

      {/* ADDRESSES TAB */}
      {activeTab === 'addresses' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-display font-bold text-base text-white">Your Delivery Locations</h3>
            <button
              onClick={() => setIsAddingAddr(true)}
              className="flex items-center gap-1 text-xs font-semibold text-orange-400 hover:text-orange-300"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Address</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {user?.savedAddresses?.map((addr) => (
              <div key={addr.id} className="p-5 rounded-2xl bg-[#121316] border border-stone-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-stone-200">{addr.label}</span>
                  {addr.isDefault && (
                    <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-300">{addr.street}</p>
                <p className="text-stone-500 text-[11px]">
                  {addr.city}, {addr.postalCode}
                </p>
                {addr.deliveryInstructions && (
                  <p className="text-[11px] text-amber-500/80 italic pt-1">
                    "{addr.deliveryInstructions}"
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* New address modal */}
          {isAddingAddr && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <div className="bg-[#121316] border border-stone-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
                <h3 className="font-display text-base font-bold text-white">Add Delivery Address</h3>
                <form onSubmit={handleSaveAddress} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-stone-400 block mb-1">
                      Label
                    </label>
                    <select
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      className="w-full bg-[#18191E] border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none"
                    >
                      <option value="Home">Home</option>
                      <option value="Office">Office</option>
                      <option value="Studio">Studio</option>
                      <option value="Friend's Place">Friend's Place</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-stone-400 block mb-1">
                      Street & Apartment
                    </label>
                    <input
                      type="text"
                      required
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="e.g. 742 Evergreen Terrace, Apt 4B"
                      className="w-full bg-[#18191E] border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-orange-500"
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
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full bg-[#18191E] border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-stone-400 block mb-1">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        required
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        className="w-full bg-[#18191E] border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none"
                      />
                    </div>
                  </div>

                  {addrError && (
                    <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                      {addrError}
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-3 border-t border-stone-800">
                    <button
                      type="button"
                      onClick={() => setIsAddingAddr(false)}
                      className="px-4 py-2 text-xs text-stone-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 text-xs font-bold text-black bg-orange-500 rounded-xl hover:bg-orange-400"
                    >
                      Save Location
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
