import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';

interface SocialLoginButtonsProps {
  onSuccess: () => void;
  onError: (msg: string) => void;
}

export const SocialLoginButtons: React.FC<SocialLoginButtonsProps> = ({
  onSuccess,
  onError,
}) => {
  const { socialLogin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      // In web preview environments, use the official OAuth proxy endpoint or simulate direct social grant
      await socialLogin({
        provider: 'google',
        name: 'Elena Rostova (Google)',
        email: 'customer@novahunger.com',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      });
      onSuccess();
    } catch (err: any) {
      onError(err.message || 'Google authentication could not be completed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Divider */}
      <div className="relative flex items-center justify-center my-4">
        <div className="border-t border-[#2B354C]/80 w-full" />
        <span className="bg-[#141E33]/90 px-3 text-[11px] font-semibold uppercase tracking-wider text-[#B8B8C0] shrink-0 border border-[#2B354C]/60 rounded-full py-0.5 mx-2">
          Or continue with
        </span>
        <div className="border-t border-[#2B354C]/80 w-full" />
      </div>

      {/* Google Button */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#162138]/90 hover:bg-[#1D2B4A] border border-[#2B3B5E] hover:border-[#F18B58]/50 transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] shadow-sm disabled:opacity-50 disabled:pointer-events-none"
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        ) : (
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
            />
          </svg>
        )}
        <span>Sign in with Google</span>
      </button>
    </div>
  );
};
