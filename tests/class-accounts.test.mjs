import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {groupNumber} from '../src/utils/groupOrder.js';
import {classes2026,classesForYear,classLoginEmail,initialPassword,credentialCsv,provisionClasses,parseTeacherRoster} from '../src/utils/classAccounts.js';

test('year preparation uses only that year and its actual classes in numeric order',()=>{
 const groups=[{id:'old',year:'2026',departmentId:'part1',name:'1목장',order:1},
  {id:'b',year:'2027',departmentId:'part2',name:'3목장',order:1},
  {id:'a',year:'2027',departmentId:'part1',name:'10목장',order:1},
  {id:'c',year:'2027',departmentId:'part1',name:'2목장',order:99}];
 const rows=classesForYear(groups,'2027');
 assert.deepEqual(rows.map(r=>r.code),['270102','270110','270203']);
 assert.deepEqual(rows.map(r=>r.id),['c','a','b']);
 assert.equal(classLoginEmail('20270110'),rows[1].email);
 assert.equal(initialPassword(rows[0].code),'@270102#');
 assert.equal(parseTeacherRoster('2,3,새 선생님',rows).get('270203'),'새 선생님');
 assert.throws(()=>parseTeacherRoster('1,1,없는 목장',rows));
 assert.deepEqual(classesForYear(groups,'2028'),[]);
 assert.ok(credentialCsv(rows).includes('"2027"'));
 assert.equal(groups[0].year,'2026');
});

test('duplicate or unsupported class numbers cannot create colliding yearly accounts',()=>{
 const group={id:'a',year:'2027',departmentId:'part1',name:'1목장',order:1};
 assert.throws(()=>classesForYear([group,{...group,id:'b'}],'2027'),/중복/);
 assert.throws(()=>classesForYear([{...group,name:'100목장'}],'2027'));
 assert.throws(()=>classesForYear([{...group,departmentId:'other'}],'2027'));
});
test('2026 accounts use the requested 260101, 260114, 260201 through 260208 format',()=>{
 const rows=classes2026();assert.equal(rows.length,22);assert.equal(new Set(rows.map(r=>r.code)).size,22);
 assert.equal(rows.filter(r=>r.departmentId==='part1').length,14);assert.equal(rows.filter(r=>r.departmentId==='part2').length,8);
 assert.equal(rows[0].code,'260101');assert.equal(rows[13].code,'260114');assert.equal(rows[14].code,'260201');assert.equal(rows[21].code,'260208');
 assert.equal(classLoginEmail(' 260114 '),'260114@accounts.bujeon56.invalid');assert.equal(classLoginEmail('admin@example.com'),'admin@example.com');
});
test('initial passwords use @ and # and the CSV exports the same credentials',()=>{
 const rows=classes2026().map(row=>({...row,password:initialPassword(row.code)}));
 assert.equal(new Set(rows.map(r=>r.password)).size,22);
 for(const row of rows)assert.equal(row.password,`@${row.code}#`);
 assert.equal(initialPassword('270101'),'@270101#');
 const csv=credentialCsv(rows);assert.ok(csv.startsWith('\uFEFF'));assert.equal(csv.split('\r\n').length,23);assert.ok(csv.includes(rows[0].password));assert.ok(csv.includes('"260114"'));
});
test('batch failure preserves completed credentials and resumes only remaining rows',async()=>{
 const rows=classes2026().slice(0,3).map(row=>({...row,password:initialPassword(row.code),status:'pending'}));
 const calls=[];let fail=true;
 const services={provision:async row=>{calls.push(row.code);if(row.code==='260102'&&fail)throw new Error('network');return 'created';}};
 const report=(code,status,message)=>Object.assign(rows.find(r=>r.code===code),{status,error:message});
 await provisionClasses(rows,services,report);
 assert.deepEqual(rows.map(r=>r.status),['created','failed','pending']);
 fail=false;await provisionClasses(rows,services,report);
 assert.deepEqual(calls,['260101','260102','260102','260103']);assert.ok(rows.every(r=>r.status==='created'));
});

test('teacher roster validates class numbers and preserves the provided names',()=>{
 const rows=classes2026();
 const roster=parseTeacherRoster('1,1,교사 가\n2,5,미정\n2,8,교사 나',rows);
 assert.equal(roster.get('260101'),'교사 가');assert.equal(roster.get('260205'),'미정');
 assert.throws(()=>parseTeacherRoster('2,9,교사',rows),/1행: 2026년 2부 9목장이 목록에 없습니다/);
 assert.throws(()=>parseTeacherRoster('1,1,교사\n1,1,다른교사',rows),/2행: 1부 1목장이 1행에도 입력/);
});

