<template>
  <header class="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
    <div class="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
      <!-- Left: Logo & Title -->
      <div class="flex items-center gap-2.5 min-w-0">
        <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-100 flex-shrink-0">
          <Church class="w-5 h-5" />
        </div>
        <div class="min-w-0">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="font-black text-sm sm:text-base tracking-tight text-slate-900 truncate">
              소년부 출석부
            </span>
            <!-- Year Badge / Selector -->
            <select 
              v-if="auth.isAdmin" 
              :value="church.currentYear" 
              @change="onYearChange"
              class="text-[11px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg px-1.5 py-0.5 focus:outline-none cursor-pointer"
            >
              <option v-for="y in church.years" :key="y.id" :value="y.id">
                {{ y.title || y.id + '년' }}
              </option>
            </select>
            <span 
              v-else 
              class="text-[10px] sm:text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md px-1.5 py-0.2"
            >
              {{ church.currentYear }}년
            </span>
          </div>

          <div class="text-[10px] text-slate-400 font-medium flex items-center gap-1 truncate">
            <span class="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0" :class="isCloud ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'"></span>
            <span class="truncate">{{ isCloud ? 'Cloud 실시간' : '로컬 모드' }}</span>
            <button 
              @click="showConfigModal = true" 
              class="text-indigo-600 font-bold hover:underline ml-0.5 cursor-pointer"
            >
              [설정]
            </button>
          </div>
        </div>
      </div>

      <!-- Right: User Avatar & Logout -->
      <div class="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        <!-- User Badge -->
        <div class="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100/90 rounded-xl text-xs font-bold text-slate-700">
          <div 
            class="w-6 h-6 rounded-full flex items-center justify-center font-black text-[11px] flex-shrink-0"
            :class="auth.isAdmin ? 'bg-indigo-600 text-white' : 'bg-emerald-100 text-emerald-700'"
          >
            {{ auth.userName ? auth.userName.charAt(0) : '교' }}
          </div>
          <span class="hidden xs:inline max-w-[90px] truncate">{{ auth.userName }}</span>
          <span v-if="auth.isAdmin" class="bg-indigo-600 text-white text-[9px] px-1 py-0.2 rounded font-black">
            관리자
          </span>
          <span v-else-if="auth.userGroup" class="bg-emerald-100 text-emerald-800 text-[9px] px-1 py-0.2 rounded font-black max-w-[80px] truncate">
            {{ auth.userGroup }}
          </span>
        </div>

        <!-- Quick Switch for Testing (Helper for user) -->
        <button 
          @click="showRoleSwitchModal = true" 
          class="hidden sm:flex items-center gap-1 p-2 sm:px-2.5 sm:py-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 rounded-xl transition cursor-pointer"
          title="계정 변경 (테스트용)"
        >
          <Users class="w-3.5 h-3.5" />
          <span class="hidden md:inline">계정 변경</span>
        </button>

        <!-- Logout Button (Large Touch Area) -->
        <button 
          @click="handleLogout" 
          class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
          title="로그아웃"
        >
          <LogOut class="w-4 h-4" />
          <span class="hidden md:inline">로그아웃</span>
        </button>
      </div>
    </div>

    <!-- Firebase Config Modal -->
    <Modal v-model="showConfigModal" title="Firebase 무료 DB 연결 설정">
      <div class="space-y-4 text-xs sm:text-sm text-slate-600">
        <p class="leading-relaxed">
          Google Firebase의 <strong class="text-slate-800">무료 Spark 요금제</strong>를 연동하면 모든 선생님의 스마트폰과 관리자 PC 간에 <strong>출석부가 실시간으로 동기화</strong>됩니다.
        </p>

        <div class="p-3 bg-indigo-50/70 rounded-2xl border border-indigo-100 text-xs text-indigo-900 space-y-1">
          <div class="font-bold flex items-center gap-1">
            <Sparkles class="w-3.5 h-3.5 text-indigo-600" />
            평생 무료 티어 (교회 출석부에 넉넉함)
          </div>
          <div>• Firestore 읽기 50,000회/일, 쓰기 20,000회/일 (무료)</div>
          <div>• 무료 SSL 도메인 호스팅 제공</div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Firebase 설정 JSON 붙여넣기</label>
          <textarea 
            v-model="configJsonInput" 
            rows="6" 
            placeholder='{
  "apiKey": "AIzaSy...",
  "authDomain": "your-app.firebaseapp.com",
  "projectId": "your-app-id",
  "storageBucket": "your-app.appspot.com",
  "messagingSenderId": "...",
  "appId": "..."
}'
            class="w-full text-xs font-mono p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          ></textarea>
        </div>
      </div>

      <template #footer>
        <button 
          @click="resetLocalData" 
          class="px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl mr-auto cursor-pointer"
        >
          데이터 초기화
        </button>
        <button 
          @click="showConfigModal = false" 
          class="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
        >
          닫기
        </button>
        <button 
          @click="saveFirebaseConfig" 
          class="px-4 py-2 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-200 cursor-pointer"
        >
          저장 및 새로고침
        </button>
      </template>
    </Modal>

    <!-- Role Switch Modal (Quick Testing Preset) -->
    <Modal v-model="showRoleSwitchModal" title="빠른 계정 전환 (테스트용)">
      <div class="space-y-3">
        <p class="text-xs text-slate-500">
          원하는 권한과 목장을 선택하여 바로 테스트할 수 있습니다.
        </p>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto p-1">
          <button 
            v-for="u in church.teachers" 
            :key="u.id"
            @click="switchAccount(u)"
            class="flex items-center gap-3 p-3 rounded-2xl border text-left transition hover:border-indigo-400 hover:bg-indigo-50/50 cursor-pointer"
            :class="auth.user?.id === u.id ? 'border-indigo-500 bg-indigo-50/80 ring-2 ring-indigo-200' : 'border-slate-200 bg-white'"
          >
            <div 
              class="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs"
              :class="u.role === 'admin' ? 'bg-indigo-600 text-white' : 'bg-emerald-100 text-emerald-700'"
            >
              {{ u.name.charAt(0) }}
            </div>
            <div class="min-w-0 flex-1">
              <div class="font-black text-xs text-slate-900 truncate">{{ u.name }}</div>
              <div class="text-[11px] text-slate-500 flex items-center gap-1">
                <span v-if="u.role === 'admin'" class="text-indigo-600 font-bold">관리자 ({{ u.position || '목사님/서기' }})</span>
                <span v-else class="text-emerald-700 font-bold">{{ u.groupName || '반 미배정' }}</span>
              </div>
            </div>
          </button>
        </div>
      </div>
    </Modal>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
