<template>
  <div class="space-y-6">
    <h2 class="text-xl font-black text-slate-900">설정</h2>
    <!-- Section 1: Dynamic Check Items & Talent Points Configuration -->
    <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div class="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <h3 class="font-extrabold text-base text-slate-900 flex items-center gap-2">
            <Sliders class="w-5 h-5 text-indigo-600" />
            <span>출석부 체크 항목 및 달란트 점수 설정</span>
          </h3>
          <p class="text-xs text-slate-500 mt-1">
            항목마다 체크박스 또는 주간 일수 선택을 설정하고 달란트 점수를 정할 수 있습니다.
          </p>
        </div>

        <button 
          @click="openAddCheckItemModal" 
          class="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-100 transition flex items-center gap-1.5 flex-shrink-0"
        >
          <Plus class="w-4 h-4" />
          <span>새 체크 항목 추가</span>
        </button>
      </div>

      <!-- Check Items List -->
      <div class="divide-y divide-slate-100">
        <div 
          v-for="item in church.checkItems" 
          :key="item.id"
          class="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition"
        >
          <div class="flex items-center gap-3">
            <div 
              class="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shadow-sm"
              :class="getItemColorClass(item)"
            >
              <CheckSquare class="w-5 h-5" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-extrabold text-sm text-slate-900">{{ item.label }}</span>
                <span v-if="item.isDefault" class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  기본 필수
                </span>
                <span v-else class="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                  커스텀 항목
                </span>
              </div>
              <div class="text-xs text-slate-400 mt-0.5">
                {{ checkItemMaxDays(item) ? `0~${checkItemMaxDays(item)}일 선택 · 1일당` : '체크 1회당' }}
                <strong class="text-amber-500 font-bold">{{ item.points }} 달란트</strong>
              </div>
            </div>
          </div>

          <!-- Points Editor & Actions -->
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl">
              <Coins class="w-3.5 h-3.5 text-amber-500" />
              <span class="text-xs font-bold text-slate-700">달란트:</span>
              <input 
                type="number" 
                min="0" 
                :value="item.points" 
                @change="updateItemPoints(item, $event.target.value)"
                class="w-14 text-center font-extrabold text-xs bg-white border border-slate-200 rounded-lg py-0.5 text-indigo-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <span class="text-xs text-slate-500 font-medium">점</span>
            </div>

            <div class="flex items-center gap-1">
              <button 
                @click="openEditCheckItemModal(item)" 
                class="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
                title="수정"
              >
                <Edit2 class="w-4 h-4" />
              </button>
              <button 
                v-if="!item.isDefault"
                @click="confirmDeleteCheckItem(item)" 
                class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                title="삭제"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 2: Year Management (매년 새로 만들어짐) -->
    <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div class="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <h3 class="font-extrabold text-base text-slate-900 flex items-center gap-2">
            <Calendar class="w-5 h-5 text-indigo-600" />
            <span>연도별 출석부 관리 (매년 새로 생성)</span>
          </h3>
          <p class="text-xs text-slate-500 mt-1">
            새로운 해가 시작될 때 새 연도를 개설하고 목장 및 출석부를 연도별로 독립적으로 관리합니다.
          </p>
          <p class="text-xs text-slate-500 mt-1">연결된 데이터가 없는 연도만 삭제할 수 있으며, 최소 한 연도를 유지해야 합니다.</p>
          <p class="text-xs text-slate-500 mt-1">연도 전환으로 지정한 활성 연도는 반 계정이 다시 로그인할 때 적용됩니다.</p>
        </div>

        <button 
          @click="openAddYearModal"
          :disabled="deletingYear || !!switchingYear"
          class="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-100 transition flex items-center gap-1.5 flex-shrink-0"
        >
          <Plus class="w-4 h-4" />
          <span>새 연도 개설</span>
        </button>
      </div>

      <div class="p-5">
        <p v-if="yearSwitchNotice" role="status" class="mb-3 text-sm text-emerald-700">{{ yearSwitchNotice }}</p>
        <p v-if="yearSwitchError" role="alert" class="mb-3 text-sm text-rose-700">{{ yearSwitchError }}</p>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div 
            v-for="y in church.years" 
            :key="y.id"
            class="p-4 rounded-2xl border transition flex items-center justify-between"
            :class="church.currentYear === y.id ? 'border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-200' : 'border-slate-200 bg-white hover:border-slate-300'"
          >
            <div>
              <div class="flex items-center gap-2">
                <span class="font-extrabold text-base text-slate-900">{{ y.title || y.id + '년도' }}</span>
                <span v-if="y.isCurrent" class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-600 text-white">
                  현재 활성
                </span>
              </div>
              <div class="text-[11px] text-slate-400 mt-1">
                목장: {{ getYearGroupsCount(y.id) }}개 등록됨
              </div>
            </div>

            <div class="flex flex-wrap justify-end gap-1.5">
              <button v-if="!y.isCurrent" type="button" :aria-label="`${y.id}년도 연도 전환`"
                :disabled="!!switchingYear || creatingYear || deletingYear" @click="switchActiveYear(y.id)"
                class="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-white border border-indigo-200 hover:bg-indigo-50 rounded-xl transition disabled:opacity-50">
                {{ switchingYear === y.id ? '전환 중…' : '연도 전환' }}
              </button>
              <button type="button" :aria-label="`${y.id}년도 출석부 삭제`"
                :disabled="church.years.length <= 1 || getYearGroupsCount(y.id) > 0 || creatingYear || deletingYear || !!switchingYear"
                @click="openDeleteYear(y.id)"
                class="inline-flex items-center gap-1 rounded-xl border border-rose-200 px-2.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-40">
                <Trash2 class="h-3.5 w-3.5" aria-hidden="true" /> 삭제
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Modal v-model="showDeleteYearModal" title="연도별 출석부 삭제">
      <p class="text-sm text-slate-700"><strong>{{ yearToDelete }}년도 출석부</strong>를 삭제하시겠습니까?</p>
      <p v-if="church.years.some(year => year.id === yearToDelete && year.isCurrent)" class="text-xs text-slate-600">현재 활성 연도를 삭제하면 남아 있는 연도 중 가장 최근 연도가 활성화됩니다.</p>
      <p v-if="deleteYearError" role="alert" class="text-sm text-rose-700">{{ deleteYearError }}</p>
      <template #footer>
        <button type="button" :disabled="deletingYear" class="rounded-xl px-4 py-2 text-sm font-bold" @click="showDeleteYearModal = false">취소</button>
        <button type="button" :disabled="deletingYear" @click="confirmDeleteYear"
          class="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
          {{ deletingYear ? '삭제 중…' : '삭제하기' }}
        </button>
      </template>
    </Modal>

    <!-- Check Item Add/Edit Modal -->
    <Modal v-model="showItemModal" :title="isEditingItem ? '체크 항목 수정' : '새 체크 항목 추가'">
      <form @submit.prevent="saveCheckItem" class="space-y-4 text-xs">
        <div>
          <label class="block font-bold text-slate-700 mb-1">항목 이름 *</label>
          <input 
            v-model="itemForm.label" 
            type="text" 
            required 
            placeholder="예: 성경읽기, 대표기도, 성경암송, QT, 전도 등"
            class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <label v-if="editingItemId !== 'attendance'" class="block font-bold text-slate-700">
          출석부 입력 방식
          <select v-model.number="itemForm.maxDays" class="mt-1 block w-full px-3 py-2 rounded-xl border border-slate-200">
            <option :value="0">체크박스</option>
            <option v-for="day in WEEK_DAYS" :key="day" :value="day">주간 일수 선택 (0~{{ day }}일)</option>
          </select>
          <span class="mt-1 block text-[11px] font-normal text-slate-500">예를 들어 큐티에 7일을 설정하면 출석부에서 0~7일을 선택할 수 있습니다.</span>
        </label>

        <div>
          <label class="block font-bold text-slate-700 mb-1">{{ itemForm.maxDays ? '1일당' : '체크 1회당' }} 지급할 달란트 점수 *</label>
          <div class="flex items-center gap-2">
            <input 
              v-model.number="itemForm.points" 
              type="number" 
              min="0" 
              required 
              class="w-32 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <span class="text-xs text-slate-500">달란트</span>
          </div>
          <p class="text-[11px] text-slate-400 mt-1">예: 출석 2달란트, 성경읽기 3달란트, 대표기도 5달란트</p>
        </div>
      </form>

      <template #footer>
        <button 
          @click="showItemModal = false" 
          class="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
        >
          취소
        </button>
        <button 
          @click="saveCheckItem" 
          class="px-5 py-2 text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-200"
        >
          {{ isEditingItem ? '수정 완료' : '추가하기' }}
        </button>
      </template>
    </Modal>

    <!-- New Year Add Modal -->
    <Modal v-model="showYearModal" title="새 연도 출석부 개설">
      <form @submit.prevent="saveNewYear" class="space-y-4 text-xs">
        <div>
          <label class="block font-bold text-slate-700 mb-1">신규 개설 연도 (숫자 4자리) *</label>
          <input 
            v-model="newYearInput" 
            :disabled="creatingYear"
            type="number" 
            required 
            min="2000"
            max="2099"
            placeholder="예: 2027"
            class="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <p v-if="duplicateYear" role="alert" class="text-rose-600 mt-2">이미 등록된 연도입니다. 다른 연도를 입력해주세요.</p>
        </div>

        <div class="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100 space-y-2">
          <label class="flex items-center gap-2 cursor-pointer">
            <input 
              v-model="copyPreviousGroups" 
              type="checkbox" 
              class="w-4 h-4 rounded text-indigo-600 accent-indigo-600"
            />
            <span class="font-bold text-indigo-900 text-xs">선택한 연도의 반 이름과 순서만 복사</span>
          </label>
          <p class="text-[11px] text-indigo-700 pl-6 leading-relaxed">
            기본은 빈 반·학생 명단으로 시작합니다. 선택해도 학생, 교사 배정, 출석 기록은 복사되지 않습니다. 이전 연도 자료는 보존됩니다.
          </p>
        </div>
      </form>

      <template #footer>
        <button 
          @click="showYearModal = false" 
          class="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
        >
          취소
        </button>
        <button 
          @click="saveNewYear" 
          :disabled="creatingYear || duplicateYear || !validYear"
          class="px-5 py-2 text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-200 disabled:opacity-40"
        >
          {{ creatingYear ? '개설 중…' : '개설하기' }}
        </button>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useChurchStore } from '../../stores/churchStore';
