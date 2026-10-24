import {createPinia,setActivePinia} from 'pinia';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {STUDENT_GRADES,studentGrade,gradeLabel,phoneDigits,formatPhone,normalizeStudentFields} from '../src/utils/studentFields.js';
import {clearedAttendance} from '../src/utils/attendanceChecks.js';
test('only fifth, sixth and other grades are offered; old values display consistently',()=>{
 assert.deepEqual(STUDENT_GRADES.map(g=>g.label),['5학년','6학년','기타']);
 assert.equal(studentGrade('초5'),'초5');assert.equal(gradeLabel('초6'),'6학년');assert.equal(gradeLabel('초4'),'기타');assert.equal(studentGrade('5학년'),'초5');
});
test('phone display uses separators but student persistence keeps digits and leading zero',()=>{
 for(const [raw,display] of [['01012345678','010-1234-5678'],['0212345678','02-1234-5678'],['0511234567','051-123-4567'],['15881234','1588-1234'],['','']])assert.equal(formatPhone(raw),display);
 assert.equal(phoneDigits('010-1234 5678'),'01012345678');
 const raw={phone:'010-1234-5678',parentPhone:'02-123-4567',name:'학생'};
 assert.deepEqual(normalizeStudentFields(raw),{phone:'01012345678',parentPhone:'021234567',name:'학생'});
 assert.equal(raw.phone,'010-1234-5678');assert.deepEqual(normalizeStudentFields({notes:'수정'}),{notes:'수정'});
});
test('reset clears every checkbox, including custom and retired items, without mutating input',()=>{
 const before={s:{attendance:true,bibleReading:true,prayer:true,custom:true,retired:true,notes:'보존',updatedAt:'old'},inactive:{attendance:true,custom:true}};
 const cleared=clearedAttendance(before,[{id:'s'},{id:'new'}],[{id:'attendance'},{id:'newItem'}],'now');
 for(const checks of Object.values(cleared))for(const value of Object.values(checks))if(typeof value==='boolean')assert.equal(value,false);
 assert.equal(cleared.s.notes,'보존');assert.equal(cleared.s.updatedAt,'now');assert.equal(cleared.new.newItem,false);assert.equal(before.s.custom,true);
});
test('cloud reset commits the whole target group once and leaves other groups untouched',async()=>{
 let source=await readFile('src/api/storage.js','utf8');
 source=source.replace(/import \{\s*db,[\s\S]+?\} from '\.\/firebase';/,`const {db,isFirebaseConfigured,collection,doc,setDoc,getDoc,getDocs,updateDoc,deleteDoc,query,where,orderBy,onSnapshot}=globalThis.__studentDb; const runTransaction=(...args)=>globalThis.__studentDb.runTransaction(...args);`)
 .replace("from '../utils/studentFields.js'",`from '${import.meta.resolve('../src/utils/studentFields.js')}'`).replace("from '../utils/attendanceChecks.js'",`from '${import.meta.resolve('../src/utils/attendanceChecks.js')}'`);
 const key='attendances/2026_2026-10-25_g1';
 const docs={[key]:{year:'2026',date:'2026-10-25',groupId:'g1',records:{s:{attendance:true,prayer:true}}},other:{records:{s:{attendance:true}}}};
 let writes=0,saved;
 globalThis.__studentDb={db:{},isFirebaseConfigured:true,doc:(db,col,id)=>col+'/'+id,setDoc:async(ref,payload)=>{saved=payload;},runTransaction:async (db,fn)=>fn({get:async ref=>({exists:()=>!!docs[ref],data:()=>docs[ref]}),set:(ref,payload)=>{assert.equal(ref,key);writes++;docs[ref]=payload;}})};
 const {DBService}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 const records=await DBService.resetGroupAttendance('2026','2026-10-25','g1',[{id:'s'}],[{id:'attendance'},{id:'prayer'}]);
 assert.equal(writes,1);assert.equal(records.s.prayer,false);assert.equal(docs.other.records.s.attendance,true);
 await DBService.set('students','s',{phone:'010-1234-5678',parentPhone:'010 1111 2222'});
 assert.equal(saved.phone,'01012345678');assert.equal(saved.parentPhone,'01011112222');
 // Administrator edits merge only changed checks, preserving concurrent changes and closed submissions.
 const submissionKey='submissions/2026_2026-10-25_g1';
 docs[key].records.s={attendance:false,prayer:true,custom:true,notes:'학생 메모'};
 docs[key].records.other={attendance:true};
 docs[submissionKey]={submitted:true,teacherId:'teacher',submittedAt:'original',notes:'이전 메모'};
 globalThis.__studentDb.runTransaction=async(db,fn)=>{
  const pending=[];
  const result=await fn({get:async ref=>({exists:()=>!!docs[ref],data:()=>structuredClone(docs[ref])}),set:(ref,payload)=>pending.push([ref,payload])});
  for(const [ref,payload] of pending)docs[ref]={...docs[ref],...payload};
  return result;
 };
 const edited=await DBService.saveAdminAttendance('2026','2026-10-25','g1',{s:{attendance:true}},'수정 메모');
 assert.equal(edited.s.attendance,true);assert.equal(edited.s.prayer,true);assert.equal(edited.s.custom,true);assert.equal(edited.s.notes,'학생 메모');assert.equal(edited.other.attendance,true);
 assert.equal(docs[submissionKey].submitted,true);assert.equal(docs[submissionKey].submittedAt,'original');assert.equal(docs[submissionKey].teacherId,'teacher');assert.equal(docs[submissionKey].notes,'수정 메모');
 delete docs[submissionKey];
 await assert.rejects(DBService.saveAdminAttendance('2026','2026-10-25','g1',{s:{attendance:false}},'충돌'),/제출 상태가 변경/);
 assert.equal(docs[key].records.s.attendance,true);
 const before=structuredClone(docs[key]);
 globalThis.__studentDb.runTransaction=async()=>{throw new Error('permission-denied');};
 await assert.rejects(DBService.saveAdminAttendance('2026','2026-10-25','g1',{s:{attendance:false}}),/permission-denied/);
 assert.deepEqual(docs[key],before);
 delete globalThis.__studentDb;
});

