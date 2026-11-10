<template>
  <section class="attendance-report rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h2 class="text-lg font-black">{{ dateLabel }} 출석부 출석 통계</h2>
      <div class="screen-only flex flex-wrap gap-2">
        <button v-for="format in outputFormats" :key="format.id" type="button"
          class="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          :disabled="attendance.loading || attendance.statsError || exporting" @click="exportReport(format.id)">
          {{ format.label }}
        </button>
      </div>
    </div>
    <p v-if="exportError" role="alert" class="screen-only mb-3 text-sm text-rose-700">{{ exportError }}</p>

    <p v-if="attendance.loading" role="status" class="text-sm">출석 통계를 불러오는 중입니다.</p>
    <p v-else-if="attendance.statsError" role="alert" class="text-sm text-rose-700">출석 통계를 불러오지 못했습니다. 새로고침 버튼으로 다시 시도해 주세요.</p>
    <template v-else>
      <table class="report-table w-full table-fixed text-center text-sm" aria-label="1부와 2부 목장별 출석 통계">
        <thead><tr>
          <template v-for="part in departments" :key="part">
            <th scope="col">{{ part }}</th><th scope="col">남</th><th scope="col">여</th><th scope="col">합</th>
          </template>
        </tr></thead>
        <tbody>
          <tr v-for="(pair, index) in rowPairs" :key="index">
            <template v-for="(row, part) in pair" :key="part">
              <th scope="row">{{ row?.label }}</th>
              <td>{{ row?.hasMale ? row.male : '' }}</td><td>{{ row?.hasFemale ? row.female : '' }}</td>
              <td class="font-bold">{{ row?.total }}</td>
            </template>
          </tr>
        </tbody>
        <tfoot><tr>
          <template v-for="(part, index) in parts" :key="index">
            <th scope="row">총계</th><td>{{ part.totals.male }}</td><td>{{ part.totals.female }}</td><td>{{ part.totals.total }}</td>
          </template>
        </tr></tfoot>
      </table>

      <div class="report-summary mt-3 grid items-start gap-3">
        <table class="report-table w-full table-fixed text-sm" aria-label="등반 및 새친구 기록">
          <thead><tr><th v-for="part in departments" :key="part" scope="colgroup" colspan="2">{{ part }}</th></tr></thead>
          <tbody>
            <tr v-for="(field, row) in noteLabels" :key="field">
              <template v-for="(part, column) in departments" :key="part">
                <th scope="row" class="text-center"><span class="sr-only">{{ part }} </span>{{ field }}</th>
                <td>
                  <p v-if="milestoneNames[column][row]" class="mb-1 break-words font-medium">{{ milestoneNames[column][row] }}</p>
                  <textarea :aria-label="`${part} ${field}`" :value="notes[row * 2 + column]" rows="1"
                    class="screen-only block w-full resize-y rounded border border-slate-200 px-1.5 py-1 text-sm"
                    @input="updateNote(row * 2 + column, $event.target.value)" />
                  <span class="print-only whitespace-pre-wrap break-words">{{ notes[row * 2 + column] }}</span>
                </td>
              </template>
            </tr>
          </tbody>
        </table>
        <table class="report-table w-full table-fixed text-center text-sm" aria-label="전체 출석 합계">
          <thead><tr><th scope="col">남</th><th scope="col">여</th><th scope="col">합</th></tr></thead>
          <tbody><tr class="font-black"><td>{{ totals.male }}</td><td>{{ totals.female }}</td><td>{{ totals.total }}</td></tr></tbody>
        </table>
      </div>

      <p v-if="unclassifiedCount" class="mt-2 text-xs text-amber-800">성별 미등록 {{ unclassifiedCount }}명은 합계에 포함됩니다.</p>
      <p class="screen-only mt-2 text-xs text-slate-500">새친구의 첫 출석, 4회, 8회 기록이 자동 표시됩니다. 추가 입력은 이 브라우저 탭에서 날짜별로 유지됩니다.</p>
    </template>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useAttendanceStore } from '../stores/attendanceStore';
import { useAuthStore } from '../stores/authStore';
import { useChurchStore } from '../stores/churchStore';
import { attendanceReportPart } from '../utils/attendanceReport.js';
import { attendanceExportSheet, writeAttendanceExcel } from '../utils/attendanceReportExport.js';
import { newcomerWeeks } from '../utils/newcomers.js';

