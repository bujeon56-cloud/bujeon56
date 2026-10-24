<template>
  <div class="min-h-screen bg-slate-50 flex flex-col pb-24 md:pb-8">
    <AppHeader />

    <!-- Teacher Sub-nav Header -->
    <div class="bg-white border-b border-slate-200/80 sticky top-16 z-30 shadow-xs">
      <div class="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
        <div class="flex items-center gap-2 min-w-0">
          <span class="w-3 h-3 rounded-full bg-emerald-500 animate-pulse flex-shrink-0"></span>
          <div class="min-w-0">
            <h2 class="font-black text-slate-900 text-sm sm:text-base truncate tracking-tight">
              {{ currentGroupName }} 출석부
            </h2>
            <div class="text-[11px] text-slate-400 font-medium truncate">
              담당: {{ auth.userName }}
            </div>
          </div>
        </div>

        <!-- Navigation Tabs (Tablet & Desktop) -->
        <div class="hidden sm:flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
          <router-link 
            to="/teacher/attendance" 
            class="px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition flex items-center gap-1.5"
            :class="$route.path.includes('attendance') ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'"
          >
            <CheckSquare class="w-4 h-4" />
            <span>출석 체크</span>
          </router-link>
          <router-link 
            to="/teacher/students" 
            class="px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition flex items-center gap-1.5"
            :class="$route.path.includes('students') ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'"
          >
            <Users class="w-4 h-4" />
            <span>아이들 관리</span>
          </router-link>
        </div>
      </div>
    </div>

    <!-- Main View Content (Responsive Width) -->
    <main class="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-6 py-4">
      <router-view />
    </main>

    <!-- Mobile Bottom Navigation Bar (Large Touch Friendly for all phone sizes) -->
    <nav class="sm:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-40 shadow-2xl px-6 pt-2 pb-safe">
      <div class="flex items-center justify-around max-w-sm mx-auto">
        <router-link 
          to="/teacher/attendance" 
          class="flex-1 flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl transition duration-150 active:scale-95 touch-manipulation"
          :class="$route.path.includes('attendance') ? 'text-indigo-600 font-black' : 'text-slate-400 font-bold hover:text-slate-600'"
        >
          <div 
            class="w-10 h-7 rounded-xl flex items-center justify-center transition"
            :class="$route.path.includes('attendance') ? 'bg-indigo-50 text-indigo-600' : ''"
          >
            <CheckSquare class="w-5 h-5" />
          </div>
          <span class="text-xs">출석 체크</span>
        </router-link>

        <router-link 
          to="/teacher/students" 
          class="flex-1 flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl transition duration-150 active:scale-95 touch-manipulation"
          :class="$route.path.includes('students') ? 'text-indigo-600 font-black' : 'text-slate-400 font-bold hover:text-slate-600'"
        >
          <div 
            class="w-10 h-7 rounded-xl flex items-center justify-center transition"
            :class="$route.path.includes('students') ? 'bg-indigo-50 text-indigo-600' : ''"
          >
            <Users class="w-5 h-5" />
          </div>
          <span class="text-xs">아이들 관리</span>
        </router-link>
      </div>
    </nav>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useAuthStore } from '../../stores/authStore';
import { useChurchStore } from '../../stores/churchStore';
import AppHeader from '../../components/AppHeader.vue';
import { CheckSquare, Users } from 'lucide-vue-next';

const auth = useAuthStore();
const church = useChurchStore();

const currentGroupName = computed(() => {
  if (auth.user?.groupName) return auth.user.groupName;
  if (auth.user?.groupId) {
    const g = church.getGroupById(auth.user.groupId);
    if (g) return `${g.departmentName} ${g.name}`;
  }
  return '담당 목장';
});
</script>
