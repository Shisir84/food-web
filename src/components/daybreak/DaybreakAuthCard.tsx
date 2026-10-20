import React, { useState } from 'react';
import { User, Bike, Store, Shield, CheckCircle2, Sparkles, Sun } from 'lucide-react';
import { SignInForm } from './SignInForm.tsx';
import { SignUpForm } from './SignUpForm.tsx';
import { ForgotPasswordForm } from './ForgotPasswordForm.tsx';
import { EmailVerificationForm } from './EmailVerificationForm.tsx';
import { DaybreakLogo } from './DaybreakLogo.tsx';

export type DaybreakAuthViewMode = 'signin' | 'signup' | 'forgot' | 'verify' | 'success';

interface DaybreakAuthCardProps {
  portal: 'customer' | 'rider' | 'restaurant' | 'admin';
  initialMode?: 'signin' | 'signup';
  isRevealed?: boolean;
  onNavigate: (path: string) => void;
  onPortalChange?: (portal: 'customer' | 'rider' | 'restaurant' | 'admin') => void;
  onGlowChange?: (intensity: number) => void;
}

export const DaybreakAuthCard: React.FC<DaybreakAuthCardProps> = ({
  portal,
  initialMode = 'signin',
  isRevealed = true,
  onNavigate,
  onPortalChange,
  onGlowChange,
}) => {
  const [viewMode, setViewMode] = useState<DaybreakAuthViewMode>(initialMode);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [isSuccessAnimated, setIsSuccessAnimated] = useState(false);
  const [isCardHovered, setIsCardHovered] = useState(false);

  // Field focus/blur callback to brighten the 3D sunrise
  const handleFieldFocus = () => {
    if (onGlowChange) onGlowChange(1.35);
  };

  const handleFieldBlur = () => {
    if (onGlowChange) onGlowChange(1.0);
  };

  const handleAuthSuccess = () => {
    setIsSuccessAnimated(true);
    if (onGlowChange) onGlowChange(1.65);
  };

  // Portal metadata
  const portalMeta = {
    customer: {
      label: 'Customer Access',
      icon: <User className="w-3.5 h-3.5 text-[#F18B58]" />,
      badge: 'Gourmet Dining',
    },
    rider: {
      label: 'Courier Fleet',
      icon: <Bike className="w-3.5 h-3.5 text-[#F18B58]" />,
      badge: 'Verified Couriers',
    },
    restaurant: {
      label: 'Restaurant Partner',
      icon: <Store className="w-3.5 h-3.5 text-[#F18B58]" />,
      badge: 'Kitchen Console',
    },
    admin: {
      label: 'Operations Admin',
      icon: <Shield className="w-3.5 h-3.5 text-rose-400" />,
      badge: 'Platform Master',
    },
  }[portal];

  return (
    <div
      onMouseEnter={() => setIsCardHovered(true)}
      onMouseLeave={() => setIsCardHovered(false)}
      className="relative w-full max-w-md mx-auto rounded-3xl p-6 sm:p-8 backdrop-blur-2xl transition-all duration-1000 select-none"
      style={{
        background: 'linear-gradient(160deg, rgba(20, 29, 48, 0.88) 0%, rgba(17, 26, 46, 0.95) 100%)',
        border: '1px solid rgba(255, 213, 138, 0.24)',
        boxShadow: isCardHovered
          ? '0 25px 60px -10px rgba(0, 0, 0, 0.8), 0 0 45px -5px rgba(241, 139, 88, 0.28)'
          : '0 20px 50px -10px rgba(0, 0, 0, 0.7), 0 0 35px -5px rgba(241, 139, 88, 0.16)',
        transform: isRevealed
          ? isCardHovered
            ? 'perspective(1200px) rotateX(0deg) rotateY(0deg) translateY(-2px) scale(1.005)'
            : 'perspective(1200px) rotateX(0deg) rotateY(0deg) translateY(0px) scale(1)'
          : 'perspective(1200px) rotateX(12deg) rotateY(-8deg) translateY(48px) scale(0.92)',
        opacity: isRevealed ? 1 : 0,
        pointerEvents: isRevealed ? 'auto' : 'none',
        transition: 'transform 1100ms cubic-bezier(0.16, 1, 0.3, 1), opacity 950ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 800ms ease',
      }}
    >
      {/* Top Warm Highlight Bar */}
      <div
        className="absolute top-0 left-10 right-10 h-[2px] rounded-full pointer-events-none transition-opacity duration-1000"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255, 213, 138, 0.85) 50%, transparent 100%)',
          opacity: isRevealed ? 1 : 0,
        }}
      />

      {/* Header with Daybreak Logo & Portal Badge (Stagger 1) */}
      <div
        className={`flex items-center justify-between mb-5 transition-all duration-700 ${
          isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
        }`}
        style={{ transitionDelay: '100ms' }}
      >
        <DaybreakLogo size={32} showText={true} />

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1A2744]/90 border border-[#2B3B5E] text-[11px] font-semibold text-[#FFD58A] shadow-sm">
          {portalMeta.icon}
          <span>{portalMeta.label}</span>
        </div>
      </div>

      {/* Titles depending on mode (Stagger 2) */}
      <div
        className={`text-left mb-5 transition-all duration-700 ${
          isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
        }`}
        style={{ transitionDelay: '200ms' }}
      >
        {viewMode === 'signin' && (
          <>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight">
              Sign in to Daybreak
            </h2>
            <p className="text-xs text-[#B8B8C0] mt-1 leading-relaxed">
              Welcome back. Enter your credentials to continue your journey.
            </p>
          </>
        )}

        {viewMode === 'signup' && (
          <>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight">
              Create an account
            </h2>
            <p className="text-xs text-[#B8B8C0] mt-1 leading-relaxed">
              Begin with Daybreak. Sign up in moments for seamless access.
            </p>
          </>
        )}

        {viewMode === 'forgot' && (
          <>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight">
              Password recovery
            </h2>
            <p className="text-xs text-[#B8B8C0] mt-1 leading-relaxed">
              Enter your account email to receive cryptographic reset instructions.
            </p>
          </>
        )}

        {viewMode === 'verify' && (
          <>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight">
              Email verification
            </h2>
            <p className="text-xs text-[#B8B8C0] mt-1 leading-relaxed">
              Confirm your identity code to complete Daybreak security setup.
            </p>
          </>
        )}
      </div>

      {/* Mode Navigation Tabs (Visible on signin/signup) (Stagger 3) */}
      {(viewMode === 'signin' || viewMode === 'signup') && (
        <div
          className={`flex border-b border-[#2B3B5E]/60 mb-5 transition-all duration-700 ${
            isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          }`}
          style={{ transitionDelay: '300ms' }}
        >
          <button
            type="button"
            onClick={() => setViewMode('signin')}
            className={`pb-2.5 text-xs font-semibold mr-6 relative transition-colors ${
              viewMode === 'signin' ? 'text-[#FFD58A]' : 'text-stone-400 hover:text-white'
            }`}
          >
            Sign In
            {viewMode === 'signin' && (
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                style={{
                  background: 'linear-gradient(90deg, #F18B58, #FFD58A)',
                }}
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => setViewMode('signup')}
            className={`pb-2.5 text-xs font-semibold relative transition-colors ${
              viewMode === 'signup' ? 'text-[#FFD58A]' : 'text-stone-400 hover:text-white'
            }`}
          >
            Create Account
            {viewMode === 'signup' && (
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                style={{
                  background: 'linear-gradient(90deg, #F18B58, #FFD58A)',
                }}
              />
            )}
          </button>
        </div>
      )}

      {/* View Content (Stagger 4) */}
      <div
        className={`transition-all duration-700 ${
          isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
        }`}
        style={{ transitionDelay: '380ms' }}
      >
        {viewMode === 'signin' && (
          <SignInForm
            portal={portal}
            onNavigate={onNavigate}
            onForgotPasswordClick={() => setViewMode('forgot')}
            onSuccess={handleAuthSuccess}
            onFocusField={handleFieldFocus}
            onBlurField={handleFieldBlur}
          />
        )}

        {viewMode === 'signup' && (
          <SignUpForm
            onSuccess={(em) => {
              setVerificationEmail(em);
              setViewMode('verify');
            }}
            onSignInClick={() => setViewMode('signin')}
            onFocusField={handleFieldFocus}
            onBlurField={handleFieldBlur}
          />
        )}

        {viewMode === 'forgot' && (
          <ForgotPasswordForm
            onBackToSignIn={() => setViewMode('signin')}
            onProceedToVerification={(em) => {
              setVerificationEmail(em);
              setViewMode('verify');
            }}
            onFocusField={handleFieldFocus}
            onBlurField={handleFieldBlur}
          />
        )}

        {viewMode === 'verify' && (
          <EmailVerificationForm
            email={verificationEmail}
            onVerified={() => {
              handleAuthSuccess();
              setTimeout(() => {
                onNavigate(portal === 'admin' ? '/admin/dashboard' : '/');
              }, 600);
            }}
            onBackToSignIn={() => setViewMode('signin')}
            onFocusField={handleFieldFocus}
            onBlurField={handleFieldBlur}
          />
        )}
      </div>

      {/* Bottom Switch Portal Bar (Stagger 5) */}
      <div
        className={`mt-5 pt-4 border-t border-[#263653]/60 flex items-center justify-between text-[11px] text-[#B8B8C0] transition-all duration-700 ${
          isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
        }`}
        style={{ transitionDelay: '460ms' }}
      >
        <div className="flex items-center gap-2">
          <span>Portal:</span>
          {portal !== 'customer' && (
            <button
              type="button"
              onClick={() => onPortalChange ? onPortalChange('customer') : onNavigate('/login')}
              className="hover:text-[#FFD58A] transition-colors"
            >
              Customer
            </button>
          )}
          {portal !== 'rider' && (
            <button
              type="button"
              onClick={() => onPortalChange ? onPortalChange('rider') : onNavigate('/rider/login')}
              className="hover:text-[#FFD58A] transition-colors"
            >
              Courier
            </button>
          )}
          {portal !== 'restaurant' && (
            <button
              type="button"
              onClick={() => onPortalChange ? onPortalChange('restaurant') : onNavigate('/restaurant/login')}
              className="hover:text-[#FFD58A] transition-colors"
            >
              Kitchen
            </button>
          )}
          {portal !== 'admin' && (
            <button
              type="button"
              onClick={() => onPortalChange ? onPortalChange('admin') : onNavigate('/admin/login')}
              className="hover:text-rose-400 transition-colors"
            >
              Admin
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => onNavigate('/')}
          className="hover:text-white transition-colors"
        >
          Exit to Home
        </button>
      </div>
    </div>
  );
};
