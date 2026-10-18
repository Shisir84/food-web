import React, { useState } from 'react';
import { Clock, ShieldAlert, Bike, RefreshCw, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface RiderPendingViewProps {
  onNavigate: (path: string) => void;
}

export const RiderPendingView: React.FC<RiderPendingViewProps> = ({ onNavigate }) => {
  const { riderProfile, user, logout, refreshUser } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [checkNotice, setCheckNotice] = useState<string | null>(null);

  const isRejected = riderProfile?.status === 'rejected';

  const handleCheckStatus = async () => {
    setIsChecking(true);
    setCheckNotice(null);
    try {
      await refreshUser();
      setCheckNotice('Status refreshed.');
      setTimeout(() => setCheckNotice(null), 3000);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="bg-[#151518] border border-[#2B2B30] rounded-3xl p-8 sm:p-10 shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center border transition-all">
          {isRejected ? (
            <div className="w-full h-full rounded-2xl bg-rose-500/10 border-rose-500/30 text-rose-400 flex items-center justify-center">
              <ShieldAlert className="w-8 h-8" />
            </div>
          ) : (
            <div className="w-full h-full rounded-2xl bg-[#FF7900]/10 border border-[#FF7900]/30 text-[#FF9D00] flex items-center justify-center">
              <Clock className="w-8 h-8" />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <span
            className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
              isRejected
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
            }`}
          >
            {isRejected ? 'Application Rejected' : 'Application Under Administrative Review'}
          </span>

          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white mt-2">
            {isRejected
              ? 'Rider Application Decision Notice'
              : 'Your Rider Application Has Been Submitted Successfully'}
          </h1>

          <p className="text-xs sm:text-sm text-[#B8B8C0] max-w-lg mx-auto leading-relaxed">
            {isRejected
              ? 'Our administrative safety team has reviewed your application and determined that it cannot be approved at this time.'
              : 'Please wait while our admin team reviews your vehicle paperwork and background verification. Pending riders cannot access delivery features or go online.'}
          </p>
        </div>

        {/* Rejection reason box */}
        {isRejected && riderProfile?.rejectionReason && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-left text-xs space-y-1">
            <span className="font-bold text-rose-400 block">Reason for rejection:</span>
            <p className="text-stone-300 leading-relaxed">{riderProfile.rejectionReason}</p>
          </div>
        )}

        {/* Submitted profile summary */}
        <div className="p-5 rounded-2xl bg-[#0B0B0D] border border-[#2B2B30] text-left text-xs space-y-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#B8B8C0] block">
            Submitted Credentials
          </span>
          <div className="grid grid-cols-2 gap-y-2 text-[#FFFFFF]">
            <div>
              <span className="text-[#B8B8C0] block text-[11px]">Rider Name:</span>
              <span className="font-medium">{riderProfile?.fullName || user?.name}</span>
            </div>
            <div>
              <span className="text-[#B8B8C0] block text-[11px]">Email:</span>
              <span className="font-medium">{riderProfile?.email || user?.email}</span>
            </div>
            <div>
              <span className="text-[#B8B8C0] block text-[11px]">Vehicle:</span>
              <span className="font-medium capitalize">
                {riderProfile?.vehicleType} ({riderProfile?.vehicleRegNumber})
              </span>
            </div>
            <div>
              <span className="text-[#B8B8C0] block text-[11px]">Assigned City:</span>
              <span className="font-medium">{riderProfile?.city}</span>
            </div>
          </div>
        </div>

        {checkNotice && (
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
            {checkNotice}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={handleCheckStatus}
            disabled={isChecking}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-[#0B0B0D] border border-[#2B2B30] text-stone-200 hover:border-[#FF7900] transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#FF7900] ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'Checking...' : 'Check Approval Status'}</span>
          </button>

          <button
            onClick={() => onNavigate('/')}
            className="btn-secondary px-4 py-2 text-xs font-semibold"
          >
            Return to Homepage
          </button>

          <button
            onClick={() => {
              logout();
              onNavigate('/');
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-[#0B0B0D] border border-[#2B2B30] text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Admin login info link */}
        <div className="pt-4 border-t border-[#2B2B30] flex items-center justify-center text-xs text-[#B8B8C0]">
          <span>Are you a platform operator? </span>
          <button
            onClick={() => onNavigate('/admin/login')}
            className="text-[#FF9D00] hover:underline font-semibold ml-1.5 flex items-center gap-1"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin Portal</span>
          </button>
        </div>
      </div>
    </div>
  );
};
