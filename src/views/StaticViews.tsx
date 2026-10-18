import React, { useState } from 'react';
import {
  Tag,
  Copy,
  Check,
  Mail,
  Phone,
  MapPin,
  HelpCircle,
  ShieldCheck,
  Send,
  Award,
  Clock,
} from 'lucide-react';
import { api } from '../services/api.ts';

// -------------------------------------------------------------
// OFFERS VIEW
// -------------------------------------------------------------
export const OffersView: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const coupons = [
    {
      code: 'NOVAFIRST',
      title: '20% Welcome Discount',
      discount: '20% OFF',
      minOrder: '$25.00',
      description: 'Valid on your first order across any certified kitchen on Nova Hunger Food.',
      expires: 'Valid Until Dec 2026',
    },
    {
      code: 'CRAVINGS15',
      title: '15% Off Midweek Feast',
      discount: '15% OFF',
      minOrder: '$20.00',
      description: 'Apply on any gourmet dinner or family lunch combo.',
      expires: 'Valid Everyday',
    },
    {
      code: 'SUPERNOVA',
      title: '30% VIP Chef Discount',
      discount: '30% OFF',
      minOrder: '$40.00',
      description: 'Maximum savings of $15 on orders containing artisan pizzas or handi biryanis.',
      expires: 'Limited Redemptions',
    },
  ];

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="text-center max-w-xl mx-auto space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-orange-400">
          Deals & Vouchers
        </span>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white">
          Active Offers & Coupons
        </h1>
        <p className="text-xs sm:text-sm text-stone-400">
          Copy your preferred discount voucher code and paste it during checkout.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {coupons.map((c) => (
          <div
            key={c.code}
            className="p-6 rounded-3xl bg-[#121316] border border-stone-800 flex flex-col justify-between space-y-6 shadow-xl relative overflow-hidden"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-display font-extrabold text-2xl text-amber-400">
                  {c.discount}
                </span>
                <span className="text-[11px] text-stone-500 uppercase font-semibold">
                  Min {c.minOrder}
                </span>
              </div>
              <h3 className="font-bold text-base text-stone-100">{c.title}</h3>
              <p className="text-xs text-stone-400 leading-relaxed">{c.description}</p>
            </div>

            <div className="pt-4 border-t border-stone-800 flex items-center justify-between gap-3">
              <div className="font-mono text-xs font-bold text-stone-200 tracking-wider">
                {c.code}
              </div>

              <button
                onClick={() => handleCopy(c.code)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-700 text-xs text-stone-200 hover:text-white hover:border-orange-500 transition-colors"
              >
                {copiedCode === c.code ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// ABOUT VIEW
// -------------------------------------------------------------
export const AboutView: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-orange-400">
          Our Culinary Philosophy
        </span>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white">
          About Nova Hunger Food
        </h1>
        <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">
          Nova Hunger Food was founded on a simple conviction: fast delivery should never compromise food craftsmanship. We bridge authentic artisan kitchens with diners who appreciate true flavor.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-6 rounded-2xl bg-[#121316] border border-stone-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-stone-100">Optimized Thermal Dispatch</h3>
          <p className="text-xs text-stone-400 leading-relaxed">
            Every courier is equipped with multi-compartment thermal carriers so pizzas stay crisp, momo steamers stay tender, and biryani keeps its aromatic seal.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#121316] border border-stone-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-stone-100">100% Identity Vetting</h3>
          <p className="text-xs text-stone-400 leading-relaxed">
            We reject the gig-economy rush to onboard unchecked couriers. Every single rider and kitchen is reviewed by human administrators before receiving orders.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#121316] border border-stone-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-stone-100">Fair Kitchen Economics</h3>
          <p className="text-xs text-stone-400 leading-relaxed">
            We partner on transparent commission models, empowering chefs to use premium organic ingredients without cutting corners.
          </p>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// CONTACT VIEW
// -------------------------------------------------------------
export const ContactView: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [responseMsg, setResponseMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResponseMsg(null);

    try {
      const res = await api.submitContact({ name, email, subject, message });
      setResponseMsg(res.message);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (e: any) {
      setResponseMsg('An error occurred. Please reach out to support@novahunger.com.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10">
      <div className="text-center max-w-xl mx-auto space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-orange-400">
          Support Desk
        </span>
        <h1 className="font-display text-3xl font-extrabold text-white">Get in Touch</h1>
        <p className="text-xs text-stone-400">
          Need assistance with a live order, rider inquiry, or restaurant listing?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl bg-[#121316] border border-stone-800 space-y-4">
            <h3 className="font-bold text-sm text-stone-100">Headquarters</h3>
            <div className="space-y-3 text-xs text-stone-400">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-orange-400 shrink-0" />
                <span>+1 (555) 019-NOVA (24/7 Desk)</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-orange-400 shrink-0" />
                <span>support@novahunger.com</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-orange-400 shrink-0" />
                <span>400 Central Plaza, Metropolis</span>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-7">
          <form
            onSubmit={handleSubmit}
            className="p-6 sm:p-8 rounded-3xl bg-[#121316] border border-stone-800 space-y-4"
          >
            {responseMsg && (
              <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs">
                {responseMsg}
              </div>
            )}

            <div>
              <label className="text-[11px] font-semibold text-stone-300 block mb-1">
                Your Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Elena Rostova"
                className="w-full bg-[#18191E] border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-stone-300 block mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="elena@example.com"
                className="w-full bg-[#18191E] border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-stone-300 block mb-1">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Order tracking inquiry / Feedback"
                className="w-full bg-[#18191E] border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-stone-300 block mb-1">
                Message
              </label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="How can our support team assist you today?"
                className="w-full bg-[#18191E] border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-orange-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 text-xs font-bold text-black bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl hover:opacity-95 active:scale-95 disabled:opacity-50 transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Transmitting...' : 'Send Message'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// FAQ VIEW
// -------------------------------------------------------------
export const FAQView: React.FC = () => {
  const faqs = [
    {
      q: 'How does the rider approval workflow operate?',
      a: 'When you register as a rider, your account starts with a pending status. Our administration team inspects driver licenses and vehicle registration numbers before granting approved status. Only approved riders can toggle online or accept delivery jobs.',
    },
    {
      q: 'Can I pay with Cash on Delivery (COD)?',
      a: 'Yes! Both Cash on Delivery and online digital card payments are supported during checkout. You can hand cash directly to the rider upon receipt.',
    },
    {
      q: 'How do restaurants receive and fulfill customer orders?',
      a: 'Restaurant owners have a dedicated dashboard where live orders appear. The chef clicks "Accept Order", updates status to "In Prep", and finally marks "Ready for Pickup", which alerts nearby active couriers.',
    },
    {
      q: 'What happens if a rider application is rejected?',
      a: 'The administrator is strictly required to provide an explicit rejection reason (e.g. illegible ID). The rejected rider sees this reason clearly upon logging in and can reapply with updated documentation.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
      <div className="text-center max-w-xl mx-auto space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-orange-400">
          Knowledge Base
        </span>
        <h1 className="font-display text-3xl font-extrabold text-white">Frequently Asked Questions</h1>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, idx) => (
          <div key={idx} className="p-6 rounded-2xl bg-[#121316] border border-stone-800 space-y-2">
            <h3 className="font-bold text-sm text-stone-100">{faq.q}</h3>
            <p className="text-xs text-stone-400 leading-relaxed">{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// PRIVACY & TERMS
// -------------------------------------------------------------
export const LegalView: React.FC<{ type: 'privacy' | 'terms' }> = ({ type }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-6">
      <h1 className="font-display text-3xl font-extrabold text-white">
        {type === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
      </h1>
      <div className="p-8 rounded-3xl bg-[#121316] border border-stone-800 space-y-4 text-xs text-stone-400 leading-relaxed">
        <p>
          At Nova Hunger Food, we maintain strict standards regarding customer confidentiality, delivery location privacy, and courier document security.
        </p>
        <p>
          Personal information such as phone numbers and gate access instructions are disclosed only to assigned delivery couriers for the active order window and expire immediately upon order completion.
        </p>
        <p>
          Payment transactions are verified using TLS encryption and tokenized gateways. Raw credit card numbers are never stored in plain text.
        </p>
      </div>
    </div>
  );
};
