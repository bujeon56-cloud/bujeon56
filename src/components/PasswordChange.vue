<template>
  <button @click="show = true" class="p-2 text-xs text-indigo-700 font-bold rounded-xl border" title="내 비밀번호 변경">비밀번호</button>
  <Modal v-model="show" title="내 비밀번호 변경">
    <form id="change-own-password" @submit.prevent="save" class="space-y-4">
      <label class="block text-sm">현재 비밀번호<input v-model="current" required type="password" autocomplete="current-password" class="block w-full border rounded-xl p-3 mt-1" /></label>
      <label class="block text-sm">새 비밀번호<input v-model="next" required minlength="6" type="password" autocomplete="new-password" class="block w-full border rounded-xl p-3 mt-1" /></label>
      <label class="block text-sm">새 비밀번호 확인<input v-model="repeat" required minlength="6" type="password" autocomplete="new-password" class="block w-full border rounded-xl p-3 mt-1" /></label>
      <p v-if="error" role="alert" class="text-sm text-rose-700">{{ error }}</p>
      <p v-if="notice" role="status" class="text-sm text-emerald-700">{{ notice }}</p>
    </form>
    <template #footer><button type="submit" form="change-own-password" :disabled="busy" class="px-4 py-3 bg-indigo-600 text-white rounded-xl disabled:opacity-50">{{busy ? '변경 중…' : '내 비밀번호 변경'}}</button></template>
  </Modal>
</template>
<script setup>
import {ref,watch} from 'vue';
import Modal from './Modal.vue';
import {auth,EmailAuthProvider,reauthenticateWithCredential,updatePassword} from '../api/firebase';
import {authErrorMessage} from '../stores/authStore';
const show=ref(false),current=ref(''),next=ref(''),repeat=ref(''),error=ref(''),notice=ref(''),busy=ref(false);
watch(show,()=>{current.value='';next.value='';repeat.value='';error.value='';notice.value='';});
async function save(){
  error.value='';notice.value='';
  if(next.value!==repeat.value){error.value='새 비밀번호가 일치하지 않습니다.';return;}
  if(!auth.currentUser?.email){error.value='다시 로그인해주세요.';return;}
  busy.value=true;
  try{
    await reauthenticateWithCredential(auth.currentUser,EmailAuthProvider.credential(auth.currentUser.email,current.value));
    await updatePassword(auth.currentUser,next.value);
    current.value='';next.value='';repeat.value='';notice.value='비밀번호를 변경했습니다.';
  }catch(err){error.value=authErrorMessage(err);}
  finally{busy.value=false;}
}
</script>
