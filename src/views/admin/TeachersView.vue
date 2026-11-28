<template>
  <div class="space-y-5 sm:space-y-6">
    <!-- Header Action Bar -->
    <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h3 class="font-extrabold text-base text-slate-900 flex items-center gap-2">
          <span>선생님 계정 및 반 배정 관리</span>
          <span class="text-xs font-bold px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700">
            {{ church.currentYear }}년 · 총 {{ church.currentTeachers.length }}명
          </span>
        </h3>
        <p class="text-xs text-slate-400 mt-0.5">
          이메일 로그인 계정을 등록하고 연도별 반 배정과 비밀번호 재설정 이메일을 관리합니다.
        </p>
      </div>

      <button
        @click="openAddModal"
        class="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-100 transition flex items-center gap-1.5 cursor-pointer"
      >
        <UserPlus class="w-4 h-4" />
        <span>새 선생님 등록</span>
      </button>
    </div>

    <ClassAccountsSetup />

    <div class="flex flex-wrap items-center justify-between gap-3 p-3 bg-white rounded-xl border">
      <p class="text-sm">{{ church.currentYear }}년 명단 · {{ selectedIds.length }}명 선택 <span class="text-xs text-slate-500">담당 목장 오름차순 · 미배정은 마지막에 표시</span></p>
      <button @click="deleteSelected" :disabled="!selectedIds.length || deleting" class="px-4 py-2 bg-rose-600 text-white font-bold rounded-xl disabled:opacity-40">{{ deleting ? '삭제 중…' : '삭제' }}</button>
    </div>
    <p class="text-xs text-slate-500">삭제하면 선택한 연도의 명단과 반 배정에서만 제외됩니다. 다른 연도와 학생·출석·달란트 기록은 보존됩니다.</p>
    <!-- Teachers Table -->
    <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50/70 text-[11px] text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <th class="p-3"><input type="checkbox" aria-label="현재 연도 선생님 전체 선택" :checked="allSelected" :indeterminate="selectedIds.length > 0 && !allSelected" :disabled="deleting || !selectableTeachers.length" @change="toggleAll($event.target.checked)" class="w-5 h-5 accent-indigo-600" /></th>
              <th class="py-3 px-4">성함</th>
              <th class="py-3 px-3">로그인 아이디 / 이메일</th>
              <th class="py-3 px-3">비밀번호 관리</th>
              <th class="py-3 px-3">권한</th>
              <th class="py-3 px-3">담당 목장(반)</th>
              <th class="py-3 px-3">연락처</th>
              <th class="py-3 px-4 text-center w-28">관리</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-xs text-slate-700">
            <tr
              v-for="teacher in church.currentTeachers"
              :key="teacher.id"
              class="hover:bg-slate-50/70 transition"
            >
              <td class="p-3"><input v-model="selectedIds" type="checkbox" :value="teacher.id" :aria-label="getDisplayTeacherName(teacher) + ' 선택'" :disabled="deleting || teacher.role === 'admin' || teacher.id === auth.currentUser?.uid" class="w-5 h-5 accent-indigo-600" /></td>
              <!-- Name (Guaranteed '선생님' for everyone except pastor) -->
              <td class="py-3.5 px-4">
                <div class="flex items-center gap-2.5">
                  <div
                    class="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0"
                    :class="teacher.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'"
                  >
                    {{ teacher.name.charAt(0) }}
                  </div>
                  <span class="font-black text-sm text-slate-900">
                    {{ getDisplayTeacherName(teacher) }}
                  </span>
                </div>
              </td>

              <!-- Login ID (Code e.g. 11, 12, 114, 21, pastor) -->
              <td class="py-3.5 px-3">
                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-blue-50 text-blue-800 border border-blue-200">
                  <Key class="w-3 h-3 text-indigo-600" />
                  {{ teacher.loginCode || teacher.email }}
                </span>
              </td>

              <!-- Password & Change Button -->
              <td class="py-3.5 px-3">
                <div class="flex items-center gap-1.5">
                  <span class="text-slate-400 font-mono text-xs">
                    {{ teacher.accountType === 'class' ? '본인 로그인 후 변경' : '이메일로 재설정' }}
                  </span>
                  <button
                    v-if="teacher.accountType !== 'class'" @click="openPasswordModal(teacher)"
                    class="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-200 transition cursor-pointer"
                    title="비밀번호 재설정 이메일"
                  >
                    재설정
                  </button>
                </div>
              </td>

              <!-- Role Badge -->
              <td class="py-3.5 px-3">
                <span
                  v-if="teacher.role === 'admin'"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200"
                >
                  <Shield class="w-3 h-3" />
                  관리자 ({{ teacher.position || '목사님/서기' }})
                </span>
                <span
                  v-else
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-600"
                >
                  반 선생님
                </span>
              </td>

              <!-- Assigned Group -->
              <td class="py-3.5 px-3">
                <span
                  v-if="teacher.role === 'admin'"
                  class="text-slate-400 italic"
                >
                  모든 반 관리 가능
                </span>
                <span
                  v-else-if="church.getTeacherGroup(teacher.id)"
                  class="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100"
                >
                  <CheckSquare class="w-3.5 h-3.5" />
                  {{ getTeacherGroupName(teacher) }}
                </span>
                <span v-else class="text-amber-600 font-medium">
                  미배정
                </span>
              </td>

              <!-- Phone -->
              <td class="py-3.5 px-3 text-slate-500">
                {{ teacher.phone || '-' }}
              </td>

              <!-- Actions -->
              <td class="py-3.5 px-4 text-center">
                <div class="flex items-center justify-center gap-1">
                  <button
                    @click="openEditModal(teacher)"
                    class="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                    title="선생님 정보 수정"
                  >
                    <Edit2 class="w-3.5 h-3.5" />
                  </button>
                  <button
                    v-if="teacher.role !== 'admin' && teacher.id !== auth.currentUser?.uid"
                    :disabled="deleting"
                    @click="confirmDeleteTeacher(teacher)"
                    class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    title="선생님 삭제"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Modal v-model="showDeleteModal" title="선생님 삭제 확인">
      <form id="confirm-teacher-removal" class="space-y-3 text-sm" @submit.prevent="removeTeachers">
        <p>{{ deleteRequest?.year }}년 명단에서 선생님 {{ deleteRequest?.ids.length }}명을 제외합니다. 해당 연도의 반 배정이 해제됩니다.</p>
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
        <button type="submit" form="confirm-teacher-removal" :disabled="deleting || !deletePassword"
          class="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
          {{ deleting ? '확인 중…' : '비밀번호 확인 후 삭제' }}
        </button>
      </template>
    </Modal>

    <!-- Password Change Modal (Requested: 관리자 쪽에서 비밀번호 변경 가능) -->
    <Modal v-model="showPasswordModal" title="비밀번호 재설정">
      <p class="text-sm">{{ targetTeacher?.email }} 주소로 비밀번호 재설정 이메일을 보냅니다.</p>
      <template #footer><button @click="saveNewPassword" class="p-3 rounded-xl bg-blue-600 text-white">재설정 이메일 보내기</button></template>
    </Modal>

    <!-- Teacher Add/Edit Modal -->
    <Modal v-model="showModal" :title="isEditing ? '선생님 정보 수정' : '새 선생님 등록'">
      <form @submit.prevent="saveTeacher" class="space-y-3.5 text-xs">
        <div>
          <label class="block font-bold text-slate-700 mb-1">선생님 성함 *</label>
          <input
            v-model="form.name"
            type="text"
            required
            placeholder="이름 입력 (예: 홍길동)"
            class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <p class="text-[10px] text-slate-400 mt-0.5">목사님 외에는 성함 뒤에 '선생님'이 자동으로 붙습니다.</p>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-slate-700 mb-1">표시 코드 *</label>
            <input
              v-model="form.username"
              :disabled="isClassAccount"
              type="text"
              required
              placeholder="예: 11, 12, 21 등"
              class="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">초기 비밀번호 *</label>
            <input
              v-model="form.password"
              :disabled="isEditing"
              :required="!isEditing"
              minlength="6"
              type="password"
              placeholder="신규 등록 시 6자 이상"
              class="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <div v-if="!isClassAccount">
          <label class="block font-bold text-slate-700 mb-1">로그인 이메일 (필수)</label>
          <input
            v-model="form.email"
            required
            :disabled="isEditing"
            type="email"
            placeholder="teacher@church.com"
            class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1">연락처</label>
          <input
            v-model="form.phone"
            type="tel"
            placeholder="010-0000-0000"
            class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1">역할 구분 *</label>
          <select
            v-model="form.role"
            class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white cursor-pointer"
          >
            <option value="teacher">반 선생님 (배정된 반만 출석 체크 가능)</option>
            <option value="admin">관리자 (목사님, 서기 - 전체 관리 및 통계 가능)</option>
          </select>
        </div>

        <div v-if="form.role === 'admin'">
          <label class="block font-bold text-slate-700 mb-1">직분/직책</label>
          <input
            v-model="form.position"
            type="text"
            placeholder="목사님, 서기, 부장집사님 등"
            class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div v-if="form.role === 'teacher'">
          <label class="block font-bold text-slate-700 mb-1">담당 목장(반) 배정</label>
          <select
            v-model="form.groupId"
            @change="onGroupSelectChange"
            class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white cursor-pointer"
          >
            <option :value="null">미배정</option>
            <optgroup label="소년부 1부">
              <option v-for="g in church.part1Groups" :key="g.id" :value="g.id">
                1부 {{ g.name }} (현재: {{ g.teacherName }})
              </option>
            </optgroup>
            <optgroup label="소년부 2부">
              <option v-for="g in church.part2Groups" :key="g.id" :value="g.id">
                2부 {{ g.name }} (현재: {{ g.teacherName }})
              </option>
            </optgroup>
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
          @click="saveTeacher"
          class="px-5 py-2 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-200 cursor-pointer"
        >
          {{ isEditing ? '수정 완료' : '등록 완료' }}
        </button>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { authErrorMessage } from '../../stores/authStore';
