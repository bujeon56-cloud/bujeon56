import {createPinia,setActivePinia} from 'pinia';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {STUDENT_GRADES,studentGrade,gradeLabel,phoneDigits,formatPhone,normalizeStudentFields} from '../src/utils/studentFields.js';
import {clearedAttendance} from '../src/utils/attendanceChecks.js';
import {attendanceReportPart} from '../src/utils/attendanceReport.js';
import {attendanceExportSheet, writeAttendanceExcel} from '../src/utils/attendanceReportExport.js';
import {createAttendanceHwp} from '../src/utils/attendanceHwp.js';
import XLSX from 'xlsx';
import {isInAttendanceStats, isOnAttendanceRoster, newcomerAttendanceUpdate, studentAttended, withNewcomerGraduations} from '../src/utils/newcomers.js';

test('attendance exports preserve numeric totals and Korean milestone notes', () => {
 const first = {male:1,female:2,total:3};
 const second = {male:0,female:1,total:1};
 const report = {
   title:'11/01 출석부 출석 통계', rowPairs:[], parts:[{totals:first},{totals:second}],
   totals:{male:1,female:3,total:4}, noteLabels:['4주 등반','8주 등반','새친구'],
   milestoneNames:[['테스트 이름','',''],['','','']], notes:['직접 입력'], unclassifiedCount:0
 };
 const sheet = attendanceExportSheet(report);
 assert.deepEqual(sheet.rows[2],['총계',1,2,3,'총계',0,1,1]);
 assert.equal(sheet.rows[4][1],'테스트 이름\n직접 입력');
 writeAttendanceExcel({...XLSX,writeFile(workbook, filename){
   assert.equal(filename,'report.xlsx');
   const result = XLSX.read(XLSX.write(workbook,{bookType:'xlsx',type:'buffer'}),{type:'buffer'});
   assert.equal(result.Sheets['출석 통계'].D3.v,3);
   assert.equal(result.Sheets['출석 통계'].B5.v,'테스트 이름\n직접 입력');
 }},sheet,'report');
 const hwp = XLSX.CFB.read(createAttendanceHwp(XLSX.CFB,report),{type:'array'});
 const header = Buffer.from(XLSX.CFB.find(hwp,'/FileHeader').content);
 const body = Buffer.from(XLSX.CFB.find(hwp,'/BodyText/Section0').content);
 assert.equal(header.subarray(0,17).toString(),'HWP Document File');
 assert.ok(body.includes(Buffer.from('테스트 이름','utf16le')));
 assert.ok(body.includes(Buffer.from('직접 입력','utf16le')));
});

test('HWP retains the template tables and places overflow groups on another page', () => {
 const totals = {male:30,female:0,total:30};
 const rowPairs = Array.from({length:15},(_,index)=>[{label:`반${index+1}`,male:2,total:2,hasMale:true}]);
 const report = {title:'출석 통계',rowPairs,parts:[{totals},{totals:{male:0,female:0,total:0}}],totals,noteLabels:[],milestoneNames:[],notes:[]};
 const hwp = XLSX.CFB.read(createAttendanceHwp(XLSX.CFB,report),{type:'array'});
 const body = Buffer.from(XLSX.CFB.find(hwp,'/BodyText/Section0').content);
 const overflow = Buffer.from(XLSX.CFB.find(hwp,'/BodyText/Section1').content);
 const tables = [];
 let emptyCells = 0;
 for (let offset = 0; offset < body.length;) {
   const header = body.readUInt32LE(offset);
   offset += 4;
   const tag = header & 1023;
   const level = (header >>> 10) & 1023;
   const size = header >>> 20;
   if (tag === 77) tables.push([body.readUInt16LE(offset + 4),body.readUInt16LE(offset + 6)]);
   if (tag === 66) {
     const length = body.readUInt32LE(offset);
     const nextTag = body.readUInt32LE(offset + size) & 1023;
     if (level === 2 && length === 0x80000001) {
       assert.equal(nextTag,68);
       emptyCells++;
     }
   }
   offset += size;
 }
 assert.deepEqual(tables,[[3,4],[17,8],[2,3]]);
 assert.ok(emptyCells > 0);
 assert.ok(body.includes(Buffer.from('반14','utf16le')));
 assert.ok(!body.includes(Buffer.from('반15','utf16le')));
 assert.ok(overflow.includes(Buffer.from('반15','utf16le')));
});

