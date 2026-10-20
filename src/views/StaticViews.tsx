import React, { useState, useEffect } from 'react';
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
  Sparkles,
  AlertCircle,
  RotateCw,
  User,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import type { ContactPageSettings } from '../types/index.ts';


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
  const { user } = useAuth();
  const searchParams = new URLSearchParams(window.location.search);
  const initialSubject = searchParams.get('subject') || '';
  const initialMessage = searchParams.get('message') || '';

  // Configuration settings from backend
  const [settings, setSettings] = useState<ContactPageSettings>({
    supportPhone: '+1 (555) 019-NOVA',
    supportEmail: 'support@novahunger.com',
    businessAddress: '400 Central Plaza, Metropolis',
    heading: 'Get in Touch',
    description: 'Need assistance with a live order, rider inquiry, or restaurant listing?',
    supportCardHeading: 'Headquarters & Support Desk',
    formEnabled: true,
    showSubject: true,
    subjectRequired: false,
    confirmationMessage: 'Thank you! Your message has been submitted successfully. Our support team will review it soon.',
    notificationEmail: 'support@novahunger.com',
    minMessageLength: 10,
    maxMessageLength: 2000,
    showContactDetails: true,
    showOperatingHours: true,
    operatingHours: '24/7 Priority Support Desk',
  });
  const [settingsLoading, setSettingsLoading] = useState(true);

  // Form input states - strictly empty by default, no pre-filled personal/demo info
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState(initialSubject);
  const [message, setMessage] = useState(initialMessage);
  const [honeypot, setHoneypot] = useState('');

  // Submission & Feedback states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [responseMsg, setResponseMsg] = useState<string | null>(null);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);
  const [emailDeliveryStatus, setEmailDeliveryStatus] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasAutofilled, setHasAutofilled] = useState(false);

  const isEscalatedFromChat = initialSubject.includes('AI') || initialMessage.includes('AI Assistant');

  // Load public contact configuration from backend
  useEffect(() => {
    let mounted = true;
    const fetchSettings = async () => {
      try {
        const data = await api.getPublicContactSettings();
        if (mounted && data) {
          setSettings((prev) => ({ ...prev, ...data }));
        }
      } catch (err) {
        console.warn('Failed to load dynamic contact settings, using fallback:', err);
      } finally {
        if (mounted) setSettingsLoading(false);
      }
    };
    fetchSettings();
    return () => {
      mounted = false;
    };
  }, []);

  // Optional, user-controlled account autofill (only executed if user explicitly clicks button)
  const handleAutofillUser = () => {
    if (user) {
      if (!name) setName(user.name || '');
      if (!email) setEmail(user.email || '');
      setHasAutofilled(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResponseMsg(null);
    setErrorMessage(null);

    // Client-side validation
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setErrorMessage('Please enter your full name (minimum 2 characters).');
      setIsSubmitting(false);
      return;
    }
    if (trimmedName.length > 100) {
      setErrorMessage('Full name must be 100 characters or fewer.');
      setIsSubmitting(false);
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address (e.g. name@domain.com).');
      setIsSubmitting(false);
      return;
    }

    if (settings.showSubject && settings.subjectRequired && !subject.trim()) {
      setErrorMessage('Please enter an inquiry subject.');
      setIsSubmitting(false);
      return;
    }

    const minLen = settings.minMessageLength || 10;
    const maxLen = settings.maxMessageLength || 2000;
    const trimmedMessage = message.trim();

    if (!trimmedMessage || trimmedMessage.length < minLen) {
      setErrorMessage(`Please enter an inquiry message of at least ${minLen} characters.`);
      setIsSubmitting(false);
      return;
    }

    if (trimmedMessage.length > maxLen) {
      setErrorMessage(`Message exceeds the maximum limit of ${maxLen} characters.`);
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await api.submitContact({
        name: trimmedName,
        email: trimmedEmail,
        subject: subject.trim(),
        message: trimmedMessage,
        hp: honeypot, // Honeypot field for anti-spam detection
      });

      setResponseMsg(res.message);
      setTicketNumber(res.ticketNumber);
      setEmailSent(!!res.emailSent);
      setEmailDeliveryStatus(res.emailDeliveryStatus || 'stored_locally');

      // Clear the form fields only after successful submission confirmation
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      setHasAutofilled(false);
    } catch (e: any) {
      // Do NOT clear form on failure; allow visitor to review and retry
      setErrorMessage(
        e.message || 'An error occurred while transmitting your message. Please check your network and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const minLen = settings.minMessageLength || 10;
  const maxLen = settings.maxMessageLength || 2000;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10">
      {/* Header section (dynamically loaded from admin settings) */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-orange-400">
          Support Desk
        </span>
        <h1 className="font-display text-3xl font-extrabold text-white">
          {settings.heading}
        </h1>
        <p className="text-xs text-stone-400 leading-relaxed">
          {settings.description}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Support Information Card (editable via Admin Dashboard) */}
        {settings.showContactDetails && (
          <div className="md:col-span-5 space-y-6">
            <div className="p-6 rounded-3xl bg-[#121316] border border-stone-800 space-y-4 shadow-xl">
              <h2 className="font-display font-bold text-sm text-stone-100">
                {settings.supportCardHeading}
              </h2>
              <div className="space-y-3.5 text-xs text-stone-300">
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-stone-200">Phone Support</span>
                    <a
                      href={`tel:${settings.supportPhone.replace(/[^0-9+]/g, '')}`}
                      className="hover:text-orange-400 transition-colors"
                    >
                      {settings.supportPhone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-stone-200">Email Inquiries</span>
                    <a
                      href={`mailto:${settings.supportEmail}`}
                      className="hover:text-orange-400 transition-colors break-all"
                    >
                      {settings.supportEmail}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-stone-200">Headquarters</span>
                    <span className="text-stone-400">{settings.businessAddress}</span>
                  </div>
                </div>

                {settings.showOperatingHours && (
                  <div className="flex items-start gap-3 pt-2 border-t border-stone-800/80">
                    <Clock className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block text-stone-200">Operating Hours</span>
                      <span className="text-stone-400">{settings.operatingHours}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#0F1013] border border-stone-800/80 text-[11px] text-stone-400 space-y-2">
              <span className="font-semibold text-stone-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verified Direct Support</span>
              </span>
              <p className="leading-relaxed">
                All submitted tickets are directly assigned to our operations team and logged into our secure dispatch system.
              </p>
            </div>
          </div>
        )}

        {/* Contact Form Container */}
        <div className={settings.showContactDetails ? 'md:col-span-7' : 'md:col-span-12 max-w-2xl mx-auto w-full'}>
          {settings.formEnabled ? (
            <form
              onSubmit={handleSubmit}
              noValidate
              className="p-6 sm:p-8 rounded-3xl bg-[#121316] border border-stone-800 space-y-4 shadow-xl"
            >
              {/* Optional user autofill helper - strictly user-controlled */}
              {user && !hasAutofilled && (!name || !email) && (
                <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-stone-300 truncate">
                    <User className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                    <span className="truncate">Signed in as <strong className="text-white">{user.name}</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutofillUser}
                    className="text-[11px] font-bold text-orange-400 hover:text-orange-300 underline whitespace-nowrap"
                  >
                    Use my details
                  </button>
                </div>
              )}

              {/* Chat escalation alert */}
              {isEscalatedFromChat && (
                <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-start gap-2.5 text-xs text-purple-300">
                  <Sparkles className="w-4 h-4 text-[#8B5CF6] shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold text-white block">Inquiry Escalated from Nova AI Assistant</span>
                    <p className="text-[11px] text-purple-200">
                      Your conversation summary has been attached below. Please enter your contact details and message, then submit when ready.
                    </p>
                  </div>
                </div>
              )}

              {/* Success confirmation banner */}
              {ticketNumber && responseMsg && (
                <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-2 font-bold text-white">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[11px]">
                      Ticket #{ticketNumber}
                    </span>
                    <span>Received & Queued</span>
                  </div>
                  <p className="text-xs text-emerald-200 leading-relaxed">{responseMsg}</p>
                  <div className="text-[11px] text-emerald-400/90 pt-1 flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>
                      {emailSent
                        ? 'Notification dispatched to support team.'
                        : 'Message securely logged in database for support review.'}
                    </span>
                  </div>
                </div>
              )}

              {/* Accessible error banner */}
              {errorMessage && (
                <div
                  role="alert"
                  className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1 leading-relaxed">{errorMessage}</div>
                </div>
              )}

              {/* Anti-spam honeypot field (hidden from genuine users, traps bots) */}
              <div className="hidden" aria-hidden="true">
                <label htmlFor="contact_hp_field">Leave this field empty</label>
                <input
                  id="contact_hp_field"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              {/* Full Name Input */}
              <div>
                <label htmlFor="contact_name" className="text-[11px] font-semibold text-stone-300 block mb-1">
                  Full Name <span className="text-orange-400">*</span>
                </label>
                <input
                  id="contact_name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  maxLength={100}
                  className="w-full bg-[#18191E] border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>

              {/* Email Address Input */}
              <div>
                <label htmlFor="contact_email" className="text-[11px] font-semibold text-stone-300 block mb-1">
                  Email Address <span className="text-orange-400">*</span>
                </label>
                <input
                  id="contact_email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  maxLength={120}
                  className="w-full bg-[#18191E] border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>

              {/* Subject Input (configurable visibility & requirement) */}
              {settings.showSubject && (
                <div>
                  <label htmlFor="contact_subject" className="text-[11px] font-semibold text-stone-300 block mb-1">
                    Subject {settings.subjectRequired && <span className="text-orange-400">*</span>}
                  </label>
                  <input
                    id="contact_subject"
                    type="text"
                    required={settings.subjectRequired}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter your subject"
                    maxLength={200}
                    className="w-full bg-[#18191E] border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
              )}

              {/* Message Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="contact_message" className="text-[11px] font-semibold text-stone-300">
                    Message <span className="text-orange-400">*</span>
                  </label>
                  <span className="text-[10px] text-stone-500 tabular-nums">
                    {message.length} / {maxLen}
                  </span>
                </div>
                <textarea
                  id="contact_message"
                  rows={5}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can we help you?"
                  maxLength={maxLen}
                  className="w-full bg-[#18191E] border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-orange-500 transition-colors resize-y min-h-[100px]"
                />
                <span className="text-[10px] text-stone-500 block mt-0.5">
                  Minimum {minLen} characters required.
                </span>
              </div>

              {/* Privacy Notice */}
              <p className="text-[11px] text-stone-500 leading-relaxed">
                We respect your privacy. The information you submit will only be used by our support team to respond to your inquiry.
              </p>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 text-xs font-bold text-black bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl hover:opacity-95 active:scale-95 disabled:opacity-50 transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Transmitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Message</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Disabled Form State */
            <div className="p-8 rounded-3xl bg-[#121316] border border-stone-800 space-y-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center mx-auto">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-base text-white">
                Contact Form Temporarily Paused
              </h3>
              <p className="text-xs text-stone-400 max-w-md mx-auto leading-relaxed">
                The online contact form is temporarily offline for maintenance. Please reach our direct support team at{' '}
                <a
                  href={`mailto:${settings.supportEmail}`}
                  className="text-orange-400 font-semibold hover:underline"
                >
                  {settings.supportEmail}
                </a>{' '}
                or call us at{' '}
                <a
                  href={`tel:${settings.supportPhone.replace(/[^0-9+]/g, '')}`}
                  className="text-orange-400 font-semibold hover:underline"
                >
                  {settings.supportPhone}
                </a>
                .
              </p>
            </div>
          )}
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
