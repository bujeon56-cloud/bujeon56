<template>
  <div class="min-h-screen bg-slate-50 text-slate-800">
    <div
      v-if="auth.loading || church.loading || attendance.loading"
      role="progressbar"
      :aria-label="auth.loading ? '로그인 확인 중' : '출석부 정보 불러오는 중'"
      class="pointer-events-none fixed inset-x-0 top-0 z-[90] h-1 overflow-hidden bg-blue-100"
    >
      <div class="loading-bar h-full w-2/5 bg-blue-600"></div>
    </div>
    <div v-if="error" role="alert" class="fixed top-2 inset-x-2 z-[100] p-4 rounded-xl bg-rose-100 text-rose-900 shadow-lg flex justify-between gap-3">
      <span>{{ error }}</span><button @click="error = ''" aria-label="오류 안내 닫기">닫기</button>
    </div>
    <div v-if="initializationError" role="alert" class="flex flex-wrap items-center justify-center gap-3 bg-rose-100 p-3 text-sm text-rose-900">
      <span>출석부 정보를 불러오지 못했습니다. {{ initializationError }}</span>
      <button type="button" class="rounded-lg border border-rose-300 px-3 py-1 font-bold" @click="initializeChurch">다시 시도</button>
    </div>
    <router-view />
    <PwaInstallPrompt :active="$route.name === 'Login'" />
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useAuthStore, authErrorMessage } from './stores/authStore';
import { useChurchStore } from './stores/churchStore';
import { useAttendanceStore } from './stores/attendanceStore';
import PwaInstallPrompt from './components/PwaInstallPrompt.vue';

const auth = useAuthStore();
const church = useChurchStore();
const attendance = useAttendanceStore();
const error = ref('');
const initializationError = ref('');
const showError = event => { error.value = event.detail; };
onMounted(() => window.addEventListener('bujeon-error', showError));
onUnmounted(() => window.removeEventListener('bujeon-error', showError));

async function initializeChurch() {
  const user = auth.user;
  initializationError.value = '';
  if (!user || church.loading || church.initialized) return;
  try { await church.initChurchData(); }
  catch (err) {
    if (auth.user === user) initializationError.value = authErrorMessage(err);
  }
}

watch(() => auth.user?.id, id => {
  attendance.$reset();
  church.$reset();
  initializationError.value = '';
  if (id) void initializeChurch();
}, { immediate: true });
</script>

<style scoped>
.loading-bar {
  animation: loading-bar-slide 1.2s ease-in-out infinite;
}

@keyframes loading-bar-slide {
  from { transform: translateX(-100%); }
  to { transform: translateX(250%); }
}

@media (prefers-reduced-motion: reduce) {
  .loading-bar {
    animation: none;
    width: 100%;
  }
}
</style>
