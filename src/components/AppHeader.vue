<template>
  <header class="sticky top-0 z-40 border-b border-blue-200 bg-blue-50">
    <div class="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
      <!-- Left: Logo & Title -->
      <div class="flex items-center gap-2.5 min-w-0">
        <VAvatar size="36" color="primary" rounded="lg" class="!hidden shrink-0 sm:!inline-flex">
          <Church class="h-5 w-5" aria-hidden="true" />
        </VAvatar>
        <div class="min-w-0">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="truncate text-sm font-bold tracking-tight text-slate-900 sm:text-base">
              소년부 출석부
            </span>
            <span class="inline-flex min-w-0 items-center gap-1.5">
              <span class="whitespace-nowrap rounded-md border border-blue-200 bg-blue-50 px-1.5 text-[10px] font-bold text-blue-700 sm:text-xs">
                {{ yearLabel }}
              </span>
              <span class="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-[10px] font-medium text-slate-600">
                <span class="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true"></span>
                DB 연결
              </span>
            </span>
          </div>
        </div>
      </div>

      <!-- Right: User Avatar & Logout -->
      <div class="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        <!-- User Badge -->
        <div class="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-100/90 rounded-xl text-xs font-bold text-slate-700">
          <div 
            class="w-6 h-6 rounded-full flex items-center justify-center font-black text-[11px] flex-shrink-0"
            :class="auth.isAdmin ? 'bg-blue-600 text-white' : 'bg-emerald-100 text-emerald-700'"
          >
            {{ auth.userName ? auth.userName.charAt(0) : '교' }}
          </div>
          <span class="hidden xs:inline max-w-[90px] truncate">{{ auth.userName }}</span>
          <span v-if="auth.isAdmin" class="bg-blue-600 text-white text-[9px] px-1 py-0.2 rounded font-black">
            관리자
          </span>
          <span v-else-if="currentGroup" class="bg-emerald-100 text-emerald-800 text-[9px] px-1 py-0.2 rounded font-black max-w-[80px] truncate">
            {{ currentGroup?.name }}
          </span>
        </div>

        <ThemeToggle />
        <!-- <TeacherPushSettings v-if="auth.user && !auth.isAdmin" /> -->
        <UserManual />
        <!-- Logout Button (Large Touch Area) -->
        <VBtn
          type="button"
          @click="handleLogout"
          :disabled="loggingOut"
          :aria-label="loggingOut ? '로그아웃 중' : '로그아웃'"
          :aria-busy="loggingOut"
          title="로그아웃"
          icon
          variant="text"
          size="44"
          class="text-slate-600"
        >
          <LoaderCircle v-if="loggingOut" class="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />
          <LogOut v-else class="h-4 w-4" aria-hidden="true" />
        </VBtn>
      </div>
    </div>

  </header>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { VAvatar } from 'vuetify/components/VAvatar';
import { VBtn } from 'vuetify/components/VBtn';
import { useAuthStore } from '../stores/authStore';
import { useChurchStore } from '../stores/churchStore';
import UserManual from './UserManual.vue';
import ThemeToggle from './ThemeToggle.vue';
// import TeacherPushSettings from './TeacherPushSettings.vue';
// import { disablePush } from '../api/pushNotifications';
import { Church, LoaderCircle, LogOut } from 'lucide-vue-next';
const auth = useAuthStore();
const church = useChurchStore();
const router = useRouter();
const yearLabel = computed(() => {
  const year = church.currentYear;
  return (auth.isAdmin && church.years.find(entry => entry.id === year)?.title) || `${year}년`;
});
const currentGroup = computed(() => church.getTeacherGroup(auth.user?.id));
const loggingOut = ref(false);

async function handleLogout() {
  if (loggingOut.value) return;
  loggingOut.value = true;
  try {
    // if (!auth.isAdmin) {
    //   const pushCleanup = disablePush().catch(() => {});
    //   await Promise.race([pushCleanup, new Promise(resolve => setTimeout(resolve, 1000))]);
    // }
    await auth.logout();
    await router.replace({ name: 'Login' });
  } catch (error) {
    console.error('Logout failed:', error);
    window.dispatchEvent(new CustomEvent('bujeon-error', {
      detail: '로그아웃을 완료하지 못했습니다. 다시 시도해 주세요.'
    }));
  } finally {
    loggingOut.value = false;
  }
}
</script>
