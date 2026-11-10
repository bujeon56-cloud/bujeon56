<template>
  <section class="space-y-3 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 text-sm">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h3 class="font-black text-indigo-950">새친구 출석</h3>
        <p class="text-xs text-slate-600">서로 다른 주일에 8회 출석하면 정식 출석부에 자동 등록됩니다.</p>
      </div>
      <button type="button" :disabled="disabled || busy" @click="showForm = !showForm"
        class="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">
        {{ showForm ? '등록 닫기' : '새친구 등록' }}
      </button>
    </div>

    <form v-if="showForm" class="flex flex-wrap gap-2" @submit.prevent="register">
      <input v-model.trim="name" required maxlength="80" aria-label="새친구 이름" placeholder="이름" :disabled="disabled || busy"
        class="min-w-32 flex-1 rounded-lg border border-slate-300 bg-white px-2 py-1.5" />
      <select v-model="gender" required aria-label="새친구 성별" :disabled="disabled || busy" class="rounded-lg border border-slate-300 bg-white px-2">
        <option disabled value="">성별</option><option value="남">남</option><option value="여">여</option>
      </select>
      <select v-model="grade" aria-label="새친구 학년" :disabled="disabled || busy" class="rounded-lg border border-slate-300 bg-white px-2">
        <option v-for="option in STUDENT_GRADES" :key="option.value" :value="option.value">{{ option.label }}</option>
      </select>
      <button type="submit" :disabled="disabled || busy" class="rounded-lg bg-indigo-600 px-3 py-2 font-bold text-white disabled:opacity-50">등록</button>
    </form>

    <p v-if="!rows.length" class="text-xs text-slate-500">이 날짜에 관리할 새친구가 없습니다.</p>
    <div v-for="row in rows" :key="row.student.id" class="flex items-center justify-between gap-3 rounded-xl bg-white p-2.5">
      <div>
        <strong>{{ row.student.name }}</strong>
        <span class="ml-2 text-xs text-indigo-700">{{ row.count }}/8주{{ row.count === 8 ? ' · 등반 완료' : '' }}</span>
      </div>
      <label class="flex shrink-0 items-center gap-2 font-bold">
        <input type="checkbox" :aria-label="`${row.student.name} 새친구 출석`" :checked="row.attended" :disabled="disabled || busy"
          class="h-5 w-5 accent-indigo-600" @change="setAttendance(row, $event)" /> 출석
      </label>
    </div>
    <p v-if="error" role="alert" class="text-xs text-rose-700">{{ error }}</p>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue';
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
  return [{ student, count: weeks.filter(week => week <= props.date).length, attended: weeks.includes(props.date) }];
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
</script>
