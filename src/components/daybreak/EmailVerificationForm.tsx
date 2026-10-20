import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, ArrowRight, RotateCw, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

interface EmailVerificationFormProps {
  email: string;
  onVerified: () => void;
  onBackToSignIn: () => void;
  onFocusField?: () => void;
  onBlurField?: () => void;
}

export const EmailVerificationForm: React.FC<EmailVerificationFormProps> = ({
  email,
  onVerified,
  onBackToSignIn,
  onFocusField,
  onBlurField,
}) => {
  const { verifyEmail, resendVerification } = useAuth();

  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Countdown timer for rate limiting resend action (60 seconds)
  const [cooldown, setCooldown] = useState(45);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleDigitChange = (index: number, value: string) => {
    // Only accept numeric character
    const char = value.slice(-1);
    if (char && !/^\d$/.test(char)) return;

    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);
    setErrorMessage(null);

    // Auto focus next box
    if (char && index < 5) {
      const nextInput = document.getElementById(`digit-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      const prevInput = document.getElementById(`digit-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (/^\d{4,6}$/.test(pasted)) {
      const newDigits = ['', '', '', '', '', ''];
      for (let i = 0; i < Math.min(6, pasted.length); i++) {
        newDigits[i] = pasted[i];
      }
      setDigits(newDigits);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length < 4) {
      setErrorMessage('Please enter the verification code sent to your email.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await verifyEmail(email || 'customer@novahunger.com', code);
      setIsSuccess(true);
      setSuccessMessage(res.message || 'Email verified successfully!');
      setTimeout(() => {
        onVerified();
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid or expired verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setErrorMessage(null);
    try {
      const res = await resendVerification(email || 'customer@novahunger.com');
      setSuccessMessage(res.message || 'Fresh verification code dispatched!');
      setCooldown(60);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to resend code. Please try again shortly.');
    }
  };

  // Demo auto-fill button
  const handleFillDemoCode = () => {
    setDigits(['5', '4', '9', '2', '1', '0']);
    setErrorMessage(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      {/* Header Info */}
      <div className="p-3.5 rounded-2xl bg-[#0F1728]/70 border border-[#263653] text-xs space-y-2">
        <div className="flex items-center gap-2 text-[#FFD58A] font-semibold">
          <Mail className="w-4 h-4 text-[#F18B58]" />
          <span>Security Verification Code</span>
        </div>
        <p className="text-[11px] text-stone-300 leading-relaxed">
          We have transmitted a 6-digit verification code to{' '}
          <strong className="text-white">{email || 'your email address'}</strong>.
        </p>
      </div>

      {/* 6-Digit Code Input Row */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[11px] font-semibold text-[#B8B8C0]">
            Enter 6-digit confirmation code
          </label>
          <button
            type="button"
            onClick={handleFillDemoCode}
            className="text-[10px] font-bold text-[#FFD58A] hover:underline"
          >
            Auto-fill demo code
          </button>
        </div>

        <div className="flex items-center justify-between gap-2" onPaste={handlePaste}>
          {digits.map((digit, idx) => (
            <input
              key={idx}
              id={`digit-${idx}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              onFocus={onFocusField}
              onBlur={onBlurField}
              className="w-11 h-12 text-center text-lg font-bold text-white bg-[#0F1728]/90 border border-[#263653] rounded-xl focus:border-[#F18B58] focus:ring-2 focus:ring-[#F18B58]/40 focus:outline-none transition-all duration-200"
            />
          ))}
        </div>
      </div>

      {/* Error or Success Alert */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{successMessage}</span>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || isSuccess}
        className="w-full py-3 rounded-xl text-xs font-bold text-black transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-[#F18B58]/25 hover:shadow-[#F18B58]/40 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mt-2"
        style={{
          background: 'linear-gradient(135deg, #F18B58 0%, #FFD58A 100%)',
        }}
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            <span>Verifying code...</span>
          </>
        ) : isSuccess ? (
          <>
            <CheckCircle2 className="w-4 h-4" />
            <span>Verified Successfully!</span>
          </>
        ) : (
          <>
            <span>Verify & Continue</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      {/* Resend Code Action with Rate-Limiting */}
      <div className="flex items-center justify-between text-xs pt-1 border-t border-[#263653]/60">
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0}
          className="inline-flex items-center gap-1.5 text-stone-300 hover:text-[#FFD58A] transition-colors disabled:opacity-50 disabled:pointer-events-none"
        >
          <RotateCw className={`w-3.5 h-3.5 ${cooldown > 0 ? 'text-stone-500' : 'text-[#F18B58]'}`} />
          <span>{cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend verification code'}</span>
        </button>

        <button
          type="button"
          onClick={onBackToSignIn}
          className="text-stone-400 hover:text-white transition-colors"
        >
          Return to Sign in
        </button>
      </div>
    </form>
  );
};
