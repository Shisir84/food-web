import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { SocialLoginButtons } from './SocialLoginButtons.tsx';

interface SignInFormProps {
  portal: 'customer' | 'rider' | 'restaurant' | 'admin';
  onNavigate: (path: string) => void;
  onForgotPasswordClick: () => void;
  onSuccess: () => void;
  onFocusField?: () => void;
  onBlurField?: () => void;
}

export const SignInForm: React.FC<SignInFormProps> = ({
  portal,
  onNavigate,
  onForgotPasswordClick,
  onSuccess,
  onFocusField,
  onBlurField,
}) => {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Email format validation helper
  const validateEmail = (val: string) => {
    if (!val.trim()) {
      setEmailError('Email address is required');
      return false;
    }
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(val.trim())) {
      setEmailError('Please enter a valid email address (e.g. name@domain.com)');
      return false;
    }
    setEmailError(null);
    return true;
  };

  // Demo credential quick-loaders
  const handleFillDemo = (demoRole: 'customer' | 'rider' | 'restaurant' | 'admin') => {
    setErrorMessage(null);
    setEmailError(null);
    if (demoRole === 'admin') {
      setEmail('admin@novahunger.com');
      setPassword('admin123');
    } else if (demoRole === 'rider') {
      setEmail('rider.alex@novahunger.com');
      setPassword('pass123');
    } else if (demoRole === 'restaurant') {
      setEmail('owner.flame@novahunger.com');
      setPassword('pass123');
    } else {
      setEmail('customer@novahunger.com');
      setPassword('pass123');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const isEmailValid = validateEmail(email);
    if (!isEmailValid) return;

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await login(
        email.trim(),
        password,
        portal === 'customer' ? undefined : portal,
        rememberMe
      );

      onSuccess();

      // Navigate to corresponding dashboard
      const userRole = res?.user?.role;
      setTimeout(() => {
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
          onNavigate('/');
        }
      }, 500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      {/* Quick-Fill Demo Bar */}
      <div className="p-2.5 rounded-2xl bg-[#162138]/70 border border-[#2B3B5E]/60 text-xs mb-3">
        <div className="flex items-center justify-between mb-1.5 px-0.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#FFD58A]">
            <Sparkles className="w-3.5 h-3.5 text-[#F18B58]" />
            <span>Instant Demo Accounts</span>
          </div>
          <span className="text-[10px] text-stone-400">One-click fill</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          <button
            type="button"
            onClick={() => handleFillDemo('customer')}
            className={`py-1 px-1.5 rounded-lg text-[10px] font-bold transition-all border ${
              email === 'customer@novahunger.com'
                ? 'bg-[#F18B58] text-black border-[#F18B58]'
                : 'bg-[#1C2A48] hover:bg-[#23355C] text-[#FFF6E9] border-[#2E3F66]'
            }`}
          >
            Customer
          </button>
          <button
            type="button"
            onClick={() => handleFillDemo('rider')}
            className={`py-1 px-1.5 rounded-lg text-[10px] font-bold transition-all border ${
              email === 'rider.alex@novahunger.com'
                ? 'bg-[#F18B58] text-black border-[#F18B58]'
                : 'bg-[#1C2A48] hover:bg-[#23355C] text-[#FFF6E9] border-[#2E3F66]'
            }`}
          >
            Courier
          </button>
          <button
            type="button"
            onClick={() => handleFillDemo('restaurant')}
            className={`py-1 px-1.5 rounded-lg text-[10px] font-bold transition-all border ${
              email === 'owner.flame@novahunger.com'
                ? 'bg-[#F18B58] text-black border-[#F18B58]'
                : 'bg-[#1C2A48] hover:bg-[#23355C] text-[#FFF6E9] border-[#2E3F66]'
            }`}
          >
            Kitchen
          </button>
          <button
            type="button"
            onClick={() => handleFillDemo('admin')}
            className={`py-1 px-1.5 rounded-lg text-[10px] font-bold transition-all border ${
              email === 'admin@novahunger.com'
                ? 'bg-[#F18B58] text-black border-[#F18B58]'
                : 'bg-[#1C2A48] hover:bg-[#23355C] text-[#FFF6E9] border-[#2E3F66]'
            }`}
          >
            Admin
          </button>
        </div>
      </div>

      {/* Email Address Field */}
      <div>
        <label
          htmlFor="daybreak-email"
          className="block text-[11px] font-semibold text-[#B8B8C0] mb-1.5"
        >
          Email address
        </label>
        <div className="relative">
          <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="daybreak-email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) validateEmail(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            onBlur={() => {
              validateEmail(email);
              if (onBlurField) onBlurField();
            }}
            onFocus={onFocusField}
            placeholder="name@example.com"
            className={`w-full rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-medium text-white bg-[#0F1728]/80 border transition-all duration-200 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-[#F18B58]/40 ${
              emailError
                ? 'border-rose-500 focus:border-rose-500'
                : 'border-[#263653] focus:border-[#F18B58]'
            }`}
          />
        </div>
        {emailError && (
          <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>{emailError}</span>
          </p>
        )}
      </div>

      {/* Password Field */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label
            htmlFor="daybreak-password"
            className="block text-[11px] font-semibold text-[#B8B8C0]"
          >
            Password
          </label>
          <button
            type="button"
            onClick={onForgotPasswordClick}
            className="text-[11px] font-semibold text-[#FFD58A] hover:text-[#FFF6E9] transition-colors focus:outline-none"
          >
            Forgot password?
          </button>
        </div>
        <div className="relative">
          <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="daybreak-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            onFocus={onFocusField}
            onBlur={onBlurField}
            placeholder="••••••••••••"
            className="w-full rounded-xl pl-10 pr-10 py-2.5 text-xs font-medium text-white bg-[#0F1728]/80 border border-[#263653] focus:border-[#F18B58] transition-all duration-200 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-[#F18B58]/40"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-[#FFD58A] transition-colors focus:outline-none"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Remember Me Checkbox */}
      <div className="flex items-center justify-between pt-0.5">
        <label className="flex items-center gap-2 cursor-pointer text-xs select-none text-[#B8B8C0]">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded border-[#2B3B5E] text-[#F18B58] focus:ring-[#F18B58] bg-[#0F1728]"
          />
          <span className="text-[11px]">Remember me for 30 days</span>
        </label>
      </div>

      {/* Error Message Alert */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{errorMessage}</span>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 rounded-xl text-xs font-bold text-black transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-[#F18B58]/25 hover:shadow-[#F18B58]/40 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, #F18B58 0%, #FFD58A 100%)',
        }}
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            <span>Signing in...</span>
          </>
        ) : (
          <>
            <span>Sign in</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      {/* Social Login Options */}
      <SocialLoginButtons
        onSuccess={onSuccess}
        onError={(err) => setErrorMessage(err)}
      />
    </form>
  );
};