import { checkItemMaxDays, WEEK_DAYS } from '../../utils/attendanceChecks.js';
import Modal from '../../components/Modal.vue';
import { Sliders, Calendar, CheckSquare, Coins, Plus, Edit2, Trash2 } from 'lucide-vue-next';

const church = useChurchStore();

const showItemModal = ref(false);
const isEditingItem = ref(false);
const editingItemId = ref(null);
const itemForm = ref({
  label: '',
  points: 3,
  maxDays: 0,
  color: 'blue'
});

const showYearModal = ref(false);
const newYearInput = ref(Number(church.currentYear) + 1);
const creatingYear = ref(false);
const duplicateYear = computed(() => church.years.some(year => String(year.id) === String(newYearInput.value).trim()));
const validYear = computed(() => /^20\d{2}$/.test(String(newYearInput.value).trim()));
const copyPreviousGroups = ref(false);
const yearToDelete = ref('');
const deletingYear = ref(false);
const deleteYearError = ref('');
const switchingYear = ref('');
const yearSwitchNotice = ref('');
const yearSwitchError = ref('');
const showDeleteYearModal = computed({
  get: () => Boolean(yearToDelete.value),
  set: visible => { if (!visible && !deletingYear.value) yearToDelete.value = ''; }
});

const getItemColorClass = (item) => {
  if (item.id === 'attendance') return 'bg-emerald-50 text-emerald-600';
  if (item.id === 'bibleReading') return 'bg-blue-50 text-blue-600';
  if (item.id === 'prayer') return 'bg-purple-50 text-purple-600';
  return 'bg-amber-50 text-amber-600';
};

