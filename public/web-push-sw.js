// Web Push Service Worker - No Firebase dependency
console.log('🔧 Web Push Service Worker loaded');

// Service Worker version
const SW_VERSION = '1.0.0';
const CACHE_NAME = 'kulu-ilan-push-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('🔧 Web Push SW installing, version:', SW_VERSION);
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('🔧 Web Push SW activated, version:', SW_VERSION);
  event.waitUntil(self.clients.claim());
});

// Push event - Handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('📱 Push notification received:', event);
  
  let notificationData = {
    title: 'Kulu İlan',
    body: 'Yeni bir bildiriminiz var',
    icon: '/icon-192x192.png',
    badge: '/icon-96x96.png',
    tag: 'kulu-ilan-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: 'Aç',
        icon: '/icon-96x96.png'
      },
      {
        action: 'close',
        title: 'Kapat'
      }
    ],
    data: {
      url: '/',
      timestamp: Date.now()
    }
  };
  
  // Parse push data if available
  if (event.data) {
    try {
      const pushData = event.data.json();
      console.log('📱 Push data received:', pushData);
      
      // Update notification data with received data
      if (pushData.title) notificationData.title = pushData.title;
      if (pushData.body) notificationData.body = pushData.body;
      if (pushData.icon) notificationData.icon = pushData.icon;
      if (pushData.url) notificationData.data.url = pushData.url;
      if (pushData.tag) notificationData.tag = pushData.tag;
      if (pushData.data) notificationData.data = { ...notificationData.data, ...pushData.data };
      
    } catch (error) {
      console.error('❌ Error parsing push data:', error);
      // Use default notification data
    }
  }
  
  // Show notification
  const notificationPromise = self.registration.showNotification(
    notificationData.title,
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      actions: notificationData.actions,
      data: notificationData.data,
      vibrate: [200, 100, 200],
      timestamp: notificationData.data.timestamp
    }
  );
  
  event.waitUntil(notificationPromise);
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Notification clicked:', event);
  
  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};
  
  // Close notification
  notification.close();
  
  if (action === 'close') {
    console.log('🔒 Notification closed by user');
    return;
  }
  
  // Default action or 'open' action
  const urlToOpen = data.url || '/';
  
  // Focus existing window or open new one
  const promiseChain = self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then((windowClients) => {
    let matchingClient = null;
    
    // Look for existing window
    for (let i = 0; i < windowClients.length; i++) {
      const windowClient = windowClients[i];
      if (windowClient.url.includes(self.location.origin)) {
        matchingClient = windowClient;
        break;
      }
    }
    
    if (matchingClient) {
      // Focus existing window and navigate
      console.log('🔍 Focusing existing window:', urlToOpen);
      return matchingClient.focus().then(() => {
        return matchingClient.navigate(urlToOpen);
      });
    } else {
      // Open new window
      console.log('🆕 Opening new window:', urlToOpen);
      return self.clients.openWindow(urlToOpen);
    }
  });
  
  event.waitUntil(promiseChain);
});

// Background sync (optional - for offline support)
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync:', event.tag);
  
  if (event.tag === 'push-subscription-sync') {
    // Handle subscription sync if needed
    console.log('🔄 Syncing push subscription...');
  }
});

// Message event (for communication with main thread)
self.addEventListener('message', (event) => {
  console.log('💬 SW Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: SW_VERSION });
  }
});

console.log('✅ Web Push Service Worker ready, version:', SW_VERSION);