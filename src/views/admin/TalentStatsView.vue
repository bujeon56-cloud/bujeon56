<template>
  <div class="space-y-5">
    <!-- Top Filter & Month Selector Bar -->
    <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold flex-shrink-0">
          <Award class="w-5 h-5" />
        </div>
        <div>
          <h3 class="font-black text-base sm:text-lg text-slate-900 tracking-tight">
            월별 목장 및 학생 달란트 합계
          </h3>
          <p class="text-xs text-slate-400">
            목장별로 펼치기/접기하여 각 반 아이들의 달란트 세부 내역을 확인하세요.
          </p>
        </div>
      </div>

      <!-- Month Selector & Excel Export -->
      <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
        <input 
          type="month" 
          v-model="selectedMonth" 
          @change="loadTalentData"
          class="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50 focus:bg-white cursor-pointer"
        />

        <button 
          @click="exportToExcel" 
          class="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-100 transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
        >
          <FileSpreadsheet class="w-4 h-4" />
          <span>엑셀 다운로드</span>
        </button>
      </div>
    </div>

    <!-- Monthly Summary Stat Cards (Clean: 1위/참여학생수 제거됨) -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <!-- Total Church Month Talents -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div>
          <div class="text-xs font-bold text-slate-400">소년부 전체 총 달란트</div>
          <div class="text-2xl sm:text-3xl font-black text-amber-500 mt-0.5">
            {{ totalMonthTalents }}<span class="text-xs font-bold text-amber-600">점</span>
          </div>
          <div class="text-[11px] text-slate-400 mt-1">
            {{ selectedMonth }} 한 달간 누적
          </div>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center font-bold flex-shrink-0">
          <Coins class="w-6 h-6" />
        </div>
      </div>

      <!-- Part 1 Talents Total -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div>
          <div class="text-xs font-bold text-slate-400">1부 목장 총 달란트</div>
          <div class="text-2xl sm:text-3xl font-black text-blue-600 mt-0.5">
            {{ part1TotalTalents }}<span class="text-xs font-bold text-blue-500">점</span>
          </div>
          <div class="text-[11px] text-slate-400 mt-1">
            14개 목장 합계
          </div>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold flex-shrink-0">
          <Award class="w-6 h-6" />
        </div>
      </div>

      <!-- Part 2 Talents Total -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div>
          <div class="text-xs font-bold text-slate-400">2부 목장 총 달란트</div>
          <div class="text-2xl sm:text-3xl font-black text-purple-600 mt-0.5">
            {{ part2TotalTalents }}<span class="text-xs font-bold text-purple-500">점</span>
          </div>
          <div class="text-[11px] text-slate-400 mt-1">
            7개 목장 합계
          </div>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold flex-shrink-0">
          <Award class="w-6 h-6" />
        </div>
      </div>
    </div>

    <!-- Group-by-Group Accordion Table (Requested: 각 목장별로 펼치기/줄이기 기능으로 아이들 달란트 확인) -->
    <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <!-- Table Header & Accordion Toggle All Buttons -->
      <div class="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div class="flex items-center gap-2">
          <h4 class="font-black text-sm sm:text-base text-slate-800">
            목장별 달란트 목록 및 아이별 상세 내역
          </h4>
          <span class="text-xs font-bold px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700">
            총 {{ church.currentGroups.length }}개 목장
          </span>
        </div>

        <!-- Expand All / Collapse All Controls -->
        <div class="flex items-center gap-2 self-end sm:self-auto">
          <button 
            @click="expandAllGroups" 
            class="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
          >
            <ChevronDown class="w-3.5 h-3.5 text-indigo-600" />
            <span>전체 펼치기</span>
          </button>
          <button 
            @click="collapseAllGroups" 
            class="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
          >
            <ChevronUp class="w-3.5 h-3.5 text-slate-500" />
            <span>전체 접기</span>
          </button>
        </div>
      </div>

      <!-- Main Accordion Table -->
      <div class="divide-y divide-slate-200">
        <div 
          v-for="g in groupRankings" 
          :key="g.id"
          class="transition"
        >
          <!-- Group Row (Clickable to Toggle) -->
          <div 
            @click="toggleGroup(g.id)"
            class="p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/90 transition select-none"
            :class="isGroupExpanded(g.id) ? 'bg-indigo-50/30' : 'bg-white'"
          >
            <!-- Left: Group Name, Badge, Teacher Name -->
            <div class="flex items-center gap-3 min-w-0">
              <button 
                type="button"
                class="w-7 h-7 rounded-lg flex items-center justify-center transition border flex-shrink-0"
                :class="isGroupExpanded(g.id) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-100 text-slate-500 border-slate-200'"
              >
                <ChevronDown v-if="!isGroupExpanded(g.id)" class="w-4 h-4" />
                <ChevronUp v-else class="w-4 h-4" />
              </button>

              <div class="min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span 
                    class="text-[10px] font-black px-1.5 py-0.5 rounded"
                    :class="g.departmentId === 'part1' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'"
                  >
                    {{ g.departmentName }}
                  </span>
                  <span class="font-black text-sm sm:text-base text-slate-900">{{ g.name }}</span>
                  <span class="text-xs font-bold text-slate-500">
                    ({{ getFormattedTeacherName(g.teacherName) }})
                  </span>
                </div>
                <div class="text-xs text-slate-400 mt-0.5">
                  소속 아이: <strong class="text-slate-700">{{ g.studentCount }}명</strong>
                </div>
              </div>
            </div>

            <!-- Right: Group Total Talent & Toggle Label -->
            <div class="flex items-center gap-3 sm:gap-4 flex-shrink-0">
              <div class="text-right">
                <div class="text-[11px] font-bold text-slate-400">목장 총 달란트</div>
                <div class="text-base sm:text-lg font-black text-amber-500 flex items-center justify-end gap-0.5">
                  <Coins class="w-4 h-4 text-amber-500" />
                  <span>{{ g.totalPoints }}점</span>
                </div>
              </div>

              <div class="hidden sm:block">
                <span class="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                  {{ isGroupExpanded(g.id) ? '접기 ▲' : '아이들 보기 ▼' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Expanded Sub-Panel: Individual Students in This Group -->
          <div 
            v-if="isGroupExpanded(g.id)" 
            class="bg-slate-50/70 border-t border-slate-100 p-3 sm:p-5 animate-scale-up"
          >
            <!-- Empty state for group with no students -->
            <div v-if="getStudentsInGroup(g.id).length === 0" class="py-6 text-center text-xs text-slate-400">
              등록된 아이가 없습니다.
            </div>

            <!-- Students Talent Sub-table -->
            <div v-else class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr class="bg-slate-100/80 text-[11px] text-slate-600 font-bold border-b border-slate-200">
                      <th class="py-2.5 px-3 text-center w-12">No</th>
                      <th class="py-2.5 px-4 min-w-[100px]">아이 이름</th>
                      <th class="py-2.5 px-3">학년</th>
                      <th class="py-2.5 px-3 text-center">출석 횟수</th>
                      <th class="py-2.5 px-3 text-center">성경읽기 횟수</th>
                      <th class="py-2.5 px-3 text-center">대표기도 횟수</th>
                      <th class="py-2.5 px-4 text-center font-black text-amber-600 w-28">총 달란트</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    <tr 
                      v-for="(s, idx) in getStudentsInGroup(g.id)" 
                      :key="s.id"
                      class="hover:bg-slate-50/80 transition"
                    >
                      <td class="py-2.5 px-3 text-center font-bold text-slate-400">
                        {{ idx + 1 }}
                      </td>
                      <td class="py-2.5 px-4 font-black text-slate-900">
                        {{ s.name }}
                      </td>
                      <td class="py-2.5 px-3 font-medium text-slate-600">
                        {{ s.grade || '-' }}
                      </td>
                      <td class="py-2.5 px-3 text-center font-bold text-emerald-600">
                        {{ s.attendanceCount }}회
                      </td>
                      <td class="py-2.5 px-3 text-center font-bold text-blue-600">
                        {{ s.bibleCount }}회
                      </td>
                      <td class="py-2.5 px-3 text-center font-bold text-purple-600">
                        {{ s.prayerCount }}회
                      </td>
                      <td class="py-2.5 px-4 text-center">
                        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-amber-50 text-amber-700 border border-amber-200">
                          <Coins class="w-3.5 h-3.5 text-amber-500" />
                          +{{ s.points }}점
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { compareGroups } from '../../utils/groupOrder.js';
import { ref, computed, onMounted } from 'vue';
import { useChurchStore } from '../../stores/churchStore';
import { useAttendanceStore } from '../../stores/attendanceStore';
import { formatTeacherName } from '../../api/storage';
import * as XLSX from 'xlsx';
import { Award, FileSpreadsheet, Coins, ChevronDown, ChevronUp } from 'lucide-vue-next';

