<template>
  <div class="space-y-4 pb-12 sm:pb-6" :class="{ 'text-base': isLargeFont, 'text-sm': !isLargeFont }">
    <!-- Top Utility & Mode Bar -->
    <div class="flex items-center justify-between gap-2 px-1">
      <!-- Large Font Mode Toggle (For Senior Teachers) -->
      <button 
        @click="toggleLargeFont"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition shadow-sm text-xs font-bold"
        :class="isLargeFont ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'"
        title="글씨와 버튼을 크게 보기"
      >
        <ZoomIn class="w-4 h-4" />
        <span>{{ isLargeFont ? '보통 글씨로' : '큰 글씨 모드 🔍' }}</span>
      </button>

      <!-- View Mode Toggle: Cards vs Table -->
      <div class="inline-flex rounded-xl bg-slate-200/80 p-0.5 border border-slate-200">
        <button 
          @click="viewMode = 'cards'"
          class="px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1"
          :class="viewMode === 'cards' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'"
        >
          <LayoutGrid class="w-3.5 h-3.5" />
          <span>큰 카드</span>
        </button>
        <button 
          @click="viewMode = 'table'"
          class="px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1"
          :class="viewMode === 'table' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'"
        >
          <TableIcon class="w-3.5 h-3.5" />
          <span>표로 보기</span>
        </button>
      </div>
    </div>

    <!-- Date Navigation Card (Large Touch Controls) -->
    <div class="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-sm">
      <div class="flex items-center justify-between gap-2">
        <!-- Prev Week Button -->
        <button 
          @click="changeSunday(-7)" 
          class="w-11 h-11 sm:w-10 sm:h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 transition flex items-center justify-center flex-shrink-0"
          title="지난 주"
        >
          <ChevronLeft class="w-6 h-6 sm:w-5 sm:h-5 text-slate-700" />
        </button>

        <!-- Current Date Center Display -->
        <div class="flex-1 text-center min-w-0 px-1">
          <div class="inline-flex items-center gap-1.5 bg-indigo-50/80 border border-indigo-100 px-3 py-1.5 rounded-xl">
            <Calendar class="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <input 
              type="date" 
              :value="attendanceStore.selectedDate" 
              @change="onDateSelect"
              class="font-black text-sm sm:text-base text-slate-900 bg-transparent focus:outline-none cursor-pointer tracking-tight"
            />
            <span class="text-xs font-black text-indigo-600 bg-white px-1.5 py-0.5 rounded shadow-xs">
              {{ getDayLabel(attendanceStore.selectedDate) }}
            </span>
          </div>
        </div>

        <!-- Next Week Button -->
        <button 
          @click="changeSunday(7)" 
          class="w-11 h-11 sm:w-10 sm:h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 transition flex items-center justify-center flex-shrink-0"
          title="다음 주"
        >
          <ChevronRight class="w-6 h-6 sm:w-5 sm:h-5 text-slate-700" />
        </button>
      </div>

      <!-- Realtime Status Banner -->
      <div class="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
        <!-- Status Indicator -->
        <div v-if="attendanceStore.isSubmitted" class="flex items-center gap-1.5 text-amber-700 font-bold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
          <Lock class="w-3.5 h-3.5 text-amber-600" />
          <span>제출 완료 (수정 불가)</span>
        </div>
        <div v-else class="flex items-center gap-1.5">
          <span v-if="attendanceStore.saveStatus === 'saving'" class="text-indigo-600 font-bold flex items-center gap-1">
            <span class="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping"></span>
            실시간 자동 저장 중...
          </span>
          <span v-else-if="attendanceStore.saveStatus === 'saved'" class="text-emerald-600 font-bold flex items-center gap-1">
            <CheckCircle2 class="w-4 h-4 text-emerald-500" />
            체크 즉시 저장됨
          </span>
          <span v-else class="text-slate-400 font-medium">
            체크 시 즉시 자동 저장됩니다
          </span>
        </div>

        <!-- Group Name Badge -->
        <div class="text-[11px] font-extrabold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
          {{ currentGroupName }}
        </div>
      </div>
    </div>

    <!-- Quick Stats Cards (Clean & High Legibility) -->
    <div class="grid grid-cols-2 gap-2.5">
      <!-- Total Attendance Card -->
      <div class="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div>
          <div class="text-xs font-bold text-slate-400">오늘 출석</div>
          <div class="text-2xl sm:text-3xl font-black text-emerald-600 mt-0.5">
            {{ todayAttendedCount }}<span class="text-xs sm:text-sm font-bold text-slate-400"> / {{ groupStudents.length }}명</span>
          </div>
        </div>
        <div class="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold flex-shrink-0">
          <UserCheck class="w-6 h-6" />
        </div>
      </div>

      <!-- Today Total Talents -->
      <div class="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div>
          <div class="text-xs font-bold text-slate-400">오늘 달란트 합계</div>
          <div class="text-2xl sm:text-3xl font-black text-amber-500 mt-0.5 flex items-center gap-1">
            <span>+{{ totalTodayTalents }}</span>
            <span class="text-xs sm:text-sm font-bold text-amber-600">점</span>
          </div>
        </div>
        <div class="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center font-bold flex-shrink-0">
          <Coins class="w-6 h-6" />
        </div>
      </div>
    </div>

    <!-- Quick Action Bar (Mark All) -->
    <div v-if="!attendanceStore.isReadOnly && groupStudents.length > 0" class="flex items-center gap-2">
      <button 
        @click="markAllAttendance(true)" 
        class="flex-1 py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 active:scale-[0.98] text-emerald-800 border border-emerald-200 rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-1.5 shadow-xs"
      >
        <CheckCircle2 class="w-4 h-4 text-emerald-600" />
        <span>아이들 전원 출석 체크</span>
      </button>

      <button 
        @click="markAllAttendance(false)" 
        class="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-600 rounded-xl text-xs sm:text-sm font-bold transition"
        title="출석 초기화"
      >
        초기화
      </button>
    </div>

    <!-- Empty Students State -->
    <div v-if="groupStudents.length === 0" class="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 text-center shadow-sm">
      <div class="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-3xl flex items-center justify-center mx-auto mb-3">
        <Users class="w-8 h-8" />
      </div>
      <h4 class="font-extrabold text-slate-800 text-base sm:text-lg">등록된 아이가 없습니다</h4>
      <p class="text-xs sm:text-sm text-slate-500 mt-1 mb-5">
        우리 반 아이들을 먼저 등록해주세요.<br/>선생님이 직접 등록할 수 있습니다.
      </p>
      <router-link 
        to="/teacher/students" 
        class="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-indigo-100 active:scale-95 transition"
      >
        <UserPlus class="w-5 h-5" />
        <span>우리 반 아이 등록하기</span>
      </router-link>
    </div>

    <!-- ============================================== -->
    <!-- VIEW MODE 1: MOBILE OPTIMIZED LARGE CARD VIEW  -->
    <!-- (Highly Recommended for Seniors & Smartphones) -->
    <!-- ============================================== -->
    <div v-else-if="viewMode === 'cards'" class="space-y-3">
      <div 
        v-for="(student, index) in groupStudents" 
        :key="student.id"
        class="bg-white rounded-2xl p-4 border transition shadow-xs flex flex-col gap-3"
        :class="[
          isAttended(student.id) 
            ? 'border-emerald-300 bg-gradient-to-r from-emerald-50/40 via-white to-white ring-1 ring-emerald-200' 
            : 'border-slate-200/90'
        ]"
      >
        <!-- Card Header: Student Info & Today's Talent Badge -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <!-- Student Avatar -->
            <div 
              class="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-base shadow-xs flex-shrink-0"
              :class="student.gender === '여' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'"
            >
              {{ student.name.charAt(0) }}
            </div>

            <!-- Student Name & Grade -->
            <div>
              <div class="flex items-center gap-2">
                <span class="font-black text-base sm:text-lg text-slate-900 tracking-tight">
                  {{ student.name }}
                </span>
                <span v-if="student.grade" class="text-xs font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700">
                  {{ student.grade }}
                </span>
                <span 
                  v-if="isAttended(student.id)" 
                  class="text-[11px] font-black px-2 py-0.5 rounded-md bg-emerald-500 text-white flex items-center gap-0.5 animate-scale-up"
                >
                  출석함
                </span>
              </div>
              <div v-if="student.notes" class="text-xs text-slate-500 mt-0.5 line-clamp-1">
                {{ student.notes }}
              </div>
            </div>
          </div>

          <!-- Calculated Today's Talent for this Student -->
          <div class="text-right flex-shrink-0">
            <span class="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl font-black text-xs sm:text-sm bg-amber-50 text-amber-800 border border-amber-200 shadow-xs">
              <Coins class="w-4 h-4 text-amber-500" />
              <span>+{{ getStudentTodayTalents(student.id) }}점</span>
            </span>
          </div>
        </div>

        <!-- Big Touch Toggle Buttons for All Check Items -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
          <button 
            v-for="item in church.activeCheckItems" 
            :key="item.id"
            type="button"
            :disabled="attendanceStore.isReadOnly"
            @click="handleCheckToggle(student.id, item.id)"
            class="min-h-[48px] py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm transition-all duration-150 flex items-center justify-between gap-2 border active:scale-95 disabled:active:scale-100 touch-manipulation cursor-pointer"
            :class="[
              isItemChecked(student.id, item.id)
                ? getActivePillClass(item.id)
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200/80',
              attendanceStore.isReadOnly ? 'cursor-not-allowed opacity-85' : ''
            ]"
          >
            <div class="flex items-center gap-2">
              <div 
                class="w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs"
                :class="isItemChecked(student.id, item.id) ? 'bg-white/30 text-white' : 'bg-slate-200 text-slate-400'"
              >
                <Check v-if="isItemChecked(student.id, item.id)" class="w-4 h-4" />
                <span v-else>•</span>
              </div>
              <span class="tracking-tight">{{ item.label }}</span>
            </div>

            <span 
              class="text-[11px] font-bold px-1.5 py-0.5 rounded-md"
              :class="isItemChecked(student.id, item.id) ? 'bg-white/20 text-white' : 'text-slate-400'"
            >
              +{{ item.points }}달란트
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- ============================================== -->
    <!-- VIEW MODE 2: TABLE VIEW (For Desktop/Wide screens) -->
    <!-- ============================================== -->
    <div v-else class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50/80 text-xs text-slate-600 font-bold border-b border-slate-200">
              <th class="py-3 px-3 text-center w-10">No</th>
              <th class="py-3 px-4 min-w-[110px]">이름</th>
              <th class="py-3 px-3 text-center" v-for="item in church.activeCheckItems" :key="item.id">
                <div class="flex flex-col items-center">
                  <span class="font-bold">{{ item.label }}</span>
                  <span class="text-[11px] text-amber-500 font-bold">(+{{ item.points }})</span>
                </div>
              </th>
              <th class="py-3 px-4 text-center w-24">달란트</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
            <tr 
              v-for="(student, index) in groupStudents" 
              :key="student.id"
              class="hover:bg-slate-50/80 transition"
              :class="isAttended(student.id) ? 'bg-emerald-50/20' : ''"
            >
              <td class="py-3.5 px-3 text-center font-bold text-slate-400">{{ index + 1 }}</td>
              <td class="py-3.5 px-4 font-black text-slate-900">{{ student.name }}</td>

              <td 
                v-for="item in church.activeCheckItems" 
                :key="item.id"
                class="py-3.5 px-3 text-center"
              >
                <button 
                  type="button"
                  :disabled="attendanceStore.isReadOnly"
                  @click="handleCheckToggle(student.id, item.id)"
                  class="w-10 h-10 rounded-xl inline-flex items-center justify-center transition border cursor-pointer active:scale-95 disabled:cursor-not-allowed"
                  :class="isItemChecked(student.id, item.id) ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' : 'bg-slate-100 text-slate-300 border-slate-200'"
                >
                  <Check v-if="isItemChecked(student.id, item.id)" class="w-5 h-5 stroke-[3]" />
                  <span v-else class="text-xs text-slate-300">•</span>
                </button>
              </td>

              <td class="py-3.5 px-4 text-center font-black text-amber-600">
                +{{ getStudentTodayTalents(student.id) }}점
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Notes & Submission Footer Card -->
    <div class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
      <div>
        <label class="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
          <MessageSquare class="w-4 h-4 text-indigo-600" />
          <span>오늘 목장 특이사항 / 기도제목 (선택)</span>
        </label>
        <textarea 
          v-model="submissionNotes" 
          rows="2" 
          :disabled="attendanceStore.isReadOnly"
          placeholder="아이들의 기도제목이나 심방 필요사항을 적어주시면 목사님과 서기 선생님이 확인합니다."
          class="w-full p-3 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50 focus:bg-white transition disabled:bg-slate-100 disabled:text-slate-500"
        ></textarea>
      </div>

      <!-- Submit Action Button (Large & Distinct) -->
      <div class="pt-2">
        <!-- When already submitted -->
        <div v-if="attendanceStore.isSubmitted" class="p-3.5 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-between">
          <div class="flex items-center gap-2">
            <CheckCircle class="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <div>출석부 제출이 완료되었습니다.</div>
              <div class="text-[11px] text-emerald-700 font-normal">수정이 필요하시면 서기선생님 또는 목사님께 잠금 해제를 요청하세요.</div>
            </div>
          </div>
          <span class="text-xs bg-emerald-200/60 px-2 py-1 rounded-lg font-bold flex-shrink-0">
            {{ formatSubmittedTime }} 제출됨
          </span>
        </div>

        <!-- When not yet submitted: Big High-Visibility Button -->
        <button 
          v-else
          @click="openSubmitConfirm"
          class="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 active:scale-[0.99] text-white text-sm sm:text-base font-black rounded-2xl shadow-xl shadow-indigo-200 transition duration-150 flex items-center justify-center gap-2.5 touch-manipulation cursor-pointer"
        >
          <Send class="w-5 h-5" />
          <span>오늘 출석부 최종 제출하기</span>
        </button>
      </div>
    </div>

    <!-- Submit Confirm Modal -->
    <Modal v-model="showSubmitModal" title="출석부 제출 확인">
      <div class="space-y-4 text-xs sm:text-sm text-slate-700">
        <p class="leading-relaxed">
          <strong class="text-slate-900 font-black text-base">{{ currentGroupName }}</strong>의<br/>
          <strong class="text-indigo-600 font-bold">{{ attendanceStore.selectedDate }} (주일)</strong> 출석부를 제출하시겠습니까?
        </p>

        <div class="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-800 space-y-1">
          <div class="font-black flex items-center gap-1.5 text-amber-900">
            <Lock class="w-4 h-4 text-amber-600" />
            제출 후에는 읽기 전용으로 잠깁니다
          </div>
          <div>• 제출 후 수정을 원하실 경우 목사님이나 서기 선생님에게 잠금 해제를 요청하셔야 합니다.</div>
        </div>

        <div class="p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
          <div>• 오늘 출석: <strong class="text-emerald-600 font-bold">{{ todayAttendedCount }}명</strong> / 총 {{ groupStudents.length }}명</div>
          <div>• 총 부여 달란트: <strong class="text-amber-600 font-bold">{{ totalTodayTalents }}점</strong></div>
        </div>
      </div>

      <template #footer>
        <button 
          @click="showSubmitModal = false" 
          class="px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
        >
          더 수정하기
        </button>
        <button 
          @click="executeSubmit" 
          :disabled="submitting"
          class="px-6 py-2.5 text-xs sm:text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-200 flex items-center gap-2"
        >
          <span v-if="submitting" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          <span>제출 완료하기</span>
        </button>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useAuthStore } from '../../stores/authStore';
