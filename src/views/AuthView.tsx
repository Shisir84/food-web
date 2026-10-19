import React, { useState } from 'react';
import {
  User,
  Bike,
  Store,
  Shield,
  ArrowRight,
  Lock,
  Mail,
  Phone,
  FileText,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Info,
  Sun,
  Moon,
  Key,
  Sparkles,
  HelpCircle,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useTheme } from '../context/ThemeContext.tsx';

interface AuthViewProps {
  portal: 'customer' | 'rider' | 'restaurant' | 'admin';
  mode: 'login' | 'register';
  onNavigate: (path: string) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  portal,
  mode,
  onNavigate,
}) => {
  const { login, register } = useAuth();

  // Common fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Rider fields
  const [vehicleType, setVehicleType] = useState<'motorcycle' | 'bicycle' | 'scooter' | 'car'>('motorcycle');
  const [vehicleRegNumber, setVehicleRegNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [city, setCity] = useState('Metropolis');
  const [deliveryArea, setDeliveryArea] = useState('Central & Downtown');

  // Restaurant fields
  const [restaurantName, setRestaurantName] = useState('');
  const [address, setAddress] = useState('');
  const [cuisineTypes, setCuisineTypes] = useState('Artisan, Multi-Cuisine');

  const { theme, toggleMode, getBackgroundStyle } = useTheme();
  const [rememberMe, setRememberMe] = useState(true);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [adminLoginSuccess, setAdminLoginSuccess] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPasswordHelp, setShowPasswordHelp] = useState(false);

  const handleFillDemoAdmin = () => {
    setEmail('admin@novahunger.com');
    setPassword('admin123');
    setErrorMessage(null);
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotSent(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    // Client-side validations
    if (!email.trim() || !password) {
      setIsLoading(false);
      setErrorMessage('Please provide both your administrator email and password.');
      return;
    }

    try {
      if (mode === 'login') {
        const res = await login(
          email.trim(),
          password,
          portal === 'customer' ? undefined : portal,
          rememberMe
        );
        const userRole = res?.user?.role;
        if (userRole === 'admin') {
          setAdminLoginSuccess(true);
          setTimeout(() => {
            onNavigate('/admin/dashboard');
          }, 400);
        } else if (userRole === 'rider') {
          if (res.riderProfile?.status === 'approved') {
            onNavigate('/rider/dashboard');
          } else {
            onNavigate('/rider/pending');
          }
        } else if (userRole === 'restaurant') {
          if (res.restaurantProfile?.status === 'approved') {
            onNavigate('/restaurant/dashboard');
          } else {
            onNavigate('/restaurant/pending');
          }
        } else {
          onNavigate('/customer/dashboard');
        }
      } else {
        // Register: role is fixed to the portal type
        const payload: any = {
          role: portal,
          name,
          email,
          phone,
          password,
        };

        if (portal === 'rider') {
          payload.vehicleType = vehicleType;
          payload.vehicleRegNumber = vehicleRegNumber || 'NV-TEMP-REG';
          payload.licenseNumber = licenseNumber || 'NV-LIC-TEMP';
          payload.city = city;
          payload.deliveryArea = deliveryArea;
        } else if (portal === 'restaurant') {
          payload.restaurantName = restaurantName || name;
          payload.address = address || 'Central Metropolis';
          payload.city = city;
          payload.deliveryArea = deliveryArea;
          payload.cuisineTypes = cuisineTypes.split(',').map((c) => c.trim());
        }

        await register(payload);

        if (portal === 'rider') {
          onNavigate('/rider/pending');
        } else if (portal === 'restaurant') {
          onNavigate('/restaurant/pending');
        } else {
          onNavigate('/customer/dashboard');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------
  // ADVANCED ADMIN LOGIN VIEW (PREMIUM MODERN DASHBOARD AESTHETIC)
  // -------------------------------------------------------------
  if (portal === 'admin') {
    const isLight = theme.mode === 'light';
    const bgStyle = getBackgroundStyle(theme.loginBackground);

    return (
      <div
        className="relative min-h-[92vh] flex flex-col items-center justify-center px-4 py-12 transition-colors duration-300"
        style={{
          backgroundColor: isLight ? '#F1F5F9' : '#070709',
          ...bgStyle,
        }}
      >
        {/* Subtle Ambient Glow Layers */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-orange-600/15 blur-3xl" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[48rem] h-[36rem] bg-gradient-to-tr from-amber-600/5 via-orange-500/10 to-transparent rounded-full blur-3xl" />
        </div>

        {/* Top Floating Controls */}
        <div className="relative z-10 w-full max-w-md flex items-center justify-between mb-6 px-1">
          <button
            onClick={() => onNavigate('/')}
            className="flex items-center gap-2 text-xs font-semibold tracking-wide transition-opacity hover:opacity-80"
            style={{ color: isLight ? '#475569' : '#B8B8C0' }}
          >
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-500 font-extrabold text-sm shadow-sm">
              N
            </div>
            <span>{theme.appName || 'Nova Hunger Food'}</span>
          </button>

          <div className="flex items-center gap-2">
            {/* Quick Dark/Light Theme Toggle */}
            <button
              onClick={toggleMode}
              title={`Switch to ${isLight ? 'Dark' : 'Light'} Mode`}
              className={`p-2 rounded-xl border text-xs flex items-center gap-1.5 transition-all shadow-sm ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  : 'bg-[#151518] border-[#2B2B30] text-slate-300 hover:border-orange-500/50 hover:text-white'
              }`}
            >
              {isLight ? <Moon className="w-4 h-4 text-indigo-500" /> : <Sun className="w-4 h-4 text-amber-400" />}
              <span className="hidden sm:inline font-medium capitalize">{theme.mode || 'dark'}</span>
            </button>

            <button
              onClick={() => onNavigate('/customer/login')}
              className={`text-xs px-3 py-1.5 rounded-xl border transition-colors ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                  : 'bg-[#151518] border-[#2B2B30] text-[#B8B8C0] hover:text-white'
              }`}
            >
              Customer Sign In
            </button>
          </div>
        </div>

        {/* Main Glassmorphic Login Card */}
        <div
          className={`relative z-10 w-full max-w-md border rounded-3xl p-6 sm:p-9 shadow-2xl backdrop-blur-xl transition-all duration-300 ${
            isLight
              ? 'bg-white/95 border-slate-200/80 shadow-slate-300/50'
              : 'bg-[#121215]/90 border-[#2B2B30]/80 shadow-black/80'
          }`}
        >
          {/* Card Header & Shield Branding */}
          <div className="text-center space-y-3 mb-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-orange-500/10 border border-orange-500/30 text-orange-500">
              <Shield className="w-3.5 h-3.5" />
              <span>Platform Operations Console</span>
            </div>

            <h1
              className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight"
              style={{ color: isLight ? '#0F172A' : '#FFFFFF' }}
            >
              Administrator Sign In
            </h1>

            <p
              className="text-xs leading-relaxed max-w-sm mx-auto"
              style={{ color: isLight ? '#64748B' : '#B8B8C0' }}
            >
              Sign in with your master credentials to manage customer rosters, delivery couriers, restaurant partners, and system settings.
            </p>
          </div>

          {/* Quick-Fill Demo Credentials Helper */}
          <div
            className={`p-3 rounded-2xl border text-xs mb-5 flex items-center justify-between gap-3 ${
              isLight
                ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                : 'bg-gradient-to-r from-orange-950/30 to-amber-950/20 border-orange-500/20 text-amber-300'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="w-4 h-4 text-orange-500 shrink-0" />
              <div className="truncate">
                <span className="font-semibold block text-[11px]">Master Admin Roster:</span>
                <span className="font-mono text-[11px] opacity-90 truncate">admin@novahunger.com / admin123</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleFillDemoAdmin}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-orange-500 hover:bg-orange-600 text-black transition-colors shrink-0 shadow-sm"
            >
              Fill Demo
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                className="text-[11px] font-semibold block mb-1.5"
                style={{ color: isLight ? '#475569' : '#B8B8C0' }}
              >
                Administrator Email Address
              </label>
              <div className="relative">
                <Mail
                  className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: isLight ? '#94A3B8' : '#71717A' }}
                />
                <input
                  type="email"
                  required
                  autoFocus
                  autoComplete="username"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="admin@novahunger.com"
                  className={`w-full rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
                    isLight
                      ? 'bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-orange-500'
                      : 'bg-[#0B0B0D] border border-[#2B2B30] text-white placeholder:text-stone-600 focus:border-orange-500'
                  }`}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  className="text-[11px] font-semibold"
                  style={{ color: isLight ? '#475569' : '#B8B8C0' }}
                >
                  Master Password
                </label>
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(true)}
                  className="text-[11px] font-semibold text-orange-500 hover:text-orange-400 transition-colors"
                >
                  Forgot Password?
                </button>
              </div>

              <div className="relative">
                <Lock
                  className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: isLight ? '#94A3B8' : '#71717A' }}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="••••••••••••"
                  className={`w-full rounded-xl pl-10 pr-10 py-2.5 text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
                    isLight
                      ? 'bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-orange-500'
                      : 'bg-[#0B0B0D] border border-[#2B2B30] text-white placeholder:text-stone-600 focus:border-orange-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-orange-500 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500 bg-transparent"
                />
                <span style={{ color: isLight ? '#475569' : '#B8B8C0' }}>
                  Remember this console session for 30 days
                </span>
              </label>
            </div>

            {/* Error Message Banner */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* Success state */}
            {adminLoginSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in duration-150">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>Authentication successful! Launching administrative console...</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || adminLoginSuccess}
              className="btn-primary w-full py-3.5 text-xs font-bold flex items-center justify-center gap-2 mt-2 shadow-lg"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating Session...</span>
                </>
              ) : adminLoginSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Access Granted</span>
                </>
              ) : (
                <>
                  <span>Sign In to Admin Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Security Notice */}
          <div
            className="mt-6 pt-5 border-t text-center text-[11px] leading-relaxed"
            style={{
              borderColor: isLight ? '#E2E8F0' : '#2B2B30',
              color: isLight ? '#94A3B8' : '#71717A',
            }}
          >
            <span>Restricted administrative portal. All session activities and dispatch events are cryptographically recorded in the platform audit log.</span>
          </div>
        </div>

        {/* Forgot Password Modal */}
        {forgotModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div
              className={`w-full max-w-md border rounded-3xl p-6 sm:p-7 shadow-2xl relative ${
                isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#151518] border-[#2B2B30] text-white'
              }`}
            >
              <button
                onClick={() => {
                  setForgotModalOpen(false);
                  setForgotSent(false);
                  setForgotEmail('');
                }}
                className="absolute top-5 right-5 text-stone-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-500">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base">Password Recovery</h3>
                  <p className="text-xs text-stone-400">Master Administrative Account</p>
                </div>
              </div>

              {forgotSent ? (
                <div className="space-y-4 py-2">
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Instructions Dispatched</p>
                      <p className="text-[11px] text-stone-300 mt-1 leading-relaxed">
                        If an administrator account exists for <strong>{forgotEmail}</strong>, password reset instructions have been logged to the platform security event stream.
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-stone-400 leading-relaxed">
                    For local development & evaluation, the master seed credentials are:
                    <br />
                    <code className="text-orange-400 font-mono text-[11px] block mt-1 bg-black/40 p-2 rounded-lg">
                      Email: admin@novahunger.com
                      <br />
                      Password: admin123
                    </code>
                  </p>

                  <button
                    onClick={() => {
                      setForgotModalOpen(false);
                      setForgotSent(false);
                      handleFillDemoAdmin();
                    }}
                    className="btn-primary w-full py-2.5 text-xs font-bold"
                  >
                    Use Master Credentials & Close
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <p className="text-xs text-stone-400 leading-relaxed">
                    Enter the master email associated with your administrative account to initiate identity verification and recovery.
                  </p>

                  <div>
                    <label className="text-[11px] font-semibold text-stone-400 block mb-1">
                      Registered Administrator Email
                    </label>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="admin@novahunger.com"
                      className="w-full bg-[#0B0B0D] border border-[#2B2B30] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setForgotModalOpen(false)}
                      className="btn-secondary flex-1 py-2.5 text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary flex-1 py-2.5 text-xs font-bold"
                    >
                      Request Recovery
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  const portalConfig = {
    customer: {
      badge: 'Customer Account',
      loginTitle: 'Customer Sign In',
      registerTitle: 'Create Customer Account',
      subtitle: 'Order delicious meals, save addresses, and track deliveries in real time.',
      icon: <User className="w-5 h-5 text-[#FF7900]" />,
    },
    rider: {
      badge: 'Rider Fleet Portal',
      loginTitle: 'Delivery Rider Sign In',
      registerTitle: 'Become a Delivery Rider',
      subtitle: 'Join our vetted courier team. Applications are subject to administrative review.',
      icon: <Bike className="w-5 h-5 text-[#FF7900]" />,
    },
    restaurant: {
      badge: 'Restaurant Manager Portal',
      loginTitle: 'Restaurant Manager Login',
      registerTitle: 'Register Your Restaurant',
      subtitle: 'Manage your commercial kitchen, live orders, menus, and business analytics.',
      icon: <Store className="w-5 h-5 text-[#FF7900]" />,
    },
    admin: {
      badge: 'Restricted Administration',
      loginTitle: 'Admin Console Login',
      registerTitle: '',
      subtitle: 'Authorized platform operators only. Administrative credentials required.',
      icon: <Shield className="w-5 h-5 text-rose-500" />,
    },
  }[portal];

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-[#0B0B0D]">
      <div className="w-full max-w-xl bg-[#151518] border border-[#2B2B30] rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        {/* Portal Badge & Header */}
        <div className="mb-6 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#0B0B0D] border border-[#2B2B30] flex items-center justify-center">
                {portalConfig.icon}
              </div>
              <span className="text-xs uppercase tracking-wider font-bold text-[#FF7900]">
                {portalConfig.badge}
              </span>
            </div>

            {/* Quick cross-portal navigation for partners */}
            {portal === 'customer' && (
              <div className="flex items-center gap-3 text-xs text-[#B8B8C0]">
                <button
                  type="button"
                  onClick={() => onNavigate('/rider/login')}
                  className="hover:text-[#FF9D00] transition-colors"
                >
                  Rider Portal
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => onNavigate('/restaurant/login')}
                  className="hover:text-[#FF9D00] transition-colors"
                >
                  Restaurant Portal
                </button>
              </div>
            )}
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
            {mode === 'login' ? portalConfig.loginTitle : portalConfig.registerTitle}
          </h1>

          <p className="text-xs text-[#B8B8C0] leading-relaxed">
            {portalConfig.subtitle}
          </p>
        </div>

        {/* Mode Toggle (Sign In vs Register) */}
        <div className="flex border-b border-[#2B2B30] mb-6 text-xs">
          <button
            type="button"
            onClick={() => {
              if (portal === 'customer') onNavigate('/customer/login');
              else if (portal === 'rider') onNavigate('/rider/login');
              else if (portal === 'restaurant') onNavigate('/restaurant/login');
            }}
            className={`pb-3 font-semibold transition-colors relative mr-6 ${
              mode === 'login' ? 'text-[#FF9D00]' : 'text-[#B8B8C0] hover:text-white'
            }`}
          >
            Sign In
            {mode === 'login' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF7900]" />
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              if (portal === 'customer') onNavigate('/customer/register');
              else if (portal === 'rider') onNavigate('/rider/register');
              else if (portal === 'restaurant') onNavigate('/restaurant/register');
            }}
            className={`pb-3 font-semibold transition-colors relative ${
              mode === 'register' ? 'text-[#FF9D00]' : 'text-[#B8B8C0] hover:text-white'
            }`}
          >
            {portal === 'rider'
              ? 'Apply as Rider'
              : portal === 'restaurant'
              ? 'Register Restaurant'
              : 'Create Account'}
            {mode === 'register' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF7900]" />
            )}
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="text-[11px] font-semibold text-[#B8B8C0] block mb-1">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Mercer"
                  className="w-full bg-[#0B0B0D] border border-[#2B2B30] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-stone-600 focus:outline-none focus:border-[#FF7900] transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-[11px] font-semibold text-[#B8B8C0] block mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-[#0B0B0D] border border-[#2B2B30] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder:text-stone-600 focus:outline-none focus:border-[#FF7900] transition-colors"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="text-[11px] font-semibold text-[#B8B8C0] block mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-[#0B0B0D] border border-[#2B2B30] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder:text-stone-600 focus:outline-none focus:border-[#FF7900] transition-colors"
                />
              </div>
            </div>
          )}

          {/* RIDER-SPECIFIC REGISTRATION FIELDS */}
          {portal === 'rider' && mode === 'register' && (
            <div className="p-4 rounded-2xl bg-[#0B0B0D] border border-[#2B2B30] space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF9D00] block">
                Courier & Vehicle Information
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[#B8B8C0] block mb-1">
                    Vehicle Type
                  </label>
                  <select
                    value={vehicleType}
                    onChange={(e: any) => setVehicleType(e.target.value)}
                    className="w-full bg-[#151518] border border-[#2B2B30] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF7900]"
                  >
                    <option value="motorcycle">Motorcycle</option>
                    <option value="scooter">Electric Scooter</option>
                    <option value="bicycle">Bicycle</option>
                    <option value="car">Car</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#B8B8C0] block mb-1">
                    Registration No.
                  </label>
                  <input
                    type="text"
                    required
                    value={vehicleRegNumber}
                    onChange={(e) => setVehicleRegNumber(e.target.value)}
                    placeholder="e.g. MT-8849-BK"
                    className="w-full bg-[#151518] border border-[#2B2B30] rounded-xl px-3 py-2 text-xs text-white placeholder:text-stone-600 focus:outline-none focus:border-[#FF7900]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[#B8B8C0] block mb-1">
                    License / Govt ID
                  </label>
                  <input
                    type="text"
                    required
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="DL-NV-992019"
                    className="w-full bg-[#151518] border border-[#2B2B30] rounded-xl px-3 py-2 text-xs text-white placeholder:text-stone-600 focus:outline-none focus:border-[#FF7900]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#B8B8C0] block mb-1">
                    City & Zone
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Metropolis"
                    className="w-full bg-[#151518] border border-[#2B2B30] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF7900]"
                  />
                </div>
              </div>

              <div className="text-[11px] text-[#FF9D00]/90 flex items-start gap-1.5 pt-1">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#FF7900]" />
                <span>
                  After registration, your account will enter <strong>Pending Approval</strong> until verified by our safety team.
                </span>
              </div>
            </div>
          )}

          {/* RESTAURANT-SPECIFIC REGISTRATION FIELDS */}
          {portal === 'restaurant' && mode === 'register' && (
            <div className="p-4 rounded-2xl bg-[#0B0B0D] border border-[#2B2B30] space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF9D00] block">
                Restaurant Verification
              </span>

              <div>
                <label className="text-[11px] font-semibold text-[#B8B8C0] block mb-1">
                  Kitchen / Restaurant Name
                </label>
                <input
                  type="text"
                  required
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  placeholder="e.g. Flame & Crust Artisan Kitchen"
                  className="w-full bg-[#151518] border border-[#2B2B30] rounded-xl px-3 py-2 text-xs text-white placeholder:text-stone-600 focus:outline-none focus:border-[#FF7900]"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#B8B8C0] block mb-1">
                  Commercial Address
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="42 High Street, Downtown"
                  className="w-full bg-[#151518] border border-[#2B2B30] rounded-xl px-3 py-2 text-xs text-white placeholder:text-stone-600 focus:outline-none focus:border-[#FF7900]"
                />
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-[#B8B8C0]">
                Password
              </label>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => setShowPasswordHelp(!showPasswordHelp)}
                  className="text-[11px] font-medium text-[#FF9D00] hover:underline transition-colors"
                >
                  {showPasswordHelp ? 'Close help' : 'Password help'}
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0B0B0D] border border-[#2B2B30] rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder:text-stone-600 focus:outline-none focus:border-[#FF7900] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {showPasswordHelp && (
              <div className="mt-2 p-3 rounded-xl bg-[#0B0B0D] border border-[#2B2B30] text-[11px] text-[#B8B8C0] flex items-start gap-2 animate-in fade-in duration-150">
                <Info className="w-4 h-4 text-[#FF7900] shrink-0 mt-0.5" />
                <span>
                  For customer or courier account assistance, please contact platform support at{' '}
                  <span className="text-[#FF9D00] font-medium">support@novahunger.com</span>.
                </span>
              </div>
            )}
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="block">{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full py-3.5 text-xs font-bold flex items-center justify-center gap-2 mt-4"
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>
                  {mode === 'login' ? 'Sign In' : 'Submit Registration'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Links & Navigation */}
        <div className="mt-8 pt-6 border-t border-[#2B2B30] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#B8B8C0]">
          {portal !== 'customer' ? (
            <button
              onClick={() => onNavigate('/customer/login')}
              className="hover:text-[#FF9D00] transition-colors"
            >
              ← Back to Customer Sign In
            </button>
          ) : (
            <div className="flex gap-4">
              <button
                onClick={() => onNavigate('/rider/register')}
                className="hover:text-[#FF9D00] transition-colors"
              >
                Become a Rider
              </button>
              <button
                onClick={() => onNavigate('/restaurant/register')}
                className="hover:text-[#FF9D00] transition-colors"
              >
                Register Restaurant
              </button>
            </div>
          )}

          <button onClick={() => onNavigate('/')} className="hover:text-white transition-colors">
            Return to Homepage
          </button>
        </div>
      </div>
    </div>
  );
};
