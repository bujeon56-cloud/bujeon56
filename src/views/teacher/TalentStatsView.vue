<template>
  <section class="space-y-4 text-sm">
    <div class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 class="flex items-center gap-2 font-black text-slate-900">
        <Coins class="h-5 w-5 text-amber-500" />
        월별 달란트 통계
      </h3>
      <label v-if="group" class="flex items-center gap-2 font-bold text-slate-600">
        조회 월
        <select v-model="selectedMonth" class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
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
    <template v-else>
      <div class="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <span class="font-bold text-slate-700">우리 반 달란트 합계</span>
        <strong class="text-xl text-amber-700">{{ totalPoints }}점</strong>
      </div>

      <div class="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <p v-if="students.length === 0" class="p-4 text-center text-slate-600">등록된 학생이 없습니다.</p>
        <table v-else class="w-full whitespace-nowrap text-center text-xs sm:text-sm" aria-label="학생별 월간 달란트">
          <thead class="border-b border-slate-200 bg-slate-50 text-slate-600">
            <tr>
              <th scope="col" class="px-3 py-3 text-left">학생 이름</th>
              <th scope="col" class="px-2 py-3">출석</th>
              <th scope="col" class="px-2 py-3">성경읽기</th>
              <th scope="col" class="px-2 py-3">대표기도</th>
              <th scope="col" class="px-3 py-3">총 달란트</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="student in students" :key="student.id">
              <th scope="row" class="whitespace-normal px-3 py-3 text-left font-bold">{{ student.name }}</th>
              <td class="px-2 py-3">{{ stats[student.id]?.attendanceCount ?? 0 }}회</td>
              <td class="px-2 py-3">{{ stats[student.id]?.bibleCount ?? 0 }}회</td>
              <td class="px-2 py-3">{{ stats[student.id]?.prayerCount ?? 0 }}회</td>
              <td class="px-3 py-3 font-black text-amber-700">{{ stats[student.id]?.points ?? 0 }}점</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { Coins } from 'lucide-vue-next';
import { useAttendanceStore } from '../../stores/attendanceStore';
import { useAuthStore } from '../../stores/authStore';
import { useChurchStore } from '../../stores/churchStore';
import { seoulDate } from '../../utils/sundays.js';

const auth = useAuthStore();
const church = useChurchStore();
const attendance = useAttendanceStore();
const selectedMonth = ref(Number(seoulDate().slice(5, 7)));
const stats = ref({});
const loading = ref(false);
const loadFailed = ref(false);
const retry = ref(0);

const group = computed(() => church.getTeacherGroup(auth.user?.id));
const students = computed(() => group.value ? church.getStudentsByGroup(group.value.id) : []);
const totalPoints = computed(() => students.value.reduce((sum, student) => sum + (stats.value[student.id]?.points ?? 0), 0));

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
