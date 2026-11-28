<template>
  <Teleport v-if="active" to="#pwa-install-placement" defer>
    <section
      v-if="!hidden && !installed && (deferredPrompt || guide)"
      aria-labelledby="pwa-install-title"
      class="mt-5 rounded-2xl border border-blue-100 bg-blue-50/70 p-3.5"
    >
      <div class="flex items-start gap-3">
        <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700">
          <Smartphone class="h-5 w-5" aria-hidden="true" />
        </div>
        <div class="min-w-0 flex-1">
          <h2 id="pwa-install-title" class="text-sm font-bold text-slate-900">출석부 앱 설치</h2>
          <p class="mt-1 text-xs leading-relaxed text-slate-600">
            {{ deferredPrompt ? '홈 화면에서 출석부를 바로 열 수 있어요.' : guide.description }}
          </p>
        </div>
        <button type="button" @click="hidden = true" aria-label="설치 안내 닫기"
          class="-mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-blue-100">
          <X class="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div class="mt-3 flex flex-wrap gap-2">
        <button v-if="deferredPrompt" type="button" @click="installPwa"
          class="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700">
          앱 설치
        </button>
        <button v-if="guide" type="button" @click="expanded = !expanded"
          :aria-expanded="expanded" aria-controls="pwa-install-steps"
          class="rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50">
          {{ expanded ? '설치 방법 접기' : '설치 방법' }}
        </button>
      </div>

      <div v-if="guide" v-show="expanded" id="pwa-install-steps" class="mt-3 border-t border-blue-100 pt-3">
        <ol class="list-decimal space-y-1.5 pl-5 text-xs leading-relaxed text-slate-700">
          <li v-for="step in guide.steps" :key="step">{{ step }}</li>
        </ol>
        <div v-if="guide.showAddress" class="mt-3">
          <button type="button" @click="copyAddress"
            class="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50">
            <Copy class="h-3.5 w-3.5" aria-hidden="true" />
            주소 복사
          </button>
          <p v-if="copyStatus" role="status" class="mt-2 text-xs text-slate-700">{{ copyStatus }}</p>
          <input v-if="showAddress" ref="addressField" :value="address" readonly aria-label="출석부 주소"
            class="mt-2 w-full min-w-0 rounded-lg border border-blue-200 bg-white px-2 py-1 text-slate-800" />
        </div>
      </div>
    </section>
  </Teleport>
</template>

<script setup>
import { nextTick, onMounted, onUnmounted, ref, shallowRef } from 'vue';
import { Copy, Smartphone, X } from 'lucide-vue-next';
import { getPwaInstallGuide } from './pwaInstallGuide.js';

defineProps({ active: Boolean });

const deferredPrompt = shallowRef(null);
const guide = shallowRef(null);
const hidden = ref(false);
const installed = ref(false);
const expanded = ref(false);
const address = ref('');
const addressField = ref(null);
const showAddress = ref(false);
const copyStatus = ref('');
const installedKey = `bujeon:pwa-installed:${import.meta.env.BASE_URL}`;

function onInstallPrompt(event) {
  event.preventDefault();
  // A fresh native prompt means this browser can install the app again.
  installed.value = false;
  try { localStorage.removeItem(installedKey); } catch {}
  deferredPrompt.value = event;
}

function onInstalled() {
  deferredPrompt.value = null;
  installed.value = true;
  try { localStorage.setItem(installedKey, 'yes'); } catch {}
}

function syncInstalled(event) {
  if (event.key === installedKey) installed.value = event.newValue === 'yes';
}

onMounted(() => {
  if (window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true) {
    onInstalled();
    return;
  }
  try { installed.value = localStorage.getItem(installedKey) === 'yes'; } catch {}
  guide.value = getPwaInstallGuide(navigator);
  address.value = new URL(import.meta.env.BASE_URL, window.location.origin).href;
  window.addEventListener('beforeinstallprompt', onInstallPrompt);
  window.addEventListener('appinstalled', onInstalled);
  window.addEventListener('storage', syncInstalled);
});

onUnmounted(() => {
  window.removeEventListener('beforeinstallprompt', onInstallPrompt);
  window.removeEventListener('appinstalled', onInstalled);
  window.removeEventListener('storage', syncInstalled);
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
    expanded.value = true;
    console.warn('PWA 설치 창을 열지 못했습니다.', error);
  }
}

async function copyAddress() {
  try {
    await navigator.clipboard.writeText(address.value);
    copyStatus.value = '출석부 주소를 복사했습니다.';
    showAddress.value = false;
  } catch {
    copyStatus.value = '아래 주소를 길게 눌러 복사하세요.';
    showAddress.value = true;
    await nextTick();
    addressField.value?.select();
  }
}
</script>
