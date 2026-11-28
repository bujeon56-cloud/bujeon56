<template>
  <div class="attendance-day-options">
    <div class="day-button-grid" role="group" :aria-label="label">
      <button
        v-for="day in options"
        :key="day"
        type="button"
        class="min-h-10 min-w-0 touch-manipulation rounded-lg border text-xs font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500 disabled:opacity-70"
        :class="day === days ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 text-slate-600 enabled:hover:bg-blue-50'"
        :aria-pressed="day === days"
        :disabled="disabled"
        @click="selectDay(day)"
      >
        {{ day }}일
      </button>
    </div>
    <p v-if="days > maxDays" class="mt-1 text-left text-xs text-slate-500">기존 기록 {{ days }}일</p>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { checkCount } from '../utils/attendanceChecks.js';

const props = defineProps({
  value: [Boolean, Number],
  maxDays: { type: Number, required: true },
  label: { type: String, required: true },
  disabled: Boolean
});
const emit = defineEmits(['change']);

const options = computed(() => Array.from({ length: props.maxDays + 1 }, (_, day) => day));
const days = computed(() => checkCount(props.value));

function selectDay(day) {
  if (day !== days.value) emit('change', day);
}
</script>

<style scoped>
.attendance-day-options {
  container-type: inline-size;
}

.day-button-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.25rem;
}

@container (min-width: 27rem) {
  .day-button-grid {
    grid-template-columns: repeat(8, minmax(0, 1fr));
  }
}

</style>
