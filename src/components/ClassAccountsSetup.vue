<template>
  <section class="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 space-y-3">
    <!-- 2026년 목장별 로그인 계정 안내
    <h3 class="font-bold text-indigo-900">2026년 목장별 로그인 계정</h3>
    <p class="text-sm text-indigo-900">1부 1~14목장: 260101~260114 · 2부 1~8목장: 260201~260208</p>
    -->
    <h3 class="font-bold text-indigo-900">선생님 일괄 등록</h3>
    <p class="text-sm text-indigo-900">선택한 {{ church.currentYear }}년의 등록된 목장을 기준으로 준비합니다. 목장이 없으면 목장 관리에서 먼저 등록해주세요.</p>
    <button @click="prepare" :disabled="busy" class="bg-indigo-600 text-white font-bold rounded-xl px-4 py-3 disabled:opacity-50">{{ church.currentYear }}년 선생님 일괄 등록</button>
    <p v-if="!show && error" role="alert" class="text-sm text-rose-700">{{ error }}</p>
    <Modal v-model="show" :title="preparedYear + '년 목장 계정 생성'">
      <div class="space-y-3 text-sm">
        <p>각 계정은 자기 반의 학생·출석·달란트만 관리합니다. 이미 배정된 교사 계정은 유지합니다.</p>
        <p class="p-3 bg-amber-50 text-amber-900 rounded-xl">아이디와 초기 비밀번호는 동일한 6자리입니다. 비밀번호 변경은 강제하지 않습니다. 계정 목록은 담당 선생님에게만 전달하세요.</p>
        <label class="block font-bold">담당 선생님 일괄 입력
          <textarea v-model="rosterInput" :disabled="busy" rows="3" class="block w-full border rounded-xl p-2 mt-1 font-normal" placeholder="부서,목장번호,선생님 (예: 1,1,홍길동)" />
        </label>
        <button @click="applyRoster" :disabled="busy" class="px-3 py-2 border rounded-xl">선생님 명단 적용</button>
        <p v-if="error" role="alert" class="text-rose-700">{{ error }}</p>
        <p role="status">처리 완료 {{ completed }} / {{ rows.length }}개</p>
        <div class="overflow-x-auto max-h-60 overflow-y-auto">
          <table class="w-full text-left text-xs">
            <thead><tr><th class="p-2">목장</th><th class="p-2">로그인 아이디</th><th class="p-2">담당 선생님</th><th class="p-2">상태</th></tr></thead>
            <tbody><tr v-for="row in rows" :key="row.code" class="border-t"><td class="p-2">{{ row.departmentName }} {{ row.name }}</td><td class="p-2 font-bold">{{ row.code }}</td><td class="p-2"><input v-model="row.teacherName" :disabled="busy || row.status === 'created'" :aria-label="row.departmentName + ' ' + row.name + ' 담당 선생님'" class="w-24 p-2 border rounded-lg" /></td><td class="p-2">{{ labels[row.status] }}<span v-if="row.error" class="text-rose-700 block">{{ row.error }}</span></td></tr></tbody>
          </table>
        </div>
      </div>
      <template #footer>
        <button @click="download" :disabled="busy || !rows.some(r => r.status !== 'existing')" class="px-3 py-3 border rounded-xl disabled:opacity-50">초기 비밀번호 CSV 다운로드</button>
        <button @click="create" :disabled="busy || !exported || completed === rows.length" class="px-3 py-3 bg-indigo-600 text-white rounded-xl disabled:opacity-50">{{ busy ? '생성 중… 창을 닫지 마세요' : '목장 계정 생성' }}</button>
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
const exported = ref(false);
const error = ref('');
const rosterInput = ref('');
const preparedYear=ref('');
watch(()=>church.currentYear,()=>{
  rows.value=[];visible.value=false;exported.value=false;rosterInput.value='';error.value='';preparedYear.value='';
});
watch(rows,()=>{exported.value=false;},{deep:true,flush:'sync'});
const show = computed({get:()=>visible.value,set:value=>{if(!busy.value)visible.value=value;}});
const labels = {pending:'준비됨',creating:'생성 중',created:'생성 완료',existing:'기존 배정 유지',failed:'실패·재시도 가능'};
const completed = computed(()=>rows.value.filter(r=>['created','existing'].includes(r.status)).length);
async function prepare() {
  if(busy.value)return;
  if (rows.value.length) { visible.value=true; return; }
  const year=String(church.currentYear);
  busy.value=true; error.value='';
  try {
    await church.initChurchData();
    if(String(church.currentYear)!==year)return;
    preparedYear.value=year;
    rows.value=classesForYear(church.groups,year).map(row=>{
      const group=church.groups.find(g=>g.id===row.id);
      return {...row,teacherName:group?.teacherName || '',password:group?.teacherId ? '' : initialPassword(row.code),status:group?.teacherId ? 'existing' : 'pending',error:''};
    });
    if(!rows.value.length)throw new Error(year+'년 등록된 목장이 없습니다. 목장 관리에서 먼저 등록해주세요.');
    visible.value=true;
  } catch(err){error.value=authErrorMessage(err);visible.value=true;}
  finally{busy.value=false;}
}
function applyRoster() {
  error.value='';
  try {
    const names=parseTeacherRoster(rosterInput.value, rows.value);
    for(const row of rows.value) if(names.has(row.code) && row.status!=='created') row.teacherName=names.get(row.code);
    exported.value=false;
  } catch(err) { error.value=err.message; }
}
function download() {
  if(rows.value.some(row=>!row.teacherName.trim())) {error.value='모든 목장에 담당 선생님을 입력해주세요. 미정이면 미정으로 입력하세요.';return;}
  const blob=new Blob([credentialCsv(rows.value.filter(r=>r.status!=='existing'))],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob); const link=document.createElement('a');
  link.href=url;link.download=preparedYear.value+'-목장-초기계정.csv';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
  exported.value=true;
}
async function create() {
  if (!exported.value || busy.value || !rows.value.length || preparedYear.value!==String(church.currentYear)) return;
  if(rows.value.some(row=>!row.teacherName.trim())) {error.value='담당 선생님을 모두 입력해주세요.';return;}
  busy.value=true;error.value='';
  const batchRows=rows.value;
  const year=preparedYear.value;
  try {
    await church.initChurchData();
    if(String(church.currentYear)!==year)return;
    await provisionClasses(batchRows,classProvisioner(church.groups,church.teachers),(code,status,message)=>{
      const row=batchRows.find(r=>r.code===code);row.status=status;row.error=message;
    });
    const failed=batchRows.find(r=>r.status==='failed');
    if(failed && String(church.currentYear)===year)error.value=failed.error;
    await church.initChurchData();
  }catch(err){error.value=authErrorMessage(err);}
  finally{busy.value=false;}
}
const warn=event=>{if(busy.value){event.preventDefault();event.returnValue='';}};
window.addEventListener('beforeunload',warn);
onBeforeUnmount(()=>window.removeEventListener('beforeunload',warn));
</script>
