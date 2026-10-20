import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { CartProvider } from './context/CartContext.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { HomeView } from './views/HomeView.tsx';
import { RestaurantsView } from './views/RestaurantsView.tsx';
import { RestaurantDetailView } from './views/RestaurantDetailView.tsx';
import { CartView } from './views/CartView.tsx';
import { CheckoutView } from './views/CheckoutView.tsx';
import { TrackOrderView } from './views/TrackOrderView.tsx';
import { AuthView } from './views/AuthView.tsx';
import { RiderDashboardView } from './views/RiderDashboardView.tsx';
import { RiderPendingView } from './views/RiderPendingView.tsx';
import { RestaurantDashboardView } from './views/RestaurantDashboardView.tsx';
import { RestaurantPendingView } from './views/RestaurantPendingView.tsx';
import { AdminDashboardView } from './views/AdminDashboardView.tsx';
import { CustomerDashboardView } from './views/CustomerDashboardView.tsx';
import { DaybreakHome3D } from './views/DaybreakHome3D.tsx';
import { NovaChatbot } from './components/NovaChatbot.tsx';
import {
  OffersView,
  AboutView,
  ContactView,
  FAQView,
  LegalView,
} from './views/StaticViews.tsx';

function MainRouter() {
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname || '/');
  const { user, riderProfile, restaurantProfile, isLoading, logout } = useAuth();

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const handleSessionExpired = async () => {
      await logout();
      navigate('/admin/login');
    };
    window.addEventListener('nova_admin_session_expired', handleSessionExpired);
    return () => window.removeEventListener('nova_admin_session_expired', handleSessionExpired);
  }, [logout]);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0B0D]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
          <span className="text-xs text-stone-400 font-medium tracking-wide">
            Loading Nova Hunger...
          </span>
        </div>
      </div>
    );
  }

  // Route matchers
  const renderCurrentView = () => {
    // 1. Restaurant Detail: /restaurants/:id
    if (currentPath.startsWith('/restaurants/')) {
      const restId = currentPath.replace('/restaurants/', '').split('?')[0];
      return <RestaurantDetailView restaurantId={restId} onNavigate={navigate} />;
    }

    // 2. Track Order: /track-order/:id
    if (currentPath.startsWith('/track-order/')) {
      const orderId = currentPath.replace('/track-order/', '').split('?')[0];
      return <TrackOrderView orderId={orderId} onNavigate={navigate} />;
    }

    // 3. Restaurants List: /restaurants
    if (currentPath === '/restaurants' || currentPath.startsWith('/restaurants?')) {
      const searchParamsString = currentPath.includes('?')
        ? currentPath.substring(currentPath.indexOf('?'))
        : window.location.search;
      const urlParams = new URLSearchParams(searchParamsString);
      const search = urlParams.get('search') || '';
      const category = urlParams.get('category') || '';
      return (
        <RestaurantsView
          initialSearch={search}
          initialCategory={category}
          onNavigate={navigate}
        />
      );
    }

    // 4. Shopping Cart & Checkout
    if (currentPath === '/cart') {
      return <CartView onNavigate={navigate} />;
    }
    if (currentPath === '/checkout') {
      return <CheckoutView onNavigate={navigate} />;
    }

    // 5. Customer Dashboard & Orders
    if (currentPath === '/customer/dashboard' || currentPath === '/customer/orders') {
      if (!user) {
        return (
          <AuthView
            portal="customer"
            mode="login"
            onNavigate={navigate}
          />
        );
      }
      return <CustomerDashboardView onNavigate={navigate} />;
    }

    // 6. Rider Portal & Pending Approval
    if (currentPath === '/rider/dashboard') {
      if (!user || user.role !== 'rider') {
        return (
          <AuthView
            portal="rider"
            mode="login"
            onNavigate={navigate}
          />
        );
      }
      if (riderProfile?.status !== 'approved') {
        return <RiderPendingView onNavigate={navigate} />;
      }
      return <RiderDashboardView onNavigate={navigate} />;
    }

    if (currentPath === '/rider/pending') {
      return <RiderPendingView onNavigate={navigate} />;
    }

    if (currentPath === '/rider/login') {
      return <AuthView portal="rider" mode="login" onNavigate={navigate} />;
    }
    if (currentPath === '/rider/register') {
      return <AuthView portal="rider" mode="register" onNavigate={navigate} />;
    }

    // 7. Restaurant Portal
    if (currentPath === '/restaurant/dashboard' || currentPath === '/restaurant/menu' || currentPath === '/restaurant/orders') {
      if (!user || user.role !== 'restaurant') {
        return (
          <AuthView
            portal="restaurant"
            mode="login"
            onNavigate={navigate}
          />
        );
      }
      if (restaurantProfile?.status !== 'approved') {
        return <RestaurantPendingView onNavigate={navigate} />;
      }
      return <RestaurantDashboardView onNavigate={navigate} />;
    }

    if (currentPath === '/restaurant/pending') {
      return <RestaurantPendingView onNavigate={navigate} />;
    }
    if (currentPath === '/restaurant/login') {
      return (
        <AuthView
          portal="restaurant"
          mode="login"
          onNavigate={navigate}
        />
      );
    }
    if (currentPath === '/restaurant/register') {
      return (
        <AuthView
          portal="restaurant"
          mode="register"
          onNavigate={navigate}
        />
      );
    }

    // 8. Admin Portal (Dedicated admin login & dashboard)
    if (currentPath === '/admin' || currentPath.startsWith('/admin/') || currentPath.startsWith('/admin?')) {
      if (currentPath === '/admin/login' || currentPath.startsWith('/admin/login')) {
        if (user && user.role === 'admin') {
          return <AdminDashboardView onNavigate={navigate} />;
        }
        return <AuthView portal="admin" mode="login" onNavigate={navigate} />;
      }

      if (!user || user.role !== 'admin') {
        return <AuthView portal="admin" mode="login" onNavigate={navigate} />;
      }
      return <AdminDashboardView onNavigate={navigate} />;
    }

    // 9. Daybreak & Customer Auth Routes (Supporting redirect query params e.g. /login?redirect=checkout)
    if (
      currentPath === '/daybreak' ||
      currentPath.startsWith('/daybreak?') ||
      currentPath === '/auth' ||
      currentPath.startsWith('/auth?') ||
      currentPath === '/login' ||
      currentPath.startsWith('/login?') ||
      currentPath === '/customer/login' ||
      currentPath.startsWith('/customer/login?')
    ) {
      return <AuthView portal="customer" mode="login" onNavigate={navigate} />;
    }
    if (
      currentPath === '/register' ||
      currentPath.startsWith('/register?') ||
      currentPath === '/customer/register' ||
      currentPath.startsWith('/customer/register?')
    ) {
      return <AuthView portal="customer" mode="register" onNavigate={navigate} />;
    }

    // 10. 3D Home & Root View
    if (currentPath === '/home' || currentPath === '/3d-home' || (currentPath === '/' && user)) {
      return <DaybreakHome3D onNavigate={navigate} />;
    }

    if (currentPath === '/' && !user) {
      return <AuthView portal="customer" mode="login" onNavigate={navigate} />;
    }

    // 11. Static & Utility Pages
    if (currentPath === '/offers') return <OffersView onNavigate={navigate} />;
    if (currentPath === '/about') return <AboutView onNavigate={navigate} />;
    if (currentPath === '/contact' || currentPath.startsWith('/contact?')) return <ContactView />;
    if (currentPath === '/faq') return <FAQView />;
    if (currentPath === '/privacy') return <LegalView type="privacy" />;
    if (currentPath === '/terms') return <LegalView type="terms" />;

    // Classic Marketplace fallback
    if (currentPath === '/classic' || currentPath === '/market') {
      return <HomeView onNavigate={navigate} />;
    }

    // Default
    return user ? <DaybreakHome3D onNavigate={navigate} /> : <HomeView onNavigate={navigate} />;
  };

  // Determine if viewing an edge-to-edge Daybreak authentication view
  const isAuthRoute =
    (!user && currentPath === '/') ||
    currentPath === '/daybreak' ||
    currentPath.startsWith('/daybreak?') ||
    currentPath === '/auth' ||
    currentPath.startsWith('/auth?') ||
    currentPath === '/login' ||
    currentPath.startsWith('/login?') ||
    currentPath === '/register' ||
    currentPath.startsWith('/register?') ||
    currentPath === '/customer/login' ||
    currentPath.startsWith('/customer/login?') ||
    currentPath === '/customer/register' ||
    currentPath.startsWith('/customer/register?') ||
    currentPath === '/rider/login' ||
    currentPath === '/rider/register' ||
    currentPath === '/restaurant/login' ||
    currentPath === '/restaurant/register' ||
    (currentPath.startsWith('/admin') && (!user || user.role !== 'admin')) ||
    (!user && (
      currentPath === '/customer/dashboard' ||
      currentPath === '/customer/orders' ||
      currentPath === '/rider/dashboard' ||
      currentPath === '/restaurant/dashboard'
    ));

  if (isAuthRoute) {
    return (
      <div className="min-h-screen w-full bg-[#111A2E] text-white">
        {renderCurrentView()}
      </div>
    );
  }

  const isDaybreakHome =
    currentPath === '/home' ||
    currentPath === '/3d-home' ||
    (currentPath === '/' && user);

  if (isDaybreakHome) {
    return (
      <div className="min-h-screen w-full bg-[#0D1424] text-white">
        <DaybreakHome3D onNavigate={navigate} />
        <NovaChatbot onNavigate={navigate} />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col transition-colors duration-200"
      style={{
        backgroundColor: 'var(--bg-primary, #0B0B0D)',
        color: 'var(--text-main, #FFFFFF)',
      }}
    >
      <Navbar currentPath={currentPath} onNavigate={navigate} />
      <main className="flex-1">{renderCurrentView()}</main>
      <Footer onNavigate={navigate} />
      {/* Floating Nova AI Assistant */}
      <NovaChatbot onNavigate={navigate} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <MainRouter />
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
