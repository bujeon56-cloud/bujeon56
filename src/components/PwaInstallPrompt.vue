<template>
  <div>
    <!-- Android / Chrome / Edge Install Banner -->
    <div
      v-if="(deferredPrompt || showAndroidGuide) && !dismissed"
      class="fixed bottom-20 left-4 right-4 md:bottom-6 md:right-6 md:left-auto md:max-w-md bg-indigo-600 text-white p-4 rounded-2xl shadow-2xl z-50 flex items-center justify-between border border-indigo-500"
    >
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <Download class="w-6 h-6 text-white" />
        </div>
        <div>
          <h4 class="font-bold text-sm">소년부 출석부 앱 설치</h4>
          <p class="text-xs text-indigo-100">{{ deferredPrompt ? '홈 화면에 추가하여 앱처럼 편리하게 이용하세요' : 'Chrome 메뉴(⋮) → 홈 화면에 추가 또는 앱 설치를 선택하세요.' }}</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button
          v-if="deferredPrompt" @click="installPwa"
          class="px-3 py-1.5 bg-white text-indigo-700 font-bold text-xs rounded-xl hover:bg-indigo-50 active:scale-95 transition shadow-sm"
        >
          설치
        </button>
        <button
          @click="dismissed = true"
          aria-label="설치 안내 닫기" class="p-3 hover:bg-white/20 rounded-lg text-indigo-200"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- iOS Safari Guide Banner -->
    <div
      v-if="showIosPrompt && !dismissedIos"
      class="fixed bottom-20 left-4 right-4 md:bottom-6 md:right-6 md:left-auto md:max-w-md bg-slate-900/95 text-white p-4 rounded-2xl shadow-2xl z-50 border border-slate-700 backdrop-blur-md"
    >
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center flex-shrink-0">
            <Share class="w-5 h-5" />
          </div>
          <div>
            <h4 class="font-bold text-sm">아이폰(iOS) 앱으로 설치하기</h4>
            <p class="text-xs text-slate-300 mt-0.5">
              Safari에서 열고 <strong class="text-blue-400">공유( <Share class="w-3 h-3 inline" /> )</strong> 버튼을 누른 후 <strong class="text-blue-400">'홈 화면에 추가'</strong>를 누르세요.
            </p>
          </div>
        </div>
        <button
          @click="dismissIos"
          aria-label="설치 안내 닫기" class="p-3 text-slate-400 hover:text-white"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { Download, Share, X } from 'lucide-vue-next';

const deferredPrompt = ref(null);
const dismissed = ref(false);
const showIosPrompt = ref(false);
const dismissedIos = ref(localStorage.getItem('bujeon_dismiss_ios_pwa') === 'true');

const showAndroidGuide = ref(false);
const onInstallPrompt = (event) => {
  event.preventDefault();
  deferredPrompt.value = event;
};
const onInstalled = () => {
  deferredPrompt.value = null;
  showAndroidGuide.value = false;
  showIosPrompt.value = false;
};
onMounted(() => {
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  if (standalone) return;
  window.addEventListener('beforeinstallprompt', onInstallPrompt);
  window.addEventListener('appinstalled', onInstalled);
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  showIosPrompt.value = ios && !dismissedIos.value;
  showAndroidGuide.value = /android/i.test(navigator.userAgent);
});
onUnmounted(() => {
  window.removeEventListener('beforeinstallprompt', onInstallPrompt);
  window.removeEventListener('appinstalled', onInstalled);
});
const installPwa = async () => {
  if (!deferredPrompt.value) return;
  const prompt = deferredPrompt.value;
  deferredPrompt.value = null;
  await prompt.prompt();
  const { outcome } = await prompt.userChoice;
  if (outcome === 'accepted') {
    showAndroidGuide.value = false;
    deferredPrompt.value = null;
  }
};

const dismissIos = () => {
  showIosPrompt.value = false;
  dismissedIos.value = true;
  localStorage.setItem('bujeon_dismiss_ios_pwa', 'true');
};
</script>