const getYearGroupsCount = (yearId) => {
  return church.groups.filter(g => g.year === yearId).length;
};

// Check Item Actions
const openAddCheckItemModal = () => {
  isEditingItem.value = false;
  editingItemId.value = null;
  itemForm.value = {
    label: '',
    points: 3,
    maxDays: 0,
    color: 'blue'
  };
  showItemModal.value = true;
};

const openEditCheckItemModal = (item) => {
  isEditingItem.value = true;
  editingItemId.value = item.id;
  itemForm.value = { ...item, maxDays: checkItemMaxDays(item) };
  showItemModal.value = true;
};

const updateItemPoints = async (item, newPoints) => {
  await church.updateCheckItem(item.id, { points: Number(newPoints) });
};

const saveCheckItem = async () => {
  if (!itemForm.value.label.trim()) {
    alert('항목 이름을 입력해주세요.');
    return;
  }

  const { label, points, color, maxDays } = itemForm.value;
  const values = { label: label.trim(), points, color, maxDays };
  if (isEditingItem.value) {
    await church.updateCheckItem(editingItemId.value, { label: values.label, points, maxDays });
  } else {
    await church.addCheckItem(values);
  }

  showItemModal.value = false;
};

const confirmDeleteCheckItem = async (item) => {
  if (confirm(`'${item.label}' 항목을 삭제하시겠습니까? 출석부에서 해당 항목이 제거됩니다.`)) {
    await church.deleteCheckItem(item.id);
  }
};

