<template>
  <div>
    <!-- Android / Chrome / Edge Install Banner -->
    <div 
      v-if="deferredPrompt && !dismissed" 
      class="fixed bottom-20 left-4 right-4 md:bottom-6 md:right-6 md:left-auto md:max-w-md bg-indigo-600 text-white p-4 rounded-2xl shadow-2xl z-50 flex items-center justify-between border border-indigo-500 animate-bounce"
    >
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <Download class="w-6 h-6 text-white" />
        </div>
        <div>
          <h4 class="font-bold text-sm">소년부 출석부 앱 설치</h4>
          <p class="text-xs text-indigo-100">홈 화면에 추가하여 앱처럼 편리하게 이용하세요</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button 
          @click="installPwa" 
          class="px-3 py-1.5 bg-white text-indigo-700 font-bold text-xs rounded-xl hover:bg-indigo-50 active:scale-95 transition shadow-sm"
        >
          설치
        </button>
        <button 
          @click="dismissed = true" 
          class="p-1 hover:bg-white/20 rounded-lg text-indigo-200"
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
              사파리 하단 <strong class="text-blue-400">공유( <Share class="w-3 h-3 inline" /> )</strong> 버튼을 누른 후 <strong class="text-blue-400">'홈 화면에 추가'</strong>를 누르세요.
            </p>
          </div>
        </div>
        <button 
          @click="dismissIos" 
          class="p-1 text-slate-400 hover:text-white"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Download, Share, X } from 'lucide-vue-next';

const deferredPrompt = ref(null);
const dismissed = ref(false);
const showIosPrompt = ref(false);
const dismissedIos = ref(localStorage.getItem('bujeon_dismiss_ios_pwa') === 'true');

onMounted(() => {
  // Capture PWA install prompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt.value = e;
  });

  // Check if iOS and not standalone
  const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
  const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator.standalone);

  if (isIos && !isInStandaloneMode && !dismissedIos.value) {
    showIosPrompt.value = true;
  }
});

const installPwa = async () => {
  if (!deferredPrompt.value) return;
  deferredPrompt.value.prompt();
  const { outcome } = await deferredPrompt.value.userChoice;
  if (outcome === 'accepted') {
    deferredPrompt.value = null;
  }
};

const dismissIos = () => {
  showIosPrompt.value = false;
  dismissedIos.value = true;
  localStorage.setItem('bujeon_dismiss_ios_pwa', 'true');
};
</script>
