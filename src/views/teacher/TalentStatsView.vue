<template>
  <section class="space-y-5 text-sm sm:space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 class="flex items-center gap-2 font-black text-slate-900">
        <Coins class="h-5 w-5 text-amber-500" />
        월별 달란트 통계
      </h3>
      <label v-if="group" class="flex w-full min-w-0 items-center gap-2 font-bold text-slate-600 sm:w-auto">
        <span class="shrink-0">조회 월</span>
        <select v-model="selectedMonth" class="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 sm:flex-none">
          <option v-for="month in 12" :key="month" :value="month">{{ group.year }}년 {{ month }}월</option>
        </select>
      </label>
    </div>

    <p v-if="!church.initialized || loading" role="status" class="p-4 text-slate-600">달란트 통계를 불러오는 중입니다.</p>
    <p v-else-if="!group" class="p-4 text-slate-600">이 연도에 배정된 반이 없습니다.</p>
    <div v-else-if="loadFailed" class="flex flex-wrap items-center gap-3 p-4 text-rose-700">
      <p role="alert">달란트 통계를 불러오지 못했습니다.</p>
      <button type="button" class="rounded-lg border border-rose-200 px-3 py-2 font-bold" @click="retry++">다시 시도</button>
    </div>
    <p v-else-if="students.length === 0" class="rounded-2xl border border-slate-200 bg-white p-4 text-center text-slate-600">
      등록된 학생이 없습니다.
    </p>
    <ul v-else aria-label="학생별 월간 달란트" class="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      <li v-for="student in students" :key="student.id"
        class="flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
        <span class="min-w-0 break-all font-bold text-slate-900">{{ student.name }}</span>
        <strong class="shrink-0 rounded-lg bg-amber-50 px-2.5 py-1 font-black tabular-nums text-amber-800">
          {{ stats[student.id]?.points ?? 0 }}점
        </strong>
      </li>
    </ul>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { Coins } from 'lucide-vue-next';
import { useAttendanceStore } from '../../stores/attendanceStore';
import { useAuthStore } from '../../stores/authStore';
import { useChurchStore } from '../../stores/churchStore';
import { defaultMonthForYear } from '../../utils/sundays.js';

const auth = useAuthStore();
const church = useChurchStore();
const attendance = useAttendanceStore();
const monthSelection = ref(null);
const stats = ref({});
const loading = ref(false);
const loadFailed = ref(false);
const retry = ref(0);

const group = computed(() => church.getTeacherGroup(auth.user?.id));
const selectedMonth = computed({
  get() {
    const year = group.value?.year;
    if (monthSelection.value?.year === year && monthSelection.value) return monthSelection.value.month;
    return defaultMonthForYear(year);
  },
  set(month) {
    monthSelection.value = { year: group.value?.year, month };
  },
});
const students = computed(() => group.value ? church.getStudentsByGroup(group.value.id) : []);

watch([group, selectedMonth, retry], async ([currentGroup, month], _, onCleanup) => {
  let stale = false;
  onCleanup(() => { stale = true; });
  stats.value = {};
  loadFailed.value = false;
  loading.value = Boolean(currentGroup);
  if (!currentGroup) return;

  const { year, id } = currentGroup;
  const monthKey = `${year}-${String(month).padStart(2, '0')}`;
  try {
    const result = await attendance.calculateMonthlyTalents(year, monthKey, id);
    if (!stale) stats.value = result;
  } catch (error) {
    console.error('Failed to load monthly class talents:', error);
    if (!stale) loadFailed.value = true;
  } finally {
    if (!stale) loading.value = false;
  }
}, { immediate: true });
</script>
