<template>
  <VBtn v-if="accountId" type="button" aria-label="사용 매뉴얼" title="사용 매뉴얼" @click="opening = 'manual'"
    icon variant="text" size="44" class="shrink-0 text-slate-600">
    <BookOpen class="h-4 w-4" aria-hidden="true" />
  </VBtn>

  <Modal v-model="visible" :title="`${roleLabel} 사용 매뉴얼`">
    <p class="text-sm leading-relaxed text-slate-700">{{ description }}</p>
    <VBtn :href="manualUrl" :download="`소년부 출석부 ${roleLabel} 매뉴얼.pptx`" color="primary" variant="flat">
      <template #prepend><Download class="h-4 w-4" aria-hidden="true" /></template>
      매뉴얼 PPT 받기
    </VBtn>
    <template #footer>
      <VBtn v-if="opening === 'login'" type="button" variant="text" @click="hidePermanently">영원히 보지 않기</VBtn>
      <VBtn type="button" variant="outlined" @click="visible = false">닫기</VBtn>
    </template>
  </Modal>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { BookOpen, Download } from 'lucide-vue-next';
import { VBtn } from 'vuetify/components/VBtn';
import { useAuthStore } from '../stores/authStore';
import Modal from './Modal.vue';

const auth = useAuthStore();
const accountId = computed(() => auth.user?.id);
const roleLabel = computed(() => auth.isAdmin ? '관리자' : '반 계정');
const description = computed(() => auth.isAdmin
  ? '출석부 확인과 수정, 통계 출력, 목장·계정 관리, 달란트 및 연도 설정을 안내합니다.'
  : '우리 반 출석 체크, 새친구와 학생 관리, 월별 달란트 조회, 출석부 제출 방법을 안내합니다.');
const manualUrl = computed(() => `${import.meta.env.BASE_URL}manuals/${auth.isAdmin ? 'admin' : 'teacher'}-manual.pptx`);
const opening = ref(null);
const visible = computed({
  get: () => opening.value !== null,
  set: value => { if (!value) opening.value = null; }
});
const storageKey = id => `bujeon:manual-hidden:${id}`;

watch(accountId, id => {
  opening.value = id ? 'login' : null;
  if (!id) return;
  try {
    if (localStorage.getItem(storageKey(id)) === 'permanent') opening.value = null;
  } catch {
    // The manual remains available when browser storage is blocked.
  }
}, { immediate: true });

function hidePermanently() {
  const id = accountId.value;
  visible.value = false;
  if (!id) return;
  try {
    localStorage.setItem(storageKey(id), 'permanent');
  } catch {
    // Closing the current popup does not depend on browser storage.
  }
}
</script>
