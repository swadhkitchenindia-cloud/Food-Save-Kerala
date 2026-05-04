// Firebase Cloud Messaging Service Worker
// This file MUST be at the root public/ folder

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAE7XX-8Jn3T1tgZBBzuSu22OJ1HtNLiGE",
  authDomain: "foodsavernapp.firebaseapp.com",
  projectId: "foodsavernapp",
  storageBucket: "foodsavernapp.firebasestorage.app",
  messagingSenderId: "610582580020",
  appId: "1:610582580020:web:e83124f479b3d38f71b361",
});

const messaging = firebase.messaging();

// Handle background push notifications
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification || {};
  self.registration.showNotification(title || 'Saver', {
    body: body || 'New deal available near you!',
    icon: icon || '/logo192.png',
    badge: '/logo192.png',
    tag: 'saver-notification',
    data: payload.data,
    actions: [{ action: 'open', title: 'View deal' }],
  });
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/customer/browse')
  );
});
