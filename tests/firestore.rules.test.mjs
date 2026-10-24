import { readFile } from 'node:fs/promises';
import { before, after, beforeEach, test } from 'node:test';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, query, where } from 'firebase/firestore';
let env;
const groupA = 'part1_2026_g1';
const groupB = 'part2_2026_g1';
const recordA = `2026_2026-10-25_${groupA}`;
const recordB = `2026_2026-10-25_${groupB}`;
const attendance = groupId => ({year:'2026', date:'2026-10-25', groupId, records:{student:{attendance:true}}});

test('original administrator profile is immutable by UID and email, including to itself',async()=>{
 const uid='Y24ONBZTuiT9BKXp1Q9F1RGLWPE2';
 await env.withSecurityRulesDisabled(async context=>{
  await setDoc(doc(context.firestore(),'users',uid),{role:'admin',email:'bujeon56@gmail.com',name:'원본'});
  await setDoc(doc(context.firestore(),'users','email-protected'),{role:'admin',email:'BUJEON56@gmail.com'});
 });
 for(const actor of ['admin',uid]){
  const db=env.authenticatedContext(actor).firestore();
  for(const target of [uid,'email-protected']){
   await assertSucceeds(getDoc(doc(db,'users',target)));
   await assertFails(updateDoc(doc(db,'users',target),{name:'변경'}));
   await assertFails(updateDoc(doc(db,'users',target),{email:'other@example.com',role:'teacher'}));
   await assertFails(setDoc(doc(db,'users',target),{role:'admin',name:'덮어쓰기'}));
   await assertFails(deleteDoc(doc(db,'users',target)));
  }
 }
});
before(async () => {
  env = await initializeTestEnvironment({projectId:'demo-bujeon56',firestore:{host:'127.0.0.1',port:8080,rules:await readFile('firestore.rules','utf8')}});
});
after(async () => { await env?.cleanup(); });
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async context => {
    const db=context.firestore();
    await Promise.all([
      setDoc(doc(db,'users','admin'),{role:'admin',name:'관리자'}),
      setDoc(doc(db,'users','teacher'),{role:'teacher',name:'선생님'}),
      setDoc(doc(db,'users','other'),{role:'teacher'}),
      setDoc(doc(db,'groups',groupA),{year:'2026',teacherId:'teacher'}),
      setDoc(doc(db,'groups',groupB),{year:'2026',teacherId:'other'}),
      setDoc(doc(db,'students','a'),{year:'2026',groupId:groupA,name:'A'}),
      setDoc(doc(db,'students','b'),{year:'2026',groupId:groupB,name:'B'})
    ]);
  });
});
test('anonymous and unregistered accounts cannot read students or grant themselves roles',async()=>{
 for(const context of [env.unauthenticatedContext(),env.authenticatedContext('stranger')]) {
  await assertFails(getDocs(collection(context.firestore(),'students')));
  await assertFails(setDoc(doc(context.firestore(),'users','stranger'),{role:'admin'}));
 }
});
test('teacher can query assigned classes and students but cannot list all data',async()=>{
 const db=env.authenticatedContext('teacher').firestore();
 await assertSucceeds(getDocs(query(collection(db,'groups'),where('teacherId','==','teacher'))));
 await assertSucceeds(getDocs(query(collection(db,'students'),where('groupId','==',groupA))));
 await assertFails(getDocs(collection(db,'groups')));
 await assertFails(getDocs(collection(db,'students')));
 await assertFails(getDoc(doc(db,'students','b')));
 await assertFails(getDocs(collection(db,'users')));
 await assertFails(updateDoc(doc(db,'users','teacher'),{role:'admin'}));
});
test('missing attendance is readable only for own class; records must match class and year',async()=>{
 const db=env.authenticatedContext('teacher').firestore();
 await assertSucceeds(getDoc(doc(db,'attendances',recordA)));
 await assertSucceeds(getDoc(doc(db,'submissions',recordA)));
 await assertFails(getDoc(doc(db,'attendances',recordB)));
 await assertSucceeds(setDoc(doc(db,'attendances',recordA),attendance(groupA)));
 await assertFails(setDoc(doc(db,'attendances',recordB),attendance(groupB)));
 await assertFails(setDoc(doc(db,'attendances',recordB),attendance(groupA)));
 await assertFails(setDoc(doc(db,'attendances',recordA),{...attendance(groupA),year:'2027'}));
});
test('submission locks teacher writes and only admin may unlock',async()=>{
 const db=env.authenticatedContext('teacher').firestore();
 await assertSucceeds(setDoc(doc(db,'attendances',recordA),attendance(groupA)));
 await assertSucceeds(setDoc(doc(db,'submissions',recordA),{...attendance(groupA),submitted:true,teacherId:'teacher'}));
 await assertFails(updateDoc(doc(db,'attendances',recordA),{records:{}}));
 await assertFails(deleteDoc(doc(db,'submissions',recordA)));
 await assertSucceeds(deleteDoc(doc(env.authenticatedContext('admin').firestore(),'submissions',recordA)));
 await assertSucceeds(updateDoc(doc(db,'attendances',recordA),{records:{}}));
});
test('teacher cannot move students into another class or change their year',async()=>{
 const db=env.authenticatedContext('teacher').firestore();
 await assertSucceeds(updateDoc(doc(db,'students','a'),{name:'수정'}));
 await assertFails(updateDoc(doc(db,'students','a'),{groupId:groupB}));
 await assertFails(updateDoc(doc(db,'students','a'),{year:'2027'}));
 await assertFails(setDoc(doc(db,'students','bad'),{year:'2027',groupId:groupA}));
});
test('admin can manage all classes but cannot store passwords or remove own admin access',async()=>{
 const db=env.authenticatedContext('admin').firestore();
 await assertSucceeds(getDocs(collection(db,'students')));
 await assertSucceeds(setDoc(doc(db,'users','new'),{role:'teacher',email:'t@example.com'}));
 await assertFails(setDoc(doc(db,'users','bad'),{role:'teacher',password:'secret'}));
 await assertFails(updateDoc(doc(db,'users','admin'),{role:'teacher'}));
 await assertFails(deleteDoc(doc(db,'users','admin')));
 await assertSucceeds(deleteDoc(doc(db,'users','teacher')));
 await assertFails(getDoc(doc(env.authenticatedContext('teacher').firestore(),'students','a')));
});

test('deleting another administrator revokes access even with an existing authenticated session',async()=>{
 const db=env.authenticatedContext('admin').firestore();
 await assertSucceeds(setDoc(doc(db,'users','second-admin'),{role:'admin',name:'추가 관리자'}));
 const second=env.authenticatedContext('second-admin').firestore();
 await assertSucceeds(getDocs(collection(second,'students')));
 await assertFails(deleteDoc(doc(env.authenticatedContext('teacher').firestore(),'users','second-admin')));
 await assertSucceeds(updateDoc(doc(db,'users','second-admin'),{name:'수정된 관리자'}));
 await assertSucceeds(deleteDoc(doc(db,'users','second-admin')));
 await assertFails(getDocs(collection(second,'students')));
 await assertFails(setDoc(doc(second,'users','second-admin'),{role:'admin'}));
});
