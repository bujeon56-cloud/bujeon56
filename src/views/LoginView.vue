<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4">
    <div class="w-full max-w-md bg-white rounded-3xl p-6 shadow-lg space-y-5">
      <h1 class="text-2xl font-black text-indigo-700">소년부 스마트 출석부</h1>
      <p class="text-sm text-slate-600">등록된 이메일로 로그인하여 출석과 달란트를 관리하세요.</p>
      <p v-if="error || auth.error" role="alert" class="p-3 bg-rose-50 text-rose-700 rounded-xl text-sm">{{ error || auth.error }}</p>
      <p v-if="notice" role="status" class="p-3 bg-indigo-50 text-indigo-700 rounded-xl text-sm">{{ notice }}</p>
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <label class="block text-sm font-bold">이메일
          <input v-model="email" type="email" autocomplete="username" required class="mt-1 w-full border rounded-xl p-3" placeholder="등록된 이메일 주소" />
        </label>
        <label class="block text-sm font-bold">비밀번호
          <input v-model="password" type="password" autocomplete="current-password" required class="mt-1 w-full border rounded-xl p-3" />
        </label>
        <button :disabled="busy" class="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold disabled:opacity-50">{{ busy ? '로그인 중…' : '로그인' }}</button>
      </form>
      <button @click="resetPassword" :disabled="busy" class="text-sm text-indigo-700 underline">비밀번호 재설정 이메일 받기</button>
      <p class="text-xs text-slate-500">계정이 없으면 관리자에게 등록을 요청해주세요.</p>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore, authErrorMessage } from '../stores/authStore';
import { useChurchStore } from '../stores/churchStore';
const auth = useAuthStore();
const church = useChurchStore();
const router = useRouter();
const email = ref('');
const password = ref('');
const busy = ref(false);
const error = ref('');
const notice = ref('');
async function handleSubmit() {
  busy.value = true; error.value = ''; notice.value = '';
  try {
    const user = await auth.login(email.value, password.value);
    await church.initChurchData();
    router.push(user.role === 'admin' ? '/admin/dashboard' : '/teacher/attendance');
  } catch (err) { error.value = authErrorMessage(err); }
  finally { busy.value = false; }
}
async function resetPassword() {
  error.value = ''; notice.value = '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) { error.value = '이메일을 먼저 입력해주세요.'; return; }
  busy.value = true;
  try { await auth.resetPassword(email.value); notice.value = '등록된 계정이면 재설정 이메일이 발송됩니다. 스팸함도 확인해주세요.'; }
  catch (err) { error.value = authErrorMessage(err); }
  finally { busy.value = false; }
}
</script>
