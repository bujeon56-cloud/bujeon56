<template>
  <div class="space-y-5">
    <!-- Top Filter Bar: Date & Part Filter -->
    <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
      <!-- Sunday Date Picker & Prev/Next -->
      <div class="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
        <button
          @click="changeSunday(-7)"
          :disabled="sundayIndex <= 0"
          class="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
          title="이전 주"
        >
          <ChevronLeft class="w-4 h-4" />
        </button>

        <div class="flex items-center gap-2">
          <Calendar class="w-4 h-4 text-indigo-600" />
          <select aria-label="출석 통계 일요일 선택" :value="attendanceStore.selectedDate" @change="onDateSelect" class="font-bold text-sm text-slate-800 bg-transparent focus:outline-none cursor-pointer">
            <option v-for="date in availableSundays" :key="date" :value="date">{{ date }}</option>
          </select>
          <span class="text-xs text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-md">
            {{ getDayLabel(attendanceStore.selectedDate) }}
          </span>
        </div>

        <button
          @click="changeSunday(7)"
          :disabled="sundayIndex >= availableSundays.length - 1"
          class="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
          title="다음 주"
        >
          <ChevronRight class="w-4 h-4" />
        </button>
      </div>

      <!-- Department Filter Buttons -->
      <div class="flex items-center gap-1.5 w-full sm:w-auto justify-end">
        <button
          @click="selectedDept = 'all'"
          class="px-3 py-1.5 rounded-xl text-xs font-bold transition"
          :class="selectedDept === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
        >
          전체 (1부+2부)
        </button>
        <button
          @click="selectedDept = 'part1'"
          class="px-3 py-1.5 rounded-xl text-xs font-bold transition"
          :class="selectedDept === 'part1' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
        >
          1부 ({{ church.part1Groups.length }}목장)
        </button>
        <button
          @click="selectedDept = 'part2'"
          class="px-3 py-1.5 rounded-xl text-xs font-bold transition"
          :class="selectedDept === 'part2' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
        >
          2부 ({{ church.part2Groups.length }}목장)
        </button>
      </div>
    </div>

    <!-- Church Overall Stats Summary Grid -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <!-- Total Attendance Card -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between col-span-2 sm:col-span-1 lg:col-span-1">
        <div>
          <div class="text-xs font-bold text-slate-400">전체 출석 인원</div>
          <div class="text-2xl font-black text-indigo-600 mt-0.5">
            {{ totalAttended }}<span class="text-xs font-bold text-slate-500"> / {{ totalStudents }}명</span>
          </div>
          <div class="text-[11px] font-medium text-slate-400 mt-1">
            출석률 <strong class="text-slate-800">{{ overallRate }}%</strong>
          </div>
        </div>
        <div class="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold flex-shrink-0">
          <UserCheck class="w-5 h-5" />
        </div>
      </div>

      <!-- Part 1 Attendance Card -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div>
          <div class="text-xs font-bold text-slate-400">1부 출석 인원</div>
          <div class="text-2xl font-black text-blue-600 mt-0.5">
            {{ part1Attended }}<span class="text-xs font-bold text-slate-500"> / {{ part1Total }}명</span>
          </div>
          <div class="text-[11px] font-medium text-slate-400 mt-1">
            출석률 <strong class="text-slate-800">{{ part1Rate }}%</strong> ({{ church.part1Groups.length }}개 목장)
          </div>
        </div>
        <div class="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold flex-shrink-0">
          <Church class="w-5 h-5" />
        </div>
      </div>

      <!-- Part 2 Attendance Card -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div>
          <div class="text-xs font-bold text-slate-400">2부 출석 인원</div>
          <div class="text-2xl font-black text-purple-600 mt-0.5">
            {{ part2Attended }}<span class="text-xs font-bold text-slate-500"> / {{ part2Total }}명</span>
          </div>
          <div class="text-[11px] font-medium text-slate-400 mt-1">
            출석률 <strong class="text-slate-800">{{ part2Rate }}%</strong> ({{ church.part2Groups.length }}개 목장)
          </div>
        </div>
        <div class="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold flex-shrink-0">
          <Church class="w-5 h-5" />
        </div>
      </div>

      <!-- Part 1 & 2 Submission Status Card (Separated by Department) -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between col-span-2 sm:col-span-1 lg:col-span-1">
        <div>
          <div class="text-xs font-bold text-slate-400">전체 제출 현황</div>
          <div class="text-2xl font-black text-emerald-600 mt-0.5">
            {{ submittedGroupCount }}<span class="text-xs font-bold text-slate-500"> / {{ displayGroups.length }}목장</span>
          </div>
          <div class="text-[11px] font-medium text-slate-400 mt-1">
            전체 제출률 <strong class="text-slate-800">{{ submissionRate }}%</strong>
          </div>
        </div>
        <div class="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold flex-shrink-0">
          <CheckCircle2 class="w-5 h-5" />
        </div>
      </div>
    </div>

    <!-- Department-Specific Submission Status Cards (Requested: 각 부서별로 나오도록) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <!-- 1부 제출 현황 Card -->
      <div class="bg-gradient-to-r from-blue-50/70 via-white to-white p-4 sm:p-5 rounded-2xl border border-blue-200/80 shadow-xs flex items-center justify-between">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 text-[10px] font-black rounded-md bg-blue-600 text-white">
              소년부 1부
            </span>
            <span class="text-xs font-black text-slate-700">출석부 제출 현황</span>
          </div>
          <div class="text-2xl sm:text-3xl font-black text-blue-700">
            {{ part1SubmittedCount }}<span class="text-sm font-bold text-slate-400"> / {{ church.part1Groups.length }}개 목장 제출됨</span>
          </div>
          <div class="text-xs text-slate-500">
            1부 제출률 <strong class="text-blue-700 font-bold">{{ part1SubmissionRate }}%</strong>
            <span class="text-slate-400 ml-1">({{ church.part1Groups.length - part1SubmittedCount }}개 목장 미제출)</span>
          </div>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-black flex-shrink-0">
          <CheckCircle2 class="w-6 h-6" />
        </div>
      </div>

      <!-- 2부 제출 현황 Card -->
      <div class="bg-gradient-to-r from-purple-50/70 via-white to-white p-4 sm:p-5 rounded-2xl border border-purple-200/80 shadow-xs flex items-center justify-between">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 text-[10px] font-black rounded-md bg-purple-600 text-white">
              소년부 2부
            </span>
            <span class="text-xs font-black text-slate-700">출석부 제출 현황</span>
          </div>
          <div class="text-2xl sm:text-3xl font-black text-purple-700">
            {{ part2SubmittedCount }}<span class="text-sm font-bold text-slate-400"> / {{ church.part2Groups.length }}개 목장 제출됨</span>
          </div>
          <div class="text-xs text-slate-500">
            2부 제출률 <strong class="text-purple-700 font-bold">{{ part2SubmissionRate }}%</strong>
            <span class="text-slate-400 ml-1">({{ church.part2Groups.length - part2SubmittedCount }}개 목장 미제출)</span>
          </div>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center font-black flex-shrink-0">
          <CheckCircle2 class="w-6 h-6" />
        </div>
      </div>
    </div>

    <!-- Group-by-Group Attendance Statistics Table -->
    <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div class="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div class="font-extrabold text-sm text-slate-800 flex items-center gap-2">
          <span>각 목장별 출석 및 체크 항목 현황</span>
          <span class="text-xs font-normal text-slate-400">({{ displayGroups.length }}개 목장)</span>
        </div>

        <button
          @click="refreshStats"
          class="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
          title="새로고침"
        >
          <RotateCw class="w-4 h-4" />
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50/70 text-[11px] text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <th class="py-3 px-4 min-w-[120px]">목장 (반)</th>
              <th class="py-3 px-3">담당 선생님</th>
              <th class="py-3 px-3 text-center">총원</th>
              <th class="py-3 px-3 text-center">출석 인원</th>
              <th class="py-3 px-3 min-w-[140px]">출석률</th>
              <!-- Dynamic Check Items columns -->
              <th
                v-for="item in dynamicCheckItems"
                :key="item.id"
                class="py-3 px-3 text-center"
              >
                {{ item.label }}
              </th>
              <th class="py-3 px-4 text-center">제출(마감) 상태</th>
              <th class="py-3 px-3 text-center w-24">관리</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-xs text-slate-700">
            <tr
              v-for="g in displayGroups"
              :key="g.id"
              class="hover:bg-slate-50/70 transition"
            >
              <!-- Group Name & Department Badge -->
              <td class="py-3.5 px-4">
                <div class="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <span
                    class="text-[10px] font-bold px-1.5 py-0.5 rounded"
                    :class="g.departmentId === 'part1' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'"
                  >
                    {{ g.departmentName }}
                  </span>
                  <span>{{ g.name }}</span>
                </div>
              </td>

              <!-- Teacher Name -->
              <td class="py-3.5 px-3">
                <span class="font-bold text-slate-800">{{ getFormattedTeacherName(g.teacherName) }}</span>
              </td>

              <!-- Students Total -->
              <td class="py-3.5 px-3 text-center font-bold text-slate-700">
                {{ getGroupTotalCount(g.id) }}명
              </td>

              <!-- Attended Count -->
              <td class="py-3.5 px-3 text-center">
                <span class="font-extrabold text-sm text-indigo-600">
                  {{ getGroupAttendedCount(g.id) }}
                </span>
                <span class="text-slate-400 text-[11px]">명</span>
              </td>

              <!-- Rate Progress Bar -->
              <td class="py-3.5 px-3">
                <div class="flex items-center gap-2">
                  <div class="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all duration-300"
                      :class="getGroupRate(g.id) >= 70 ? 'bg-emerald-500' : (getGroupRate(g.id) >= 40 ? 'bg-indigo-500' : 'bg-amber-400')"
                      :style="{ width: getGroupRate(g.id) + '%' }"
                    ></div>
                  </div>
                  <span class="font-bold text-xs w-9 text-right text-slate-700">
                    {{ getGroupRate(g.id) }}%
                  </span>
                </div>
              </td>

              <!-- Dynamic Check Items counts -->
              <td
                v-for="item in dynamicCheckItems"
                :key="item.id"
                class="py-3.5 px-3 text-center font-semibold text-slate-600"
              >
                {{ getGroupItemCheckCount(g.id, item.id) }}명
              </td>

              <!-- Submission Status -->
              <td class="py-3.5 px-4 text-center">
                <span
                  v-if="isGroupSubmitted(g.id)"
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"
                >
                  <CheckCircle class="w-3.5 h-3.5 text-emerald-600" />
                  제출 완료
                </span>
                <span
                  v-else
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-500"
                >
                  <Clock class="w-3.5 h-3.5" />
                  미제출
                </span>
              </td>

              <!-- Admin Action Buttons (Inspect & Unlock) -->
              <td class="py-3.5 px-3 text-center">
                <div class="flex items-center justify-center gap-1">
                  <!-- Unlock button if submitted -->
                  <button
                    v-if="isGroupSubmitted(g.id)"
                    @click="unlockGroupAttendance(g)"
                    class="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                    title="마감 잠금 해제 (수정 허용)"
                  >
                    <Unlock class="w-3.5 h-3.5" />
                  </button>

                  <!-- View/Edit Attendance Modal -->
                  <button
                    @click="openInspectModal(g)"
                    class="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                    title="상세 출석부 확인"
                  >
                    <Eye class="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Admin Inspect Attendance Modal -->
    <Modal v-model="showInspectModal" :title="inspectingGroup ? `${inspectingGroup.departmentName} ${inspectingGroup.name} 출석부 상세` : ''">
      <div v-if="inspectingGroup" class="space-y-4">
        <div class="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
          <div>담당: <strong class="text-slate-800">{{ getFormattedTeacherName(inspectingGroup.teacherName) }}</strong></div>
          <div>기준 일자: <strong class="text-indigo-600">{{ attendanceStore.selectedDate }}</strong></div>
        </div>

        <!-- Student Attendance Detail Table -->
        <div class="max-h-80 overflow-y-auto">
          <table class="w-full text-xs">
            <thead>
              <tr class="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <th class="py-2 px-3 text-left">이름</th>
                <th v-for="item in church.activeCheckItems" :key="item.id" class="py-2 px-2 text-center">
                  {{ item.label }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="s in inspectingStudents" :key="s.id">
                <td class="py-2.5 px-3 font-bold text-slate-800">{{ s.name }}</td>
                <td v-for="item in church.activeCheckItems" :key="item.id" class="py-2.5 px-2 text-center">
                  <span
                    class="inline-block w-5 h-5 rounded-md text-center leading-5 font-bold text-xs"
                    :class="inspectingRecords[s.id]?.[item.id] ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-300'"
                  >
                    {{ inspectingRecords[s.id]?.[item.id] ? '✓' : '-' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="inspectingSubmission?.notes" class="p-3 bg-slate-50 rounded-xl text-xs text-slate-600">
          <span class="font-bold text-indigo-600">선생님 메모/기도제목: </span>
          <span>{{ inspectingSubmission.notes }}</span>
        </div>
      </div>

      <template #footer>
        <button
          v-if="inspectingGroup && isGroupSubmitted(inspectingGroup.id)"
          @click="unlockGroupAttendance(inspectingGroup)"
          class="px-3.5 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-200 mr-auto flex items-center gap-1 cursor-pointer"
        >
          <Unlock class="w-3.5 h-3.5" />
          <span>마감 잠금 해제</span>
        </button>
        <button
          @click="showInspectModal = false"
          class="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
        >
          닫기
        </button>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useChurchStore } from '../../stores/churchStore';
import { useAttendanceStore } from '../../stores/attendanceStore';
import { formatTeacherName } from '../../api/storage';
import Modal from '../../components/Modal.vue';
import { sundaysInYear, sundayForYear, isSunday } from '../../utils/sundays.js';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Church,
  CheckCircle2,
  CheckCircle,
  Clock,
  RotateCw,
  Unlock,
  Eye
} from 'lucide-vue-next';

const church = useChurchStore();
const attendanceStore = useAttendanceStore();

const availableSundays = computed(() => sundaysInYear(church.currentYear));
const sundayIndex = computed(() => availableSundays.value.indexOf(attendanceStore.selectedDate));
const selectedDept = ref('all'); // 'all', 'part1', 'part2'
const showInspectModal = ref(false);
const inspectingGroup = ref(null);
const inspectingRecords = ref({});
const inspectingSubmission = ref(null);

const getFormattedTeacherName = (name) => {
  if (!name || name === '미배정') return '미배정';
  return formatTeacherName(name);
};

const dynamicCheckItems = computed(() => {
  return church.activeCheckItems.filter(item => item.id !== 'attendance');
});

const displayGroups = computed(() => {
  if (selectedDept.value === 'part1') return church.part1Groups;
  if (selectedDept.value === 'part2') return church.part2Groups;
  return church.currentGroups;
});

const loadStats = async () => {
  if (!church.initialized) {
    await church.initChurchData();
  }
  const sunday = sundayForYear(church.currentYear, attendanceStore.selectedDate);
  if (sunday !== attendanceStore.selectedDate) { attendanceStore.setDate(sunday); return; }
  await attendanceStore.loadAllGroupsStatsForDate(church.currentYear, church.currentGroups);
};

watch([() => attendanceStore.selectedDate, () => church.currentYear], () => loadStats(), { immediate: true });

const refreshStats = () => loadStats();

const getDayLabel = () => '일요일';

const changeSunday = dayOffset => {
  const next = availableSundays.value[sundayIndex.value + (dayOffset < 0 ? -1 : 1)];
  if (next) attendanceStore.setDate(next);
};

const onDateSelect = event => {
  const value = event.target.value;
  if (isSunday(value) && availableSundays.value.includes(value)) attendanceStore.setDate(value);
  else event.target.value = attendanceStore.selectedDate;
};

// Group Calculation Helpers
const getGroupStudents = (groupId) => {
  return church.getStudentsByGroup(groupId);
};

const getGroupTotalCount = (groupId) => {
  return getGroupStudents(groupId).length;
};

const getGroupAttendedCount = (groupId) => {
  const records = attendanceStore.allDateAttendances[groupId] || {};
  const students = getGroupStudents(groupId);
  return students.filter(s => records[s.id]?.attendance).length;
};

const getGroupRate = (groupId) => {
  const total = getGroupTotalCount(groupId);
  if (total === 0) return 0;
  return Math.round((getGroupAttendedCount(groupId) / total) * 100);
};

const getGroupItemCheckCount = (groupId, itemId) => {
  const records = attendanceStore.allDateAttendances[groupId] || {};
  const students = getGroupStudents(groupId);
  return students.filter(s => records[s.id]?.[itemId]).length;
};

const isGroupSubmitted = (groupId) => {
  return !!attendanceStore.allDateSubmissions[groupId]?.submitted;
};

// Overall Church Summaries
const totalStudents = computed(() => {
  return displayGroups.value.reduce((acc, g) => acc + getGroupTotalCount(g.id), 0);
});

const totalAttended = computed(() => {
  return displayGroups.value.reduce((acc, g) => acc + getGroupAttendedCount(g.id), 0);
});

const overallRate = computed(() => {
  if (totalStudents.value === 0) return 0;
  return Math.round((totalAttended.value / totalStudents.value) * 100);
});

// Part 1 Summaries
const part1Total = computed(() => {
  return church.part1Groups.reduce((acc, g) => acc + getGroupTotalCount(g.id), 0);
});

const part1Attended = computed(() => {
  return church.part1Groups.reduce((acc, g) => acc + getGroupAttendedCount(g.id), 0);
});

const part1Rate = computed(() => {
  if (part1Total.value === 0) return 0;
  return Math.round((part1Attended.value / part1Total.value) * 100);
});

// Part 2 Summaries
const part2Total = computed(() => {
  return church.part2Groups.reduce((acc, g) => acc + getGroupTotalCount(g.id), 0);
});

const part2Attended = computed(() => {
  return church.part2Groups.reduce((acc, g) => acc + getGroupAttendedCount(g.id), 0);
});

const part2Rate = computed(() => {
  if (part2Total.value === 0) return 0;
  return Math.round((part2Attended.value / part2Total.value) * 100);
});

// Submission Summaries
const submittedGroupCount = computed(() => {
  return displayGroups.value.filter(g => isGroupSubmitted(g.id)).length;
});

const submissionRate = computed(() => {
  if (displayGroups.value.length === 0) return 0;
  return Math.round((submittedGroupCount.value / displayGroups.value.length) * 100);
});

// Part 1 & Part 2 Submissions (Requested: 각 부서별로 나오도록)
const part1SubmittedCount = computed(() => {
  return church.part1Groups.filter(g => isGroupSubmitted(g.id)).length;
});

const part1SubmissionRate = computed(() => {
  if (church.part1Groups.length === 0) return 0;
  return Math.round((part1SubmittedCount.value / church.part1Groups.length) * 100);
});

const part2SubmittedCount = computed(() => {
  return church.part2Groups.filter(g => isGroupSubmitted(g.id)).length;
});

const part2SubmissionRate = computed(() => {
  if (church.part2Groups.length === 0) return 0;
  return Math.round((part2SubmittedCount.value / church.part2Groups.length) * 100);
});

// Unlock Group Attendance
const unlockGroupAttendance = async (group) => {
  if (confirm(`'${group.departmentName} ${group.name}'의 출석 마감을 해제하시겠습니까? 선생님이 다시 수정할 수 있게 됩니다.`)) {
    await attendanceStore.unlockGroup(church.currentYear, group.id);
    await refreshStats();
    if (showInspectModal.value) {
      showInspectModal.value = false;
    }
  }
};

// Inspect Modal
const openInspectModal = async (group) => {
  inspectingGroup.value = group;
  inspectingRecords.value = attendanceStore.allDateAttendances[group.id] || {};
  inspectingSubmission.value = attendanceStore.allDateSubmissions[group.id] || null;
  showInspectModal.value = true;
};

const inspectingStudents = computed(() => {
  if (!inspectingGroup.value) return [];
  return church.getStudentsByGroup(inspectingGroup.value.id);
});
</script>
