import { useState } from 'react';
import { db, auth } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { usePaystack } from '../hooks/usePaystack.js';

const AMOUNT_KOBO = 100000; // ₦1,000

const BENEFITS = [
  {
    icon: (
      <svg className="h-5 w-5 text-naos-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
      </svg>
    ),
    title: 'Digital Member ID Badge',
    desc: 'Download your verified NAOS pass as a PNG you can share or print.',
  },
  {
    icon: (
      <svg className="h-5 w-5 text-naos-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    title: 'Community Feed Access',
    desc: 'Read and interact with official announcements, press releases, and member discussions.',
  },
  {
    icon: (
      <svg className="h-5 w-5 text-naos-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Free Entry to Educational Events',
    desc: 'Verified members get free admission to all NAOS educational events this session.',
  },
  {
    icon: (
      <svg className="h-5 w-5 text-naos-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
    title: 'Official Verified Member Status',
    desc: 'Your account is permanently marked as a verified NAOS Unilorin member.',
  },
];

/**
 * PaywallScreen
 * Shown when a logged-in user has isVerified !== true.
 * Uses the native Paystack inline script (no npm package) so it works with
 * any React version.
 *
 * Props:
 *   userProfile — Firestore user document data
 *   onVerified  — callback fired with { isVerified, passId } after payment
 */
export default function PaywallScreen({ userProfile, onVerified }) {
  const pay   = usePaystack();
  const email = auth?.currentUser?.email || userProfile?.email || '';
  const uid   = auth?.currentUser?.uid;

  // toast: null | { type: 'success'|'error', title: string, body: string }
  const [toast, setToast] = useState(null);

  const showToast = (type, title, body) => {
    setToast({ type, title, body });
    if (type === 'success') {
      // auto-dismiss after 3 s then hand off to onVerified
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handlePayNow = () => {
    const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '';
    if (!publicKey) {
      showToast('error', 'Configuration error', 'Payment system is not configured. Please contact the admin.');
      return;
    }

    pay({
      key:       publicKey,
      email,
      amount:    AMOUNT_KOBO,
      reference: `naos_${uid}_${Date.now()}`,
      metadata: {
        custom_fields: [
          { display_name: 'Name',   variable_name: 'name',   value: userProfile?.name   || '' },
          { display_name: 'Matric', variable_name: 'matric', value: userProfile?.matric || '' },
        ],
      },
      onSuccess: async (transaction) => {
        const ref = transaction?.reference || transaction?.trxref || '';
        try {
          if (!db || !uid) throw new Error('Firestore not available');
          const passId = `NAOS-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
          await updateDoc(doc(db, 'users', uid), {
            isVerified:       true,
            passId,
            paymentReference: ref,
            verifiedAt:       new Date().toISOString(),
          });
          showToast('success', 'Payment successful!', 'Your membership is now active. Redirecting to your dashboard…');
          setTimeout(() => {
            if (onVerified) onVerified({ isVerified: true, passId });
          }, 2000);
        } catch (err) {
          console.error('[Paywall] Firestore update failed:', err);
          showToast(
            'error',
            'Payment received — record update failed',
            `Your payment was successful (ref: ${ref || 'N/A'}), but we could not update your record automatically. Please send your payment reference to the PRO.`
          );
        }
      },
      onCancel: () => {
        // User dismissed the popup — do nothing
      },
    });
  };

  return (
    <section className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-naos-dark via-naos-green/90 to-naos-dark flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-2xl">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-naos-gold/20 border-2 border-naos-gold/40 mb-5">
            <svg className="h-8 w-8 text-naos-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Welcome to <span className="text-naos-gold">NAOS!</span>
          </h1>
          <p className="text-white/70 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            Your account has been created. To unlock the community Feed, your personal Dashboard,
            and free entry to all NAOS educational events this session, pay the
            <strong className="text-white"> one-time registration fee</strong> below.
          </p>
        </div>

        {/* Benefits Card */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8 mb-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-naos-gold mb-5">
            What you unlock
          </h2>
          <ul className="space-y-4">
            {BENEFITS.map((b) => (
              <li key={b.title} className="flex items-start gap-4">
                <span className="shrink-0 mt-0.5">{b.icon}</span>
                <div>
                  <p className="text-sm font-bold text-white">{b.title}</p>
                  <p className="text-xs text-white/60 leading-relaxed">{b.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Pay Button */}
        <div className="text-center">
          <button
            type="button"
            onClick={handlePayNow}
            className="inline-flex items-center gap-3 rounded-xl bg-naos-gold px-10 py-4 text-base font-bold text-naos-dark shadow-lg hover:bg-yellow-400 transition-all hover:scale-[1.02] active:scale-[0.99] cursor-pointer"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Pay Registration Fee — ₦1,000
          </button>
          <p className="mt-3 text-xs text-white/40">
            Secured by Paystack · One-time payment · No recurring charges
          </p>
        </div>

        {/* ── Toast notification ── */}
        {toast && (
          <div
            className={`mt-6 rounded-xl border p-4 flex items-start gap-3 ${
              toast.type === 'success'
                ? 'bg-emerald-900/60 border-emerald-500/40 text-emerald-200'
                : 'bg-red-900/60 border-red-500/40 text-red-200'
            }`}
            role="alert"
          >
            {/* Icon */}
            <span className="shrink-0 mt-0.5">
              {toast.type === 'success' ? (
                <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              )}
            </span>
            {/* Message */}
            <div className="min-w-0">
              <p className="text-sm font-bold">{toast.title}</p>
              <p className="text-xs mt-0.5 leading-relaxed opacity-90">{toast.body}</p>
            </div>
            {/* Dismiss (error only — success auto-dismisses) */}
            {toast.type === 'error' && (
              <button
                type="button"
                onClick={() => setToast(null)}
                className="shrink-0 ml-auto text-red-300 hover:text-white transition cursor-pointer"
                aria-label="Dismiss"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

      </div>
    </section>
  );
}
