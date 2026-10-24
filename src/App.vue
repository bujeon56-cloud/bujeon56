<template>
  <div class="min-h-screen bg-slate-50 text-slate-800">
    <router-view />
    <PwaInstallPrompt />
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useAuthStore } from './stores/authStore';
import { useChurchStore } from './stores/churchStore';
import PwaInstallPrompt from './components/PwaInstallPrompt.vue';

const auth = useAuthStore();
const church = useChurchStore();

onMounted(async () => {
  await auth.initAuth();
  await church.initChurchData();
});
</script>