test('newcomers join the regular roster on their eighth distinct Sunday', () => {
 const student = {id:'new',year:'2026',groupId:'g1',gender:'여',newcomerSince:'2026-09-06',newcomerWeeks:[]};
 const weeks = ['2026-09-06','2026-09-13','2026-09-27','2026-10-04','2026-10-11','2026-10-18','2026-10-25','2026-11-01'];
 for (const date of weeks.slice(0, 7)) student.newcomerWeeks = newcomerAttendanceUpdate(student,date,true);
 student.newcomerWeeks = newcomerAttendanceUpdate(student,weeks[0],true);
 assert.equal(student.newcomerWeeks.length,7);
 assert.equal(isOnAttendanceRoster(student),false);
 const groups = [{id:'g1',name:'1목장'}];
 const regular = {id:'regular',gender:'남'};
 const records = {g1:{regular:{attendance:true}}};
 const statsStudents = (_, date) => [regular, student].filter(student => isInAttendanceStats(student, date));
 assert.deepEqual(attendanceReportPart(groups, records, statsStudents, weeks[6]).totals, {male:1,female:1,total:2});
 assert.deepEqual(attendanceReportPart(groups, records, statsStudents, '2026-09-20').totals, {male:1,female:0,total:1});
 assert.throws(() => newcomerAttendanceUpdate(student,'2026-10-26',true),/주일/);
 student.newcomerWeeks = newcomerAttendanceUpdate(student,weeks[7],true);
 assert.equal(isOnAttendanceRoster(student,weeks[6]),false);
 assert.equal(isOnAttendanceRoster(student,weeks[7]),true);
 assert.equal(studentAttended(student,weeks[7],{}),true);
 assert.equal(studentAttended(student,weeks[7],{new:{attendance:false}}),false);
 assert.equal(studentAttended(student,'2026-11-08',{}),false);
 assert.deepEqual(withNewcomerGraduations([], [student], '2026', '2026-11')[0].records.new,{attendance:true});
 const report = attendanceReportPart(groups, records, statsStudents, weeks[7]);
 assert.deepEqual(report.totals,{male:1,female:1,total:2});
 student.newcomerWeeks = newcomerAttendanceUpdate(student,weeks[7],false);
 assert.equal(isOnAttendanceRoster(student,weeks[7]),false);
});

test('weekly attendance report counts only marked students and includes missing gender in totals', () => {
 const groups = [{id:'one',name:'1목장'},{id:'three',name:'3반'}];
 const students = {one:[{id:'m',gender:'남'},{id:'f',gender:'여'},{id:'u'}],three:[{id:'f2',gender:'여'}]};
 const records = {one:{m:{attendance:true},f:{attendance:false},u:{attendance:true},old:{attendance:true}}};
 const report = attendanceReportPart(groups, records, id => students[id]);
 assert.deepEqual(report.totals, {male:1,female:0,total:2});
 assert.deepEqual(report.rows.map(({label,total,hasFemale}) => [label,total,hasFemale]), [['1',2,true],['3',0,true]]);
});
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
 const before={s:{attendance:true,bibleReading:true,prayer:true,custom:true,retired:true,qt:7,retiredDays:3,notes:'보존',updatedAt:'old'},inactive:{attendance:true,custom:true}};
 const cleared=clearedAttendance(before,[{id:'s'},{id:'new'}],[{id:'attendance'},{id:'newItem'},{id:'qt',maxDays:7}],'now');
 for(const checks of Object.values(cleared))for(const value of Object.values(checks))if(typeof value==='boolean')assert.equal(value,false);
 assert.equal(cleared.s.notes,'보존');assert.equal(cleared.s.updatedAt,'now');assert.equal(cleared.new.newItem,false);assert.equal(before.s.custom,true);
 assert.equal(cleared.s.qt,0);assert.equal(cleared.s.retiredDays,0);assert.equal(cleared.new.qt,0);assert.equal(before.s.qt,7);
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
 const edited=await DBService.saveAdminAttendance('2026','2026-10-25','g1',{s:{attendance:true,qt:5}},'수정 메모');
 assert.equal(edited.s.qt,5);
 assert.equal(edited.s.attendance,true);assert.equal(edited.s.prayer,true);assert.equal(edited.s.custom,true);assert.equal(edited.s.notes,'학생 메모');assert.equal(edited.other.attendance,true);
 assert.equal(docs[submissionKey].submitted,true);assert.equal(docs[submissionKey].submittedAt,'original');assert.equal(docs[submissionKey].teacherId,'teacher');assert.equal(docs[submissionKey].notes,'수정 메모');
 await assert.rejects(DBService.saveAdminAttendance('2026','2026-10-25','g1',{s:{qt:8}}),/체크 값을 확인/);
 const teacherEdit=await DBService.saveStudentAttendance('2026','2026-10-25','g1','s',{qt:2});
 assert.equal(teacherEdit.s.qt,2);assert.equal(teacherEdit.s.prayer,true);
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
 source=source.replace("from '../utils/attendanceChecks.js'",`from '${import.meta.resolve('../src/utils/attendanceChecks.js')}'`);
 source=source.replace("from '../utils/newcomers.js'",`from '${import.meta.resolve('../src/utils/newcomers.js')}'`);
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
