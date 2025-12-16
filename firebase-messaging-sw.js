// Firebase Cloud Messaging Service Worker - Production Ready
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase config - MUST match frontend exactly
const firebaseConfig = {
  apiKey: "AIzaSyCrQhePIDi7omAYVfUmPL6BKZTObtnvGfQ",
  authDomain: "kuluilanyeni.firebaseapp.com",
  projectId: "kuluilanyeni",
  storageBucket: "kuluilanyeni.firebasestorage.app",
  messagingSenderId: "151921029592",
  appId: "1:151921029592:web:84f0ee5d7c15e05466c2ad",
  measurementId: "G-FG3H7NKTTD"
};

// Initialize Firebase in service worker
firebase.initializeApp(firebaseConfig);

// Get messaging instance
const messaging = firebase.messaging();

// CRITICAL: Handle background messages when tab is closed
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message received:', payload);
  
  const notificationTitle = payload.notification?.title || 'Kulu İlan';
  const notificationOptions = {
    body: payload.notification?.body || 'Yeni bildirim',
    icon: '/icon-192x192.png',
    badge: '/icon-96x96.png',
    tag: 'kulu-ilan-notification',
    requireInteraction: true,
    data: payload.data || {},
    actions: [
      {
        action: 'open',
        title: 'Aç'
      },
      {
        action: 'close',
        title: 'Kapat'
      }
    ]
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click:', event.action);
  
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // If app is already open, focus it
        for (const client of clientList) {
          if (client.url === self.location.origin && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise open new window
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

console.log('[SW] Firebase messaging service worker loaded');