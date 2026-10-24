<template>
  <div class="min-h-screen bg-slate-50 flex flex-col pb-20 md:pb-6">
    <AppHeader />

    <!-- Admin Navigation Header -->
    <div class="bg-white border-b border-slate-200">
      <div class="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
          <h2 class="font-extrabold text-slate-800 text-sm sm:text-base">
            소년부 관리자 센터
          </h2>
          <span class="text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
            {{ auth.user?.position || '목사님/서기' }}
          </span>
        </div>

        <!-- Navigation Tabs (Desktop & Tablet) -->
        <div class="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <router-link 
            to="/admin/dashboard" 
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0"
            :class="$route.path.includes('dashboard') ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'"
          >
            <BarChart2 class="w-4 h-4" />
            <span>출석 통계</span>
          </router-link>

          <router-link 
            to="/admin/groups" 
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0"
            :class="$route.path.includes('groups') ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'"
          >
            <Layers class="w-4 h-4" />
            <span>목장(반) 관리</span>
          </router-link>

          <router-link 
            to="/admin/teachers" 
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0"
            :class="$route.path.includes('teachers') ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'"
          >
            <Users class="w-4 h-4" />
            <span>선생님 관리</span>
          </router-link>

          <router-link v-if="auth.isAdmin" to="/admin/accounts" class="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0" :class="$route.path.includes('accounts') ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'">
            <KeyRound class="w-4 h-4" /><span>계정 관리</span>
          </router-link>

          <router-link 
            to="/admin/settings" 
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0"
            :class="$route.path.includes('settings') ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'"
          >
            <Sliders class="w-4 h-4" />
            <span>설정</span>
          </router-link>

          <router-link 
            to="/admin/talents" 
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0"
            :class="$route.path.includes('talents') ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'"
          >
            <Award class="w-4 h-4" />
            <span>달란트 월별 통계</span>
          </router-link>
        </div>
      </div>
    </div>

    <!-- Main Admin Content Area -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 py-4 sm:py-6">
      <router-view />
    </main>

    <!-- Mobile Bottom Navigation for Admin -->
    <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30 shadow-lg px-2 py-1.5 flex justify-around">
      <router-link 
        to="/admin/dashboard" 
        class="flex flex-col items-center gap-0.5 py-1 px-2 text-[10px] font-bold transition"
        :class="$route.path.includes('dashboard') ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'"
      >
        <BarChart2 class="w-4 h-4" />
        <span>출석통계</span>
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
        to="/admin/settings" 
        class="flex flex-col items-center gap-0.5 py-1 px-2 text-[10px] font-bold transition"
        :class="$route.path.includes('settings') ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'"
      >
        <Sliders class="w-4 h-4" />
        <span>설정</span>
      </router-link>

      <router-link 
        to="/admin/talents" 
        class="flex flex-col items-center gap-0.5 py-1 px-2 text-[10px] font-bold transition"
        :class="$route.path.includes('talents') ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'"
      >
        <Award class="w-4 h-4" />
        <span>달란트집계</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { useAuthStore } from '../../stores/authStore';
import AppHeader from '../../components/AppHeader.vue';
import { BarChart2, Layers, Users, Sliders, Award, KeyRound } from 'lucide-vue-next';

const auth = useAuthStore();
</script>
