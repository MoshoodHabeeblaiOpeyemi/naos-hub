import { getToken, onMessage, isSupported } from 'firebase/messaging';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, messaging } from '../firebase';

/**
 * Initializes FCM, registers the service worker, and prompts the user to allow notifications.
 * If granted, saves the FCM token to the user's Firestore document.
 */
export async function initFCMAndPrompt(uid) {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  try {
    // 1. Register service worker
    let swRegistration = null;
    if ('serviceWorker' in navigator) {
      try {
        swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/',
        });
        console.log('[FCM] Service worker registered successfully');
      } catch (swErr) {
        console.warn('[FCM] Service worker registration note:', swErr.message);
      }
    }

    // 2. Prompt user for notification permission if not yet decided
    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') {
      console.log('[FCM] Notification permission was denied or dismissed.');
      return false;
    }

    // 3. Obtain FCM Token if messaging is supported
    const supported = await isSupported().catch(() => false);
    if (supported && messaging && swRegistration) {
      try {
        const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || undefined;
        const currentToken = await getToken(messaging, {
          vapidKey,
          serviceWorkerRegistration: swRegistration,
        });

        if (currentToken && db && uid) {
          await updateDoc(doc(db, 'users', uid), {
            fcmTokens: arrayUnion(currentToken),
            notificationsEnabled: true,
            lastTokenUpdate: new Date().toISOString(),
          }).catch((e) => console.warn('[FCM] Token Firestore save note:', e.message));
          console.log('[FCM] FCM Token obtained & saved to user record');
        }
      } catch (tokenErr) {
        console.warn('[FCM] Unable to retrieve FCM token:', tokenErr.message);
      }

      // Foreground message listener
      try {
        onMessage(messaging, (payload) => {
          console.log('[FCM] Foreground message received:', payload);
          showPushNotification(
            payload.notification?.title || 'NAOS Hub',
            payload.notification?.body || 'New community update!'
          );
        });
      } catch (onMsgErr) {
        console.warn('[FCM] Foreground listener note:', onMsgErr.message);
      }
    }

    return true;
  } catch (err) {
    console.warn('[FCM] Notification init error:', err.message);
    return false;
  }
}

/**
 * Triggers a native system push notification via the Service Worker or Notification API.
 */
export function showPushNotification(title, body, url = '/feed') {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        title: title || 'NAOS Hub',
        body: body || 'You have a new notification.',
        icon: '/logos/naos-logo.png',
        url,
      });
    } else {
      new Notification(title || 'NAOS Hub', {
        body: body || 'You have a new notification.',
        icon: '/logos/naos-logo.png',
        badge: '/favicon.svg',
      });
    }
  } catch (err) {
    console.warn('[FCM] Failed to display native notification:', err);
  }
}