test('2027 roster matches displayed class names for spreadsheet and comma-separated input', () => {
 const rows = classesForYear([
   { id: 'old', year: '2026', departmentId: 'part1', name: '1목장', order: 1 },
   { id: 'a', year: '2027', departmentId: 'part1', name: '３반', order: 1 },
   { id: 'b', year: '2027', departmentId: 'part2', name: '목장 5', order: 1 },
 ], '2027');
 assert.deepEqual(rows.map(row => row.code), ['270103', '270205']);
 assert.deepEqual([...parseTeacherRoster('１부\t０３반\t교사 가\n2부，목장 5，교사 나', rows)], [
   ['270103', '교사 가'], ['270205', '교사 나'],
 ]);
 assert.throws(() => parseTeacherRoster('1,1,교사', rows), /2027년 1부 1목장이 목록에 없습니다/);
 assert.throws(() => parseTeacherRoster('1,3,교사 가\n1부,03반,교사 나', rows), /2행: 1부 3목장이 1행에도 입력/);
 const issues = [];
 const pasted = '부서,목장번호,선생님\n1부 3반 교사 가\n260103,다른 연도\n270205,교사 나\n1,3,중복 이름';
 assert.deepEqual([...parseTeacherRoster(pasted, rows, { onInvalid: issue => issues.push(issue) })], [
   ['270103', '교사 가'], ['270205', '교사 나'],
 ]);
 assert.match(issues[0], /3행: 2027년 아이디 260103/);
 assert.match(issues[1], /5행: 1부 3목장이 2행/);
});

test('full year IDs and pasted phone number forms resolve to the existing six-digit account',()=>{
 for(const input of ['20260114','260114','２０２６０１１４','2026-01-14',' 2026 01 14 ','20260114\u200B']) assert.equal(classLoginEmail(input),'260114@accounts.bujeon56.invalid');
 assert.equal(classLoginEmail('20260208'),'260208@accounts.bujeon56.invalid');
});

test('roster can plan new groups in an empty selected year without accepting a different year code', () => {
 const newGroups = [];
 const errors = [];
 const result = parseTeacherRoster('1부,2목장,교사 가\n270205,교사 나\n260103,다른 연도\n270102,중복', [], {
   year:'2027', onNewGroup:group=>newGroups.push(group), onInvalid:error=>errors.push(error),
 });
 assert.deepEqual([...result], [['270102','교사 가'], ['270205','교사 나']]);
 assert.deepEqual(newGroups.map(group=>[group.id,group.year,group.newGroup]), [
   ['part1_2027_g2','2027',true], ['part2_2027_g5','2027',true],
 ]);
 assert.match(errors[0], /2027년 아이디 260103/);
 assert.match(errors[1], /4행: 아이디 270102이 1행에도 입력/);
});

test('registering a new group writes its teacher and group together and preserves state on failure', async () => {
 const source = (await readFile('src/api/classAccounts.js','utf8')).replace(/^import .*\r?\n/gm,'').replace('export function','function');
 const groups = [], users = [], persisted = new Map();
 let rejectCommit = true;
 const provisioner = new Function('auth','db','doc','runTransaction','createStaffAccount','groupNumber',
   `${source}\nreturn classProvisioner;`)(
   {currentUser:{uid:'admin'}}, {}, (_,collection,id)=>`${collection}/${id}`,
   async (_, callback) => {
     const writes = [];
     await callback({
       get: async ref=>({exists:()=>persisted.has(ref),data:()=>persisted.get(ref)}),
       set: (ref, data)=>writes.push([ref,data]),
     });
     if (rejectCommit) throw new Error('저장 실패');
     for (const [ref,data] of writes) persisted.set(ref,data);
   }, async (_, __, saveProfile)=>saveProfile('new-teacher'), groupNumber,
 );
 const row = {id:'part1_2027_g2',year:'2027',departmentId:'part1',departmentName:'1부',
   name:'2목장',order:2,code:'270102',email:classLoginEmail('270102'),teacherName:'샘플',password:'270102',newGroup:true};
 await assert.rejects(provisioner(groups,users).provision(row),/저장 실패/);
 assert.equal(persisted.size,0);
 assert.deepEqual(groups,[]);
 assert.deepEqual(users,[]);
 rejectCommit = false;
 assert.equal(await provisioner(groups,users).provision(row),'created');
 assert.equal(persisted.get('groups/part1_2027_g2').teacherId,'new-teacher');
 assert.equal(persisted.get('users/new-teacher').groupId,'part1_2027_g2');
 assert.equal(groups.length,1);
 assert.equal(users.length,1);
});

test('administrator alias resolves to a separate Auth account without changing email login',()=>{
 assert.equal(classLoginEmail(' bujeon56 '),'bujeon56@accounts.bujeon56.invalid');
 assert.equal(classLoginEmail('BUJEON56'),'bujeon56@accounts.bujeon56.invalid');
 assert.equal(classLoginEmail('bujeon56@gmail.com'),'bujeon56@gmail.com');
});
