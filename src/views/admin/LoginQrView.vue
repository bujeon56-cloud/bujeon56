<template>
  <section class="mx-auto max-w-xl space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
    <div>
      <h2 class="flex items-center gap-2 text-xl font-black text-slate-900">
        <QrCode class="h-6 w-6 text-indigo-600" aria-hidden="true" />
        로그인 QR코드
      </h2>
      <p class="mt-2 text-sm leading-relaxed text-slate-600">
        휴대폰 카메라로 스캔한 뒤, 출석부 로그인 화면에서 본인 계정으로 로그인하세요.
      </p>
    </div>

    <form class="space-y-2" @submit.prevent="generateQr">
      <label for="qr-site-address" class="block text-sm font-bold text-slate-700">출석부 사이트 주소</label>
      <div class="flex flex-wrap gap-2">
        <input id="qr-site-address" v-model.trim="siteAddress" type="text" inputmode="url" required
          autocomplete="url" autocapitalize="off" spellcheck="false" :disabled="generating"
          aria-describedby="qr-site-help"
          class="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-slate-800" />
        <button type="submit" :disabled="generating"
          class="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50">
          QR코드 생성
        </button>
      </div>
      <p id="qr-site-help" class="text-xs text-slate-600">새 도메인으로 바뀌면 이 주소를 수정하세요. 하위 경로에 배포했다면 경로까지 입력하세요.</p>
      <p v-if="addressError" role="alert" class="text-sm text-rose-700">{{ addressError }}</p>
    </form>

    <div class="flex min-h-48 items-center justify-center rounded-xl border border-slate-200 bg-white p-2">
      <img v-if="qrImage" :src="qrImage" alt="소년부 출석부 로그인 링크 QR코드"
        width="256" height="256" class="h-auto w-64 max-w-full" />
      <p v-else-if="qrError" role="alert" class="text-sm text-rose-700">QR코드를 만들지 못했습니다. 아래 로그인 주소를 복사해 주세요.</p>
      <p v-else-if="generating" role="status" class="text-sm text-slate-600">QR코드를 만드는 중입니다.</p>
      <p v-else class="text-sm text-slate-600">사이트 주소를 입력해 QR코드를 생성하세요.</p>
    </div>

    <label v-if="loginUrl" class="block space-y-1.5">
      <span class="text-sm font-bold text-slate-700">로그인 주소</span>
      <input ref="addressField" :value="loginUrl" readonly
        class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800" />
    </label>
    <div v-if="loginUrl" class="flex flex-wrap gap-2">
      <button type="button" @click="copyLink"
        class="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
        <Copy class="h-4 w-4" aria-hidden="true" />
        링크 복사
      </button>
      <a v-if="qrImage" :href="qrImage" download="출석부-로그인-QR.png"
        class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-bold text-white hover:bg-indigo-700">
        <Download class="h-4 w-4" aria-hidden="true" />
        QR 이미지 저장
      </a>
    </div>
    <p v-if="copyStatus" role="status" class="text-sm text-slate-600">{{ copyStatus }}</p>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { Copy, Download, QrCode } from 'lucide-vue-next';
import QRCode from 'qrcode';

const siteAddress = ref(new URL(import.meta.env.BASE_URL, window.location.origin).href);
const loginUrl = ref('');
const addressError = ref('');
const generating = ref(false);
const qrImage = ref('');
const qrError = ref(false);
const addressField = ref(null);
const copyStatus = ref('');

onMounted(generateQr);

async function generateQr() {
  if (generating.value) return;
  addressError.value = '';
  copyStatus.value = '';
  qrError.value = false;
  qrImage.value = '';
  loginUrl.value = '';
  try {
    const input = siteAddress.value;
    if (!input || /\s/.test(input)) throw new Error();
    const url = new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(input) ? input : `https://${input}`);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
      throw new Error();
    }
    const path = url.pathname.replace(/\/+$/, '');
    url.pathname = path.endsWith('/login') ? path : `${path}/login`;
    loginUrl.value = url.href;
  } catch {
    addressError.value = '올바른 사이트 주소를 입력해 주세요. 예: https://example.com';
    return;
  }

  generating.value = true;
  try {
    qrImage.value = await QRCode.toDataURL(loginUrl.value, { scale: 14, margin: 4 });
  } catch {
    qrError.value = true;
  } finally {
    generating.value = false;
  }
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(loginUrl.value);
    copyStatus.value = '로그인 주소를 복사했습니다.';
  } catch {
    addressField.value?.focus();
    addressField.value?.select();
    copyStatus.value = '선택된 주소를 복사해 주세요.';
  }
}
</script>
