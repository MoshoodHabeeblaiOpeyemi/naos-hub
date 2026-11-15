import { useEffect, useRef, useState } from 'react';

/**
 * usePaystack
 * ─────────────────────────────────────────────────────────────────────────────
 * Dynamically loads the Paystack Inline JS V2 script once and returns a
 * stable `pay` function that opens the checkout popup.
 *
 * V2 API (from https://paystack.com/docs/developer-tools/inlinejs/):
 *   const popup = new PaystackPop();          // CDN class name is PaystackPop
 *   popup.newTransaction({ key, email, amount, reference,
 *                          onSuccess, onCancel, onError });
 *
 * Usage:
 *   const pay = usePaystack();
 *   pay({ key, email, amount, reference, metadata, onSuccess, onCancel });
 */

const SCRIPT_SRC = 'https://js.paystack.co/v2/inline.js';
const SCRIPT_ID  = 'paystack-inline-v2';

export function usePaystack() {
  const [ready, setReady] = useState(
    () => typeof window !== 'undefined' && !!document.getElementById(SCRIPT_ID)
  );
  const queued = useRef(null); // stores a pay() call made before the script loaded

  useEffect(() => {
    // Already injected (e.g. hot-reload) — nothing to do
    if (document.getElementById(SCRIPT_ID)) {
      setReady(true);
      return;
    }

    const script    = document.createElement('script');
    script.id       = SCRIPT_ID;
    script.src      = SCRIPT_SRC;
    script.async    = true;
    script.onload   = () => {
      setReady(true);
      if (queued.current) {
        queued.current();
        queued.current = null;
      }
    };
    script.onerror  = () => console.error('[usePaystack] Failed to load Paystack V2 script.');
    document.body.appendChild(script);
  }, []);

  /**
   * @param {{
   *   key:        string,
   *   email:      string,
   *   amount:     number,   // kobo
   *   reference:  string,
   *   metadata?:  object,
   *   onSuccess:  (transaction: object) => void,
   *   onCancel?:  () => void,
   *   onError?:   (error: object) => void,
   * }} config
   */
  const pay = (config) => {
    const launch = () => {
      if (typeof window.PaystackPop === 'undefined') {
        console.error('[usePaystack] PaystackPop is not defined — script may not have loaded.');
        return;
      }
      const popup = new window.PaystackPop();
      popup.newTransaction({
        key:       config.key,
        email:     config.email,
        amount:    config.amount,
        reference: config.reference,
        metadata:  config.metadata || {},
        onSuccess: config.onSuccess,
        onCancel:  config.onCancel  || (() => {}),
        onError:   config.onError   || ((err) => console.error('[Paystack] Error:', err.message)),
      });
    };

    if (ready) {
      launch();
    } else {
      queued.current = launch; // flush on script onload
    }
  };

  return pay;
}
