<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
      <label class="flex items-center gap-3 text-sm font-bold">
        출석 통계 날짜
        <select v-model="attendance.selectedDate" class="rounded-lg border border-slate-200 bg-white px-2 py-1">
          <option v-for="date in availableSundays" :key="date" :value="date">{{ date }}</option>
        </select>
      </label>
      <button type="button" class="rounded-lg bg-slate-100 px-3 py-2 text-sm font-bold" @click="refresh">
        새로고침
      </button>
    </div>
    <p v-if="initializationError" role="alert" class="text-sm text-rose-700">목장 명단을 불러오지 못했습니다. 새로고침 버튼으로 다시 시도해 주세요.</p>
    <WeeklyAttendanceReport v-else-if="church.initialized" />
    <p v-else role="status" class="text-sm text-slate-600">목장 명단을 불러오는 중입니다.</p>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import WeeklyAttendanceReport from '../../components/WeeklyAttendanceReport.vue';
import { useAttendanceStore } from '../../stores/attendanceStore';
import { useChurchStore } from '../../stores/churchStore';
import { sundayForYear, sundaysInYear } from '../../utils/sundays.js';

const attendance = useAttendanceStore();
const church = useChurchStore();
const availableSundays = computed(() => sundaysInYear(church.currentYear));
const initializationError = ref(false);
const refreshCount = ref(0);

function refresh() {
  refreshCount.value++;
}

watch([() => church.currentYear, () => attendance.selectedDate, refreshCount], async (_, __, onCleanup) => {
  let cancelled = false;
  onCleanup(() => { cancelled = true; });
  initializationError.value = false;

  try {
    if (!church.initialized) await church.initChurchData();
  } catch {
    if (!cancelled) initializationError.value = true;
    return;
  }
  if (cancelled) return;

  const sunday = sundayForYear(church.currentYear, attendance.selectedDate);
  if (sunday !== attendance.selectedDate) {
    attendance.setDate(sunday);
    return;
  }
  await attendance.loadAllGroupsStatsForDate(church.currentYear, church.currentGroups);
}, { immediate: true });
</script>
