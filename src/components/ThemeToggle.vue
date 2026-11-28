<template>
  <VBtn
    type="button"
    aria-label="다크 모드"
    :aria-pressed="darkMode"
    :title="darkMode ? '다크 모드 끄기' : '다크 모드 켜기'"
    icon
    variant="text"
    size="44"
    class="text-slate-700"
    @click="toggleTheme"
  >
    <Sun v-if="darkMode" class="h-4 w-4" aria-hidden="true" />
    <Moon v-else class="h-4 w-4" aria-hidden="true" />
  </VBtn>
</template>

<script setup>
import { ref } from 'vue';
import { Moon, Sun } from 'lucide-vue-next';
import { VBtn } from 'vuetify/components/VBtn';
import { useTheme } from 'vuetify';

const root = document.documentElement;
const darkMode = ref(root.dataset.theme === 'dark');
const vuetifyTheme = useTheme();

function toggleTheme() {
  darkMode.value = !darkMode.value;
  const theme = darkMode.value ? 'dark' : 'light';
  root.dataset.theme = theme;
  vuetifyTheme.change(theme);
  document.querySelector('meta[name="theme-color"]').content = darkMode.value ? '#101725' : '#2563eb';
  try {
    localStorage.setItem('bujeon:theme', theme);
  } catch {
    // Theme switching still works when storage is unavailable.
  }
}
</script>
