<template>
  <div class="space-y-4 pb-12 sm:pb-6">
    <!-- Header Action Bar -->
    <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between gap-3">
      <div>
        <h3 class="font-black text-base sm:text-lg text-slate-900 flex items-center gap-2">
          <span>우리 반 아이들</span>
          <span class="px-2.5 py-0.5 text-xs font-black bg-indigo-50 text-indigo-700 rounded-lg">
            {{ students.length }}명
          </span>
        </h3>
        <p class="text-xs text-slate-400 mt-0.5">아이 정보를 등록하고 수정할 수 있습니다.</p>
      </div>

      <!-- Add Student Button (Big Touch Friendly) -->
      <button 
        @click="openAddModal" 
        class="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs sm:text-sm font-black rounded-xl shadow-md shadow-indigo-100 transition flex items-center gap-1.5 flex-shrink-0 touch-manipulation cursor-pointer"
      >
        <UserPlus class="w-4 h-4" />
        <span>새 아이 등록</span>
      </button>
    </div>

    <!-- Empty State -->
    <div v-if="students.length === 0" class="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 text-center shadow-sm">
      <div class="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-3xl flex items-center justify-center mx-auto mb-3">
        <Users class="w-8 h-8" />
      </div>
      <h4 class="font-extrabold text-slate-800 text-base sm:text-lg">등록된 아이가 없습니다</h4>
      <p class="text-xs sm:text-sm text-slate-500 mt-1 mb-5">
        우리 반 아이를 등록하면 출석 체크를 시작할 수 있습니다.
      </p>
      <button 
        @click="openAddModal" 
        class="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-indigo-100 active:scale-95 transition cursor-pointer"
      >
        <UserPlus class="w-5 h-5" />
        <span>아이 등록하기</span>
      </button>
    </div>

    <!-- Students Card List (Optimized for Mobile Viewing & Quick Contacts) -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div 
        v-for="student in students" 
        :key="student.id"
        class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition flex flex-col justify-between gap-3"
      >
        <div>
          <!-- Card Top: Avatar, Name, Grade & Edit/Delete -->
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div 
                class="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-xs flex-shrink-0"
                :class="student.gender === '여' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'"
              >
                {{ student.name.charAt(0) }}
              </div>
              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-black text-base sm:text-lg text-slate-900">{{ student.name }}</span>
                  <span class="text-xs font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700">
                    {{ student.grade || '초등부' }}
                  </span>
                  <span 
                    class="text-[11px] font-bold px-2 py-0.5 rounded-md" 
                    :class="student.gender === '여' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'"
                  >
                    {{ student.gender || '성별' }}
                  </span>
                </div>
                <div class="text-xs text-slate-400 mt-0.5">
                  생일: {{ student.birthDate || '미입력' }}
                </div>
              </div>
            </div>

            <!-- Edit & Delete Buttons -->
            <div class="flex items-center gap-1">
              <button 
                @click="openEditModal(student)" 
                class="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                title="수정"
              >
                <Edit2 class="w-4 h-4" />
              </button>
              <button 
                @click="confirmDelete(student)" 
                class="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                title="삭제"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Notes / Prayer Topics -->
          <div v-if="student.notes" class="mt-3 text-xs bg-slate-50 p-2.5 rounded-xl text-slate-700 leading-relaxed">
            <span class="font-black text-indigo-600">기도제목/메모: </span>
            <span>{{ student.notes }}</span>
          </div>
        </div>

        <!-- Contact Quick Actions (Call & SMS) -->
        <div class="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
          <!-- Student Phone Button -->
          <div v-if="student.phone" class="flex items-center gap-1.5">
            <a 
              :href="`tel:${student.phone}`" 
              class="flex-1 py-2 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold flex items-center justify-center gap-1.5 transition text-center"
            >
              <Phone class="w-3.5 h-3.5 text-indigo-600" />
              <span class="truncate">학생 통화</span>
            </a>
            <a 
              :href="`sms:${student.phone}`" 
              class="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold transition flex items-center justify-center"
              title="문자 보내기"
            >
              <MessageSquare class="w-3.5 h-3.5" />
            </a>
          </div>
          <div v-else class="text-slate-400 text-[11px] flex items-center justify-center bg-slate-50 rounded-xl py-2">
            학생 번호 없음
          </div>

          <!-- Parent Phone Button -->
          <div v-if="student.parentPhone" class="flex items-center gap-1.5">
            <a 
              :href="`tel:${student.parentPhone}`" 
              class="flex-1 py-2 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl font-bold flex items-center justify-center gap-1.5 transition text-center"
            >
              <Phone class="w-3.5 h-3.5 text-emerald-600" />
              <span class="truncate">부모님 통화</span>
            </a>
            <a 
              :href="`sms:${student.parentPhone}`" 
              class="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl font-bold transition flex items-center justify-center"
              title="문자 보내기"
            >
              <MessageSquare class="w-3.5 h-3.5" />
            </a>
          </div>
          <div v-else class="text-slate-400 text-[11px] flex items-center justify-center bg-slate-50 rounded-xl py-2">
            부모님 번호 없음
          </div>
        </div>
      </div>
    </div>

    <!-- Student Add/Edit Modal (Large Inputs for Mobile Keyboards) -->
    <Modal v-model="showModal" :title="isEditing ? '아이 정보 수정' : '우리 반 새 아이 등록'">
      <form @submit.prevent="saveStudent" class="space-y-4 text-xs sm:text-sm">
        <div>
          <label class="block font-black text-slate-800 mb-1">아이 이름 *</label>
          <input 
            v-model="form.name" 
            type="text" 
            required 
            placeholder="학생 이름 입력"
            class="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50 focus:bg-white"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-black text-slate-800 mb-1">학년</label>
            <select 
              v-model="form.grade" 
              class="w-full px-3 py-3 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white cursor-pointer"
            >
              <option value="초4">초등학교 4학년</option>
              <option value="초5">초등학교 5학년</option>
              <option value="초6">초등학교 6학년</option>
              <option value="기타">기타</option>
            </select>
          </div>

          <div>
            <label class="block font-black text-slate-800 mb-1">성별</label>
            <select 
              v-model="form.gender" 
              class="w-full px-3 py-3 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white cursor-pointer"
            >
              <option value="남">남학생 👦</option>
              <option value="여">여학생 👧</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block font-black text-slate-800 mb-1">생년월일</label>
          <input 
            v-model="form.birthDate" 
            type="date" 
            class="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50 focus:bg-white cursor-pointer"
          />
        </div>

        <div>
          <label class="block font-black text-slate-800 mb-1">학생 연락처</label>
          <input 
            v-model="form.phone" 
            type="tel" 
            placeholder="010-0000-0000"
            class="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50 focus:bg-white"
          />
        </div>

        <div>
          <label class="block font-black text-slate-800 mb-1">부모님 연락처</label>
          <input 
            v-model="form.parentPhone" 
            type="tel" 
            placeholder="010-0000-0000"
            class="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50 focus:bg-white"
          />
        </div>

        <div>
          <label class="block font-black text-slate-800 mb-1">비고 / 기도제목</label>
          <textarea 
            v-model="form.notes" 
            rows="2" 
            placeholder="특이사항, 달란트 관심사, 기도제목 등"
            class="w-full p-3 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50 focus:bg-white"
          ></textarea>
        </div>
      </form>

      <template #footer>
        <button 
          @click="showModal = false" 
          class="px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
        >
          취소
        </button>
        <button 
          @click="saveStudent" 
          class="px-6 py-2.5 text-xs sm:text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-200"
        >
          {{ isEditing ? '수정 저장' : '등록 완료' }}
        </button>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAuthStore } from '../../stores/authStore';
