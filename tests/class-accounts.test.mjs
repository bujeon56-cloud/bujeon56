import {test} from 'node:test';
import assert from 'node:assert/strict';
import {classes2026,classLoginEmail,initialPassword,credentialCsv,provisionClasses} from '../src/utils/classAccounts.js';
test('2026 accounts use the requested 2611, 26114, 2621 through 2628 format',()=>{
 const rows=classes2026();assert.equal(rows.length,22);assert.equal(new Set(rows.map(r=>r.code)).size,22);
 assert.equal(rows.filter(r=>r.departmentId==='part1').length,14);assert.equal(rows.filter(r=>r.departmentId==='part2').length,8);
 assert.equal(rows[0].code,'2611');assert.equal(rows[13].code,'26114');assert.equal(rows[14].code,'2621');assert.equal(rows[21].code,'2628');
 assert.equal(classLoginEmail(' 26114 '),'26114@accounts.bujeon56.invalid');assert.equal(classLoginEmail('admin@example.com'),'admin@example.com');
});
test('password list is unique, contains policy characters, and exports the same credentials',()=>{
 const rows=classes2026().map(row=>({...row,password:initialPassword()}));
 assert.equal(new Set(rows.map(r=>r.password)).size,22);
 for(const row of rows){assert.match(row.password,/[A-Z]/);assert.match(row.password,/[a-z]/);assert.match(row.password,/\d/);assert.match(row.password,/!/);assert.ok(row.password.length>=16);}
 const csv=credentialCsv(rows);assert.ok(csv.startsWith('\uFEFF'));assert.equal(csv.split('\r\n').length,23);assert.ok(csv.includes(rows[0].password));assert.ok(csv.includes('"26114"'));
});
test('batch failure preserves completed credentials and resumes only remaining rows',async()=>{
 const rows=classes2026().slice(0,3).map(row=>({...row,password:initialPassword(),status:'pending'}));
 const calls=[];let fail=true;
 const services={provision:async row=>{calls.push(row.code);if(row.code==='2612'&&fail)throw new Error('network');return 'created';}};
 const report=(code,status,message)=>Object.assign(rows.find(r=>r.code===code),{status,error:message});
 await provisionClasses(rows,services,report);
 assert.deepEqual(rows.map(r=>r.status),['created','failed','pending']);
 fail=false;await provisionClasses(rows,services,report);
 assert.deepEqual(calls,['2611','2612','2612','2613']);assert.ok(rows.every(r=>r.status==='created'));
});
