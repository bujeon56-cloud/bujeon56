<template>
  <div class="min-h-screen bg-slate-50 flex flex-col pb-24 md:pb-8">
    <AppHeader />

    <!-- Teacher Sub-nav Header -->
    <div class="border-b border-slate-200/80 bg-white shadow-xs">
      <div class="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
        <div class="flex items-center gap-2 min-w-0">
          <span class="w-3 h-3 rounded-full bg-emerald-500 animate-pulse flex-shrink-0"></span>
          <div class="flex min-w-0 items-baseline gap-2">
            <h2 class="min-w-0 truncate text-sm font-black tracking-tight text-slate-900 sm:text-base">
              {{ currentGroupName }} 출석부
            </h2>
            <p class="min-w-0 truncate text-[11px] font-medium text-slate-500" :title="auth.userName">
              담당 : {{ auth.userName }}
            </p>
          </div>
        </div>

        <!-- Navigation Tabs (Tablet & Desktop) -->
        <div class="hidden shrink-0 items-center gap-1 rounded-2xl bg-slate-100 p-1 sm:flex">
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
            <span>학생 관리</span>
          </router-link>
          <router-link
            to="/teacher/talents"
            class="px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition flex items-center gap-1.5"
            :class="$route.name === 'TeacherTalents' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'"
          >
            <Coins class="w-4 h-4" />
            <span>월별 달란트</span>
          </router-link>
        </div>
      </div>
    </div>

    <!-- Main View Content (Responsive Width) -->
    <main class="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-6 py-4">
      <router-view v-if="church.initialized" />
      <p v-else-if="church.loading" role="status" class="p-4 text-sm text-slate-600">우리 반 출석부를 불러오는 중입니다.</p>
    </main>

    <!-- Mobile Bottom Navigation Bar (Large Touch Friendly for all phone sizes) -->
    <nav class="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-slate-300 bg-slate-100 px-6 pt-2 shadow-[0_-4px_16px_rgb(15_23_42_/_0.12)] sm:hidden">
      <div class="flex items-center justify-around max-w-sm mx-auto">
        <router-link 
          to="/teacher/attendance" 
          class="flex-1 flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl transition duration-150 active:scale-95 touch-manipulation"
          :class="$route.path.includes('attendance') ? 'text-blue-700 font-black' : 'text-slate-400 font-bold hover:text-slate-600'"
        >
          <div 
            class="w-10 h-7 rounded-xl flex items-center justify-center transition"
            :class="$route.path.includes('attendance') ? 'bg-blue-600 text-white' : ''"
          >
            <CheckSquare class="w-5 h-5" />
          </div>
          <span class="text-xs">출석 체크</span>
        </router-link>

        <router-link
          to="/teacher/talents"
          class="flex-1 flex flex-col items-center gap-1 py-1.5 px-1 rounded-2xl transition duration-150 active:scale-95 touch-manipulation"
          :class="$route.name === 'TeacherTalents' ? 'text-blue-700 font-black' : 'text-slate-400 font-bold hover:text-slate-600'"
        >
          <div
            class="w-10 h-7 rounded-xl flex items-center justify-center transition"
            :class="$route.name === 'TeacherTalents' ? 'bg-blue-600 text-white' : ''"
          >
            <Coins class="w-5 h-5" />
          </div>
          <span class="text-xs">월별 달란트</span>
        </router-link>

        <router-link
          to="/teacher/students"
          class="flex-1 flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl transition duration-150 active:scale-95 touch-manipulation"
          :class="$route.path.includes('students') ? 'text-blue-700 font-black' : 'text-slate-400 font-bold hover:text-slate-600'"
        >
          <div
            class="w-10 h-7 rounded-xl flex items-center justify-center transition"
            :class="$route.path.includes('students') ? 'bg-blue-600 text-white' : ''"
          >
            <Users class="w-5 h-5" />
          </div>
          <span class="text-xs">학생 관리</span>
        </router-link>
      </div>
    </nav>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../../stores/authStore';
import { useChurchStore } from '../../stores/churchStore';
import { useAttendanceStore } from '../../stores/attendanceStore';
import { activeAttendanceYear, teacherGroupForYear } from '../../utils/teacherYears.js';
import AppHeader from '../../components/AppHeader.vue';
import { CheckSquare, Coins, Users } from 'lucide-vue-next';

const auth = useAuthStore();
const church = useChurchStore();
const attendance = useAttendanceStore();
const route = useRoute();

watch(() => route.name, name => {
  const scope = auth.teacherScope;
  if (name !== 'TeacherAttendance' || church.initialized || !scope || scope.uid !== auth.user?.id) return;
  const year = activeAttendanceYear(scope.years)?.id;
  const group = teacherGroupForYear(scope.groups, year, scope.uid);
  if (!group) return;

  attendance.resetDefaultDate(year);
  const key = `${year}_${attendance.selectedDate}_${group.id}`;
  if (attendance.preloadedGroupKey === key) return;
  attendance.preloadedGroupKey = key;
  void attendance.loadGroupAttendance(year, group.id);
}, { immediate: true });

const currentGroupName = computed(() => {
  const group = church.getTeacherGroup(auth.user?.id);
  return group ? [group.departmentName, group.name].join(' ') : '반 미배정';
});
</script>
