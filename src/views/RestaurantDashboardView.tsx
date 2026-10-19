import React, { useState, useEffect } from 'react';
import {
  Store,
  DollarSign,
  ShoppingBag,
  Plus,
  Utensils,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { RestaurantProfile, FoodItem, Order } from '../types/index.ts';

interface RestaurantDashboardViewProps {
  onNavigate: (path: string) => void;
}

export const RestaurantDashboardView: React.FC<RestaurantDashboardViewProps> = ({ onNavigate }) => {
  const { user, restaurantProfile } = useAuth();
  const [profile, setProfile] = useState<RestaurantProfile | null>(restaurantProfile);
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<FoodItem[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'menu'>('orders');

  // Add Item modal state
  const [isAddingFood, setIsAddingFood] = useState(false);
  const [foodName, setFoodName] = useState('');
  const [foodDesc, setFoodDesc] = useState('');
  const [foodPrice, setFoodPrice] = useState('');
  const [foodCategory, setFoodCategory] = useState('Pizza');
  const [foodPrepTime, setFoodPrepTime] = useState('20');
  const [isVeg, setIsVeg] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isPending = profile?.status === 'pending';

  const loadData = async () => {
    try {
      const [rest, ords, menu] = await Promise.all([
        api.getRestaurantMy(),
        api.getRestaurantOrders().catch(() => []),
        api.getRestaurantMenu().catch(() => []),
      ]);
      setProfile(rest);
      setOrders(ords);
      setMenuItems(menu);
    } catch (err: any) {
      console.warn('Restaurant load error:', err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      await api.updateOrderStatusRestaurant(orderId, status);
      setSuccessMsg(`Order updated to ${status.replace('_', ' ')}!`);
      setTimeout(() => setSuccessMsg(null), 3000);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update order');
    }
  };

  const handleAddFoodItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName || !foodPrice) return;

    try {
      await api.addFoodItem({
        name: foodName.trim(),
        description: foodDesc.trim(),
        price: parseFloat(foodPrice),
        category: foodCategory,
        isVeg,
        preparationTimeMinutes: parseInt(foodPrepTime) || 20,
        imageUrl: '/src/assets/images/hero_food_showcase_1792316190702.jpg',
      });
      setIsAddingFood(false);
      setFoodName('');
      setFoodDesc('');
      setFoodPrice('');
      setSuccessMsg('New food item added to your live menu!');
      setTimeout(() => setSuccessMsg(null), 3000);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add item');
    }
  };

  const handleToggleItemAvailability = async (item: FoodItem) => {
    try {
      await api.updateFoodItem(item.id, { isAvailable: !item.isAvailable });
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to toggle availability');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to remove this dish from your menu?')) return;
    try {
      await api.deleteFoodItem(id);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete dish');
    }
  };

  if (isPending) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
          <Clock className="w-8 h-8" />
        </div>
        <h1 className="font-display text-2xl font-bold text-white">
          Restaurant Verification in Progress
        </h1>
        <p className="text-xs text-stone-400 max-w-md mx-auto">
          Your restaurant application for "{profile?.name}" has been received. Our admin team will verify food safety certificates and commercial kitchen address before opening your live menu.
        </p>
        <div className="p-4 rounded-xl bg-stone-900 border border-stone-800 text-xs text-stone-400">
          Status: <strong className="text-amber-400 uppercase">Pending Administrative Review</strong>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#121316] border border-stone-800 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center">
            <Store className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold text-white">
                {profile?.name || user?.name}
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                Approved Kitchen
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              {profile?.address} · {profile?.city} · {profile?.openingHours}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddingFood(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs bg-orange-500 text-black hover:bg-orange-400 transition-colors shadow-lg shadow-orange-500/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Dish</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#121316] border border-stone-800 space-y-1">
          <span className="text-[11px] text-stone-400 font-medium">Total Orders</span>
          <div className="font-display text-2xl font-extrabold text-white tabular-nums">
            {profile?.totalOrders || orders.length}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#121316] border border-stone-800 space-y-1">
          <span className="text-[11px] text-stone-400 font-medium">Gross Revenue</span>
          <div className="font-display text-2xl font-extrabold text-orange-400 tabular-nums">
            ${(profile?.totalRevenue || 0).toFixed(2)}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#121316] border border-stone-800 space-y-1">
          <span className="text-[11px] text-stone-400 font-medium">Active Menu Dishes</span>
          <div className="font-display text-2xl font-extrabold text-white tabular-nums">
            {menuItems.length}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#121316] border border-stone-800 space-y-1">
          <span className="text-[11px] text-stone-400 font-medium">Kitchen Rating</span>
          <div className="font-display text-2xl font-extrabold text-amber-400 tabular-nums">
            {(profile?.rating || 4.9).toFixed(1)} ★
          </div>
        </div>
      </div>

      {/* Tabs (Kitchen Orders vs Menu Management) */}
      <div className="flex border-b border-stone-800 text-xs">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 font-semibold transition-colors relative mr-6 ${
            activeTab === 'orders' ? 'text-orange-400' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          Incoming Kitchen Orders ({orders.filter((o) => o.status !== 'delivered').length})
          {activeTab === 'orders' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('menu')}
          className={`pb-3 font-semibold transition-colors relative ${
            activeTab === 'menu' ? 'text-orange-400' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          Menu & Inventory Management ({menuItems.length})
          {activeTab === 'menu' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
          )}
        </button>
      </div>

      {/* TAB 1: KITCHEN ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.length > 0 ? (
            orders.map((ord, idx) => (
              <div
                key={`${ord.id}-${idx}`}
                className="p-5 sm:p-6 rounded-2xl bg-[#121316] border border-stone-800 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-stone-100">
                        {ord.orderNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 text-[10px] font-bold uppercase tracking-wider">
                        {ord.status.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="text-xs text-stone-400 mt-0.5 block">
                      Customer: {ord.customerName} ({ord.customerPhone})
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-orange-400 text-base tabular-nums">
                      ${ord.total.toFixed(2)}
                    </span>
                    <span className="text-stone-500 text-[11px] block">
                      {ord.paymentMethod.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-1.5 text-xs text-stone-300">
                  {ord.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>
                        {it.quantity}x {it.name}
                      </span>
                      <span className="tabular-nums font-semibold">${it.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Stage Action Controls */}
                <div className="pt-3 border-t border-stone-800 flex items-center justify-end gap-2 flex-wrap">
                  {ord.status === 'placed' && (
                    <button
                      onClick={() => handleUpdateOrderStatus(ord.id, 'restaurant_accepted')}
                      className="px-4 py-2 text-xs font-bold text-black bg-orange-500 rounded-xl hover:bg-orange-400"
                    >
                      Accept Order
                    </button>
                  )}

                  {ord.status === 'restaurant_accepted' && (
                    <button
                      onClick={() => handleUpdateOrderStatus(ord.id, 'preparing')}
                      className="px-4 py-2 text-xs font-bold text-black bg-amber-400 rounded-xl hover:bg-amber-300"
                    >
                      Start Food Preparation
                    </button>
                  )}

                  {ord.status === 'preparing' && (
                    <button
                      onClick={() => handleUpdateOrderStatus(ord.id, 'ready_for_pickup')}
                      className="px-4 py-2 text-xs font-bold text-black bg-emerald-500 rounded-xl hover:bg-emerald-400"
                    >
                      Mark Ready for Courier Pickup
                    </button>
                  )}

                  {['ready_for_pickup', 'rider_assigned', 'picked_up', 'out_for_delivery'].includes(
                    ord.status
                  ) && (
                    <span className="text-xs text-emerald-400 font-medium">
                      ✓ Ready / Dispatched to Rider {ord.riderName ? `(${ord.riderName})` : ''}
                    </span>
                  )}

                  {ord.status === 'delivered' && (
                    <span className="text-xs text-stone-500">Delivered successfully</span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center rounded-2xl bg-[#121316] border border-stone-800 text-xs text-stone-400">
              No orders received yet. Active customer orders will appear here in real-time.
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MENU & INVENTORY MANAGEMENT */}
      {activeTab === 'menu' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-[#121316] border border-stone-800 flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-stone-900 border border-stone-800 shrink-0">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-orange-400">
                      {item.category}
                    </span>
                    <h4 className="font-bold text-xs text-stone-100">{item.name}</h4>
                    <span className="text-xs font-semibold text-stone-300 tabular-nums">
                      ${item.price.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-800 flex items-center justify-between text-xs">
                  <button
                    onClick={() => handleToggleItemAvailability(item)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium text-[11px] ${
                      item.isAvailable
                        ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                    }`}
                  >
                    {item.isAvailable ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>{item.isAvailable ? 'In Stock' : 'Sold Out'}</span>
                  </button>

                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="text-stone-500 hover:text-rose-400 p-1"
                    title="Delete item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADD NEW DISH MODAL */}
      {isAddingFood && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121316] border border-stone-800 rounded-3xl w-full max-w-lg p-6 sm:p-8 space-y-4 shadow-2xl">
            <h3 className="font-display text-lg font-bold text-white">Add New Dish to Menu</h3>

            <form onSubmit={handleAddFoodItem} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-stone-300 block mb-1">
                  Dish Name
                </label>
                <input
                  type="text"
                  required
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  placeholder="e.g. Truffle Woodfired Sourdough"
                  className="w-full bg-[#18191E] border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-stone-300 block mb-1">
                  Description & Ingredients
                </label>
                <textarea
                  rows={2}
                  value={foodDesc}
                  onChange={(e) => setFoodDesc(e.target.value)}
                  placeholder="San Marzano sauce, fresh buffalo mozzarella, virgin olive oil..."
                  className="w-full bg-[#18191E] border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-stone-300 block mb-1">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={foodPrice}
                    onChange={(e) => setFoodPrice(e.target.value)}
                    placeholder="18.50"
                    className="w-full bg-[#18191E] border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-stone-300 block mb-1">
                    Category
                  </label>
                  <select
                    value={foodCategory}
                    onChange={(e) => setFoodCategory(e.target.value)}
                    className="w-full bg-[#18191E] border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-orange-500"
                  >
                    <option value="Pizza">Pizza</option>
                    <option value="Burgers">Burgers</option>
                    <option value="Biryani">Biryani</option>
                    <option value="Momo">Momo</option>
                    <option value="Fast Food">Fast Food</option>
                    <option value="Desserts">Desserts</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="vegCheck"
                  checked={isVeg}
                  onChange={(e) => setIsVeg(e.target.checked)}
                  className="rounded border-stone-700 text-orange-500 focus:ring-0"
                />
                <label htmlFor="vegCheck" className="text-xs text-stone-300">
                  Vegetarian Recipe
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsAddingFood(false)}
                  className="px-4 py-2 text-xs text-stone-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-black bg-orange-500 rounded-xl hover:bg-orange-400"
                >
                  Save Dish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
