import React, { useState, useEffect } from 'react';
import {
  Search,
  ArrowRight,
  Sparkles,
  Flame,
  Award,
  Clock,
  ShieldCheck,
  Check,
  Copy,
  ChevronRight,
  Star,
  MapPin,
  Utensils,
} from 'lucide-react';
import { motion } from 'motion/react';
import { RestaurantProfile, FoodItem } from '../types/index.ts';
import { api } from '../services/api.ts';
import { FoodCard } from '../components/FoodCard.tsx';
import { RestaurantCard } from '../components/RestaurantCard.tsx';

interface HomeViewProps {
  onNavigate: (path: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  const [restaurants, setRestaurants] = useState<RestaurantProfile[]>([]);
  const [popularFood, setPopularFood] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [rests, foods, cats] = await Promise.all([
          api.getRestaurants(),
          api.getPopularFood(),
          api.getCategories(),
        ]);
        setRestaurants(rests);
        setPopularFood(foods);
        setCategories(cats);
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate(`/restaurants?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      onNavigate('/restaurants');
    }
  };

  return (
    <div className="min-h-screen space-y-20 pb-24 bg-[#0B0B0D]">
      {/* 1. Redesigned Premium Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:py-24 border-b border-[#2B2B30]/60 bg-gradient-to-b from-[#151518] via-[#0E0E11] to-[#0B0B0D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Heading, Subtitle, Search, CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-7 space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FF7900]/10 border border-[#FF7900]/30 text-[#FF9D00] text-xs font-semibold shadow-sm">
                <Flame className="w-3.5 h-3.5 text-[#FF7900]" />
                <span>Nova Hunger Food · Verified Local Kitchens</span>
              </div>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.08] text-balance">
                Your Cravings, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF7900] via-[#FF9D00] to-[#FFAE33]">Delivered.</span>
              </h1>

              <p className="text-base sm:text-lg text-[#B8B8C0] max-w-xl leading-relaxed">
                Discover amazing food from your favorite local restaurants.
              </p>

              {/* Animated Focus Search Field */}
              <form onSubmit={handleSearchSubmit} className="pt-2 max-w-xl">
                <div
                  className={`relative flex items-center bg-[#151518] border rounded-2xl p-1.5 transition-all duration-300 shadow-xl ${
                    isSearchFocused
                      ? 'border-[#FF7900] ring-4 ring-[#FF7900]/15 shadow-[#FF7900]/10 scale-[1.01]'
                      : 'border-[#2B2B30] hover:border-[#2B2B30]/90'
                  }`}
                >
                  <div className="pl-3.5 pr-2 text-[#B8B8C0]">
                    <Search
                      className={`w-5 h-5 transition-colors duration-200 ${
                        isSearchFocused ? 'text-[#FF7900]' : 'text-[#B8B8C0]'
                      }`}
                    />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search dishes, restaurants or cuisines (e.g. Biryani, Pizza)..."
                    className="w-full bg-transparent px-2 py-3 text-sm text-white placeholder:text-[#B8B8C0]/60 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="btn-primary px-5 py-3 text-xs font-bold shrink-0 shadow-md shadow-[#FF7900]/20"
                  >
                    Search
                  </button>
                </div>
              </form>

              {/* Dual Action CTA Buttons: Explore Restaurants & Order Now */}
              <div className="flex items-center gap-4 pt-2">
                <button
                  onClick={() => onNavigate('/restaurants')}
                  className="btn-primary px-6 py-3.5 text-xs font-bold flex items-center gap-2"
                >
                  <span>Explore Restaurants</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onNavigate('/restaurants')}
                  className="btn-secondary px-6 py-3.5 text-xs font-semibold"
                >
                  Order Now
                </button>
              </div>

              {/* Trust Metric Strip */}
              <div className="pt-4 grid grid-cols-3 gap-6 border-t border-[#2B2B30]/80 max-w-lg">
                <div>
                  <div className="font-display font-extrabold text-2xl text-white tabular-nums">
                    32 min
                  </div>
                  <div className="text-xs text-[#B8B8C0]">Avg. Delivery Speed</div>
                </div>
                <div>
                  <div className="font-display font-extrabold text-2xl text-white tabular-nums">
                    4.9 / 5
                  </div>
                  <div className="text-xs text-[#B8B8C0]">Customer Rating</div>
                </div>
                <div>
                  <div className="font-display font-extrabold text-2xl text-white tabular-nums">
                    100%
                  </div>
                  <div className="text-xs text-[#B8B8C0]">Certified Kitchens</div>
                </div>
              </div>
            </motion.div>

            {/* Right Column: Hero Visual Asset */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-5 relative"
            >
              <div className="relative rounded-3xl overflow-hidden border border-[#2B2B30] shadow-2xl bg-[#151518] group">
                <img
                  src="/src/assets/images/hero_food_showcase_1792316190702.jpg"
                  alt="Nova Hunger Food Culinary Showcase"
                  referrerPolicy="no-referrer"
                  className="w-full h-[410px] object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0D] via-transparent to-black/30" />

                {/* Floating highlight badge */}
                <div className="absolute bottom-5 left-5 right-5 bg-[#151518]/90 backdrop-blur-md p-4 rounded-2xl border border-[#2B2B30] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FF7900]/20 text-[#FF9D00] flex items-center justify-center">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Artisan Woodfired & Dum</div>
                      <div className="text-[11px] text-[#B8B8C0]">Prepared fresh upon order</div>
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigate('/restaurants')}
                    className="btn-primary px-3 py-1.5 text-xs font-bold"
                  >
                    View Menu
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. Food Category Section with attractive cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#FF7900]">
              Browse by Flavor
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mt-1">
              Food Categories
            </h2>
          </div>
          <button
            onClick={() => onNavigate('/restaurants')}
            className="text-xs font-semibold text-[#FF9D00] hover:text-white flex items-center gap-1 transition-colors group"
          >
            <span>View All Categories</span>
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat, idx) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              onClick={() => onNavigate(`/restaurants?category=${cat.name}`)}
              className="group cursor-pointer bg-[#151518] border border-[#2B2B30] rounded-2xl p-3.5 text-center transition-all duration-300 hover:-translate-y-1.5 hover:border-[#FF7900]/60 hover:shadow-xl hover:shadow-[#FF7900]/10 flex flex-col items-center"
            >
              <div className="w-20 h-20 rounded-xl overflow-hidden mb-3 bg-[#0B0B0D] border border-[#2B2B30]">
                <img
                  src={cat.imageUrl}
                  alt={cat.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <h3 className="font-bold text-white text-sm group-hover:text-[#FF9D00] transition-colors">
                {cat.name}
              </h3>
              <span className="text-[11px] text-[#B8B8C0] mt-0.5 tabular-nums">
                {cat.itemCount} Dishes
              </span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 3. Special Offers & Promotional Voucher Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-[#151518] via-[#1A1A1F] to-[#151518] border border-[#2B2B30] p-8 sm:p-10 relative overflow-hidden shadow-2xl">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-[#FF7900]/10 to-transparent pointer-events-none" />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">
            <div className="md:col-span-7 space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#FF9D00]">
                Special Promotional Deals
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
                Taste the Best With 20% Off Your First Order
              </h2>
              <p className="text-xs sm:text-sm text-[#B8B8C0] leading-relaxed max-w-lg">
                Use our welcome voucher during checkout to claim discounts across all approved local kitchens on Nova Hunger Food.
              </p>
            </div>

            <div className="md:col-span-5 flex flex-col sm:flex-row items-center gap-4">
              <div className="w-full bg-[#0B0B0D] border border-dashed border-[#2B2B30] rounded-2xl p-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase text-[#B8B8C0] font-bold block">
                    Promo Code
                  </span>
                  <span className="font-display font-extrabold text-base text-[#FF9D00] tracking-wider">
                    NOVAFIRST
                  </span>
                </div>
                <button
                  onClick={() => handleCopy('NOVAFIRST')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#151518] border border-[#2B2B30] hover:border-[#FF7900] text-xs font-medium text-white transition-colors"
                >
                  {copiedCode === 'NOVAFIRST' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#FF7900]" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <button
                onClick={() => onNavigate('/restaurants')}
                className="btn-primary w-full sm:w-auto px-6 py-3.5 text-xs font-bold whitespace-nowrap shadow-lg shadow-[#FF7900]/20"
              >
                Claim Deal
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Popular Restaurants Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#FF7900]">
              Certified Local Partners
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mt-1">
              Popular Restaurants
            </h2>
          </div>
          <button
            onClick={() => onNavigate('/restaurants')}
            className="text-xs font-semibold text-[#FF9D00] hover:text-white flex items-center gap-1 transition-colors group"
          >
            <span>All Restaurants</span>
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.slice(0, 3).map((restaurant) => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
              onClick={(id) => onNavigate(`/restaurants/${id}`)}
            />
          ))}
        </div>
      </section>

      {/* 5. Recommended Food Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#FF7900]">
              Handcrafted Gourmet Choices
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mt-1">
              Recommended Dishes
            </h2>
          </div>
          <button
            onClick={() => onNavigate('/restaurants')}
            className="text-xs font-semibold text-[#FF9D00] hover:text-white flex items-center gap-1 transition-colors group"
          >
            <span>Browse Full Menu</span>
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {popularFood.slice(0, 4).map((food) => (
            <FoodCard
              key={food.id}
              item={food}
              onNavigateRestaurant={(restId) => onNavigate(`/restaurants/${restId}`)}
            />
          ))}
        </div>
      </section>

      {/* 6. Why Nova Hunger Food */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border border-[#2B2B30] rounded-3xl p-8 lg:p-12 bg-[#151518]">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#FF7900]">
              The Nova Standard
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
              Food Delivery Engineered for Quality
            </h2>
            <p className="text-xs sm:text-sm text-[#B8B8C0]">
              Every kitchen and courier undergoes thorough review to guarantee hot, tamper-proof meals delivered reliably.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-[#0B0B0D] border border-[#2B2B30] space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#FF7900]/10 text-[#FF9D00] flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">Rider Identity Vetted</h3>
              <p className="text-xs text-[#B8B8C0] leading-relaxed">
                Riders are onboarded after manual admin approval of vehicle registration, driver's licenses, and identity verification.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0B0B0D] border border-[#2B2B30] space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#FF9D00]/10 text-[#FF9D00] flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">Thermal Hot Packaging</h3>
              <p className="text-xs text-[#B8B8C0] leading-relaxed">
                Sealed inside insulated thermal carriers to maintain steaming oven temperature from restaurant door to your table.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0B0B0D] border border-[#2B2B30] space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">Direct Kitchen Audits</h3>
              <p className="text-xs text-[#B8B8C0] leading-relaxed">
                Only licensed commercial kitchens with verified food hygiene certificates are permitted to accept orders on Nova Hunger Food.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Attributable Customer Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#FF7900]">
            Customer Stories
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
            What Food Lovers Are Saying
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-[#151518] border border-[#2B2B30] flex flex-col justify-between hover:border-[#FF7900]/40 transition-colors">
            <p className="text-xs sm:text-sm text-[#B8B8C0] leading-relaxed italic">
              "The Lucknowi Biryani from The Royal Dum Darbar arrived piping hot in a sealed clay handi. Best dining experience delivered at home!"
            </p>
            <div className="mt-6 pt-4 border-t border-[#2B2B30] flex items-center justify-between text-xs">
              <div>
                <strong className="text-white block">Siddharth Rao</strong>
                <span className="text-[#B8B8C0] text-[11px]">Architect, Downtown</span>
              </div>
              <span className="text-[#FF9D00] font-bold tabular-nums">5.0 ★</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#151518] border border-[#2B2B30] flex flex-col justify-between hover:border-[#FF7900]/40 transition-colors">
            <p className="text-xs sm:text-sm text-[#B8B8C0] leading-relaxed italic">
              "Tracked the delivery rider Alex in real time from the wood oven to my doorstep. Sourdough pizza crust stayed crisp, not soggy."
            </p>
            <div className="mt-6 pt-4 border-t border-[#2B2B30] flex items-center justify-between text-xs">
              <div>
                <strong className="text-white block">Clarissa Wong</strong>
                <span className="text-[#B8B8C0] text-[11px]">Product Lead, North End</span>
              </div>
              <span className="text-[#FF9D00] font-bold tabular-nums">5.0 ★</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#151518] border border-[#2B2B30] flex flex-col justify-between hover:border-[#FF7900]/40 transition-colors">
            <p className="text-xs sm:text-sm text-[#B8B8C0] leading-relaxed italic">
              "The Himalayan steamed momos with spicy sesame chutney were exceptionally fresh. Fast dispatch and polite rider delivery."
            </p>
            <div className="mt-6 pt-4 border-t border-[#2B2B30] flex items-center justify-between text-xs">
              <div>
                <strong className="text-white block">Marcus Vance</strong>
                <span className="text-[#B8B8C0] text-[11px]">Creative Director, Metropolis</span>
              </div>
              <span className="text-[#FF9D00] font-bold tabular-nums">4.9 ★</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
