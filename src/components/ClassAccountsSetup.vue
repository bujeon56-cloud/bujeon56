<template>
  <section class="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 space-y-3">
    <h3 class="font-bold text-indigo-900">2026년 목장별 로그인 계정</h3>
    <p class="text-sm text-indigo-900">1부 1~14목장: 2611~26114 · 2부 1~8목장: 2621~2628</p>
    <button @click="prepare" :disabled="busy" class="bg-indigo-600 text-white font-bold rounded-xl px-4 py-3 disabled:opacity-50">2026년 22개 목장 계정 준비</button>
    <Modal v-model="show" title="2026년 목장 계정 생성">
      <div class="space-y-3 text-sm">
        <p>각 계정은 자기 반의 학생·출석·달란트만 관리합니다. 이미 배정된 교사 계정은 유지합니다.</p>
        <p class="p-3 bg-amber-50 text-amber-900 rounded-xl">생성 전에 초기 비밀번호 CSV를 내려받으세요. 비밀번호는 DB에 저장하지 않으며 화면을 닫거나 새로고침하면 다시 조회할 수 없습니다. 계정 목록은 담당 선생님에게만 전달하세요.</p>
        <p v-if="error" role="alert" class="text-rose-700">{{ error }}</p>
        <p role="status">처리 완료 {{ completed }} / {{ rows.length }}개</p>
        <div class="overflow-x-auto max-h-60 overflow-y-auto">
          <table class="w-full text-left text-xs">
            <thead><tr><th class="p-2">목장</th><th class="p-2">로그인 아이디</th><th class="p-2">상태</th></tr></thead>
            <tbody><tr v-for="row in rows" :key="row.code" class="border-t"><td class="p-2">{{ row.departmentName }} {{ row.name }}</td><td class="p-2 font-bold">{{ row.code }}</td><td class="p-2">{{ labels[row.status] }}<span v-if="row.error" class="text-rose-700 block">{{ row.error }}</span></td></tr></tbody>
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
import { ref, computed, onBeforeUnmount } from 'vue';
import Modal from './Modal.vue';
import { useChurchStore } from '../stores/churchStore';
import { classes2026, initialPassword, credentialCsv, provisionClasses } from '../utils/classAccounts.js';
import { classProvisioner } from '../api/classAccounts';
import { authErrorMessage } from '../stores/authStore';
const church = useChurchStore();
const rows = ref([]);
const visible = ref(false);
const busy = ref(false);
const exported = ref(false);
const error = ref('');
const show = computed({get:()=>visible.value,set:value=>{if(!busy.value)visible.value=value;}});
const labels = {pending:'준비됨',creating:'생성 중',created:'생성 완료',existing:'기존 배정 유지',failed:'실패·재시도 가능'};
const completed = computed(()=>rows.value.filter(r=>['created','existing'].includes(r.status)).length);
async function prepare() {
  if (rows.value.length) { visible.value=true; return; }
  busy.value=true; error.value='';
  try {
    await church.initChurchData();
    rows.value=classes2026().map(row=>{
      const group=church.groups.find(g=>g.year===row.year && g.departmentId===row.departmentId && (g.name===row.name || g.order===row.order));
      return {...row,password:group?.teacherId ? '' : initialPassword(),status:group?.teacherId ? 'existing' : 'pending',error:''};
    });
    visible.value=true;
  } catch(err){error.value=authErrorMessage(err);visible.value=true;}
  finally{busy.value=false;}
}
function download() {
  const blob=new Blob([credentialCsv(rows.value.filter(r=>r.status!=='existing'))],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob); const link=document.createElement('a');
  link.href=url;link.download='2026-목장-초기계정.csv';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
  exported.value=true;
}
async function create() {
  if (!exported.value || busy.value) return;
  busy.value=true;error.value='';
  try {
    await church.initChurchData();
    await provisionClasses(rows.value,classProvisioner(church.groups,church.teachers),(code,status,message)=>{
      const row=rows.value.find(r=>r.code===code);row.status=status;row.error=message;
    });
    const failed=rows.value.find(r=>r.status==='failed');
    if(failed)error.value=failed.error;
    await church.initChurchData();
  }catch(err){error.value=authErrorMessage(err);}
  finally{busy.value=false;}
}
const warn=event=>{if(busy.value){event.preventDefault();event.returnValue='';}};
window.addEventListener('beforeunload',warn);
onBeforeUnmount(()=>window.removeEventListener('beforeunload',warn));
</script>