const church = useChurchStore();
const attendanceStore = useAttendanceStore();

const currentYear = new Date().getFullYear();
const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
const selectedMonth = ref(`${currentYear}-${currentMonth}`);

const studentPointsMap = ref({});

// Accordion Expanded Groups Set
const expandedGroupIds = ref(new Set());

const isGroupExpanded = (groupId) => {
  return expandedGroupIds.value.has(groupId);
};

const toggleGroup = (groupId) => {
  if (expandedGroupIds.value.has(groupId)) {
    expandedGroupIds.value.delete(groupId);
  } else {
    expandedGroupIds.value.add(groupId);
  }
};

const expandAllGroups = () => {
  church.currentGroups.forEach(g => expandedGroupIds.value.add(g.id));
};

const collapseAllGroups = () => {
  expandedGroupIds.value.clear();
};

const getFormattedTeacherName = (name) => {
  if (!name || name === '미배정') return '미배정';
  return formatTeacherName(name);
};

const loadTalentData = async () => {
  if (!church.initialized) {
    await church.initChurchData();
  }
  studentPointsMap.value = await attendanceStore.calculateMonthlyTalents(church.currentYear, selectedMonth.value);
};

onMounted(() => {
  loadTalentData();
});

// Student Full Details List
const allStudentStats = computed(() => {
  const currentYearStudents = church.students.filter(s => s.year === church.currentYear && s.active !== false);

  return currentYearStudents.map(student => {
    const stats = studentPointsMap.value[student.id] || {
      points: 0,
      attendanceCount: 0,
      bibleCount: 0,
      prayerCount: 0
    };

    const g = church.getGroupById(student.groupId);
    const groupName = g ? `${g.departmentName} ${g.name}` : '목장';

    return {
      id: student.id,
      name: student.name,
      grade: student.grade || '',
      groupId: student.groupId,
      groupName,
      departmentId: student.departmentId,
      points: stats.points || 0,
      attendanceCount: stats.attendanceCount || 0,
      bibleCount: stats.bibleCount || 0,
      prayerCount: stats.prayerCount || 0
    };
  });
});

