<template>
  <Modal v-model="visible" :title="group ? `${church.currentYear}년 ${group.departmentName} ${group.name} 학생 관리` : '학생 관리'">
    <div v-if="group" class="space-y-4">
      <div v-if="!editing" class="space-y-3">
        <div class="flex items-center justify-between gap-2">
          <p class="text-sm font-bold">등록 학생 {{ students.length }}명</p>
          <button @click="openForm()" :disabled="busy" class="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm">학생 등록</button>
        </div>
        <p v-if="!students.length" class="text-sm text-slate-500 py-4">등록된 학생이 없습니다.</p>
        <div v-for="student in students" :key="student.id" class="border rounded-xl p-3 space-y-2">
          <div class="flex justify-between items-center gap-3">
            <div><strong>{{ student.name }}</strong><span class="text-xs text-slate-500 ml-2">{{ gradeLabel(student.grade) }} · {{ student.gender || '-' }}</span></div>
            <div class="flex gap-2 shrink-0">
              <button @click="openForm(student)" :disabled="busy" :aria-label="student.name + ' 수정'" class="px-3 py-2 border rounded-lg text-xs">수정</button>
              <button @click="remove(student)" :disabled="busy" :aria-label="student.name + ' 삭제'" class="px-3 py-2 bg-rose-50 text-rose-700 rounded-lg text-xs">삭제</button>
            </div>
          </div>
          <p class="text-xs text-slate-500">학생 {{ formatPhone(student.phone) || '-' }} · 부모님 {{ formatPhone(student.parentPhone) || '-' }}</p>
          <p v-if="student.notes" class="text-xs text-slate-600 whitespace-pre-wrap">{{ student.notes }}</p>
        </div>
      </div>
      <form v-else id="group-student-form" @submit.prevent="save" class="space-y-3 text-sm">
        <h3 class="font-bold">{{ editingId ? '학생 정보 수정' : '새 학생 등록' }}</h3>
        <fieldset :disabled="busy" class="space-y-3">
          <label class="block font-bold">학생 이름<input v-model="form.name" required maxlength="80" class="block w-full border rounded-xl p-3 mt-1" /></label>
          <div class="grid grid-cols-2 gap-3">
            <label class="block font-bold">학년<select v-model="form.grade" class="block w-full border rounded-xl p-3 mt-1 bg-white"><option v-for="grade in STUDENT_GRADES" :key="grade.value" :value="grade.value">{{ grade.label }}</option></select></label>
            <label class="block font-bold">성별<select v-model="form.gender" class="block w-full border rounded-xl p-3 mt-1 bg-white"><option value="남">남학생</option><option value="여">여학생</option></select></label>
          </div>
          <label class="block font-bold">생년월일<input v-model="form.birthDate" type="date" class="block w-full border rounded-xl p-3 mt-1" /></label>
          <label class="block font-bold">학생 연락처<input v-model="studentPhone" type="tel" inputmode="tel" placeholder="010-0000-0000" class="block w-full border rounded-xl p-3 mt-1" /></label>
          <label class="block font-bold">부모님 연락처<input v-model="parentPhone" type="tel" inputmode="tel" placeholder="010-0000-0000" class="block w-full border rounded-xl p-3 mt-1" /></label>
          <label class="block font-bold">비고 / 기도제목<textarea v-model="form.notes" rows="3" class="block w-full border rounded-xl p-3 mt-1" /></label>
        </fieldset>
      </form>
      <p v-if="error" role="alert" class="text-sm text-rose-700">{{ error }}</p>
      <p v-if="notice" role="status" class="text-sm text-emerald-700">{{ notice }}</p>
    </div>
    <template #footer>
      <button v-if="editing" @click="editing = false; error = ''" :disabled="busy" class="px-4 py-2 border rounded-xl">목록으로</button>
      <button v-else @click="visible = false" :disabled="busy" class="px-4 py-2 border rounded-xl">닫기</button>
      <button v-if="editing" type="submit" form="group-student-form" :disabled="busy || !group" class="px-4 py-2 bg-indigo-600 text-white rounded-xl disabled:opacity-40">{{ busy ? '저장 중…' : '저장' }}</button>
    </template>
  </Modal>
