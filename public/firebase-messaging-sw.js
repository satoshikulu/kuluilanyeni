// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCrQhePIDi7omAYVfUmPL6BKZTObtnvGfQ",
  authDomain: "kuluilanyeni.firebaseapp.com",
  projectId: "kuluilanyeni",
  storageBucket: "kuluilanyeni.firebasestorage.app",
  messagingSenderId: "151921029592",
  appId: "1:151921029592:web:84f0ee5d7c15e05466c2ad",
  measurementId: "G-FG3H7NKTTD"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Retrieve Firebase Messaging object
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-192x192.png',
    badge: '/icon-96x96.png',
    tag: 'kulu-ilan-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: 'Aç',
        icon: '/icon-48x48.png'
      },
      {
        action: 'close',
        title: 'Kapat'
      }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received.');

  event.notification.close();

  if (event.action === 'open' || !event.action) {
    // Open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});