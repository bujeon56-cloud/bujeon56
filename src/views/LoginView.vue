<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4">
    <VCard color="surface" variant="flat" class="card-content login-card w-full max-w-md space-y-5 !rounded-[1.75rem] !border-2 !border-blue-300">
      <h1 class="text-center text-2xl font-bold tracking-tight text-blue-800">스마트 출석부</h1>
      <p v-if="error || auth.error" role="alert" class="p-3 bg-rose-50 text-rose-700 rounded-xl text-sm">{{ error || auth.error }}</p>
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <label class="block text-sm font-bold">아이디 또는 이메일
          <input v-model="email" type="text" autocapitalize="none" spellcheck="false" autocomplete="username" required class="mt-1.5 block w-full rounded-xl border border-slate-300 bg-slate-50 p-3 outline-blue-500" placeholder="아이디를 입력해주세요" />
        </label>
        <label class="block text-sm font-bold">비밀번호
          <input v-model="password" type="password" autocomplete="current-password" required class="mt-1.5 block w-full rounded-xl border border-slate-300 bg-slate-50 p-3 outline-blue-500" />
        </label>
        <div class="space-y-1">
          <label class="flex items-center gap-2 text-sm font-medium">
            <input v-model="rememberLogin" type="checkbox" class="h-4 w-4 accent-blue-600" :disabled="busy" aria-describedby="remember-login-help" />
            로그인 유지 (선생님 전용)
          </label>
          <p id="remember-login-help" class="pl-6 text-xs text-slate-600">개인 휴대폰에서만 선택하세요. 공용 기기에서는 사용 후 로그아웃하세요.</p>
        </div>
        <VBtn type="submit" block height="46" color="primary" variant="flat" class="!rounded-xl" :loading="busy" :disabled="busy">{{ busy ? '로그인 중…' : '로그인' }}</VBtn>
      </form>
      <div id="pwa-install-placement" class="empty:hidden"></div>
    </VCard>
  </div>
</template>
<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { VBtn } from 'vuetify/components/VBtn';
import { VCard } from 'vuetify/components/VCard';
import { useAuthStore, authErrorMessage } from '../stores/authStore';
const loginIdKey = 'bujeon:login-id';
const auth = useAuthStore();
const router = useRouter();
const email = ref('');
try {
  email.value = sessionStorage.getItem(loginIdKey) ?? '';
} catch {
  // Session storage may be blocked by the browser.
}
const password = ref('');
const rememberLogin = ref(false);
const busy = ref(false);
const error = ref('');
async function handleSubmit() {
  if (busy.value) return;
  busy.value = true;
  error.value = '';
  try {
    sessionStorage.setItem(loginIdKey, email.value.trim());
  } catch {
    // Allow login even when session storage is unavailable.
  }
  try {
    const user = await auth.login(email.value, password.value, rememberLogin.value);
    await router.push(user.role === 'admin' ? '/admin/dashboard' : '/teacher/attendance');
  } catch (err) { error.value = authErrorMessage(err); }
  finally { busy.value = false; }
}
</script>
