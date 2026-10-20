import React, { useState } from 'react';
import {
  ShoppingBag,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Shield,
  Layers,
  Menu,
  X,
  Bike,
  Store,
  Sunrise,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useCart } from '../context/CartContext.tsx';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate }) => {
  const { user, riderProfile, restaurantProfile, logout } = useAuth();
  const { items } = useCart();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const cartCount = items.reduce((acc, it) => acc + it.quantity, 0);

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'rider') {
      return riderProfile?.status === 'approved' ? '/rider/dashboard' : '/rider/pending';
    }
    if (user.role === 'restaurant') {
      return restaurantProfile?.status === 'approved' ? '/restaurant/dashboard' : '/restaurant/pending';
    }
    return '/customer/dashboard';
  };

  const handleMobileNav = (path: string) => {
    setIsMobileMenuOpen(false);
    onNavigate(path);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0B0B0D]/95 backdrop-blur-md border-b border-[#2B2B30]/80 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4 lg:gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigate('/')}
            className="flex items-center gap-2.5 text-left group transition-transform duration-200 hover:scale-[1.02] active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF7900] to-[#FF9D00] p-0.5 shadow-lg shadow-[#FF7900]/20 transition-all duration-300 group-hover:shadow-[#FF7900]/40">
              <div className="w-full h-full bg-[#0B0B0D] rounded-[10px] flex items-center justify-center">
                <span className="font-display font-black text-xl text-[#FF9D00] group-hover:text-white transition-colors">
                  N
                </span>
              </div>
            </div>
            <div>
              <span className="font-display font-bold text-xl sm:text-2xl text-white tracking-tight transition-colors duration-200 group-hover:text-[#FF9D00]">
                Nova Hunger <span className="text-[#FF7900] font-medium">Food</span>
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links (Desktop) */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-7 text-sm font-medium text-[#B8B8C0]">
          <button
            onClick={() => onNavigate('/')}
            className={`transition-all duration-200 hover:text-[#FF9D00] hover:-translate-y-0.5 whitespace-nowrap ${
              currentPath === '/' ? 'text-[#FF7900] font-semibold' : ''
            }`}
          >
            Home
          </button>
          <button
            onClick={() => onNavigate('/restaurants')}
            className={`transition-all duration-200 hover:text-[#FF9D00] hover:-translate-y-0.5 whitespace-nowrap ${
              currentPath === '/restaurants' ? 'text-[#FF7900] font-semibold' : ''
            }`}
          >
            Restaurants
          </button>
          <button
            onClick={() => onNavigate('/offers')}
            className={`transition-all duration-200 hover:text-[#FF9D00] hover:-translate-y-0.5 whitespace-nowrap ${
              currentPath === '/offers' ? 'text-[#FF7900] font-semibold' : ''
            }`}
          >
            Offers
          </button>
          <button
            onClick={() => onNavigate('/customer/orders')}
            className={`transition-all duration-200 hover:text-[#FF9D00] hover:-translate-y-0.5 whitespace-nowrap ${
              currentPath.startsWith('/customer/orders') || currentPath.startsWith('/track-order')
                ? 'text-[#FF7900] font-semibold'
                : ''
            }`}
          >
            Track Order
          </button>
          <button
            onClick={() => onNavigate('/about')}
            className={`transition-all duration-200 hover:text-[#FF9D00] hover:-translate-y-0.5 whitespace-nowrap ${
              currentPath === '/about' ? 'text-[#FF7900] font-semibold' : ''
            }`}
          >
            About
          </button>
          <button
            onClick={() => onNavigate('/contact')}
            className={`transition-all duration-200 hover:text-[#FF9D00] hover:-translate-y-0.5 whitespace-nowrap ${
              currentPath === '/contact' ? 'text-[#FF7900] font-semibold' : ''
            }`}
          >
            Contact
          </button>
          <button
            onClick={() => onNavigate(user ? '/home' : '/daybreak')}
            className={`transition-all duration-200 hover:text-[#FFD58A] hover:-translate-y-0.5 whitespace-nowrap flex items-center gap-1.5 ${
              currentPath === '/daybreak' || currentPath === '/login' || currentPath === '/home' || (currentPath === '/' && user)
                ? 'text-[#FFD58A] font-semibold'
                : 'text-[#F18B58]'
            }`}
          >
            <Sunrise className="w-3.5 h-3.5 text-[#F18B58]" />
            <span>{user ? '3D Experience' : 'Daybreak 3D'}</span>
          </button>
        </nav>

        {/* Zone 3: Actions (Cart + Account + Admin Login + Mobile Menu Button) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Cart Button */}
          <button
            onClick={() => onNavigate('/cart')}
            className="relative flex items-center gap-2 px-3 py-2 rounded-xl bg-[#151518] border border-[#2B2B30] text-[#FFFFFF] hover:border-[#FF7900]/60 hover:text-[#FF9D00] transition-all duration-200 hover:scale-[1.02] active:scale-95"
            aria-label="Shopping Cart"
          >
            <ShoppingBag className="w-4 h-4 text-[#FF7900]" />
            <span className="hidden sm:inline text-xs font-semibold">Cart</span>
            {cartCount > 0 && (
              <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-bold text-black bg-gradient-to-r from-[#FF7900] to-[#FF9D00] rounded-full tabular-nums shadow-sm">
                {cartCount}
              </span>
            )}
          </button>

          {/* User Account / Customer Login */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#151518] border border-[#2B2B30] text-[#FFFFFF] hover:border-[#FF7900]/50 transition-all duration-200 hover:scale-[1.02]"
              >
                <div className="w-6 h-6 rounded-lg bg-[#FF7900]/20 text-[#FF9D00] flex items-center justify-center text-xs font-bold uppercase">
                  {user.name.charAt(0)}
                </div>
                <span className="text-xs font-medium max-w-[110px] truncate hidden sm:inline">
                  {user.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#B8B8C0]" />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#151518] border border-[#2B2B30] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-[#2B2B30]">
                    <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                    <p className="text-[11px] text-[#B8B8C0] truncate">{user.email}</p>
                    <span className="inline-block mt-1 text-[10px] uppercase font-bold tracking-wider text-[#FF7900]">
                      Role: {user.role}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      onNavigate(getDashboardPath());
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl text-stone-200 hover:bg-[#2B2B30] text-left transition-colors mt-1"
                  >
                    <Layers className="w-4 h-4 text-[#FF7900]" />
                    <span>My Dashboard</span>
                  </button>

                  {user.role === 'customer' && (
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        onNavigate('/customer/orders');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl text-stone-200 hover:bg-[#2B2B30] text-left transition-colors"
                    >
                      <ShoppingBag className="w-4 h-4 text-[#FF9D00]" />
                      <span>Order History</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      logout();
                      onNavigate('/');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl text-rose-400 hover:bg-rose-500/10 text-left transition-colors mt-1 border-t border-[#2B2B30]"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => onNavigate('/customer/login')}
              className="px-3.5 sm:px-4 py-2 text-xs font-bold text-black bg-gradient-to-r from-[#FF7900] to-[#FF9D00] rounded-xl hover:opacity-95 active:scale-95 transition-all duration-200 shadow-md shadow-[#FF7900]/20 hover:scale-[1.02] whitespace-nowrap"
            >
              Sign In
            </button>
          )}

          {/* Dedicated Admin Login Link (Top-Right requirement) */}
          <button
            onClick={() => onNavigate(user?.role === 'admin' ? '/admin/dashboard' : '/admin/login')}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all duration-200 border whitespace-nowrap ${
              currentPath === '/admin/login' || currentPath.startsWith('/admin')
                ? 'text-[#FF9D00] bg-[#151518] border-[#FF7900]/50 shadow-sm shadow-[#FF7900]/20'
                : 'text-[#B8B8C0] border-[#2B2B30] bg-[#151518]/60 hover:text-white hover:border-[#FF7900]/40 hover:bg-[#151518]'
            }`}
            title="Authorized Administrator Login"
          >
            <Shield className="w-3.5 h-3.5 text-[#FF7900]" />
            <span>Admin Login</span>
          </button>

          {/* Mobile Menu Hamburger Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-[#151518] border border-[#2B2B30] text-[#B8B8C0] hover:text-white hover:border-[#FF7900]/40 transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-[#0B0B0D] border-b border-[#2B2B30] px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-4 duration-200">
          <nav className="flex flex-col space-y-1 text-sm font-medium text-[#B8B8C0]">
            <button
              onClick={() => handleMobileNav('/')}
              className={`px-3 py-2 rounded-xl text-left transition-colors ${
                currentPath === '/' ? 'bg-[#151518] text-[#FF7900] font-semibold' : 'hover:text-white'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => handleMobileNav('/restaurants')}
              className={`px-3 py-2 rounded-xl text-left transition-colors ${
                currentPath === '/restaurants' ? 'bg-[#151518] text-[#FF7900] font-semibold' : 'hover:text-white'
              }`}
            >
              Restaurants
            </button>
            <button
              onClick={() => handleMobileNav('/offers')}
              className={`px-3 py-2 rounded-xl text-left transition-colors ${
                currentPath === '/offers' ? 'bg-[#151518] text-[#FF7900] font-semibold' : 'hover:text-white'
              }`}
            >
              Offers
            </button>
            <button
              onClick={() => handleMobileNav('/customer/orders')}
              className={`px-3 py-2 rounded-xl text-left transition-colors ${
                currentPath.startsWith('/customer/orders') ? 'bg-[#151518] text-[#FF7900] font-semibold' : 'hover:text-white'
              }`}
            >
              Track Order / History
            </button>
            <button
              onClick={() => handleMobileNav('/about')}
              className={`px-3 py-2 rounded-xl text-left transition-colors ${
                currentPath === '/about' ? 'bg-[#151518] text-[#FF7900] font-semibold' : 'hover:text-white'
              }`}
            >
              About
            </button>
            <button
              onClick={() => handleMobileNav('/contact')}
              className={`px-3 py-2 rounded-xl text-left transition-colors ${
                currentPath === '/contact' ? 'bg-[#151518] text-[#FF7900] font-semibold' : 'hover:text-white'
              }`}
            >
              Contact
            </button>
          </nav>

          <div className="pt-3 border-t border-[#2B2B30] flex flex-col gap-2">
            <button
              onClick={() => handleMobileNav('/daybreak')}
              className="flex items-center gap-2 px-3 py-2.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-[#F18B58]/20 to-[#FFD58A]/20 border border-[#F18B58]/40 text-[#FFD58A] hover:text-white"
            >
              <Sunrise className="w-4 h-4 text-[#F18B58]" />
              <span>Daybreak 3D Sunrise Auth</span>
            </button>

            <button
              onClick={() => handleMobileNav('/admin/login')}
              className="flex items-center gap-2 px-3 py-2.5 text-xs font-semibold rounded-xl bg-[#151518] border border-[#2B2B30] text-stone-200 hover:text-white hover:border-[#FF7900]"
            >
              <Shield className="w-4 h-4 text-[#FF7900]" />
              <span>Admin Login</span>
            </button>

            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-[#B8B8C0]">
              <button
                onClick={() => handleMobileNav('/rider/login')}
                className="flex items-center gap-1.5 p-2 rounded-lg bg-[#151518] border border-[#2B2B30] hover:text-white"
              >
                <Bike className="w-3.5 h-3.5 text-[#FF7900]" />
                <span>Rider Portal</span>
              </button>
              <button
                onClick={() => handleMobileNav('/restaurant/login')}
                className="flex items-center gap-1.5 p-2 rounded-lg bg-[#151518] border border-[#2B2B30] hover:text-white"
              >
                <Store className="w-3.5 h-3.5 text-[#FF7900]" />
                <span>Restaurant Portal</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
