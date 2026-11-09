<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4">
    <div class="w-full max-w-md bg-white rounded-3xl p-6 shadow-lg space-y-5">
      <h1 class="text-2xl font-black text-indigo-700">소년부 스마트 출석부</h1>
      <p class="text-sm text-slate-600">목장 아이디, 관리자 아이디 또는 등록된 이메일로 로그인하세요.</p>
      <p v-if="error || auth.error" role="alert" class="p-3 bg-rose-50 text-rose-700 rounded-xl text-sm">{{ error || auth.error }}</p>
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <label class="block text-sm font-bold">아이디 또는 이메일
          <input v-model="email" type="text" autocapitalize="none" spellcheck="false" autocomplete="username" required class="mt-1 w-full border rounded-xl p-3" placeholder="아이디를 입력해주세요" />
        </label>
        <label class="block text-sm font-bold">비밀번호
          <input v-model="password" type="password" autocomplete="current-password" required class="mt-1 w-full border rounded-xl p-3" />
        </label>
        <button :disabled="busy" class="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold disabled:opacity-50">{{ busy ? '로그인 중…' : '로그인' }}</button>
      </form>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore, authErrorMessage } from '../stores/authStore';
import { useChurchStore } from '../stores/churchStore';
const loginIdKey = 'bujeon:login-id';
const auth = useAuthStore();
const church = useChurchStore();
const router = useRouter();
const email = ref('');
try {
  email.value = sessionStorage.getItem(loginIdKey) ?? '';
} catch {
  // Session storage may be blocked by the browser.
}
const password = ref('');
const busy = ref(false);
const error = ref('');
async function handleSubmit() {
  busy.value = true;
  error.value = '';
  try {
    sessionStorage.setItem(loginIdKey, email.value.trim());
  } catch {
    // Allow login even when session storage is unavailable.
  }
  try {
    const user = await auth.login(email.value, password.value);
    await church.initChurchData();
    router.push(user.role === 'admin' ? '/admin/dashboard' : '/teacher/attendance');
  } catch (err) { error.value = authErrorMessage(err); }
  finally { busy.value = false; }
}
</script>
