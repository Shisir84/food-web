import React from 'react';
import { Clock, ShieldAlert, Bike, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface RiderPendingViewProps {
  onNavigate: (path: string) => void;
}

export const RiderPendingView: React.FC<RiderPendingViewProps> = ({ onNavigate }) => {
  const { riderProfile, user, quickLogin } = useAuth();

  const isRejected = riderProfile?.status === 'rejected';

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="bg-[#121316] border border-stone-800 rounded-3xl p-8 sm:p-10 shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center border transition-all">
          {isRejected ? (
            <div className="w-full h-full rounded-2xl bg-rose-500/10 border-rose-500/30 text-rose-400 flex items-center justify-center">
              <ShieldAlert className="w-8 h-8" />
            </div>
          ) : (
            <div className="w-full h-full rounded-2xl bg-amber-500/10 border-amber-500/30 text-amber-400 flex items-center justify-center">
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
            {isRejected ? 'Application Rejected' : 'Application Under Review'}
          </span>

          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white mt-2">
            {isRejected
              ? 'Application Decision Notice'
              : 'Your Rider Application Has Been Submitted Successfully'}
          </h1>

          <p className="text-xs sm:text-sm text-stone-400 max-w-lg mx-auto leading-relaxed">
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
        <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 text-left text-xs space-y-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
            Submitted Credentials
          </span>
          <div className="grid grid-cols-2 gap-y-2 text-stone-300">
            <div>
              <span className="text-stone-500 block text-[11px]">Rider Name:</span>
              <span className="font-medium">{riderProfile?.fullName || user?.name}</span>
            </div>
            <div>
              <span className="text-stone-500 block text-[11px]">Email:</span>
              <span className="font-medium">{riderProfile?.email || user?.email}</span>
            </div>
            <div>
              <span className="text-stone-500 block text-[11px]">Vehicle:</span>
              <span className="font-medium capitalize">
                {riderProfile?.vehicleType} ({riderProfile?.vehicleRegNumber})
              </span>
            </div>
            <div>
              <span className="text-stone-500 block text-[11px]">Assigned City:</span>
              <span className="font-medium">{riderProfile?.city}</span>
            </div>
          </div>
        </div>

        {/* Quick helper for evaluators to test Admin Approval flow */}
        <div className="pt-4 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-stone-400 text-left">
            <span>Want to test the approval workflow? Log in as </span>
            <strong className="text-stone-200">Admin</strong> to approve or reject this applicant.
          </div>

          <button
            onClick={async () => {
              await quickLogin('admin');
              onNavigate('/admin/riders');
            }}
            className="px-4 py-2 text-xs font-bold text-black bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl hover:opacity-95 transition-all shrink-0 flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Open Admin Rider Review</span>
          </button>
        </div>
      </div>
    </div>
  );
};
