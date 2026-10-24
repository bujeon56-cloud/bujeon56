<template>
  <div class="min-h-screen bg-slate-50 text-slate-800">
    <div v-if="error" role="alert" class="fixed top-2 inset-x-2 z-[100] p-4 rounded-xl bg-rose-100 text-rose-900 shadow-lg flex justify-between gap-3">
      <span>{{ error }}</span><button @click="error = ''" aria-label="오류 안내 닫기">닫기</button>
    </div>
    <router-view />
    <PwaInstallPrompt />
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from './stores/authStore';
import { useChurchStore } from './stores/churchStore';
import { useAttendanceStore } from './stores/attendanceStore';
import PwaInstallPrompt from './components/PwaInstallPrompt.vue';

const auth = useAuthStore();
const church = useChurchStore();
const error = ref('');
const showError = event => { error.value = event.detail; };
onMounted(() => window.addEventListener('bujeon-error', showError));
onUnmounted(() => window.removeEventListener('bujeon-error', showError));

watch(() => auth.user?.id, async id => {
  useAttendanceStore().$reset();
  if (!id) { church.$reset(); return; }
  if (!church.initialized) {
    try { await church.initChurchData(); }
    catch (err) { error.value = err.message; }
  }
}, { immediate: true });
</script>