const attendance = useAttendanceStore();
const auth = useAuthStore();
const church = useChurchStore();
const departments = ['1부', '2부'];
const noteLabels = ['4주 등반', '8주 등반', '새친구'];
const notes = ref([]);
const exporting = ref(false);
const exportError = ref('');
const outputFormats = [
  { id: 'pdf', label: 'PDF 출력' },
  { id: 'excel', label: 'Excel 출력' },
  { id: 'hwp', label: 'HWP 출력' }
];
const noteKey = computed(() => `bujeon:attendance-report:${auth.user?.id}:${attendance.selectedDate}`);
const dateLabel = computed(() => attendance.selectedDate.slice(5).replace('-', '/'));
const parts = computed(() => [church.part1Groups, church.part2Groups].map(groups =>
  attendanceReportPart(groups, attendance.allDateAttendances, church.getAttendanceStatsStudentsByGroup, attendance.selectedDate)
));
const milestoneNames = computed(() => [church.part1Groups, church.part2Groups].map(groups => {
  const names = [[], [], []];
  for (const group of groups) {
    for (const student of church.getNewcomersByGroup(group.id)) {
      const week = newcomerWeeks(student).indexOf(attendance.selectedDate) + 1;
      const row = [4, 8, 1].indexOf(week);
      if (row !== -1) names[row].push(student.name);
    }
  }
  return names.map(list => list.join(', '));
}));
const rowPairs = computed(() => Array.from({ length: Math.max(...parts.value.map(part => part.rows.length)) },
  (_, index) => parts.value.map(part => part.rows[index])
));
const totals = computed(() => {
  const [first, second] = parts.value.map(part => part.totals);
  return { male: first.male + second.male, female: first.female + second.female, total: first.total + second.total };
});
const unclassifiedCount = computed(() => totals.value.total - totals.value.male - totals.value.female);

watch(noteKey, key => {
  exportError.value = '';
  notes.value = [];
  try {
    const stored = JSON.parse(sessionStorage.getItem(key));
    if (Array.isArray(stored)) notes.value = stored;
  } catch {
    // The report remains editable when browser storage is unavailable.
  }
}, { immediate: true, flush: 'sync' });

function updateNote(index, value) {
  notes.value[index] = value;
  try {
    sessionStorage.setItem(noteKey.value, JSON.stringify(notes.value));
  } catch {
    // Keep the current draft available for printing.
  }
}

async function exportReport(format) {
  exportError.value = '';
  if (format === 'pdf') {
    window.print();
    return;
  }

  const filename = `${attendance.selectedDate}_출석통계`;
  const sheet = attendanceExportSheet({
    title: `${dateLabel.value} 출석부 출석 통계`, rowPairs: rowPairs.value, parts: parts.value,
    totals: totals.value, noteLabels, milestoneNames: milestoneNames.value, notes: notes.value,
    unclassifiedCount: unclassifiedCount.value
  });
  exporting.value = true;
  try {
    const XLSX = await import('xlsx');
    if (format === 'excel') {
      writeAttendanceExcel(XLSX, sheet, filename);
    } else {
      const { createAttendanceHwp } = await import('../utils/attendanceHwp.js');
      const data = createAttendanceHwp(XLSX.CFB, sheet);
      const url = URL.createObjectURL(new Blob([data], { type: 'application/x-hwp' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.hwp`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  } catch (error) {
    console.error('Attendance report export failed:', error);
    exportError.value = '출력 파일을 만들지 못했습니다. 다시 시도해 주세요.';
  } finally {
    exporting.value = false;
  }
}
</script>

<style scoped>
.report-table :is(th, td) { border: 1px solid #cbd5e1; padding: 0.3rem; }
.report-table :is(thead, tfoot) { background: #f1f5f9; font-weight: 700; }
.report-table :is(th, td):nth-child(5) { border-left: 2px solid #94a3b8; }
.report-summary { grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); }
.print-only { display: none; }

@media (max-width: 520px) {
  .report-summary { grid-template-columns: minmax(0, 1fr); }
}

@media print {
  :global(#app:has(.attendance-report) *:not(.attendance-report, .attendance-report *, :has(.attendance-report))) { display: none !important; }
  :global(#app:has(.attendance-report) :has(.attendance-report)) { min-height: 0; padding: 0; }
  .attendance-report { border: 0; margin: 0 !important; padding: 0; color: black; }
  .attendance-report h2 { width: 100%; text-align: center; }
  .report-table :is(th, td) { border-color: black; padding: 0.22rem; }
  .report-table tr { break-inside: avoid; }
  .report-summary { grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); break-inside: avoid; }
  .screen-only { display: none !important; }
  .print-only { display: inline; }
}
</style>
