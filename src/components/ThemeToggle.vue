<template>
  <button
    type="button"
    aria-label="다크 모드"
    :aria-pressed="darkMode"
    :title="darkMode ? '다크 모드 끄기' : '다크 모드 켜기'"
    class="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-bold text-slate-700 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
    @click="toggleTheme"
  >
    <Sun v-if="darkMode" class="h-4 w-4" aria-hidden="true" />
    <Moon v-else class="h-4 w-4" aria-hidden="true" />
    <span class="hidden lg:inline">다크 모드</span>
  </button>
</template>

<script setup>
import { ref } from 'vue';
import { Moon, Sun } from 'lucide-vue-next';

const root = document.documentElement;
const darkMode = ref(root.dataset.theme === 'dark');

function toggleTheme() {
  darkMode.value = !darkMode.value;
  const theme = darkMode.value ? 'dark' : 'light';
  root.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]').content = darkMode.value ? '#101725' : '#4f46e5';
  try {
    localStorage.setItem('bujeon:theme', theme);
  } catch {
    // Theme switching still works when storage is unavailable.
  }
}
</script>