// Year Actions
async function switchActiveYear(yearId) {
  if (switchingYear.value || creatingYear.value || deletingYear.value) return;
  switchingYear.value = yearId;
  yearSwitchNotice.value = '';
  yearSwitchError.value = '';
  try {
    await church.activateYear(yearId);
    yearSwitchNotice.value = `${yearId}년을 활성 연도로 변경했습니다.`;
  } catch (error) {
    yearSwitchError.value = error.message || '연도 전환에 실패했습니다.';
  } finally {
    switchingYear.value = '';
  }
}

function openDeleteYear(yearId) {
  deleteYearError.value = '';
  yearToDelete.value = yearId;
}

async function confirmDeleteYear() {
  if (!yearToDelete.value || deletingYear.value || creatingYear.value) return;
  deletingYear.value = true;
  deleteYearError.value = '';
  try {
    await church.deleteYear(yearToDelete.value);
    yearToDelete.value = '';
  } catch (error) {
    deleteYearError.value = error.message || '연도 삭제에 실패했습니다.';
  } finally {
    deletingYear.value = false;
  }
}

const openAddYearModal = () => {
  copyPreviousGroups.value = false;
  newYearInput.value = Number(church.currentYear) + 1;
  showYearModal.value = true;
};

const saveNewYear = async () => {
  if (creatingYear.value || duplicateYear.value || !validYear.value) return;
  creatingYear.value = true;
  const year = newYearInput.value;
  try {
    await church.addNewYear(year, copyPreviousGroups.value);
    showYearModal.value = false;
    alert(`${year}년도 출석부가 성공적으로 개설되었습니다!`);
  } catch (err) {
    alert(err.message || '연도 생성에 실패하였습니다.');
  } finally {
    creatingYear.value = false;
  }
};
</script>
