import React, { useState, useEffect } from 'react';
import {
  Star,
  Clock,
  ShoppingBag,
  MapPin,
  ArrowLeft,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { RestaurantProfile, FoodItem } from '../types/index.ts';
import { api } from '../services/api.ts';
import { FoodCard } from '../components/FoodCard.tsx';
import { useCart } from '../context/CartContext.tsx';

interface RestaurantDetailViewProps {
  restaurantId: string;
  onNavigate: (path: string) => void;
}

export const RestaurantDetailView: React.FC<RestaurantDetailViewProps> = ({
  restaurantId,
  onNavigate,
}) => {
  const [restaurant, setRestaurant] = useState<
    (RestaurantProfile & { menu: FoodItem[] }) | null
  >(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [menuSearch, setMenuSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { items, total } = useCart();

  useEffect(() => {
    async function loadRestaurant() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await api.getRestaurant(restaurantId);
        setRestaurant(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load restaurant details');
      } finally {
        setIsLoading(false);
      }
    }
    loadRestaurant();
  }, [restaurantId]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-stone-400">Loading restaurant and menu...</p>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="p-6 rounded-2xl bg-[#121316] border border-rose-900/40 text-stone-300">
          <h2 className="text-base font-bold text-rose-400">Unable to view restaurant</h2>
          <p className="text-xs text-stone-400 mt-2">{error || 'Restaurant not found'}</p>
          <button
            onClick={() => onNavigate('/restaurants')}
            className="mt-6 px-4 py-2 text-xs font-semibold text-black bg-orange-500 rounded-xl hover:bg-orange-400"
          >
            Back to Restaurants
          </button>
        </div>
      </div>
    );
  }

  // Filter menu items
  const menuCategories = [
    'all',
    ...Array.from(new Set(restaurant.menu.map((i) => i.category))),
  ];

  const filteredItems = restaurant.menu.filter((item) => {
    const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
    const matchSearch =
      !menuSearch ||
      item.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
      item.description.toLowerCase().includes(menuSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen pb-28">
      {/* Back button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <button
          onClick={() => onNavigate('/restaurants')}
          className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Restaurants</span>
        </button>
      </div>

      {/* Restaurant Header Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <div className="relative rounded-3xl overflow-hidden border border-stone-800 bg-[#121316] shadow-2xl">
          <div className="h-64 sm:h-80 w-full relative">
            <img
              src={restaurant.coverImage}
              alt={restaurant.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#121316] via-[#121316]/50 to-black/30" />
          </div>

          <div className="p-6 sm:p-8 relative -mt-20 z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approved Kitchen</span>
                </span>
                <span className="text-xs text-stone-400">·</span>
                <span className="text-xs text-stone-300">{restaurant.openingHours}</span>
              </div>

              <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white">
                {restaurant.name}
              </h1>

              <div className="flex items-center gap-4 text-xs text-stone-300 flex-wrap">
                <div className="flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded text-amber-400 font-bold tabular-nums">
                  <Star className="w-3.5 h-3.5 fill-amber-400 stroke-none" />
                  <span>{restaurant.rating.toFixed(1)}</span>
                  <span className="text-stone-500 font-normal">
                    ({restaurant.reviewCount} reviews)
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-stone-400">
                  <Clock className="w-3.5 h-3.5 text-orange-400" />
                  <span className="tabular-nums">{restaurant.deliveryTimeEstimate}</span>
                </div>

                <div className="flex items-center gap-1.5 text-stone-400">
                  <ShoppingBag className="w-3.5 h-3.5 text-orange-400" />
                  <span>
                    Min Order: <strong className="text-stone-200">${restaurant.minOrder.toFixed(2)}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-stone-400">
                  <MapPin className="w-3.5 h-3.5 text-orange-400" />
                  <span>{restaurant.address}</span>
                </div>
              </div>
            </div>

            {/* Quick cuisine badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {restaurant.cuisineTypes.map((c) => (
                <span
                  key={c}
                  className="px-3 py-1 rounded-lg bg-stone-900 border border-stone-800 text-xs text-stone-300"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Menu Navigation & Search */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4 border-b border-stone-800">
          {/* Categories Tab Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {menuCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-orange-500 text-black shadow-md shadow-orange-500/20'
                    : 'bg-stone-900 border border-stone-800 text-stone-300 hover:text-white'
                }`}
              >
                {cat === 'all' ? 'Full Menu' : cat}
              </button>
            ))}
          </div>

          {/* Menu Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={menuSearch}
              onChange={(e) => setMenuSearch(e.target.value)}
              placeholder="Search dishes..."
              className="w-full bg-[#18191E] border border-stone-800 rounded-xl pl-9 pr-3 py-2 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        {/* Food Items Grid */}
        <div className="mt-8">
          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map((item) => (
                <FoodCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center rounded-2xl bg-[#121316] border border-stone-800 space-y-2">
              <p className="text-sm font-semibold text-stone-300">No dishes match your filter</p>
              <p className="text-xs text-stone-500">
                Try selecting "Full Menu" or clearing your dish search.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Floating Bottom Cart Bar if cart has items */}
      {items.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-xl px-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-stone-900/95 backdrop-blur-md border border-orange-500/40 rounded-2xl p-4 shadow-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 flex items-center justify-center text-black font-bold text-sm shadow-md">
                {items.reduce((s, i) => s + i.quantity, 0)}
              </div>
              <div>
                <span className="text-xs text-stone-400 block">Total items selected</span>
                <span className="text-base font-extrabold text-white tabular-nums">
                  ${total.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              onClick={() => onNavigate('/cart')}
              className="px-6 py-2.5 text-xs font-bold text-black bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl hover:opacity-95 active:scale-95 transition-all shadow-md shadow-orange-500/20"
            >
              View Cart & Checkout →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
