<template>
  <button type="button" class="flex min-h-10 shrink-0 items-center rounded-xl px-2 text-slate-600 hover:bg-blue-100 disabled:opacity-60"
    :title="subscribed ? '알림 받기 끄기' : '알림 받기'" :aria-label="subscribed ? '알림 받기 끄기' : '알림 받기'"
    :aria-pressed="subscribed" :disabled="busy" @click="toggle">
    <BellRing v-if="subscribed" class="h-4 w-4 text-blue-700" aria-hidden="true" />
    <Bell v-else class="h-4 w-4" aria-hidden="true" />
  </button>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { Bell, BellRing } from 'lucide-vue-next';
import { disablePush, enablePush, getPushSubscription, supportsPush } from '../api/pushNotifications';

const subscribed = ref(false);
const busy = ref(false);
onMounted(async () => {
  subscribed.value = Boolean(await getPushSubscription().catch(() => null));
});

async function toggle() {
  if (!supportsPush()) {
    alert('아이폰·아이패드에서는 홈 화면에 추가한 출석부 앱을 열어 알림을 등록해 주세요.');
    return;
  }
  busy.value = true;
  try {
    if (subscribed.value) await disablePush();
    else await enablePush();
    subscribed.value = !subscribed.value;
    if (subscribed.value) alert('이 기기에 출석부 알림을 등록했습니다.');
  } catch (error) {
    alert(error.code ? '알림을 설정하지 못했습니다. 발송 서버와 브라우저 권한을 확인해 주세요.' : error.message);
  } finally {
    busy.value = false;
  }
}
</script>
