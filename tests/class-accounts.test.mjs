import {test} from 'node:test';
import assert from 'node:assert/strict';
import {classes2026,classLoginEmail,initialPassword,credentialCsv,provisionClasses,parseTeacherRoster} from '../src/utils/classAccounts.js';
test('2026 accounts use the requested 260101, 260114, 260201 through 260208 format',()=>{
 const rows=classes2026();assert.equal(rows.length,22);assert.equal(new Set(rows.map(r=>r.code)).size,22);
 assert.equal(rows.filter(r=>r.departmentId==='part1').length,14);assert.equal(rows.filter(r=>r.departmentId==='part2').length,8);
 assert.equal(rows[0].code,'260101');assert.equal(rows[13].code,'260114');assert.equal(rows[14].code,'260201');assert.equal(rows[21].code,'260208');
 assert.equal(classLoginEmail(' 260114 '),'260114@accounts.bujeon56.invalid');assert.equal(classLoginEmail('admin@example.com'),'admin@example.com');
});
test('six-digit initial passwords equal the requested login IDs and export the same credentials',()=>{
 const rows=classes2026().map(row=>({...row,password:initialPassword(row.code)}));
 assert.equal(new Set(rows.map(r=>r.password)).size,22);
 for(const row of rows){assert.equal(row.password,row.code);assert.match(row.password,/^\d{6}$/);}
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
 const roster=parseTeacherRoster('1,1,교사 가\n2,5,미정\n2,8,교사 나');
 assert.equal(roster.get('260101'),'교사 가');assert.equal(roster.get('260205'),'미정');
 assert.throws(()=>parseTeacherRoster('2,9,교사'));assert.throws(()=>parseTeacherRoster('1,1,교사\n1,1,다른교사'));
});

test('full year IDs and pasted phone number forms resolve to the existing six-digit account',()=>{
 for(const input of ['20260114','260114','２０２６０１１４','2026-01-14',' 2026 01 14 ','20260114\u200B']) assert.equal(classLoginEmail(input),'260114@accounts.bujeon56.invalid');
 assert.equal(classLoginEmail('20260208'),'260208@accounts.bujeon56.invalid');
});