import { useChurchStore } from '../stores/churchStore';
import { DBService } from '../api/storage';
import { Church, LogOut, Users, Sparkles } from 'lucide-vue-next';
import Modal from './Modal.vue';

const auth = useAuthStore();
const church = useChurchStore();
const router = useRouter();

const isCloud = computed(() => DBService.isUsingCloud());
const showConfigModal = ref(false);
const showRoleSwitchModal = ref(false);

const configJsonInput = ref(localStorage.getItem('bujeon_firebase_config') || '');

const onYearChange = (e) => {
  church.setYear(e.target.value);
};

const handleLogout = async () => {
  await auth.logout();
  router.push('/login');
};

const switchAccount = async (user) => {
  await auth.demoLogin(user);
  showRoleSwitchModal.value = false;
  if (user.role === 'admin') {
    router.push('/admin/dashboard');
  } else {
    router.push('/teacher/attendance');
  }
};

const saveFirebaseConfig = () => {
  if (configJsonInput.value.trim()) {
    try {
      JSON.parse(configJsonInput.value.trim());
      localStorage.setItem('bujeon_firebase_config', configJsonInput.value.trim());
      alert('Firebase 설정이 저장되었습니다. 페이지를 새로고침하여 적용합니다.');
      window.location.reload();
    } catch (e) {
      alert('올바른 JSON 형식이 아닙니다. JSON 문법을 확인해주세요.');
    }
  } else {
    localStorage.removeItem('bujeon_firebase_config');
    alert('Firebase 설정이 해제되었습니다. 로컬 모드로 동작합니다.');
    window.location.reload();
  }
};

const resetLocalData = () => {
  if (confirm('로컬에 저장된 모든 출석 및 목장 데이터를 초기 샘플 데이터로 복구하시겠습니까?')) {
    DBService.resetAllData();
    alert('초기화 완료되었습니다.');
    window.location.reload();
  }
};
</script>
