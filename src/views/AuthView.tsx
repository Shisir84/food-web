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
  KeyRound,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  auth,
  sendPasswordResetEmail,
  formatFirebaseAuthError,
} from '../lib/firebase.ts';

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
  const { login, loginAdminWithFirebase, register } = useAuth();

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

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Forgot password state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  const handleForgotPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const targetEmail = (forgotEmail || email).trim();
    if (!targetEmail) {
      setErrorMessage('Please enter your email address to receive a password reset link.');
      return;
    }

    setResetLoading(true);
    setResetSuccessMessage(null);
    setErrorMessage(null);

    try {
      await sendPasswordResetEmail(auth, targetEmail);
      setResetSuccessMessage(
        `Password reset email sent to ${targetEmail}! Please check your inbox and follow the instructions to reset your password.`
      );
      setShowForgotModal(false);
    } catch (err: any) {
      setErrorMessage(formatFirebaseAuthError(err));
    } finally {
      setResetLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setResetSuccessMessage(null);

    try {
      if (mode === 'login') {
        let res;
        if (portal === 'admin') {
          // Firebase Authentication integration for Administrator
          res = await loginAdminWithFirebase(email, password);
        } else {
          res = await login(email, password, portal === 'customer' ? undefined : portal);
        }

        const userRole = res?.user?.role;
        if (userRole === 'admin') {
          onNavigate('/admin/dashboard');
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
        // Register: role is fixed to the portal type (never chosen arbitrarily)
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
      if (portal === 'admin') {
        setErrorMessage(formatFirebaseAuthError(err));
      } else {
        setErrorMessage(err.message || 'Authentication failed. Please verify your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

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

        {/* Mode Toggle (Sign In vs Register) - Only if not Admin */}
        {portal !== 'admin' && (
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
        )}

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
                  onClick={() => {
                    setForgotEmail(email);
                    setShowForgotModal(true);
                  }}
                  className="text-[11px] font-medium text-[#FF9D00] hover:underline transition-colors"
                >
                  Forgot Password?
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
          </div>

          {resetSuccessMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{resetSuccessMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="block">{errorMessage}</span>
                {portal === 'admin' && errorMessage.includes('Account not found') && (
                  <span className="block text-[11px] text-[#B8B8C0]">
                    To provision the initial admin user, run: <code className="bg-black/60 px-1.5 py-0.5 rounded text-white font-mono">ADMIN_INITIAL_PASSWORD="..." npm run setup-admin</code> or create user in Firebase Console with claim <code className="bg-black/60 px-1.5 py-0.5 rounded text-white font-mono">&#123; admin: true &#125;</code>.
                  </span>
                )}
              </div>
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
                  {mode === 'login'
                    ? portal === 'admin'
                      ? 'Access Admin Dashboard'
                      : 'Sign In'
                    : 'Submit Registration'}
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

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#151518] border border-[#2B2B30] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#0B0B0D] border border-[#2B2B30] flex items-center justify-center text-[#FF7900]">
                <KeyRound className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-white">Reset Account Password</h2>
            </div>

            <p className="text-xs text-[#B8B8C0] leading-relaxed">
              Enter the email address registered with your account. We will send a secure password reset link via Firebase Authentication.
            </p>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-[#B8B8C0] block mb-1">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-[#0B0B0D] border border-[#2B2B30] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder:text-stone-600 focus:outline-none focus:border-[#FF7900] transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#2B2B30] text-xs font-semibold text-[#B8B8C0] hover:text-white hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="btn-primary px-5 py-2.5 text-xs font-bold flex items-center gap-2"
                >
                  {resetLoading ? 'Sending link...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
