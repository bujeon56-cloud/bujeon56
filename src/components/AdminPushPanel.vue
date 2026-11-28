<template>
  <details class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <summary class="cursor-pointer font-bold text-slate-900">선생님에게 푸시 알림 보내기</summary>
    <form class="mt-3 grid min-w-0 gap-3 text-sm" @submit.prevent="send">
      <label class="grid gap-1 font-bold">발송 대상
        <select v-model="target" class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2">
          <option value="unsubmitted">미제출 목장</option>
          <option value="all">전체 선생님</option>
          <option value="group">특정 목장</option>
        </select>
      </label>
      <label v-if="target === 'group'" class="grid gap-1 font-bold">목장
        <select v-model="groupId" required class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2">
          <option disabled value="">목장을 선택해 주세요</option>
          <option v-for="group in groups" :key="group.id" :value="group.id">{{ group.departmentName }} {{ group.name }}</option>
        </select>
      </label>
      <label class="grid gap-1 font-bold">제목
        <input v-model.trim="title" required maxlength="70" class="w-full rounded-lg border border-slate-300 px-3 py-2" />
      </label>
      <label class="grid gap-1 font-bold">내용
        <textarea v-model.trim="body" required maxlength="200" rows="2" class="w-full rounded-lg border border-slate-300 px-3 py-2"></textarea>
      </label>
      <p class="text-xs text-slate-600">{{ year }}년 · {{ date }} 기준으로, 알림을 등록한 기기에 발송합니다.</p>
      <button type="submit" :disabled="busy || !date || !title || !body"
        class="justify-self-start rounded-lg bg-blue-600 px-4 py-2 font-bold text-white disabled:opacity-50">
        {{ busy ? '발송 중…' : '푸시 발송' }}
      </button>
      <p v-if="feedback" :role="failed ? 'alert' : 'status'" :class="failed ? 'text-rose-700' : 'text-slate-700'">{{ feedback }}</p>
    </form>
  </details>
</template>

<script setup>
import { ref, watch } from 'vue';
import { sendTeacherPush } from '../api/pushNotifications';

const props = defineProps({ year: String, date: String, groups: Array });
const target = ref('unsubmitted');
const groupId = ref('');
const title = ref('출석부 제출 안내');
const body = ref('');
const busy = ref(false);
const failed = ref(false);
const feedback = ref('');
watch(() => props.year, () => { groupId.value = ''; });

async function send() {
  if (busy.value) return;
  const group = props.groups.find(entry => entry.id === groupId.value);
  const label = target.value === 'unsubmitted' ? '미제출 목장'
    : target.value === 'all' ? '전체 선생님' : [group?.departmentName, group?.name].filter(Boolean).join(' ');
  if (!label || !confirm(`${props.date} 기준 ${label}에게 알림을 발송할까요?`)) return;
  busy.value = true;
  feedback.value = '';
  failed.value = false;
  try {
    const result = await sendTeacherPush({
      target: target.value, groupId: groupId.value, year: props.year, date: props.date,
      title: title.value, body: body.value,
    });
    feedback.value = `대상 계정 ${result.accounts}개 · 중계 서버 접수 ${result.sent}기기 · 실패 ${result.failed}기기`;
    if (!result.devices) feedback.value += ' · 등록된 기기 없음';
  } catch (error) {
    failed.value = true;
    feedback.value = error.code === 'functions/failed-precondition' ? '발송 서버의 알림 설정을 확인해 주세요.' : '발송하지 못했습니다. 발송 서버 연결을 확인해 주세요.';
  } finally {
    busy.value = false;
  }
}
</script>
