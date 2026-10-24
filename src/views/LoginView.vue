<template>
  <div class="min-h-screen bg-gradient-to-b from-indigo-50/70 via-white to-slate-100 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <!-- Church App Logo -->
      <div class="flex justify-center">
        <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-xl shadow-indigo-200">
          <Church class="w-8 h-8 sm:w-10 sm:h-10" />
        </div>
      </div>
      <h2 class="mt-4 sm:mt-6 text-center text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
        소년부 스마트 출석부
      </h2>
      <p class="mt-1 sm:mt-2 text-center text-xs sm:text-sm text-slate-500">
        로그인하여 우리 반 출석 및 달란트를 관리하세요
      </p>
    </div>

    <div class="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white py-6 sm:py-8 px-5 sm:px-10 shadow-xl shadow-slate-200/60 rounded-3xl border border-slate-100">
        <!-- Error Alert -->
        <div v-if="error" class="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-xs text-rose-700 font-bold">
          <AlertCircle class="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{{ error }}</span>
        </div>

        <!-- Login Form (Simple Code Login e.g. 11, 12, 21, pastor) -->
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-xs font-black text-slate-800">아이디 *</label>
              <span class="text-[11px] text-indigo-600 font-bold">1-1목장이면 11, 2-1목장이면 21</span>
            </div>
            <div class="relative">
              <input 
                v-model="loginId" 
                type="text" 
                required 
                placeholder="예: 11, 12, 21 또는 pastor"
                class="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-slate-50 focus:bg-white font-bold"
              />
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-xs font-black text-slate-800">비밀번호 *</label>
              <span class="text-[11px] text-slate-400">선생님 초기 비밀번호: 1234</span>
            </div>
            <div class="relative">
              <input 
                v-model="password" 
                type="password" 
                required 
                placeholder="비밀번호 입력"
                class="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-slate-50 focus:bg-white"
              />
            </div>
          </div>

          <div class="pt-2">
            <button 
              type="submit" 
              :disabled="loading"
              class="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white text-sm sm:text-base font-black rounded-xl shadow-lg shadow-indigo-200 transition duration-150 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer touch-manipulation"
            >
              <span v-if="loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              <span>{{ loading ? '로그인 중...' : '로그인' }}</span>
            </button>
          </div>
        </form>

        <!-- Divider -->
        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-slate-200"></div>
          </div>
          <div class="relative flex justify-center text-xs">
            <span class="px-3 bg-white text-slate-400 font-bold">또는 1초 간편 로그인 (체험용)</span>
          </div>
        </div>

        <!-- Quick Logins -->
        <div class="space-y-2.5">
          <div class="text-[11px] font-black text-slate-500">관리자 계정 (목사님, 서기)</div>
          <div class="grid grid-cols-2 gap-2">
            <button 
              type="button"
              @click="quickLogin('pastor')"
              class="p-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs font-bold rounded-xl border border-indigo-100 transition text-left flex items-center gap-2 cursor-pointer"
            >
              <Shield class="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <div class="truncate">
                <div class="font-black">담당 목사님</div>
                <div class="text-[10px] text-indigo-500">ID: pastor</div>
              </div>
            </button>

            <button 
              type="button"
              @click="quickLogin('clerk')"
              class="p-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs font-bold rounded-xl border border-indigo-100 transition text-left flex items-center gap-2 cursor-pointer"
            >
              <Shield class="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <div class="truncate">
                <div class="font-black">서기 선생님</div>
                <div class="text-[10px] text-indigo-500">ID: clerk</div>
              </div>
            </button>
          </div>

          <div class="text-[11px] font-black text-slate-500 mt-3">각 반 선생님 계정 (아이디 = 목장 번호)</div>
          <div class="grid grid-cols-2 gap-2">
            <button 
              type="button"
              @click="quickLogin('11')"
              class="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold rounded-xl border border-emerald-100 transition text-left flex items-center gap-2 cursor-pointer"
            >
              <UserCheck class="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <div class="truncate">
                <div class="font-black">1부 1목장</div>
                <div class="text-[10px] text-emerald-600">ID: 11 / 암호: 1234</div>
              </div>
            </button>

            <button 
              type="button"
              @click="quickLogin('12')"
              class="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold rounded-xl border border-emerald-100 transition text-left flex items-center gap-2 cursor-pointer"
            >
              <UserCheck class="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <div class="truncate">
                <div class="font-black">1부 2목장</div>
                <div class="text-[10px] text-emerald-600">ID: 12 / 암호: 1234</div>
              </div>
            </button>

            <button 
              type="button"
              @click="quickLogin('21')"
              class="p-2.5 bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-bold rounded-xl border border-purple-100 transition text-left flex items-center gap-2 cursor-pointer col-span-2"
            >
              <UserCheck class="w-4 h-4 text-purple-600 flex-shrink-0" />
              <div class="truncate">
                <div class="font-black">2부 1목장</div>
                <div class="text-[10px] text-purple-600">ID: 21 / 암호: 1234</div>
              </div>
            </button>
          </div>
        </div>

        <div class="mt-6 pt-4 border-t border-slate-100 text-center">
          <p class="text-[11px] text-slate-400">
            소년부 스마트 출석부 • 모바일/아이폰/PC 웹앱 지원
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
import { useChurchStore } from '../stores/churchStore';
import { Church, Shield, UserCheck, AlertCircle } from 'lucide-vue-next';

const router = useRouter();
const auth = useAuthStore();
const church = useChurchStore();

const loginId = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

const handleSubmit = async () => {
  error.value = '';
  loading.value = true;
  try {
    const user = await auth.login(loginId.value, password.value);
    if (user.role === 'admin') {
      router.push('/admin/dashboard');
    } else {
      router.push('/teacher/attendance');
    }
  } catch (err) {
    error.value = err.message || '로그인에 실패하였습니다.';
  } finally {
    loading.value = false;
  }
};

const quickLogin = async (username) => {
  if (!church.initialized) {
    await church.initChurchData();
  }

  const target = church.teachers.find(t => t.username === username || t.id === username);
  if (target) {
    await auth.demoLogin(target);
    if (target.role === 'admin') {
      router.push('/admin/dashboard');
    } else {
      router.push('/teacher/attendance');
    }
  } else {
    // Attempt normal login with username & default password
    try {
      const user = await auth.login(username, username.includes('admin') || username === 'pastor' || username === 'clerk' ? 'admin1234' : '1234');
      if (user.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/teacher/attendance');
      }
    } catch (e) {
      alert(`해당 계정을 찾을 수 없습니다: ${username}`);
    }
  }
};
</script>
