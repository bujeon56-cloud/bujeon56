<template>
  <div class="space-y-5 sm:space-y-6">
    <!-- Header Action Bar -->
    <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h3 class="font-extrabold text-base text-slate-900 flex items-center gap-2">
          <span>소년부 목장(반) 관리</span>
          <span class="text-xs font-bold px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700">
            총 {{ church.currentGroups.length }}개 목장
          </span>
        </h3>
        <p class="text-xs text-slate-400 mt-0.5">1부와 2부의 목장을 관리하고 새로운 목장을 추가하거나 삭제할 수 있습니다.</p>
      </div>

      <div class="flex items-center gap-2">
        <button 
          @click="openAddModal" 
          class="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-100 transition flex items-center gap-1.5 cursor-pointer"
        >
          <Plus class="w-4 h-4" />
          <span>새 목장 추가</span>
        </button>
      </div>
    </div>

    <!-- Department Tabs -->
    <div class="flex items-center gap-2 border-b border-slate-200 pb-2">
      <button 
        @click="activeDept = 'part1'"
        class="px-4 py-2 text-xs font-extrabold rounded-xl transition flex items-center gap-2 cursor-pointer"
        :class="activeDept === 'part1' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100'"
      >
        <span>1부 목장</span>
        <span class="px-1.5 py-0.2 rounded-full text-[10px]" :class="activeDept === 'part1' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'">
          {{ church.part1Groups.length }}
        </span>
      </button>

      <button 
        @click="activeDept = 'part2'"
        class="px-4 py-2 text-xs font-extrabold rounded-xl transition flex items-center gap-2 cursor-pointer"
        :class="activeDept === 'part2' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100'"
      >
        <span>2부 목장</span>
        <span class="px-1.5 py-0.2 rounded-full text-[10px]" :class="activeDept === 'part2' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'">
          {{ church.part2Groups.length }}
        </span>
      </button>
    </div>

    <!-- Groups Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <div 
        v-for="group in filteredGroups" 
        :key="group.id"
        class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:border-slate-300 transition flex flex-col justify-between"
      >
        <div>
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-2.5">
              <div 
                class="w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm"
                :class="group.departmentId === 'part1' ? 'bg-blue-50 text-blue-600' : 'bg-blue-50 text-blue-600'"
              >
                {{ group.order || '•' }}
              </div>
              <div>
                <h4 class="font-bold text-sm text-slate-900">{{ group.name }}</h4>
                <div class="text-[11px] text-slate-400 font-medium">
                  {{ group.departmentName }}
                </div>
              </div>
            </div>

            <div class="flex items-center gap-1">
              <button 
                @click="openEditModal(group)" 
                class="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                title="수정"
              >
                <Edit2 class="w-3.5 h-3.5" />
              </button>
              <button 
                @click="confirmDeleteGroup(group)"
                :disabled="deleting"
                class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                title="삭제"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div class="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
            <div class="flex items-center justify-between text-slate-600">
              <span class="text-slate-400">담당 선생님:</span>
              <span class="font-bold text-slate-800">{{ getFormattedTeacherName(group.teacherName) }}</span>
            </div>
            <div class="flex items-center justify-between text-slate-600">
              <span class="text-slate-400">등록 학생 수:</span>
              <span class="font-bold text-indigo-600">{{ getStudentsCount(group.id) }}명</span>
            </div>
          </div>
          <button @click="openStudents(group)" :aria-label="group.departmentName + ' ' + group.name + ' 학생 관리'" class="mt-4 w-full px-4 py-2.5 rounded-xl bg-blue-50 text-blue-700 font-bold text-sm hover:bg-blue-100">학생 관리</button>
        </div>
      </div>
    </div>

    <GroupStudentsManager v-model="showStudents" :group-id="studentGroupId" />

    <Modal v-model="showDeleteModal" title="목장 삭제 확인">
      <form id="confirm-group-removal" class="space-y-3 text-sm" @submit.prevent="deleteSelectedGroup">
        <p>{{ deleteRequest?.year }}년 {{ deleteRequest?.name }}을(를) 삭제합니다.</p>
        <p v-if="deleteRequest?.studentCount" class="font-bold text-rose-700">이 목장에 등록된 학생이 {{ deleteRequest.studentCount }}명 있습니다.</p>
        <label class="block font-bold">
          관리자 비밀번호
          <input v-model="deletePassword" type="password" autocomplete="current-password" required :disabled="deleting"
            class="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2" />
        </label>
        <p v-if="deleteError" role="alert" class="text-rose-700">{{ deleteError }}</p>
      </form>
      <template #footer>
        <button type="button" :disabled="deleting" class="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold disabled:opacity-50"
          @click="showDeleteModal = false">취소</button>
        <button type="submit" form="confirm-group-removal" :disabled="deleting || !deletePassword"
          class="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
          {{ deleting ? '확인 중…' : '비밀번호 확인 후 삭제' }}
        </button>
      </template>
    </Modal>

    <!-- Group Add/Edit Modal -->
    <Modal v-model="showModal" :title="isEditing ? '목장 정보 수정' : '새 목장 추가'">
      <form @submit.prevent="saveGroup" class="space-y-4 text-xs">
        <div>
          <label class="block font-bold text-slate-700 mb-1">소속 부서 *</label>
          <div class="grid grid-cols-2 gap-3">
            <button 
              type="button" 
              @click="form.departmentId = 'part1'"
              class="py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              :class="form.departmentId === 'part1' ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-100' : 'border-slate-200 text-slate-600'"
            >
              소년부 1부
            </button>
            <button 
              type="button" 
              @click="form.departmentId = 'part2'"
              class="py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              :class="form.departmentId === 'part2' ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-100' : 'border-slate-200 text-slate-600'"
            >
              소년부 2부
            </button>
          </div>
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1">목장 이름 *</label>
          <input 
            v-model="form.name" 
            type="text" 
            required 
            placeholder="예: 15목장, 새싹목장 등"
            class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1">정렬 순서</label>
          <input 
            v-model.number="form.order" 
            type="number" 
            placeholder="숫자 (예: 15)"
            class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1">담당 선생님 선택</label>
          <select 
            v-model="form.teacherId" 
            @change="onTeacherSelectChange"
            class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white cursor-pointer"
          >
            <option :value="null">미배정</option>
            <option v-for="t in church.teachers.filter(u => u.role !== 'admin')" :key="t.id" :value="t.id">
              {{ getFormattedTeacherName(t.name) }} (ID: {{ t.username || t.email }})
            </option>
          </select>
        </div>
      </form>

      <template #footer>
        <button 
          @click="showModal = false" 
          class="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
        >
          취소
        </button>
        <button 
          @click="saveGroup" 
          class="px-5 py-2 text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-200 cursor-pointer"
        >
          {{ isEditing ? '수정 저장' : '목장 생성' }}
        </button>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useChurchStore } from '../../stores/churchStore';
