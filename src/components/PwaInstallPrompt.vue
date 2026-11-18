<template>
  <div
    v-if="!dismissed && (deferredPrompt || installGuide)"
    class="fixed bottom-20 left-4 right-4 md:bottom-6 md:right-6 md:left-auto md:max-w-md bg-indigo-600 text-white p-4 rounded-2xl shadow-2xl z-50 flex items-center justify-between border border-indigo-500"
  >
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
        <Download class="w-6 h-6" aria-hidden="true" />
      </div>
      <div>
        <h4 class="font-bold text-sm">소년부 출석부 앱 설치</h4>
        <p class="text-xs text-indigo-100">
          {{ deferredPrompt ? '설치를 눌러 홈 화면에 추가하세요.' : installGuide }}
        </p>
      </div>
    </div>
    <div class="flex items-center shrink-0">
      <button
        v-if="deferredPrompt"
        type="button"
        @click="installPwa"
        class="px-3 py-1.5 bg-white text-indigo-700 font-bold text-xs rounded-xl hover:bg-indigo-50"
      >
        설치
      </button>
      <button
        type="button"
        @click="dismissed = true"
        aria-label="설치 안내 닫기"
        class="p-3 hover:bg-white/20 rounded-lg text-indigo-200"
      >
        <X class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, shallowRef, onMounted, onUnmounted } from 'vue';
import { Download, X } from 'lucide-vue-next';
import { getPwaInstallGuide } from './pwaInstallGuide.js';

const deferredPrompt = shallowRef(null);
const dismissed = ref(false);
const installGuide = ref('');

function onInstallPrompt(event) {
  if (dismissed.value) return;
  event.preventDefault();
  deferredPrompt.value = event;
}

function onInstalled() {
  deferredPrompt.value = null;
  installGuide.value = '';
  dismissed.value = true;
}

onMounted(() => {
  if (window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true) return;
  installGuide.value = getPwaInstallGuide(navigator);
  window.addEventListener('beforeinstallprompt', onInstallPrompt);
  window.addEventListener('appinstalled', onInstalled);
});

onUnmounted(() => {
  window.removeEventListener('beforeinstallprompt', onInstallPrompt);
  window.removeEventListener('appinstalled', onInstalled);
});

async function installPwa() {
  const prompt = deferredPrompt.value;
  if (!prompt) return;
  deferredPrompt.value = null;
  try {
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') onInstalled();
  } catch (error) {
    console.warn('PWA 설치 창을 열지 못했습니다.', error);
  }
}
</script>
