import { createHash } from 'node:crypto';
import { initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { defineSecret, defineString } from 'firebase-functions/params';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import webPush from 'web-push';

initializeApp();
const db = getFirestore();
const subscriptions = db.collection('pushSubscriptions');
const publicKey = defineString('PUSH_VAPID_PUBLIC_KEY');
const privateKey = defineSecret('PUSH_VAPID_PRIVATE_KEY');
const subject = defineString('PUSH_VAPID_SUBJECT');

async function requireRole(request, role) {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', '로그인이 필요합니다.');
  const profile = await db.collection('users').doc(uid).get();
  if (profile.data()?.role !== role) throw new HttpsError('permission-denied', '권한이 없습니다.');
  return uid;
}

function validEndpoint(value) {
  if (typeof value !== 'string' || value.length > 2048) return false;
  try {
    const url = new URL(value);
    const hosts = ['fcm.googleapis.com', 'push.services.mozilla.com', 'push.apple.com', 'notify.windows.com'];
    return url.protocol === 'https:' && !url.port && !url.username && !url.password && !url.hash
      && hosts.some(host => url.hostname === host || url.hostname.endsWith('.' + host));
  } catch {
    return false;
  }
}

function subscriptionRef(endpoint) {
  return subscriptions.doc(createHash('sha256').update(endpoint).digest('hex'));
}

export const getPushConfig = onCall(async request => {
  await requireRole(request, 'teacher');
  return { publicKey: publicKey.value() };
});

export const registerPush = onCall(async request => {
  const uid = await requireRole(request, 'teacher');
  const { endpoint, keys } = request.data || {};
  if (!validEndpoint(endpoint)
    || typeof keys?.p256dh !== 'string' || !/^[\w-]{87}$/.test(keys.p256dh)
    || typeof keys?.auth !== 'string' || !/^[\w-]{22}$/.test(keys.auth)) {
    throw new HttpsError('invalid-argument', '알림 등록 정보가 올바르지 않습니다.');
  }
  await subscriptionRef(endpoint).set({
    uid, endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth },
    updatedAt: FieldValue.serverTimestamp(),
  });
  return { registered: true };
});

export const unregisterPush = onCall(async request => {
  const uid = await requireRole(request, 'teacher');
  const endpoint = request.data?.endpoint;
  if (!validEndpoint(endpoint)) throw new HttpsError('invalid-argument', '알림 주소가 올바르지 않습니다.');
  const ref = subscriptionRef(endpoint);
  await db.runTransaction(async transaction => {
    const snapshot = await transaction.get(ref);
    if (snapshot.data()?.uid === uid) transaction.delete(ref);
  });
  return { removed: true };
});

export const sendTeacherPush = onCall({ secrets: [privateKey], timeoutSeconds: 90 }, async request => {
  await requireRole(request, 'admin');
  const { target, groupId, year, date, title, body } = request.data || {};
  if (!['group', 'all', 'unsubmitted'].includes(target)
    || typeof year !== 'string' || !/^\d{4}$/.test(year)
    || typeof date !== 'string' || !date.startsWith(year + '-') || !/^\d{4}-\d{2}-\d{2}$/.test(date)
    || Number.isNaN(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date || new Date(date).getUTCDay() !== 0
    || typeof title !== 'string' || !title.trim() || title.length > 70
    || typeof body !== 'string' || !body.trim() || body.length > 200
    || (target === 'group' && (typeof groupId !== 'string' || !groupId || groupId.includes('/')))) {
    throw new HttpsError('invalid-argument', '알림 대상과 내용을 확인해주세요.');
  }

  const groups = (await db.collection('groups').where('year', '==', year).get()).docs
    .filter(group => group.data().teacherId && (target !== 'group' || group.id === groupId));
  const openGroups = target !== 'unsubmitted' || !groups.length ? groups : await (async () => {
    const states = await db.getAll(...groups.map(group => db.collection('submissions').doc(`${year}_${date}_${group.id}`)));
    return groups.filter((_, index) => states[index].data()?.submitted !== true);
  })();
  const assigned = [...new Set(openGroups.map(group => group.data().teacherId))];
  const profiles = assigned.length ? await db.getAll(...assigned.map(uid => db.collection('users').doc(uid))) : [];
  const teachers = profiles.filter(profile => profile.data()?.role === 'teacher');
  const devices = (await Promise.all(teachers.map(profile => subscriptions.where('uid', '==', profile.id).get())))
    .flatMap(snapshot => snapshot.docs);
  const payload = JSON.stringify({ title: title.trim(), body: body.trim() });
  const options = {
    TTL: 3600,
    timeout: 10000,
    vapidDetails: { subject: subject.value(), publicKey: publicKey.value(), privateKey: privateKey.value() },
  };
  let sent = 0;
  for (let offset = 0; offset < devices.length; offset += 20) {
    const results = await Promise.allSettled(devices.slice(offset, offset + 20).map(async device => {
      const { endpoint, keys } = device.data();
      try {
        await webPush.sendNotification({ endpoint, keys }, payload, options);
      } catch (error) {
        if (error.statusCode === 404 || error.statusCode === 410) {
          await device.ref.delete({ lastUpdateTime: device.updateTime }).catch(() => {});
        }
        throw error;
      }
    }));
    sent += results.filter(result => result.status === 'fulfilled').length;
  }
  return { accounts: teachers.length, devices: devices.length, sent, failed: devices.length - sent };
});