</template>
<script setup>
import {ref,computed,watch} from 'vue';
import Modal from './Modal.vue';
import {useChurchStore} from '../stores/churchStore';
import {useAuthStore,authErrorMessage} from '../stores/authStore';
import {STUDENT_GRADES,studentGrade,gradeLabel,phoneDigits,formatPhone} from '../utils/studentFields.js';
const props=defineProps({modelValue:Boolean,groupId:String});
const emit=defineEmits(['update:modelValue']);
const church=useChurchStore(),auth=useAuthStore();
const busy=ref(false),editing=ref(false),editingId=ref(null),error=ref(''),notice=ref('');
const visible=computed({get:()=>props.modelValue,set:value=>{if(!busy.value)emit('update:modelValue',value);}});
const group=computed(()=>church.currentGroups.find(group=>group.id===props.groupId));
const students=computed(()=>group.value ? [...church.getStudentsByGroup(group.value.id)].sort((a,b)=>a.name.localeCompare(b.name,'ko')) : []);
const emptyForm=()=>({name:'',grade:'초5',gender:'남',birthDate:'',phone:'',parentPhone:'',notes:''});
const form=ref(emptyForm());
const studentPhone=computed({get:()=>formatPhone(form.value.phone),set:value=>{form.value.phone=phoneDigits(value);}});
const parentPhone=computed({get:()=>formatPhone(form.value.parentPhone),set:value=>{form.value.parentPhone=phoneDigits(value);}});
watch([()=>props.modelValue,()=>props.groupId,()=>church.currentYear],()=>{editing.value=false;editingId.value=null;error.value='';notice.value='';form.value=emptyForm();});
function openForm(student){
  if(busy.value || !group.value || !auth.isAdmin)return;
  editingId.value=student?.id || null;
  form.value=student ? {name:student.name,grade:studentGrade(student.grade),gender:student.gender || '남',birthDate:student.birthDate || '',phone:phoneDigits(student.phone),parentPhone:phoneDigits(student.parentPhone),notes:student.notes || ''} : emptyForm();
  editing.value=true;error.value='';notice.value='';
}
async function save(){
  if(busy.value || !group.value || !auth.isAdmin)return;
  const payload={...form.value,name:form.value.name.trim()};
  if(!payload.name){error.value='학생 이름을 입력해주세요.';return;}
  const groupId=group.value.id,year=church.currentYear,id=editingId.value;
  if(id && !students.value.some(student=>student.id===id)){error.value='학생 정보가 변경되었습니다. 목록을 다시 확인해주세요.';return;}
  busy.value=true;error.value='';notice.value='';
  try{
    if(id)await church.updateStudent(id,payload);
    else await church.addStudent({...payload,groupId,departmentId:group.value.departmentId});
    if(props.groupId===groupId && church.currentYear===year){editing.value=false;form.value=emptyForm();notice.value='학생 정보를 저장했습니다.';}
  }catch(err){if(props.groupId===groupId && church.currentYear===year)error.value=authErrorMessage(err);}
  finally{busy.value=false;}
}
async function remove(student){
  if(busy.value || !group.value || !auth.isAdmin || !students.value.some(row=>row.id===student.id))return;
  if(!confirm(student.name+' 학생과 기존 달란트 내역을 삭제하시겠습니까? 모든 월의 기존 달란트가 합계에서 제거됩니다. 출석 기록은 보존됩니다.'))return;
  const groupId=props.groupId,year=church.currentYear;
  busy.value=true;error.value='';notice.value='';
  try{
    await church.removeStudentWithTalents(student.id);
    if(props.groupId===groupId && church.currentYear===year)notice.value='학생과 기존 달란트 내역을 삭제했습니다.';
  }catch(err){if(props.groupId===groupId && church.currentYear===year)error.value=authErrorMessage(err);}
  finally{busy.value=false;}
}
</script>
