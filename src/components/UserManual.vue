<template>
  <button v-if="accountId" type="button" aria-label="사용 매뉴얼" title="사용 매뉴얼" @click="visible = true"
    class="flex shrink-0 items-center gap-1 rounded-xl p-2 text-xs font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-700">
    <BookOpen class="h-4 w-4" aria-hidden="true" />
    <span class="hidden lg:inline">사용 매뉴얼</span>
  </button>

  <Teleport to="body">
    <Modal v-model="visible" :title="`${roleLabel} 사용 매뉴얼`">
      <p class="text-sm leading-relaxed text-slate-700">{{ description }}</p>
      <a :href="manualUrl" :download="`소년부 출석부 ${roleLabel} 매뉴얼.pptx`"
        class="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700">
        <Download class="h-4 w-4" aria-hidden="true" /> 매뉴얼 PPT 받기
      </a>
      <template #footer>
        <button type="button" class="rounded-xl px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200" @click="hideToday">
          오늘 하루 보지 않기
        </button>
        <button type="button" class="rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold" @click="visible = false">닫기</button>
      </template>
    </Modal>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { BookOpen, Download } from 'lucide-vue-next';
import { useAuthStore } from '../stores/authStore';
import { seoulDate } from '../utils/sundays.js';
import Modal from './Modal.vue';

const auth = useAuthStore();
const accountId = computed(() => auth.user?.id);
const roleLabel = computed(() => auth.isAdmin ? '관리자' : '반 계정');
const description = computed(() => auth.isAdmin
  ? '목장·계정 관리, 출석 통계 출력, 달란트 설정 방법을 안내합니다.'
  : '우리 반 출석 체크, 새친구 등록, 출석부 제출 방법을 안내합니다.');
const manualUrl = computed(() => `${import.meta.env.BASE_URL}manuals/${auth.isAdmin ? 'admin' : 'teacher'}-manual.pptx`);
const visible = ref(false);
const storageKey = id => `bujeon:manual-hidden:${id}`;

watch(accountId, id => {
  visible.value = Boolean(id);
  if (!id) return;
  try {
    visible.value = localStorage.getItem(storageKey(id)) !== seoulDate();
  } catch {
    // The manual remains available when browser storage is blocked.
  }
}, { immediate: true });

function hideToday() {
  const id = accountId.value;
  visible.value = false;
  if (!id) return;
  try {
    localStorage.setItem(storageKey(id), seoulDate());
  } catch {
    // Closing the current popup does not depend on browser storage.
  }
}
</script>