// Filter Students by Specific Group
const getStudentsInGroup = (groupId) => {
  return allStudentStats.value
    .filter(s => s.groupId === groupId)
    .sort((a, b) => b.points - a.points);
};

// Group Summary Rankings
const groupRankings = computed(() => {
  return church.currentGroups.map(group => {
    const studentsInGroup = getStudentsInGroup(group.id);
    const totalPoints = studentsInGroup.reduce((acc, s) => acc + s.points, 0);
    const count = studentsInGroup.length;
    const avgPoints = count > 0 ? (totalPoints / count).toFixed(1) : '0';

    return {
      ...group,
      studentCount: count,
      totalPoints,
      avgPoints
    };
  }).sort(compareGroups);
});

// Overall Stats
const totalMonthTalents = computed(() => {
  return allStudentStats.value.reduce((acc, s) => acc + s.points, 0);
});

const part1TotalTalents = computed(() => {
  return allStudentStats.value
    .filter(s => s.departmentId === 'part1')
    .reduce((acc, s) => acc + s.points, 0);
});

const part2TotalTalents = computed(() => {
  return allStudentStats.value
    .filter(s => s.departmentId === 'part2')
    .reduce((acc, s) => acc + s.points, 0);
});

// Excel Export
const exportToExcel = () => {
  try {
    const studentData = allStudentStats.value.map((s, idx) => ({
      '순번': idx + 1,
      '아이 이름': s.name,
      '학년': s.grade,
      '소속 목장': s.groupName,
      '출석 횟수': s.attendanceCount,
      '성경읽기 횟수': s.bibleCount,
      '대표기도 횟수': s.prayerCount,
      '총 달란트': s.points
    }));

    const groupData = groupRankings.value.map(g => ({
      '부서': g.departmentName,
      '목장': g.name,
      '담당 선생님': getFormattedTeacherName(g.teacherName),
      '아이 수': g.studentCount,
      '목장 총 달란트': g.totalPoints,
      '아이 1인당 평균': g.avgPoints
    }));

    const wb = XLSX.utils.book_new();
    const wsGroups = XLSX.utils.json_to_sheet(groupData);
    const wsStudents = XLSX.utils.json_to_sheet(studentData);

    XLSX.utils.book_append_sheet(wb, wsGroups, '목장별 달란트');
    XLSX.utils.book_append_sheet(wb, wsStudents, '아이별 달란트 세부');

    const fileName = `소년부_${selectedMonth.value}_달란트합계.xlsx`;
    XLSX.writeFile(wb, fileName);
  } catch (err) {
    console.error('Excel export failed:', err);
    alert('엑셀 파일 생성 중 오류가 발생했습니다.');
  }
};
</script>
