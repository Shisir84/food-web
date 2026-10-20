import React, { useState, useEffect } from 'react';
import { Search, Filter, Store, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { RestaurantProfile } from '../types/index.ts';
import { api } from '../services/api.ts';
import { RestaurantCard } from '../components/RestaurantCard.tsx';

interface RestaurantsViewProps {
  initialSearch?: string;
  initialCategory?: string;
  onNavigate: (path: string) => void;
}

export const RestaurantsView: React.FC<RestaurantsViewProps> = ({
  initialSearch = '',
  initialCategory = '',
  onNavigate,
}) => {
  const [restaurants, setRestaurants] = useState<RestaurantProfile[]>([]);
  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || 'all');
  const [onlyVeg, setOnlyVeg] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const categories = ['all', 'Pizza', 'Burgers', 'Biryani', 'Momo', 'Fast Food', 'Italian', 'Desserts'];

  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    setSelectedCategory(initialCategory || 'all');
  }, [initialCategory]);

  const loadRestaurants = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await api.getRestaurants({
        search: search.trim() || undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        vegOnly: onlyVeg,
      });
      setRestaurants(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error fetching restaurants:', err);
      setFetchError(err.message || 'Unable to retrieve restaurants from the server.');
      setRestaurants([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRestaurants();
  }, [search, selectedCategory, onlyVeg]);

  const handleSelectCategory = (cat: string) => {
    setSelectedCategory(cat);
    const params = new URLSearchParams();
    if (cat !== 'all') params.set('category', cat);
    if (search.trim()) params.set('search', search.trim());
    const qs = params.toString();
    window.history.replaceState({}, '', `/restaurants${qs ? `?${qs}` : ''}`);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    const params = new URLSearchParams();
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    if (val.trim()) params.set('search', val.trim());
    const qs = params.toString();
    window.history.replaceState({}, '', `/restaurants${qs ? `?${qs}` : ''}`);
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory('all');
    setOnlyVeg(false);
    setFetchError(null);
    window.history.replaceState({}, '', '/restaurants');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header and Search */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#2B2B30]">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#FF7900]">
            Certified Kitchens · Nova Hunger Food
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white mt-1">
            Explore Restaurants
          </h1>
          <p className="text-xs sm:text-sm text-[#B8B8C0] mt-1">
            Discover vetted culinary partners delivering in your neighborhood.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search kitchens, dishes, cuisines..."
            className="w-full bg-[#151518] border border-[#2B2B30] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-stone-500 focus:outline-none focus:border-[#FF7900] transition-colors"
          />
        </div>
      </div>

      {/* Filter Tabs / Segmented Controls */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleSelectCategory(cat)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition-all duration-200 ${
                selectedCategory.toLowerCase() === cat.toLowerCase()
                  ? 'bg-gradient-to-r from-[#FF7900] to-[#FF9D00] text-black font-bold shadow-md shadow-[#FF7900]/20'
                  : 'bg-[#151518] border border-[#2B2B30] text-[#B8B8C0] hover:text-white hover:border-[#FF7900]/40'
              }`}
            >
              {cat === 'all' ? 'All Flavors' : cat}
            </button>
          ))}
        </div>

        <button
          onClick={() => setOnlyVeg(!onlyVeg)}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-xl border transition-colors ${
            onlyVeg
              ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold'
              : 'bg-[#151518] border-[#2B2B30] text-[#B8B8C0] hover:border-[#FF7900]/40'
          }`}
        >
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Veg Only</span>
        </button>
      </div>

      {/* Network or Server Error Message */}
      {fetchError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs flex items-center justify-between gap-4">
          <span>{fetchError}</span>
          <button
            onClick={() => loadRestaurants()}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shrink-0"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Restaurant Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="h-72 rounded-2xl bg-[#151518] animate-pulse border border-[#2B2B30]"
            />
          ))}
        </div>
      ) : restaurants.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map((rest, idx) => (
            <motion.div
              key={rest.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
            >
              <RestaurantCard
                restaurant={rest}
                onClick={(id) => onNavigate(`/restaurants/${id}`)}
              />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center rounded-2xl bg-[#151518] border border-[#2B2B30] space-y-4">
          <Store className="w-12 h-12 text-stone-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No restaurants found</h3>
            <p className="text-xs text-[#B8B8C0]">
              {search || selectedCategory !== 'all' || onlyVeg
                ? 'Try adjusting your search query, turning off vegetarian filters, or picking a different category.'
                : 'No approved restaurants are currently available.'}
            </p>
          </div>
          <button
            onClick={handleResetFilters}
            className="btn-primary px-5 py-2.5 text-xs font-bold"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};