import { auth, sendPasswordResetEmail } from '../../api/firebase';
import { ref, computed, watch } from 'vue';
import { useChurchStore } from '../../stores/churchStore';
import { formatTeacherName, DBService } from '../../api/storage';
import Modal from '../../components/Modal.vue';
import ClassAccountsSetup from '../../components/ClassAccountsSetup.vue';
import { UserPlus, Shield, CheckSquare, Edit2, Trash2, Key } from 'lucide-vue-next';

const church = useChurchStore();
const selectedIds = ref([]);
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
const selectableTeachers = computed(() => church.currentTeachers.filter(t => t.role !== 'admin' && t.id !== auth.currentUser?.uid));
const allSelected = computed(() => selectableTeachers.value.length > 0 && selectableTeachers.value.every(t => selectedIds.value.includes(t.id)));
watch(() => church.currentYear, () => { selectedIds.value = []; showModal.value = false; closeDeleteModal(); });
watch(() => selectableTeachers.value.map(t => t.id), ids => { selectedIds.value = selectedIds.value.filter(id => ids.includes(id)); });
const toggleAll = checked => { selectedIds.value = checked ? selectableTeachers.value.map(t => t.id) : []; };
function requestTeacherRemoval(ids) {
  if (deleting.value || !ids.length) return;
  closeDeleteModal();
  deleteRequest.value = { year: church.currentYear, ids };
}
async function removeTeachers() {
  const request = deleteRequest.value;
  if (deleting.value || !request || !deletePassword.value) return;
  deleting.value = true;
  deleteError.value = '';
  try {
    await church.deleteTeachersForYear(request.ids, request.year, deletePassword.value);
    if (deleteRequest.value === request) { selectedIds.value = []; closeDeleteModal(); }
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
const deleteSelected = () => requestTeacherRemoval([...selectedIds.value]);

const showModal = ref(false);
const isEditing = ref(false);
const editingTeacherId = ref(null);
const isClassAccount = computed(() => church.teachers.find(t => t.id === editingTeacherId.value)?.accountType === 'class');

// Password Change Modal State
const showPasswordModal = ref(false);
const targetTeacher = ref(null);


const form = ref({
  name: '',
  username: '',
  password: '',
  email: '',
  phone: '',
  role: 'teacher',
  position: '',
  groupId: null,
  groupName: '',
  departmentId: ''
});

const getDisplayTeacherName = (teacher) => {
  return formatTeacherName(teacher.name, teacher.position, teacher.role);
};

const getCodeFromGroup = (teacher) => {
  if (!teacher.groupId) return '';
  // part1_g1 -> 11, part2_g1 -> 21
  const match = teacher.groupId.match(/part([1-2]).*?g(\d+)/);
  if (match) {
    return `${match[1]}${match[2]}`;
  }
  return '';
};

const getTeacherGroupName = (teacher) => {
  const g = church.getTeacherGroup(teacher.id);
  return g ? [g.departmentName, g.name].join(' ') : '미배정';
};

const openPasswordModal = (teacher) => {
  targetTeacher.value = teacher;

  showPasswordModal.value = true;
};

const saveNewPassword = async () => {
  try {
    await sendPasswordResetEmail(auth, targetTeacher.value.email);
    alert('비밀번호 재설정 이메일을 보냈습니다.');
    showPasswordModal.value = false;
  } catch (error) { alert(authErrorMessage(error)); }
};

const openAddModal = () => {
  isEditing.value = false;
  editingTeacherId.value = null;
  form.value = {
    name: '',
    username: '',
    password: '',
    email: '',
    phone: '',
    role: 'teacher',
    position: '',
    groupId: null,
    groupName: '',
    departmentId: ''
  };
  showModal.value = true;
};

const openEditModal = (teacher) => {
  isEditing.value = true;
  editingTeacherId.value = teacher.id;
  form.value = {
    name: teacher.name,
    username: teacher.username || getCodeFromGroup(teacher) || '',
    password: '',
    email: teacher.email || '',
    phone: teacher.phone || '',
    role: teacher.role || 'teacher',
    position: teacher.position || '',
    groupId: church.getTeacherGroup(teacher.id)?.id || null,
    groupName: church.getTeacherGroup(teacher.id)?.name || '',
    departmentId: church.getTeacherGroup(teacher.id)?.departmentId || ''
  };
  showModal.value = true;
};

const onGroupSelectChange = (e) => {
  const gId = e.target.value;
  if (!gId || gId === 'null') {
    form.value.groupId = null;
    form.value.groupName = '';
    form.value.departmentId = '';
  } else {
    const g = church.getGroupById(gId);
    if (g) {
      form.value.groupId = g.id;
      form.value.groupName = `${g.departmentName} ${g.name}`;
      form.value.departmentId = g.departmentId;

      // Auto-suggest username if blank: e.g. 1부 1목장 -> 11, 2부 3목장 -> 23
      if (!form.value.username || /^[12]\d+$/.test(form.value.username)) {
        const deptNum = g.departmentId === 'part1' ? '1' : '2';
        form.value.username = `${deptNum}${g.order || 1}`;
      }
    }
  }
};

const saveTeacher = async () => {
  if (!form.value.name.trim()) {
    alert('선생님 성함을 입력해주세요.');
    return;
  }
  if (!form.value.username.trim()) {
    alert('로그인 아이디(코드)를 입력해주세요.');
    return;
  }

  // Format teacher name properly
  const formattedName = formatTeacherName(form.value.name, form.value.position, form.value.role);

  const payload = {
    ...form.value,
    name: formattedName,
    email: form.value.email.trim()
  };

  if (!payload.email) return alert('로그인 이메일을 입력해주세요.');
  try {
  if (isEditing.value) {
    await church.updateTeacher(editingTeacherId.value, payload);
  } else {
    await church.addTeacher(payload);
  }

  showModal.value = false;
  } catch (error) { alert(authErrorMessage(error)); }
};

const confirmDeleteTeacher = teacher => requestTeacherRemoval([teacher.id]);
</script>
