<template>
  <div class="space-y-4">
    <!-- Header Action Bar -->
    <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h3 class="font-extrabold text-base text-slate-900 flex items-center gap-2">
          <span>선생님 계정 및 반 배정 관리</span>
          <span class="text-xs font-bold px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700">
            총 {{ church.teachers.length }}명
          </span>
        </h3>
        <p class="text-xs text-slate-400 mt-0.5">
          이메일 로그인 계정을 등록하고 연도별 반 배정과 비밀번호 재설정 이메일을 관리합니다.
        </p>
      </div>

      <button
        @click="openAddModal"
        class="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-100 transition flex items-center gap-1.5 cursor-pointer"
      >
        <UserPlus class="w-4 h-4" />
        <span>새 선생님 등록</span>
      </button>
    </div>

    <ClassAccountsSetup />

    <!-- Teachers Table -->
    <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50/70 text-[11px] text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
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
              v-for="teacher in church.teachers"
              :key="teacher.id"
              class="hover:bg-slate-50/70 transition"
            >
              <!-- Name (Guaranteed '선생님' for everyone except pastor) -->
              <td class="py-3.5 px-4">
                <div class="flex items-center gap-2.5">
                  <div
                    class="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0"
                    :class="teacher.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'"
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
                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-indigo-50 text-indigo-800 border border-indigo-200">
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
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200"
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
                  v-else-if="teacher.groupId"
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
                    class="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                    title="선생님 정보 수정"
                  >
                    <Edit2 class="w-3.5 h-3.5" />
                  </button>
                  <button
                    v-if="teacher.id !== 'user_admin_pastor'"
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

    <!-- Password Change Modal (Requested: 관리자 쪽에서 비밀번호 변경 가능) -->
    <Modal v-model="showPasswordModal" title="비밀번호 재설정">
      <p class="text-sm">{{ targetTeacher?.email }} 주소로 비밀번호 재설정 이메일을 보냅니다.</p>
      <template #footer><button @click="saveNewPassword" class="p-3 rounded-xl bg-indigo-600 text-white">재설정 이메일 보내기</button></template>
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
          class="px-5 py-2 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-200 cursor-pointer"
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
import { ref, computed } from 'vue';
import { useChurchStore } from '../../stores/churchStore';
import { formatTeacherName, DBService } from '../../api/storage';
import Modal from '../../components/Modal.vue';
import ClassAccountsSetup from '../../components/ClassAccountsSetup.vue';
import { UserPlus, Shield, CheckSquare, Edit2, Trash2, Key } from 'lucide-vue-next';

const church = useChurchStore();

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

const confirmDeleteTeacher = async (teacher) => {
  if (confirm(`'${getDisplayTeacherName(teacher)}'을(를) 삭제하시겠습니까?`)) {
    try { await church.deleteTeacher(teacher.id); }
    catch (error) { alert(authErrorMessage(error)); }
  }
};
</script>
