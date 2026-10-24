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
            <span class="truncate">{{ isCloud ? '공용 DB 연결' : '로컬 모드' }}</span>

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
          <span v-else-if="currentGroup" class="bg-emerald-100 text-emerald-800 text-[9px] px-1 py-0.2 rounded font-black max-w-[80px] truncate">
            {{ currentGroup?.name }}
          </span>
        </div>

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

  </header>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
import { useChurchStore } from '../stores/churchStore';
import { Church, LogOut } from 'lucide-vue-next';
const auth = useAuthStore();
const church = useChurchStore();
const router = useRouter();
const isCloud = true;
const onYearChange = event => church.setYear(event.target.value);
const currentGroup = computed(() => church.getTeacherGroup(auth.user?.id));
const handleLogout = async () => { await auth.logout(); church.$reset(); router.push('/login'); };
</script>
