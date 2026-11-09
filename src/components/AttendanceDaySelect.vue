<template>
  <div class="attendance-day-options">
    <div class="day-button-grid" role="group" :aria-label="label">
      <VBtn
        v-for="day in options"
        :key="day"
        type="button"
        class="day-button"
        :variant="day === days ? 'flat' : 'outlined'"
        :style="day === days ? selectedButtonStyle : undefined"
        :aria-pressed="day === days"
        :disabled="disabled"
        @click="selectDay(day)"
      >
        {{ day }}일
      </VBtn>
    </div>
    <p v-if="days > maxDays" class="mt-1 text-left text-xs text-slate-500">기존 기록 {{ days }}일</p>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { VBtn } from 'vuetify/components/VBtn';
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
const selectedButtonStyle = { backgroundColor: '#4f46e5', color: '#fff', opacity: 1 };

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

.v-btn.day-button {
  min-width: 0;
  height: 2.5rem;
  padding-inline: 0;
  border-radius: 0.5rem;
  border-color: #cbd5e1;
  color: #475569;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: normal;
}

.v-btn.day-button[aria-pressed='true'] :deep(.v-btn__overlay) {
  opacity: 0;
}

.v-btn.day-button:focus-visible {
  outline: 2px solid #6366f1;
  outline-offset: 1px;
}
</style>