import { useChurchStore } from '../../stores/churchStore';
import { useAttendanceStore } from '../../stores/attendanceStore';
import confetti from 'canvas-confetti';
import Modal from '../../components/Modal.vue';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  CheckCircle,
  Users,
  UserCheck,
  UserPlus,
  Coins,
  Lock,
  Send,
  Check,
  ZoomIn,
  LayoutGrid,
  Table as TableIcon,
  MessageSquare
} from 'lucide-vue-next';

const auth = useAuthStore();
const church = useChurchStore();
const attendanceStore = useAttendanceStore();

// UI Preferences (Saved in LocalStorage for teacher convenience)
const isLargeFont = ref(localStorage.getItem('bujeon_teacher_large_font') === 'true');
const viewMode = ref(localStorage.getItem('bujeon_teacher_view_mode') || 'cards'); // 'cards' | 'table'

const showSubmitModal = ref(false);
const submitting = ref(false);
const submissionNotes = ref('');

const toggleLargeFont = () => {
  isLargeFont.value = !isLargeFont.value;
  localStorage.setItem('bujeon_teacher_large_font', isLargeFont.value);
};

watch(viewMode, (newVal) => {
  localStorage.setItem('bujeon_teacher_view_mode', newVal);
});

const currentGroupId = computed(() => {
  return auth.userGroupId || 'part1_g1';
});

