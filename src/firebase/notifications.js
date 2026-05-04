import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { db } from './config';
import { doc, updateDoc } from 'firebase/firestore';
import app from './config';

// Your Firebase VAPID key — get from Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
const VAPID_KEY = 'YOUR_VAPID_KEY_HERE';

let messaging = null;

function getMessagingInstance() {
  if (!messaging) {
    try { messaging = getMessaging(app); } catch (e) { return null; }
  }
  return messaging;
}

export async function requestNotificationPermission(userId) {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'denied') return false;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;

    const msg = getMessagingInstance();
    if (!msg) return false;

    const token = await getToken(msg, { vapidKey: VAPID_KEY });
    if (token && userId) {
      // Save FCM token to user's Firestore doc
      await updateDoc(doc(db, 'users', userId), { fcmToken: token, notificationsEnabled: true });
    }
    return true;
  } catch (e) {
    console.error('Notification setup failed:', e);
    return false;
  }
}

export function onForegroundMessage(callback) {
  const msg = getMessagingInstance();
  if (!msg) return () => {};
  return onMessage(msg, callback);
}

// Show local notification (fallback)
export function showLocalNotification(title, body, icon = '/logo192.png') {
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon });
  }
}
