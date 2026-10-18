import React, { useState, useEffect } from 'react';
import { Search, Filter, SlidersHorizontal, Store } from 'lucide-react';
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

  const categories = ['all', 'Pizza', 'Burgers', 'Biryani', 'Momo', 'Fast Food', 'Italian'];

  useEffect(() => {
    async function fetchRestaurants() {
      setIsLoading(true);
      try {
        const data = await api.getRestaurants({
          search: search || undefined,
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
        });
        setRestaurants(data);
      } catch (err) {
        console.error('Error fetching restaurants:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchRestaurants();
  }, [search, selectedCategory]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header and Search */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-stone-800">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-orange-400">
            Certified Kitchens
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white mt-1">
            Explore Restaurants
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            Discover vetted culinary partners delivering in your neighborhood.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search kitchens or food..."
            className="w-full bg-[#18191E] border border-stone-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>
      </div>

      {/* Filter Tabs / Segmented Controls */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-orange-500 text-black font-bold shadow-md shadow-orange-500/20'
                  : 'bg-stone-900 border border-stone-800 text-stone-300 hover:text-white hover:border-stone-700'
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
              ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
              : 'bg-stone-900 border-stone-800 text-stone-300 hover:border-stone-700'
          }`}
        >
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Veg Only</span>
        </button>
      </div>

      {/* Restaurant Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-72 rounded-2xl bg-stone-900/60 animate-pulse border border-stone-800"
            />
          ))}
        </div>
      ) : restaurants.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map((rest) => (
            <RestaurantCard
              key={rest.id}
              restaurant={rest}
              onClick={(id) => onNavigate(`/restaurants/${id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center rounded-2xl bg-[#121316] border border-stone-800 space-y-4">
          <Store className="w-12 h-12 text-stone-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-stone-200">No restaurants found</h3>
            <p className="text-xs text-stone-400">
              Try adjusting your search criteria or choosing a different flavor category.
            </p>
          </div>
          <button
            onClick={() => {
              setSearch('');
              setSelectedCategory('all');
            }}
            className="px-4 py-2 text-xs font-semibold text-black bg-orange-500 rounded-xl hover:bg-orange-400 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};