import { authErrorMessage } from '../../stores/authStore';
import { formatTeacherName } from '../../api/storage';
import Modal from '../../components/Modal.vue';
import GroupStudentsManager from '../../components/GroupStudentsManager.vue';
import { Plus, Edit2, Trash2 } from 'lucide-vue-next';

const church = useChurchStore();
const deleting = ref(false);
const deleteRequest = ref(null);
const deletePassword = ref('');
const deleteError = ref('');
function closeDeleteModal() {
  deleteRequest.value = null;
  deletePassword.value = '';
  deleteError.value = '';
}
const showDeleteModal = computed({
  get: () => !!deleteRequest.value,
  set: open => { if (!open && !deleting.value) closeDeleteModal(); },
});
const activeDept = ref('part1');
const showStudents=ref(false),studentGroupId=ref('');
function openStudents(group){studentGroupId.value=group.id;showStudents.value=true;}
watch(()=>church.currentYear,()=>{showStudents.value=false;studentGroupId.value='';showModal.value=false;closeDeleteModal();});

const showModal = ref(false);
const isEditing = ref(false);
const editingGroupId = ref(null);

const form = ref({
  departmentId: 'part1',
  name: '',
  order: 1,
  teacherId: null,
  teacherName: '미배정'
});

const getFormattedTeacherName = (name) => {
  if (!name || name === '미배정') return '미배정';
  return formatTeacherName(name);
};

const filteredGroups = computed(() => {
  return activeDept.value === 'part1' ? church.part1Groups : church.part2Groups;
});

const getStudentsCount = (groupId) => {
  return church.getStudentsByGroup(groupId).length;
};

const openAddModal = () => {
  isEditing.value = false;
  editingGroupId.value = null;
  const currentCount = filteredGroups.value.length;
  form.value = {
    departmentId: activeDept.value,
    name: `${currentCount + 1}목장`,
    order: currentCount + 1,
    teacherId: null,
    teacherName: '미배정'
  };
  showModal.value = true;
};

const openEditModal = (group) => {
  isEditing.value = true;
  editingGroupId.value = group.id;
  form.value = {
    departmentId: group.departmentId,
    name: group.name,
    order: group.order || 1,
    teacherId: group.teacherId || null,
    teacherName: group.teacherName || '미배정'
  };
  showModal.value = true;
};

const onTeacherSelectChange = (e) => {
  const selectedId = e.target.value;
  if (!selectedId || selectedId === 'null') {
    form.value.teacherId = null;
    form.value.teacherName = '미배정';
  } else {
    const t = church.teachers.find(u => u.id === selectedId);
    if (t) {
      form.value.teacherId = t.id;
      form.value.teacherName = getFormattedTeacherName(t.name);
    }
  }
};

const saveGroup = async () => {
  if (!form.value.name.trim()) {
    alert('목장 이름을 입력해주세요.');
    return;
  }

  if (isEditing.value) {
    await church.updateGroup(editingGroupId.value, form.value);
  } else {
    await church.addGroup(form.value);
  }

  showModal.value = false;
};

const confirmDeleteGroup = group => {
  if (deleting.value) return;
  closeDeleteModal();
  deleteRequest.value = {
    id: group.id, year: church.currentYear,
    name: `${group.departmentName} ${group.name}`, studentCount: getStudentsCount(group.id),
  };
};

async function deleteSelectedGroup() {
  const request = deleteRequest.value;
  if (deleting.value || !request || !deletePassword.value) return;
  deleting.value = true;
  deleteError.value = '';
  try {
    await church.deleteGroup(request.id, request.year, deletePassword.value);
    if (deleteRequest.value === request) closeDeleteModal();
  } catch (error) {
    if (deleteRequest.value !== request) return;
    deletePassword.value = '';
    deleteError.value = ['auth/wrong-password', 'auth/invalid-credential', 'auth/invalid-login-credentials'].includes(error.code)
      ? '관리자 비밀번호가 올바르지 않습니다.'
      : authErrorMessage(error);
  } finally {
    deleting.value = false;
  }
}
</script>
