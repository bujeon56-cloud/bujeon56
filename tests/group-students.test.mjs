import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {ref,computed,watch,reactive,nextTick} from 'vue';
import * as fields from '../src/utils/studentFields.js';

test('admin group student management scopes changes, preserves history and ignores stale completion',async()=>{
 const source=await readFile('src/components/GroupStudentsManager.vue','utf8');
 const script=source.match(/<script setup>([\s\S]*?)<\/script>/)[1].replace(/^import .*;\r?\n/gm,'');
 const props=reactive({modelValue:true,groupId:'a'}),auth={isAdmin:true};
 const students=[{id:'one',groupId:'a',year:'2026',name:'학생',grade:'초5',gender:'남',notes:'기존 메모',active:true},{id:'two',groupId:'b',year:'2026',name:'다른 반'},{id:'old',groupId:'a',year:'2025',name:'이전 연도'}];
 let fail=false,finish;
 const church=reactive({currentYear:'2026',groups:[{id:'a',year:'2026',departmentId:'part1'},{id:'b',year:'2026',departmentId:'part2'}],students,
  get currentGroups(){return this.groups.filter(group=>group.year===this.currentYear);},
  getStudentsByGroup(id){return this.students.filter(student=>student.groupId===id && student.year===this.currentYear && student.active!==false);},
  async updateStudent(id,payload){if(fail)throw new Error('네트워크 오류');Object.assign(this.students.find(student=>student.id===id),fields.normalizeStudentFields(payload));},
  async addStudent(payload){await new Promise(resolve=>{finish=resolve;});this.students.push({...payload,id:'new',year:'2026',active:true});}
 });
 const names=['ref','computed','watch','defineProps','defineEmits','useChurchStore','useAuthStore','authErrorMessage','confirm',...Object.keys(fields)];
 const values=[ref,computed,watch,()=>props,()=>()=>{},()=>church,()=>auth,error=>error.message,()=>true,...Object.values(fields)];
 const ui=new Function(...names,script+';return {students,form,editing,editingId,error,notice,busy,openForm,save,remove};')(...values);
 assert.deepEqual(ui.students.value.map(student=>student.id),['one']);
 ui.openForm(church.students[0]);ui.form.value.name='수정 학생';await ui.save();
 assert.equal(church.students[0].name,'수정 학생');assert.equal(church.students[0].notes,'기존 메모');
 assert.equal(church.students[1].name,'다른 반');assert.equal(church.students[2].name,'이전 연도');
 ui.openForm(church.students[0]);fail=true;ui.form.value.name='저장 실패';await ui.save();
 assert.equal(ui.editing.value,true);assert.equal(ui.error.value,'네트워크 오류');assert.equal(church.students[0].name,'수정 학생');fail=false;
 await ui.remove(church.students[0]);assert.equal(church.students[0].active,false);assert.equal(church.students[0].notes,'기존 메모');assert.equal(ui.students.value.length,0);
 ui.openForm();ui.form.value.name='새 학생';const pending=ui.save();
 church.currentYear='2027';await nextTick();finish();await pending;
 assert.equal(ui.notice.value,'');assert.equal(ui.students.value.length,0);assert.equal(ui.busy.value,false);
});
