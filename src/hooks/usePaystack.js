import { useEffect, useRef, useState } from 'react';

const SCRIPT_URL = 'https://js.paystack.co/v1/inline.js';
const SCRIPT_ID  = 'paystack-inline-script';

/**
 * usePaystack
 * Dynamically loads the Paystack inline script once and returns a stable
 * `pay` function that opens the payment popup.
 *
 * Usage:
 *   const pay = usePaystack();
 *   pay({
 *     key, email, amount, ref, metadata,
 *     onSuccess: (response) => { ... },
 *     onClose:   ()         => { ... },
 *   });
 */
export function usePaystack() {
  const [scriptReady, setScriptReady] = useState(
    // If the script was already injected by a previous render, mark it ready now
    () => typeof window !== 'undefined' && !!document.getElementById(SCRIPT_ID)
  );

  // Keep a queue of pending calls made before the script loaded
  const pendingCall = useRef(null);

  useEffect(() => {
    // Already loaded — nothing to do
    if (document.getElementById(SCRIPT_ID)) {
      setScriptReady(true);
      return;
    }

    const script = document.createElement('script');
    script.id  = SCRIPT_ID;
    script.src = SCRIPT_URL;
    script.async = true;

    script.onload = () => {
      setScriptReady(true);
      // Flush any call that was queued before the script finished
      if (pendingCall.current) {
        pendingCall.current();
        pendingCall.current = null;
      }
    };

    script.onerror = () => {
      console.error('[usePaystack] Failed to load Paystack script.');
    };

    document.body.appendChild(script);
  }, []);

  /**
   * @param {{
   *   key: string,
   *   email: string,
   *   amount: number,
   *   ref: string,
   *   metadata?: object,
   *   onSuccess: (response: object) => void,
   *   onClose: () => void,
   * }} config
   */
  const pay = (config) => {
    const launch = () => {
      if (typeof window.PaystackPop === 'undefined') {
        console.error('[usePaystack] PaystackPop is not available.');
        return;
      }
      const handler = window.PaystackPop.setup({
        key:       config.key,
        email:     config.email,
        amount:    config.amount,
        ref:       config.ref,
        metadata:  config.metadata || {},
        callback:  config.onSuccess,
        onClose:   config.onClose,
      });
      handler.openIframe();
    };

    if (scriptReady) {
      launch();
    } else {
      // Script still loading — queue the call
      pendingCall.current = launch;
    }
  };

  return pay;
}
