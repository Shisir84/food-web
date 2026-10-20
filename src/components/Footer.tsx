import React, { useEffect, useState } from 'react';
import { Mail, Phone, MapPin, ShieldCheck, Clock, Award } from 'lucide-react';
import { api } from '../services/api.ts';
import { ContactPageSettings } from '../types/index.ts';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [contactSettings, setContactSettings] = useState<Partial<ContactPageSettings>>({
    supportPhone: '+1 (555) 019-NOVA',
    supportEmail: 'support@novahunger.com',
    businessAddress: '400 Central Plaza, Metropolis',
    showContactDetails: true,
  });

  useEffect(() => {
    let mounted = true;
    const loadSettings = async () => {
      try {
        const s = await api.getPublicContactSettings();
        if (mounted && s) {
          setContactSettings(s);
        }
      } catch (e) {
        // Fallback already provided in state
      }
    };
    loadSettings();
    return () => {
      mounted = false;
    };
  }, []);
  return (
    <footer className="bg-[#08080A] border-t border-[#2B2B30]/80 text-[#B8B8C0] text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF7900] to-[#FF9D00] p-0.5">
                <div className="w-full h-full bg-[#0B0B0D] rounded-[10px] flex items-center justify-center">
                  <span className="font-display font-black text-lg text-[#FF9D00]">N</span>
                </div>
              </div>
              <span className="font-display font-bold text-xl text-white">
                Nova Hunger <span className="text-[#FF7900] font-medium">Food</span>
              </span>
            </div>
            <p className="text-xs text-[#B8B8C0] leading-relaxed max-w-sm">
              Discover amazing food from your favorite local restaurants. Prepared fresh by certified commercial kitchens and delivered in thermal insulated carriers straight to your door.
            </p>
            <div className="flex items-center gap-6 pt-2 text-xs text-stone-300">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>100% Vetted Partners</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#FF7900]" />
                <span>Average 32 Min Delivery</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
              Customer Portal
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('/restaurants')}
                  className="hover:text-[#FF9D00] transition-colors"
                >
                  Browse Restaurants
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/offers')}
                  className="hover:text-[#FF9D00] transition-colors"
                >
                  Coupons & Deals
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/customer/orders')}
                  className="hover:text-[#FF9D00] transition-colors"
                >
                  Live Order Tracker
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/faq')}
                  className="hover:text-[#FF9D00] transition-colors"
                >
                  Help Center & FAQ
                </button>
              </li>
            </ul>
          </div>

          {/* Partnerships & Portals */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
              Partner With Us
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('/rider/register')}
                  className="hover:text-[#FF9D00] transition-colors"
                >
                  Become a Delivery Rider
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/rider/login')}
                  className="hover:text-[#FF9D00] transition-colors"
                >
                  Rider Sign In
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/restaurant/register')}
                  className="hover:text-[#FF9D00] transition-colors"
                >
                  Register Your Restaurant
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/restaurant/login')}
                  className="hover:text-[#FF9D00] transition-colors"
                >
                  Restaurant Manager Login
                </button>
              </li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
              Customer Support
            </h4>
            {contactSettings.showContactDetails !== false ? (
              <div className="space-y-2 text-xs text-[#B8B8C0]">
                {contactSettings.supportPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-[#FF7900] shrink-0" />
                    <a
                      href={`tel:${contactSettings.supportPhone.replace(/[^0-9+]/g, '')}`}
                      className="hover:text-[#FF9D00] transition-colors"
                    >
                      {contactSettings.supportPhone}
                    </a>
                  </div>
                )}
                {contactSettings.supportEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-[#FF7900] shrink-0" />
                    <a
                      href={`mailto:${contactSettings.supportEmail}`}
                      className="hover:text-[#FF9D00] transition-colors break-all"
                    >
                      {contactSettings.supportEmail}
                    </a>
                  </div>
                )}
                {contactSettings.businessAddress && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#FF7900] shrink-0" />
                    <span className="truncate">{contactSettings.businessAddress}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2 text-xs text-[#B8B8C0]">
                <p className="text-[11px] text-stone-400">
                  Online support is available 24/7 through our dispatch desk.
                </p>
                <button
                  onClick={() => onNavigate('/contact')}
                  className="text-xs text-[#FF9D00] hover:underline"
                >
                  Visit Support Desk
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-[#2B2B30]/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <p>© {new Date().getFullYear()} Nova Hunger Food Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <button onClick={() => onNavigate('/privacy')} className="hover:text-stone-300">
              Privacy Policy
            </button>
            <button onClick={() => onNavigate('/terms')} className="hover:text-stone-300">
              Terms of Service
            </button>
            <button onClick={() => onNavigate('/contact')} className="hover:text-stone-300">
              Support Desk
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