import { useChurchStore } from '../../stores/churchStore';
import Modal from '../../components/Modal.vue';
import { Users, UserPlus, Edit2, Trash2, Phone, MessageSquare } from 'lucide-vue-next';

const auth = useAuthStore();
const church = useChurchStore();

const showModal = ref(false);
const isEditing = ref(false);
const editingStudentId = ref(null);

const form = ref({
  name: '',
  grade: '초5',
  gender: '남',
  birthDate: '',
  phone: '',
  parentPhone: '',
  notes: ''
});

const currentGroupId = computed(() => {
  return auth.userGroupId || 'part1_g1';
});

const currentGroupName = computed(() => {
  if (auth.user?.groupName) return auth.user.groupName;
  const g = church.getGroupById(currentGroupId.value);
  return g ? `${g.departmentName} ${g.name}` : '목장';
});

const students = computed(() => {
  return church.getStudentsByGroup(currentGroupId.value);
});

const openAddModal = () => {
  isEditing.value = false;
  editingStudentId.value = null;
  form.value = {
    name: '',
    grade: '초5',
    gender: '남',
    birthDate: '',
    phone: '',
    parentPhone: '',
    notes: ''
  };
  showModal.value = true;
};

const openEditModal = (student) => {
  isEditing.value = true;
  editingStudentId.value = student.id;
  form.value = { ...student };
  showModal.value = true;
};

const saveStudent = async () => {
  if (!form.value.name.trim()) {
    alert('아이 이름을 입력해주세요.');
    return;
  }

  const studentData = {
    ...form.value,
    groupId: currentGroupId.value,
    departmentId: auth.userDepartmentId || 'part1'
  };

  if (isEditing.value) {
    await church.updateStudent(editingStudentId.value, studentData);
  } else {
    await church.addStudent(studentData);
  }

  showModal.value = false;
};

const confirmDelete = async (student) => {
  if (confirm(`'${student.name}' 아이를 명단에서 삭제하시겠습니까?`)) {
    await church.deleteStudent(student.id);
  }
};
</script>
