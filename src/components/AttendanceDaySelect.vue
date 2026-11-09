<template>
  <div class="attendance-day-options">
    <VRadioGroup
      v-model="days"
      :aria-label="label"
      :disabled="disabled"
      color="#4f46e5"
      density="compact"
      hide-details
      inline
    >
      <VRadio v-for="day in options" :key="day" :label="`${day}일`" :value="day" />
    </VRadioGroup>
    <p v-if="days > maxDays" class="mt-1 text-left text-xs text-slate-500">기존 기록 {{ days }}일</p>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { VRadio } from 'vuetify/components/VRadio';
import { VRadioGroup } from 'vuetify/components/VRadioGroup';
import { checkCount } from '../utils/attendanceChecks.js';

const props = defineProps({
  value: [Boolean, Number],
  maxDays: { type: Number, required: true },
  label: { type: String, required: true },
  disabled: Boolean
});
const emit = defineEmits(['change']);

const options = computed(() => Array.from({ length: props.maxDays + 1 }, (_, day) => day));
const days = computed({
  get: () => checkCount(props.value),
  set: value => emit('change', value)
});
</script>

<style scoped>
.attendance-day-options {
  container-type: inline-size;
}

.attendance-day-options :deep(.v-selection-control-group) {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.125rem;
}

@container (min-width: 27rem) {
  .attendance-day-options :deep(.v-selection-control-group) {
    grid-template-columns: repeat(8, minmax(0, 1fr));
  }
}

.attendance-day-options :deep(.v-selection-control) {
  grid-area: auto;
  min-height: 2.25rem;
  border-radius: 0.5rem;
  text-align: left;
}

.attendance-day-options :deep(.v-selection-control--dirty) {
  color: #3730a3;
  background-color: #eef2ff;
}

.attendance-day-options :deep(.v-selection-control--disabled) {
  opacity: 0.6;
}

.attendance-day-options :deep(.v-selection-control--focus-visible) {
  outline: 2px solid #6366f1;
  outline-offset: -2px;
}

.attendance-day-options :deep(.v-label) {
  align-self: stretch;
  font-size: 0.75rem;
  font-weight: 700;
  white-space: nowrap;
  flex: 1;
}
</style>
