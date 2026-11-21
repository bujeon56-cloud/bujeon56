<template>
  <section class="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm sm:p-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex min-w-0 items-center gap-3">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <UserRoundPlus class="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h3 class="font-black text-slate-900">새친구 출석</h3>
          <p class="mt-0.5 text-xs leading-relaxed text-slate-500">서로 다른 주일에 8회 출석하면 반 학생으로 자동 등록됩니다. 새친구 출석은 달란트에 포함되지 않습니다.</p>
        </div>
      </div>
      <button type="button" :disabled="disabled || busy" :aria-expanded="showForm" @click="showForm = !showForm"
        class="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-indigo-100 bg-indigo-50 px-3 text-xs font-bold text-indigo-700 enabled:hover:bg-indigo-100 disabled:opacity-50">
        <Plus v-if="!showForm" class="h-4 w-4" aria-hidden="true" />
        <X v-else class="h-4 w-4" aria-hidden="true" />
        {{ showForm ? '등록 닫기' : '새친구 등록' }}
      </button>
    </div>

    <form v-if="showForm" class="grid grid-cols-2 gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3" @submit.prevent="register">
      <label class="col-span-2 space-y-1 text-xs font-bold text-slate-700">
        <span>이름</span>
        <input v-model.trim="name" required maxlength="80" placeholder="새친구 이름" :disabled="disabled || busy"
          class="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-medium text-slate-900" />
      </label>
      <label class="min-w-0 space-y-1 text-xs font-bold text-slate-700">
        <span>성별</span>
        <select v-model="gender" required :disabled="disabled || busy"
          class="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 font-medium text-slate-900">
          <option disabled value="">선택</option><option value="남">남</option><option value="여">여</option>
        </select>
      </label>
      <label class="min-w-0 space-y-1 text-xs font-bold text-slate-700">
        <span>학년</span>
        <select v-model="grade" :disabled="disabled || busy"
          class="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 font-medium text-slate-900">
          <option v-for="option in STUDENT_GRADES" :key="option.value" :value="option.value">{{ option.label }}</option>
        </select>
      </label>
      <button type="submit" :disabled="disabled || busy"
        class="col-span-2 min-h-10 justify-self-end rounded-xl bg-indigo-600 px-4 py-2 font-bold text-white enabled:hover:bg-indigo-700 disabled:opacity-50">
        등록
      </button>
    </form>

    <p v-if="!rows.length" class="rounded-xl bg-slate-50 px-3 py-3 text-xs text-slate-500">
      이 날짜에 관리할 새친구가 없습니다.
    </p>
    <ul v-else class="space-y-2">
      <li v-for="row in rows" :key="row.student.id"
        class="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-xl border border-slate-200 px-3 py-2"
        :class="row.attended ? 'bg-emerald-50/50' : 'bg-slate-50/70'">
        <div class="flex min-w-0 flex-wrap items-center gap-1.5">
          <strong class="min-w-0 break-all text-slate-900">{{ row.student.name }}</strong>
          <span class="rounded-lg bg-indigo-50 px-2 py-1 text-xs font-bold tabular-nums text-indigo-700">
            {{ row.count }}/8주{{ row.count === 8 ? ' · 등반 완료' : '' }}
          </span>
        </div>
        <div class="ml-auto flex shrink-0 items-center gap-2">
          <label class="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 text-xs font-bold"
            :class="row.attended ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-700'">
            <input type="checkbox" :aria-label="`${row.student.name} 새친구 출석`" :checked="row.attended" :disabled="disabled || busy"
              class="h-4 w-4 accent-emerald-600" @change="setAttendance(row, $event)" />
            {{ row.attended ? '출석함' : '출석' }}
          </label>
          <button v-if="row.canDelete" type="button" :disabled="disabled || busy"
            :aria-label="`${row.student.name} 새친구 삭제`" @click="removeNewcomer(row.student)"
            class="inline-flex min-h-10 items-center gap-1 rounded-lg px-2 text-xs font-bold text-rose-700 enabled:hover:bg-rose-50 disabled:opacity-40">
            <Trash2 class="h-3.5 w-3.5" aria-hidden="true" />
            삭제
          </button>
        </div>
      </li>
    </ul>
    <p v-if="error" role="alert" class="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">{{ error }}</p>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue';
import { Plus, Trash2, UserRoundPlus, X } from 'lucide-vue-next';
import { useChurchStore } from '../stores/churchStore';
import { authErrorMessage } from '../stores/authStore';
import { STUDENT_GRADES } from '../utils/studentFields.js';
import { newcomerGraduationDate, newcomerWeeks } from '../utils/newcomers.js';

const props = defineProps({
  groupId: { type: String, required: true },
  date: { type: String, required: true },
  disabled: Boolean
});
const church = useChurchStore();
const showForm = ref(false);
const name = ref('');
const gender = ref('');
const grade = ref('초5');
const busy = ref(false);
const error = ref('');
const rows = computed(() => church.getNewcomersByGroup(props.groupId).flatMap(student => {
  const graduation = newcomerGraduationDate(student);
  if (student.newcomerSince > props.date || (graduation && graduation < props.date)) return [];
  const weeks = newcomerWeeks(student);
  return [{ student, count: weeks.filter(week => week <= props.date).length, attended: weeks.includes(props.date), canDelete: !graduation }];
}));

async function register() {
  const group = church.currentGroups.find(group => group.id === props.groupId);
  if (!group || props.disabled || busy.value || !name.value || !gender.value) return;
  busy.value = true;
  error.value = '';
  try {
    await church.addStudent({
      groupId: group.id, departmentId: group.departmentId, name: name.value, gender: gender.value,
      grade: grade.value, newcomerSince: props.date, newcomerWeeks: []
    });
    showForm.value = false;
    name.value = '';
    gender.value = '';
  } catch (err) {
    error.value = authErrorMessage(err);
  } finally {
    busy.value = false;
  }
}

async function setAttendance(row, event) {
  const checked = event.target.checked;
  event.target.checked = row.attended;
  if (props.disabled || busy.value) return;
  busy.value = true;
  error.value = '';
  try {
    await church.setNewcomerAttendance(props.groupId, row.student.id, props.date, checked);
  } catch (err) {
    error.value = authErrorMessage(err);
  } finally {
    busy.value = false;
  }
}

async function removeNewcomer(student) {
  if (props.disabled || busy.value) return;
  if (!window.confirm(`'${student.name}' 새친구를 삭제하시겠습니까? 이 학생의 새친구 출석 기록도 함께 삭제됩니다.`)) return;
  busy.value = true;
  error.value = '';
  try {
    await church.deleteNewcomer(props.groupId, student.id, props.date);
  } catch (err) {
    error.value = authErrorMessage(err);
  } finally {
    busy.value = false;
  }
}
</script>
