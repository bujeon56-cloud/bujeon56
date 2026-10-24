<template>
  <div v-if="auth.isAdmin" class="space-y-6">
    <h2 class="text-xl font-black text-slate-900">계정 관리</h2>
    <section class="bg-white border rounded-2xl p-5 space-y-4">
      <div class="flex flex-wrap justify-between items-center gap-3">
        <h3 class="font-bold">관리자 계정 목록 · {{ admins.length }}명</h3>
        <button @click="open()" :disabled="busy" class="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold">관리자 등록</button>
      </div>
      <p class="text-sm text-slate-500">관리자 계정은 연도와 관계없이 모든 목장을 관리합니다. 현재 로그인한 계정은 삭제할 수 없습니다.</p>
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left">
          <thead><tr class="border-b"><th class="p-3">성함</th><th class="p-3">로그인 아이디 / 이메일</th><th class="p-3">직책</th><th class="p-3">연락처</th><th class="p-3">관리</th></tr></thead>
          <tbody><tr v-for="account in admins" :key="account.id" class="border-b">
            <td class="p-3">{{ account.name }} <span v-if="account.id === auth.user?.id" class="text-xs text-indigo-600">(내 계정)</span></td>
            <td class="p-3">{{ account.email === classLoginEmail('bujeon56') ? 'bujeon56' : account.email }}</td>
            <td class="p-3">{{ account.position || '-' }}</td><td class="p-3">{{ account.phone || '-' }}</td>
            <td class="p-3"><div class="flex gap-2 whitespace-nowrap">
              <button @click="open(account)" :disabled="busy" class="px-3 py-2 border rounded-xl">수정</button>
              <button @click="remove(account)" :disabled="busy || account.id === auth.user?.id" class="px-3 py-2 rounded-xl bg-rose-600 text-white disabled:opacity-40">삭제</button>
            </div></td>
          </tr><tr v-if="!admins.length"><td colspan="5" class="p-4 text-slate-500">등록된 관리자 계정이 없습니다.</td></tr></tbody>
        </table>
      </div>
      <p class="text-xs text-slate-500">삭제하면 관리자 등록과 서비스 데이터 접근 권한이 제거됩니다. Firebase Authentication의 로그인 계정 자체는 남으며, 완전 삭제는 Firebase 콘솔에서 처리합니다.</p>
      <p v-if="error" role="alert" class="text-sm text-rose-700">{{ error }}</p>
      <p v-if="notice" role="status" class="text-sm text-emerald-700">{{ notice }}</p>
    </section>
    <AdminAccountSetup />
    <Modal v-model="show" :title="editingId ? '관리자 정보 수정' : '관리자 등록'">
      <form id="admin-form" @submit.prevent="save" class="space-y-3">
        <label class="block text-sm font-bold">성함<input v-model="form.name" required maxlength="80" class="block w-full border rounded-xl p-3 mt-1" /></label>
        <label class="block text-sm font-bold">로그인 이메일<input v-model="form.email" type="email" required :disabled="!!editingId" autocomplete="off" class="block w-full border rounded-xl p-3 mt-1 disabled:bg-slate-100" /></label>
        <p v-if="editingId" class="text-xs text-slate-500">로그인 정보는 유지되며 성함·직책·연락처를 수정할 수 있습니다.</p>
        <label v-else class="block text-sm font-bold">초기 비밀번호<input v-model="form.password" type="password" required minlength="6" autocomplete="new-password" class="block w-full border rounded-xl p-3 mt-1" /></label>
        <label class="block text-sm font-bold">직책<input v-model="form.position" class="block w-full border rounded-xl p-3 mt-1" /></label>
        <label class="block text-sm font-bold">연락처<input v-model="form.phone" type="tel" class="block w-full border rounded-xl p-3 mt-1" /></label>
        <p v-if="formError" role="alert" class="text-sm text-rose-700">{{ formError }}</p>
      </form>
      <template #footer>
        <button @click="show = false" :disabled="busy" class="px-4 py-3 border rounded-xl">취소</button>
        <button form="admin-form" type="submit" :disabled="busy" class="px-4 py-3 bg-indigo-600 text-white rounded-xl disabled:opacity-50">{{ busy ? '저장 중…' : '저장' }}</button>
      </template>
    </Modal>
  </div>
</template>
<script setup>
import {ref, computed, watch} from 'vue';
import {useAuthStore, authErrorMessage} from '../../stores/authStore';
import {useChurchStore} from '../../stores/churchStore';
import {classLoginEmail} from '../../utils/classAccounts.js';
import Modal from '../../components/Modal.vue';
import AdminAccountSetup from '../../components/AdminAccountSetup.vue';
const auth=useAuthStore();
const church=useChurchStore();
const admins=computed(()=>church.teachers.filter(t=>t.role==='admin').sort((a,b)=>(a.name || '').localeCompare(b.name || '', 'ko')));
const visible=ref(false),busy=ref(false),editingId=ref(null),error=ref(''),formError=ref(''),notice=ref('');
const show=computed({get:()=>visible.value,set:value=>{if(!busy.value)visible.value=value;}});
const emptyForm=()=>({name:'',email:'',password:'',position:'',phone:''});
const form=ref(emptyForm());
watch(visible,value=>{if(!value)form.value=emptyForm();});
function open(account){
  if(busy.value)return;
  editingId.value=account?.id || null;
  form.value=account ? {name:account.name || '',email:account.email || '',password:'',position:account.position || '',phone:account.phone || ''} : emptyForm();
  formError.value='';visible.value=true;
}
async function save(){
  if(busy.value || !auth.isAdmin)return;
  busy.value=true;formError.value='';error.value='';notice.value='';
  try{
    const profile={name:form.value.name.trim(),position:form.value.position.trim(),phone:form.value.phone.trim(),role:'admin'};
    if(!profile.name)throw new Error('성함을 입력해주세요.');
    if(editingId.value){
      if(!admins.value.some(a=>a.id===editingId.value))throw new Error('관리자 계정을 찾을 수 없습니다.');
      await church.updateTeacher(editingId.value,profile);
    }else{
      await church.addTeacher({...profile,email:form.value.email.trim(),password:form.value.password});
    }
    form.value=emptyForm();visible.value=false;notice.value='관리자 정보를 저장했습니다.';
  }catch(err){formError.value=authErrorMessage(err);}
  finally{busy.value=false;}
}
async function remove(account){
  if(busy.value || !auth.isAdmin || account.id===auth.user?.id)return;
  if(!confirm(account.name+' 관리자 등록을 삭제하시겠습니까? 서비스 데이터 접근 권한이 제거됩니다. Firebase 로그인 계정 자체는 남습니다.'))return;
  busy.value=true;error.value='';notice.value='';
  try{await church.deleteAdminAccount(account.id);notice.value='관리자 등록과 데이터 접근 권한을 삭제했습니다.';}
  catch(err){error.value=authErrorMessage(err);}
  finally{busy.value=false;}
}
</script>