test('reset action preserves locked records, failed writes and a newly selected group',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 let source=await readFile('src/stores/attendanceStore.js','utf8');
 source=source.replace("from '../utils/sundays.js'",`from '${import.meta.resolve('../src/utils/sundays.js')}'`).replace("from 'pinia'",`from '${import.meta.resolve('pinia')}'`).replace(/import \{ DBService[^\n]+\n/, 'const DBService=globalThis.__resetAction;\n').replace(/import \{ useChurchStore[^\n]+\n/, "const useChurchStore=()=>({checkItems:[{id:'attendance'},{id:'prayer'}]});\n");
 let calls=0;
 const cleared={s:{attendance:false,prayer:false}};
 globalThis.__resetAction={resetGroupAttendance:async()=>{calls++;return cleared;}};
 const {useAttendanceStore}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 setActivePinia(createPinia());const store=useAttendanceStore();
 store.selectedDate='2026-10-25';store.activeGroupKey='2026_2026-10-25_g1';store.records={s:{attendance:true,prayer:true}};
 await store.setAllAttendance('2026','g1',[{id:'s'}],false);
 assert.equal(store.records.s.prayer,false);assert.equal(store.saveStatus,'saved');
 const previous={s:{attendance:true,prayer:true}};store.records=previous;
 globalThis.__resetAction.resetGroupAttendance=async()=>{calls++;throw new Error('network');};
 await assert.rejects(store.setAllAttendance('2026','g1',[{id:'s'}],false),/network/);
 assert.equal(store.records.s.prayer,true);assert.equal(store.saveStatus,'error');
 store.submission={submitted:true};await store.setAllAttendance('2026','g1',[{id:'s'}],false);assert.equal(calls,2);
 store.submission=null;store.saveStatus='idle';let finish;
 globalThis.__resetAction.resetGroupAttendance=()=>new Promise(resolve=>{finish=resolve;});
 const pending=store.setAllAttendance('2026','g1',[{id:'s'}],false);
 store.activeGroupKey='2026_2026-10-25_g2';store.records={other:{attendance:true}};
 finish(cleared);await pending;assert.equal(store.records.other.attendance,true);assert.equal(store.records.s,undefined);
 t.mock.timers.tick(2000);delete globalThis.__resetAction;
});
