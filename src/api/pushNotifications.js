import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './firebase';

const functions = getFunctions(app);
const call = async (name, data) => (await httpsCallable(functions, name)(data)).data;

export function supportsPush() {
  return window.isSecureContext && 'Notification' in window && 'PushManager' in window && 'serviceWorker' in navigator;
}

export async function getPushSubscription() {
  if (!supportsPush()) return null;
  const registration = await navigator.serviceWorker.getRegistration();
  return registration?.pushManager.getSubscription() ?? null;
}

export async function enablePush() {
  if (!supportsPush()) throw new Error('이 브라우저에서는 알림을 받을 수 없습니다.');
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('기기의 알림 권한을 허용해 주세요.');
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration?.active) throw new Error('앱을 다시 연 뒤 알림을 등록해 주세요.');
  const { publicKey } = await call('getPushConfig');
  const subscription = await registration.pushManager.getSubscription()
    ?? await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: publicKey });
  try {
    await call('registerPush', subscription.toJSON());
  } catch (error) {
    await subscription.unsubscribe().catch(() => {});
    throw error;
  }
}

export async function disablePush() {
  const subscription = await getPushSubscription();
  if (!subscription) return;
  await subscription.unsubscribe();
  void call('unregisterPush', { endpoint: subscription.endpoint }).catch(() => {});
}

export const sendTeacherPush = data => call('sendTeacherPush', data);