const currentGroupName = computed(() => {
  if (auth.user?.groupName) return auth.user.groupName;
  const g = church.getGroupById(currentGroupId.value);
  return g ? `${g.departmentName} ${g.name}` : '목장';
});

const groupStudents = computed(() => {
  return church.getStudentsByGroup(currentGroupId.value);
});

// Load attendance data
const loadData = async () => {
  if (!church.initialized) {
    await church.initChurchData();
  }
  await attendanceStore.loadGroupAttendance(church.currentYear, currentGroupId.value);
  if (attendanceStore.submission?.notes) {
    submissionNotes.value = attendanceStore.submission.notes;
  } else {
    submissionNotes.value = '';
  }
};

onMounted(() => {
  loadData();
});

watch([() => attendanceStore.selectedDate, () => currentGroupId.value, () => church.currentYear], () => {
  loadData();
});

// Helpers
const getDayLabel = (dateStr) => {
  const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  const d = new Date(dateStr);
  return days[d.getDay()] || '주일';
};

const changeSunday = (dayOffset) => {
  const d = new Date(attendanceStore.selectedDate);
  d.setDate(d.getDate() + dayOffset);
  attendanceStore.setDate(d.toISOString().split('T')[0]);
};

const onDateSelect = (e) => {
  attendanceStore.setDate(e.target.value);
};

