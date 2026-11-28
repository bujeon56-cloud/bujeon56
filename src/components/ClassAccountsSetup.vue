<template>
  <section class="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3">
    <!-- 2026년 목장별 로그인 계정 안내
    <h3 class="font-bold text-indigo-900">2026년 목장별 로그인 계정</h3>
    <p class="text-sm text-indigo-900">1부 1~14목장: 260101~260114 · 2부 1~8목장: 260201~260208</p>
    -->
    <div class="flex items-center justify-between gap-3">
      <div class="min-w-0 space-y-1">
        <h3 class="font-bold text-indigo-900">선생님 일괄 등록</h3>
        <p class="text-sm text-indigo-900">{{ church.currentYear }}년 선생님 명단을 등록합니다.</p>
      </div>
      <button type="button" @click="prepare" :disabled="busy" class="min-h-11 shrink-0 whitespace-nowrap rounded-xl bg-blue-600 px-2.5 py-2 text-xs font-bold text-white disabled:opacity-50 sm:px-4 sm:text-sm">{{ church.currentYear }}년 선생님 일괄 등록</button>
    </div>
    <p v-if="!show && error" role="alert" class="text-sm text-rose-700">{{ error }}</p>
    <Modal v-model="show" :title="preparedYear + '년 목장 계정 생성'">
      <div class="space-y-3 text-sm">
        <p>각 계정은 자기 반의 학생·출석·달란트만 관리합니다. 이미 배정된 교사 계정은 유지합니다.</p>
        <label class="block font-bold">{{ preparedYear }}년 담당 선생님 일괄 입력
          <textarea v-model="rosterInput" rows="4" class="mt-1 block w-full rounded-xl border p-2 font-normal" placeholder="예: 1부,2목장,홍길동 또는 270102,홍길동" />
        </label>
        <button type="button" @click="applyRoster" :disabled="busy" class="px-3 py-2 border rounded-xl disabled:opacity-50">선생님 명단 적용</button>
        <p v-if="error" role="alert" class="text-rose-700">{{ error }}</p>
        <p v-if="rosterNotice" role="status" class="text-slate-700">{{ rosterNotice }}</p>
        <ul v-if="rosterIssues.length" role="alert" class="list-disc space-y-1 rounded-xl bg-rose-50 py-2 pl-7 pr-3 text-xs text-rose-800">
          <li v-for="issue in rosterIssues" :key="issue">{{ issue }}</li>
        </ul>
        <p v-if="rosterNeedsReview" class="text-xs text-slate-600">입력 내용을 적용하고 오류가 표시되면 해당 행을 수정한 뒤 다시 적용해주세요.</p>
        <p role="status">처리 완료 {{ completed }} / {{ rows.length }}개</p>
        <div class="overflow-x-auto max-h-60 overflow-y-auto">
          <table class="w-full text-left text-xs">
            <thead><tr><th class="p-2">목장</th><th class="p-2">로그인 아이디</th><th class="p-2">담당 선생님</th><th class="p-2">상태</th></tr></thead>
            <tbody>
              <tr v-for="row in rows" :key="row.code" class="border-t" :class="{ 'bg-blue-50': appliedCodes.has(row.code) || rosterPreview.has(row.code) }">
                <td class="p-2">{{ row.departmentName }} {{ row.name }}</td>
                <td class="p-2 font-bold">{{ row.code }}</td>
                <td class="p-2">
                  <template v-if="usesRegisteredName(row)">
                    <span class="font-medium">{{ rosterPreview.get(row.code) ?? importedNames.get(row.code) ?? row.teacherName }}</span>
                    <span v-if="registeredNameDiffers(row)" class="mt-1 block text-xs text-slate-500">
                      기존 계정 이름: {{ row.teacherName || '이름 없음' }}
                    </span>
                  </template>
                  <input v-else :value="rosterPreview.get(row.code) ?? row.teacherName"
                    :readonly="rosterPreview.has(row.code)" @input="row.teacherName = $event.target.value"
                    :disabled="busy" :aria-label="row.departmentName + ' ' + row.name + ' 담당 선생님'" class="w-full min-w-24 rounded-lg border bg-white p-2 text-slate-900" />
                </td>
                <td class="p-2">{{ labels[row.status] }}<span v-if="row.newGroup && !['existing', 'created'].includes(row.status)" class="block text-blue-700">목장 생성 예정</span><span v-if="row.error" class="block text-rose-700">{{ row.error }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <template #footer>
        <button type="button" @click="download" :disabled="busy || rosterNeedsReview || !credentialRows.length" class="px-3 py-3 border rounded-xl disabled:opacity-50">초기 비밀번호 CSV 다운로드</button>
        <button type="button" @click="create" :disabled="busy || rosterNeedsReview || !registerableRows.length" class="px-3 py-3 bg-blue-600 text-white rounded-xl disabled:opacity-50">{{ busy ? '처리 중…' : '목장 계정 등록' }}</button>
      </template>
    </Modal>
  </section>
</template>
<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import Modal from './Modal.vue';
import { useChurchStore } from '../stores/churchStore';
import { classesForYear, initialPassword, credentialCsv, provisionClasses, parseTeacherRoster } from '../utils/classAccounts.js';
import { classProvisioner } from '../api/classAccounts';
import { authErrorMessage } from '../stores/authStore';
const church = useChurchStore();
const rows = ref([]);
const visible = ref(false);
const busy = ref(false);
const error = ref('');
const rosterInput = ref('');
const rosterNotice = ref('');
const rosterIssues = ref([]);
const appliedRoster = ref('');
const appliedCodes = ref(new Set());
const rosterNeedsReview = computed(() => Boolean(rosterInput.value.trim())
  && (rosterInput.value !== appliedRoster.value || rosterIssues.value.length > 0));
const importedNames = ref(new Map());
const rosterPreview = computed(() => {
  if (rosterInput.value === appliedRoster.value || !rows.value.length) return new Map();
  return parseTeacherRoster(rosterInput.value, rows.value, { onInvalid: () => {} });
});
const preparedYear=ref('');
const loadedYear = ref('');
watch(()=>church.currentYear,()=>{
  rows.value=[];visible.value=false;rosterInput.value='';error.value='';preparedYear.value='';
  loadedYear.value='';
  importedNames.value.clear();
});
watch(rosterInput, () => {
  rosterNotice.value = '';
  rosterIssues.value = [];
  appliedRoster.value = '';
  appliedCodes.value = new Set();
});
const show = computed({get:()=>visible.value,set:value=>{if(!busy.value)visible.value=value;}});
const labels = {pending:'준비됨',reuse:'기존 계정 재배정 예정',creating:'등록 중',created:'생성 완료',existing:'기존 계정 사용',failed:'실패·재시도 가능'};
const completed = computed(()=>rows.value.filter(r=>['created','existing'].includes(r.status)).length);
const registerableRows = computed(() => rows.value.filter(row =>
  !['existing', 'created'].includes(row.status) && (row.reuseAccount || row.teacherName.trim())));
const credentialRows = computed(() => rows.value.filter(row =>
  !row.reuseAccount && row.status !== 'existing' && row.teacherName.trim()));
const usesRegisteredName = row => row.reuseAccount || ['existing', 'created'].includes(row.status);
const registeredNameDiffers = row => (rosterPreview.value.get(row.code) ?? importedNames.value.get(row.code) ?? row.teacherName) !== row.teacherName;
async function prepare() {
  if(busy.value)return;
  if (loadedYear.value === String(church.currentYear)) { visible.value=true; return; }
  const year=String(church.currentYear);
  preparedYear.value=year;
  busy.value=true; error.value='';
  try {
    await church.initChurchData({ preserveSelectedYear: true });
    if(String(church.currentYear)!==year)return;
    rows.value=classesForYear(church.groups,year).map(prepareRow);
    loadedYear.value = year;
    visible.value=true;
  } catch(err){if(String(church.currentYear)===year){error.value=authErrorMessage(err);visible.value=true;}}
  finally{busy.value=false;}
}
function prepareRow(row) {
  const existing = church.teachers.find(user => user.email?.toLowerCase() === row.email && user.role === 'teacher');
  const reuseAccount = !row.teacherId && !!existing;
  return {
    ...row,
    teacherName: row.teacherId ? row.teacherName || '' : existing?.name || '',
    password: row.teacherId || reuseAccount ? '' : initialPassword(row.code),
    reuseAccount,
    status: row.teacherId ? 'existing' : reuseAccount ? 'reuse' : 'pending',
    error: '',
  };
}
async function applyRoster() {
  if (busy.value) return;
  error.value = '';
  rosterNotice.value = '';
  const year = String(church.currentYear);
  if (!rosterInput.value.trim()) {
    error.value = '적용할 선생님 명단을 입력해주세요.';
    return;
  }
  if (loadedYear.value !== year) {
    await prepare();
    if (loadedYear.value !== year) return;
  }
  try {
    const issues = [];
    const newGroups = [];
    const names = parseTeacherRoster(rosterInput.value, rows.value, {
      year,
      onInvalid: issue => issues.push(issue),
      onNewGroup: row => newGroups.push(prepareRow(row)),
    });
    rows.value = [...rows.value.filter(row => !row.newGroup || ['created', 'existing'].includes(row.status) || names.has(row.code)), ...newGroups]
      .sort((a, b) => a.code.localeCompare(b.code));
    rosterIssues.value = issues;
    appliedRoster.value = rosterInput.value;
    appliedCodes.value = new Set(names.keys());
    let existingCount = 0;
    for (const row of rows.value) {
      const name = names.get(row.code);
      if (!name) continue;
      if (usesRegisteredName(row)) {
        importedNames.value.set(row.code, name);
        existingCount++;
      } else {
        row.teacherName = name;
      }
    }
    rosterNotice.value = names.size
      ? `${names.size}개 목장의 이름을 아래 표에 표시했습니다.`
      : '표에 반영할 명단이 없습니다.';
    if (existingCount) rosterNotice.value += ` 기존 계정 ${existingCount}개는 표에만 반영됩니다.`;
  } catch(err) { error.value=err.message; }
}
function download() {
  if (busy.value || rosterNeedsReview.value || !credentialRows.value.length) return;
  error.value='';
  const blob=new Blob([credentialCsv(credentialRows.value)],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob); const link=document.createElement('a');
  link.href=url;link.download=preparedYear.value+'-목장-초기계정.csv';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
}
async function create() {
  if (busy.value || rosterNeedsReview.value || !registerableRows.value.length || preparedYear.value!==String(church.currentYear)) return;
  error.value = '';
  busy.value = true;
  const batchRows=[...registerableRows.value];
  const year=preparedYear.value;
  try {
    await church.initChurchData({ preserveSelectedYear: true });
    if(String(church.currentYear)!==year)return;
    await provisionClasses(batchRows,classProvisioner(church.groups,church.teachers),(code,status,message)=>{
      const row=batchRows.find(r=>r.code===code);row.status=status;row.error=message;
    });
    const failed=batchRows.find(r=>r.status==='failed');
    if(failed && String(church.currentYear)===year)error.value=failed.error;
    if (!failed && String(church.currentYear) === year) {
      rosterNotice.value = `${batchRows.length}개 목장의 계정 등록을 완료했습니다.`;
    }
    await church.initChurchData({ preserveSelectedYear: true });
  }catch(err){if(String(church.currentYear)===year)error.value=authErrorMessage(err);}
  finally{busy.value=false;}
}
const warn=event=>{if(busy.value){event.preventDefault();event.returnValue='';}};
window.addEventListener('beforeunload',warn);
onBeforeUnmount(()=>window.removeEventListener('beforeunload',warn));
</script>
