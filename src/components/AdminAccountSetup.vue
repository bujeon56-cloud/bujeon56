<template>
  <section v-if="auth.isAdmin" id="admin-account" class="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
    <h3 class="font-bold text-base">간편 관리자 계정</h3>
    <p class="text-sm text-slate-600">기존 이메일 계정을 유지하면서 관리자 아이디를 추가합니다.</p>
    <p v-if="existing" class="text-sm text-indigo-700">{{ existing.role === 'admin' ? '관리자 아이디 bujeon56이 등록되어 있습니다.' : '같은 아이디의 계정이 있어 자동으로 변경할 수 없습니다.' }}</p>
    <form v-else @submit.prevent="create" class="space-y-3 max-w-sm">
      <label class="block text-sm font-bold">아이디<input value="bujeon56" readonly autocomplete="off" class="block w-full border rounded-xl p-3 mt-1 bg-slate-50" /></label>
      <label class="block text-sm font-bold">비밀번호<input v-model="password" type="password" autocomplete="new-password" minlength="6" required :disabled="busy" class="block w-full border rounded-xl p-3 mt-1" /></label>
      <button :disabled="busy" class="px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold disabled:opacity-50">{{ busy ? '추가 중…' : '간편 관리자 계정 추가' }}</button>
    </form>
    <p v-if="error" role="alert" class="text-sm text-rose-700">{{ error }}</p>
    <p v-if="notice" role="status" class="text-sm text-emerald-700">{{ notice }}</p>
  </section>
</template>
<script setup>
import {ref,computed,onBeforeUnmount} from 'vue';
import {useChurchStore} from '../stores/churchStore';
import {useAuthStore,authErrorMessage} from '../stores/authStore';
import {classLoginEmail} from '../utils/classAccounts.js';
const church=useChurchStore(),auth=useAuthStore();
const password=ref(''),busy=ref(false),error=ref(''),notice=ref('');
const existing=computed(()=>church.teachers.find(teacher=>teacher.email===classLoginEmail('bujeon56')));
async function create(){
  if(busy.value||existing.value)return;
  if(!auth.isAdmin){error.value='기존 관리자 계정으로 로그인해주세요.';return;}
  busy.value=true;error.value='';notice.value='';
  try{
    await church.addTeacher({username:'bujeon56',email:classLoginEmail('bujeon56'),password:password.value,name:'관리자',position:'관리자',role:'admin'});
    password.value='';notice.value='관리자 아이디 bujeon56을 추가했습니다. 기존 이메일 로그인도 그대로 사용할 수 있습니다.';
  }catch(err){error.value=authErrorMessage(err);}
  finally{busy.value=false;}
}
onBeforeUnmount(()=>{password.value='';});
</script>