const isItemChecked = (studentId, itemId) => {
  return !!attendanceStore.records[studentId]?.[itemId];
};

const isAttended = (studentId) => {
  return !!attendanceStore.records[studentId]?.attendance;
};

// Touch Check Toggle with Haptic Feedback
const handleCheckToggle = async (studentId, itemId) => {
  if (navigator.vibrate) {
    try { navigator.vibrate(25); } catch (e) {}
  }
  await attendanceStore.toggleCheck(church.currentYear, currentGroupId.value, studentId, itemId);
};

// Styling for Active Pill Buttons
const getActivePillClass = (itemId) => {
  if (itemId === 'attendance') return 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-200';
  if (itemId === 'bibleReading') return 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200';
  if (itemId === 'prayer') return 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-200';
  return 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-200';
};

// Mark all attended
const markAllAttendance = async (val) => {
  if (navigator.vibrate) {
    try { navigator.vibrate(40); } catch (e) {}
  }
  await attendanceStore.setAllAttendance(church.currentYear, currentGroupId.value, groupStudents.value, val);
};

// Computed statistics
const todayAttendedCount = computed(() => {
  return groupStudents.value.filter(s => isAttended(s.id)).length;
});

// Calculate talent for a single student today
const getStudentTodayTalents = (studentId) => {
  const checks = attendanceStore.records[studentId] || {};
  let sum = 0;
  church.activeCheckItems.forEach(item => {
    if (checks[item.id]) {
      sum += Number(item.points) || 0;
    }
  });
  return sum;
};

// Total talents today
const totalTodayTalents = computed(() => {
  return groupStudents.value.reduce((acc, s) => acc + getStudentTodayTalents(s.id), 0);
});

const formatSubmittedTime = computed(() => {
  if (!attendanceStore.submission?.submittedAt) return '';
  const d = new Date(attendanceStore.submission.submittedAt);
  return `${d.getHours()}시 ${d.getMinutes()}분`;
});

// Submit Attendance
const openSubmitConfirm = () => {
  showSubmitModal.value = true;
};

const executeSubmit = async () => {
  submitting.value = true;
  try {
    await attendanceStore.submitCurrentGroup(
      church.currentYear,
      currentGroupId.value,
      auth.user,
      submissionNotes.value
    );
    showSubmitModal.value = false;

    // Confetti celebration
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
    } catch (e) {}
  } catch (err) {
    alert('제출 처리 중 오류가 발생하였습니다.');
  } finally {
    submitting.value = false;
  }
};
</script>
