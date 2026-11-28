<template>
  <div class="min-h-screen bg-slate-50 flex flex-col pb-20 md:pb-6">
    <AppHeader />

    <!-- Admin Navigation Header -->
    <div class="bg-white border-b border-slate-200">
      <div class="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
          <h2 class="font-extrabold text-slate-800 text-sm sm:text-base">
            소년부 관리자 센터
          </h2>
          <span class="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
            {{ auth.user?.position || '목사님/서기' }}
          </span>
        </div>

        <!-- Navigation Tabs (Desktop & Tablet) -->
        <nav aria-label="관리자 메뉴" class="hidden min-w-0 items-center gap-1 overflow-x-auto md:flex">
          <router-link 
            to="/admin/dashboard" 
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0"
            :class="$route.path.includes('dashboard') ? 'bg-blue-600 text-white shadow-sm shadow-blue-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'"
          >
            <BarChart2 class="w-4 h-4" />
            <span>출석 통계</span>
          </router-link>

          <router-link
            to="/admin/attendance-report"
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0"
            exact-active-class="bg-blue-600 !text-white shadow-sm shadow-blue-200"
          >
            <Printer class="w-4 h-4" />
            <span>출석 통계(출력)</span>
          </router-link>

          <router-link 
            to="/admin/groups" 
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0"
            :class="$route.path.includes('groups') ? 'bg-blue-600 text-white shadow-sm shadow-blue-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'"
          >
            <Layers class="w-4 h-4" />
            <span>목장(반) 관리</span>
          </router-link>

          <router-link 
            to="/admin/teachers" 
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0"
            :class="$route.path.includes('teachers') ? 'bg-blue-600 text-white shadow-sm shadow-blue-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'"
          >
            <Users class="w-4 h-4" />
            <span>선생님 관리</span>
          </router-link>

          <router-link v-if="auth.isAdmin" to="/admin/accounts" class="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0" :class="$route.path.includes('accounts') ? 'bg-blue-600 text-white shadow-sm shadow-blue-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'">
            <KeyRound class="w-4 h-4" /><span>계정 관리</span>
          </router-link>

          <router-link 
            to="/admin/talents" 
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0"
            :class="$route.path.includes('talents') ? 'bg-blue-600 text-white shadow-sm shadow-blue-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'"
          >
            <Award class="w-4 h-4" />
            <span>달란트 월별 통계</span>
          </router-link>
          <router-link
            :to="{ name: 'AdminLoginQr' }"
            class="flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-600"
            exact-active-class="bg-blue-600 !text-white shadow-sm shadow-blue-200"
          >
            <QrCode class="h-4 w-4" />
            <span>로그인 QR코드</span>
          </router-link>

          <router-link
            to="/admin/settings"
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0"
            :class="$route.path.includes('settings') ? 'bg-blue-600 text-white shadow-sm shadow-blue-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'"
          >
            <Sliders class="w-4 h-4" />
            <span>설정</span>
          </router-link>
        </nav>
      </div>
    </div>

    <!-- Main Admin Content Area -->
    <main class="page-content mx-auto w-full min-w-0 max-w-7xl flex-1">
      <router-view v-if="church.initialized || $route.name === 'AdminLoginQr'" />
      <p v-else-if="church.loading" role="status" class="p-4 text-sm text-slate-600">목장과 학생 명단을 불러오는 중입니다.</p>
    </main>

    <!-- Mobile Bottom Navigation for Admin -->
    <nav aria-label="관리자 메뉴" class="pb-safe fixed inset-x-0 bottom-0 z-30 flex justify-between overflow-x-auto border-t border-slate-300 bg-slate-100 px-2 pt-1.5 md:hidden [&>a]:shrink-0">
      <router-link 
        to="/admin/dashboard" 
        class="flex flex-col items-center gap-0.5 py-1 px-2 text-[10px] font-bold transition"
        :class="$route.path.includes('dashboard') ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'"
      >
        <BarChart2 class="w-4 h-4" />
        <span>출석통계</span>
      </router-link>

      <router-link
        to="/admin/attendance-report"
        class="flex flex-col items-center gap-0.5 py-1 px-2 text-[10px] font-bold text-slate-400"
        exact-active-class="!text-indigo-600"
      >
        <Printer class="w-4 h-4" />
        <span>출석통계(출력)</span>
      </router-link>

      <router-link 
        to="/admin/groups" 
        class="flex flex-col items-center gap-0.5 py-1 px-2 text-[10px] font-bold transition"
        :class="$route.path.includes('groups') ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'"
      >
        <Layers class="w-4 h-4" />
        <span>목장관리</span>
      </router-link>

      <router-link 
        to="/admin/teachers" 
        class="flex flex-col items-center gap-0.5 py-1 px-2 text-[10px] font-bold transition"
        :class="$route.path.includes('teachers') ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'"
      >
        <Users class="w-4 h-4" />
        <span>선생님</span>
      </router-link>

      <router-link v-if="auth.isAdmin" to="/admin/accounts" class="flex flex-col items-center gap-0.5 py-1 px-1 text-[10px] font-bold transition" :class="$route.path.includes('accounts') ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'">
        <KeyRound class="w-4 h-4" /><span>계정 관리</span>
      </router-link>

      <router-link 
        to="/admin/talents" 
        class="flex flex-col items-center gap-0.5 py-1 px-2 text-[10px] font-bold transition"
        :class="$route.path.includes('talents') ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'"
      >
        <Award class="w-4 h-4" />
        <span>달란트집계</span>
      </router-link>
      <router-link
        :to="{ name: 'AdminLoginQr' }"
        class="flex flex-col items-center gap-0.5 rounded-xl px-2 py-1 text-[10px] font-bold text-slate-400"
        exact-active-class="!text-indigo-600"
      >
        <QrCode class="h-4 w-4" />
        <span>로그인 QR</span>
      </router-link>

      <router-link
        to="/admin/settings"
        class="flex flex-col items-center gap-0.5 py-1 px-2 text-[10px] font-bold transition"
        :class="$route.path.includes('settings') ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'"
      >
        <Sliders class="w-4 h-4" />
        <span>설정</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { useAuthStore } from '../../stores/authStore';
import { useChurchStore } from '../../stores/churchStore';
import AppHeader from '../../components/AppHeader.vue';
import { BarChart2, Layers, Users, Sliders, Award, KeyRound, Printer, QrCode } from 'lucide-vue-next';

const auth = useAuthStore();
const church = useChurchStore();
</script>
