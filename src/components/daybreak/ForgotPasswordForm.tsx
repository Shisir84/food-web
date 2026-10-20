import React, { useState } from 'react';
import { Mail, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, KeyRound, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

interface ForgotPasswordFormProps {
  onBackToSignIn: () => void;
  onProceedToVerification: (email: string) => void;
  onFocusField?: () => void;
  onBlurField?: () => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onBackToSignIn,
  onProceedToVerification,
  onFocusField,
  onBlurField,
}) => {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);

    try {
      await forgotPassword(email.trim().toLowerCase());
      setIsSubmitted(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to process reset request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="space-y-5 text-left animate-in fade-in duration-300">
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-emerald-300 text-sm">Recovery Dispatched</h4>
            <p className="text-[11px] text-stone-300 leading-relaxed">
              If an account is associated with <strong>{email}</strong>, a secure cryptographic password reset token and verification code have been transmitted.
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0F1728]/70 border border-[#263653] text-xs text-stone-300 space-y-2">
          <div className="flex items-center gap-2 text-[#FFD58A] font-semibold text-[11px]">
            <KeyRound className="w-4 h-4 text-[#F18B58]" />
            <span>Next Steps</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-[11px] text-stone-400 pl-1 leading-relaxed">
            <li>Check your email inbox (and spam folder) for the verification code.</li>
            <li>Click the secure link or enter your 6-digit confirmation code.</li>
            <li>Define a new 8+ character password to regain account access.</li>
          </ol>
        </div>

        <div className="flex flex-col gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => onProceedToVerification(email)}
            className="w-full py-2.5 rounded-xl text-xs font-bold text-black transition-all flex items-center justify-center gap-2 shadow-md shadow-[#F18B58]/20 hover:scale-[1.01] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #F18B58 0%, #FFD58A 100%)',
            }}
          >
            <span>Enter 6-Digit Verification Code</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onBackToSignIn}
            className="w-full py-2.5 rounded-xl text-xs font-semibold text-stone-300 hover:text-white bg-[#152033] hover:bg-[#1A2840] border border-[#263653] transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Sign In</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <div className="p-3 rounded-2xl bg-[#141E33]/70 border border-[#263653] text-[11px] text-[#B8B8C0] flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-[#FFD58A] shrink-0 mt-0.5" />
        <span className="leading-relaxed">
          To protect account confidentiality, password recovery will never reveal whether an email address is registered on this platform.
        </span>
      </div>

      <div>
        <label className="block text-[11px] font-semibold text-[#B8B8C0] mb-1.5">
          Account email address
        </label>
        <div className="relative">
          <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            onFocus={onFocusField}
            onBlur={onBlurField}
            placeholder="name@example.com"
            className="w-full rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-medium text-white bg-[#0F1728]/80 border border-[#263653] focus:border-[#F18B58] transition-all duration-200 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-[#F18B58]/40"
          />
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{errorMessage}</span>
        </div>
      )}

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
            <span>Transmitting request...</span>
          </>
        ) : (
          <>
            <span>Send password reset link</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      <div className="text-center pt-2">
        <button
          type="button"
          onClick={onBackToSignIn}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FFD58A] hover:text-[#FFF6E9] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to sign in</span>
        </button>
      </div>
    </form>
  );
};
