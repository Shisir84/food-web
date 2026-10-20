import React, { useState, useMemo } from 'react';
import { User, Mail, Phone, Lock, Eye, EyeOff, Check, X, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

interface SignUpFormProps {
  onSuccess: (email: string) => void;
  onSignInClick: () => void;
  onFocusField?: () => void;
  onBlurField?: () => void;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({
  onSuccess,
  onSignInClick,
  onFocusField,
  onBlurField,
}) => {
  const { register } = useAuth();

  const [role, setRole] = useState<'customer' | 'rider' | 'restaurant'>('customer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Real-time password strength calculations
  const passwordCriteria = useMemo(() => {
    return {
      length: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[^A-Za-z0-9]/.test(password),
    };
  }, [password]);

  const strengthScore = useMemo(() => {
    let score = 0;
    if (passwordCriteria.length) score += 1;
    if (passwordCriteria.hasUpper) score += 1;
    if (passwordCriteria.hasNumber) score += 1;
    if (passwordCriteria.hasSpecial) score += 1;
    return score;
  }, [passwordCriteria]);

  const strengthLabel = useMemo(() => {
    if (password.length === 0) return { text: 'None', color: 'bg-stone-600', textColor: 'text-stone-400' };
    if (strengthScore <= 1) return { text: 'Weak', color: 'bg-rose-500', textColor: 'text-rose-400' };
    if (strengthScore === 2) return { text: 'Fair', color: 'bg-amber-500', textColor: 'text-amber-400' };
    if (strengthScore === 3) return { text: 'Good', color: 'bg-sky-400', textColor: 'text-sky-300' };
    return { text: 'Strong', color: 'bg-emerald-400', textColor: 'text-emerald-300' };
  }, [password, strengthScore]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Please provide your full legal name.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must contain at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify.');
      return;
    }

    if (!agreeTerms) {
      setErrorMessage('Please accept the Terms of Service and Privacy Policy to proceed.');
      return;
    }

    setIsLoading(true);

    try {
      await register({
        role,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
      });

      onSuccess(email.trim().toLowerCase());
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. An account with this email may already exist.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      {/* Role Picker (Customer / Rider / Kitchen) */}
      <div>
        <label className="block text-[11px] font-semibold text-[#B8B8C0] mb-1.5">
          Account Category
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setRole('customer')}
            className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all ${
              role === 'customer'
                ? 'bg-[#F18B58]/20 border-[#F18B58] text-[#FFD58A] shadow-sm shadow-[#F18B58]/20'
                : 'bg-[#0F1728]/70 border-[#263653] text-[#B8B8C0] hover:text-white hover:border-[#384C74]'
            }`}
          >
            Customer
          </button>
          <button
            type="button"
            onClick={() => setRole('rider')}
            className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all ${
              role === 'rider'
                ? 'bg-[#F18B58]/20 border-[#F18B58] text-[#FFD58A] shadow-sm shadow-[#F18B58]/20'
                : 'bg-[#0F1728]/70 border-[#263653] text-[#B8B8C0] hover:text-white hover:border-[#384C74]'
            }`}
          >
            Courier
          </button>
          <button
            type="button"
            onClick={() => setRole('restaurant')}
            className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all ${
              role === 'restaurant'
                ? 'bg-[#F18B58]/20 border-[#F18B58] text-[#FFD58A] shadow-sm shadow-[#F18B58]/20'
                : 'bg-[#0F1728]/70 border-[#263653] text-[#B8B8C0] hover:text-white hover:border-[#384C74]'
            }`}
          >
            Restaurant
          </button>
        </div>
      </div>

      {/* Full Name */}
      <div>
        <label className="block text-[11px] font-semibold text-[#B8B8C0] mb-1">
          Full name
        </label>
        <div className="relative">
          <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={onFocusField}
            onBlur={onBlurField}
            placeholder="e.g. Elena Rostova"
            className="w-full rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-medium text-white bg-[#0F1728]/80 border border-[#263653] focus:border-[#F18B58] transition-all duration-200 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-[#F18B58]/40"
          />
        </div>
      </div>

      {/* Email Address */}
      <div>
        <label className="block text-[11px] font-semibold text-[#B8B8C0] mb-1">
          Email address
        </label>
        <div className="relative">
          <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={onFocusField}
            onBlur={onBlurField}
            placeholder="name@example.com"
            className="w-full rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-medium text-white bg-[#0F1728]/80 border border-[#263653] focus:border-[#F18B58] transition-all duration-200 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-[#F18B58]/40"
          />
        </div>
      </div>

      {/* Phone Number */}
      <div>
        <label className="block text-[11px] font-semibold text-[#B8B8C0] mb-1">
          Mobile phone number (for dispatch notices)
        </label>
        <div className="relative">
          <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onFocus={onFocusField}
            onBlur={onBlurField}
            placeholder="+1 (555) 014-4821"
            className="w-full rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-medium text-white bg-[#0F1728]/80 border border-[#263653] focus:border-[#F18B58] transition-all duration-200 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-[#F18B58]/40"
          />
        </div>
      </div>

      {/* Password with Strength Meter */}
      <div>
        <label className="block text-[11px] font-semibold text-[#B8B8C0] mb-1">
          Password
        </label>
        <div className="relative">
          <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type={showPassword ? 'text' : 'password'}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={onFocusField}
            onBlur={onBlurField}
            placeholder="Minimum 8 characters"
            className="w-full rounded-xl pl-10 pr-10 py-2.5 text-xs font-medium text-white bg-[#0F1728]/80 border border-[#263653] focus:border-[#F18B58] transition-all duration-200 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-[#F18B58]/40"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-[#FFD58A] transition-colors focus:outline-none"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {/* Strength Progress Indicator */}
        {password.length > 0 && (
          <div className="mt-2 space-y-1.5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-[#B8B8C0]">Security strength:</span>
              <span className={`font-bold ${strengthLabel.textColor}`}>{strengthLabel.text}</span>
            </div>
            <div className="h-1.5 w-full bg-[#1A2538] rounded-full overflow-hidden flex gap-1">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`h-full flex-1 transition-all duration-300 rounded-full ${
                    strengthScore >= step ? strengthLabel.color : 'bg-transparent'
                  }`}
                />
              ))}
            </div>

            {/* Criteria Checklist */}
            <div className="grid grid-cols-2 gap-1 text-[10px] text-stone-400 pt-1">
              <div className="flex items-center gap-1.5">
                {passwordCriteria.length ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <X className="w-3 h-3 text-stone-500" />
                )}
                <span className={passwordCriteria.length ? 'text-stone-200' : ''}>8+ characters</span>
              </div>
              <div className="flex items-center gap-1.5">
                {passwordCriteria.hasUpper ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <X className="w-3 h-3 text-stone-500" />
                )}
                <span className={passwordCriteria.hasUpper ? 'text-stone-200' : ''}>Uppercase letter</span>
              </div>
              <div className="flex items-center gap-1.5">
                {passwordCriteria.hasNumber ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <X className="w-3 h-3 text-stone-500" />
                )}
                <span className={passwordCriteria.hasNumber ? 'text-stone-200' : ''}>Number (0-9)</span>
              </div>
              <div className="flex items-center gap-1.5">
                {passwordCriteria.hasSpecial ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <X className="w-3 h-3 text-stone-500" />
                )}
                <span className={passwordCriteria.hasSpecial ? 'text-stone-200' : ''}>Special symbol</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <label className="block text-[11px] font-semibold text-[#B8B8C0] mb-1">
          Confirm password
        </label>
        <div className="relative">
          <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type={showPassword ? 'text' : 'password'}
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onFocus={onFocusField}
            onBlur={onBlurField}
            placeholder="Re-enter your password"
            className={`w-full rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-medium text-white bg-[#0F1728]/80 border transition-all duration-200 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-[#F18B58]/40 ${
              confirmPassword && password !== confirmPassword
                ? 'border-rose-500 focus:border-rose-500'
                : 'border-[#263653] focus:border-[#F18B58]'
            }`}
          />
        </div>
      </div>

      {/* Terms Acceptance Checkbox */}
      <div className="pt-1">
        <label className="flex items-start gap-2.5 cursor-pointer text-xs select-none text-[#B8B8C0]">
          <input
            type="checkbox"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            className="w-4 h-4 mt-0.5 rounded border-[#2B3B5E] text-[#F18B58] focus:ring-[#F18B58] bg-[#0F1728]"
          />
          <span className="text-[11px] leading-relaxed">
            I agree to the <a href="/terms" className="text-[#FFD58A] hover:underline" onClick={(e) => e.stopPropagation()}>Terms of Service</a> and acknowledge the <a href="/privacy" className="text-[#FFD58A] hover:underline" onClick={(e) => e.stopPropagation()}>Privacy Policy</a>.
          </span>
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
        className="w-full py-3 rounded-xl text-xs font-bold text-black transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-[#F18B58]/25 hover:shadow-[#F18B58]/40 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mt-2"
        style={{
          background: 'linear-gradient(135deg, #F18B58 0%, #FFD58A 100%)',
        }}
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            <span>Creating account...</span>
          </>
        ) : (
          <>
            <span>Create account</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      {/* Back to Sign In Link */}
      <div className="text-center pt-2">
        <p className="text-xs text-[#B8B8C0]">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSignInClick}
            className="font-bold text-[#FFD58A] hover:text-[#FFF6E9] transition-colors focus:outline-none"
          >
            Sign in
          </button>
        </p>
      </div>
    </form>
  );
};
