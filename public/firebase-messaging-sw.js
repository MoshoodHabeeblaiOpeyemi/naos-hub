/**
 * Firebase Cloud Messaging Service Worker for NAOS Hub
 * Handles background push notifications when the app is in the background or closed.
 */
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyCCGFzv7CfPriOJ9NBMDcZfowmf8-UT9AM",
  authDomain: "naos-hub.firebaseapp.com",
  projectId: "naos-hub",
  storageBucket: "naos-hub.firebasestorage.app",
  messagingSenderId: "490445339148",
  appId: "1:490445339148:web:3c6c0c66d5d7d7d1b68c29",
};

try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Background message received:', payload);
    const title = payload.notification?.title || payload.data?.title || 'NAOS Hub Notification';
    const options = {
      body: payload.notification?.body || payload.data?.message || 'You have a new update in NAOS Hub.',
      icon: '/logos/naos-logo.png',
      badge: '/favicon.svg',
      data: payload.data || { url: '/feed' },
    };

    self.registration.showNotification(title, options);
  });
} catch (err) {
  console.warn('[firebase-messaging-sw.js] Messaging init note:', err.message);
}

// Support direct messages from the client app to display native notifications via SW
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, icon, url } = event.data;
    self.registration.showNotification(title || 'NAOS Hub Notification', {
      body: body || 'You have a new notification.',
      icon: icon || '/logos/naos-logo.png',
      badge: '/favicon.svg',
      data: { url: url || '/feed' },
    });
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/feed';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
