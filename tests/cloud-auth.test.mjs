import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createPinia, setActivePinia } from 'pinia';

test('Firebase Auth identity controls login and session restoration; demo credentials cannot bypass it', async () => {
 const source = await readFile('src/stores/authStore.js', 'utf8');
 const stored = new Map([['bujeon_user_session', JSON.stringify({id:'fake', role:'admin'})]]);
 globalThis.localStorage={removeItem:key=>stored.delete(key),getItem:key=>stored.get(key)};
 let signedOut=0; let denyLogin=false; let expectedEmail='teacher@example.com';
 const fakeAuth={currentUser:null,app:{options:{projectId:'test-project'}}};
 let profile={role:'teacher', name:'교사', id:'firebase-uid'};
 const db={getOne:async (col,id)=>{assert.equal(col,'users');assert.equal(id,'firebase-uid');return profile;}};
 globalThis.__authTest={DBService:db,formatTeacherName:name=>name,auth:fakeAuth,authReady:Promise.resolve(),
   signInWithEmailAndPassword:async (auth,email,password)=>{
     assert.equal(email,expectedEmail);
     if(denyLogin) throw Object.assign(new Error('denied'),{code:'auth/invalid-credential'});
     auth.currentUser={uid:'firebase-uid'};
   },
   signOut:async auth=>{signedOut++;auth.currentUser=null;},sendPasswordResetEmail:async()=>{}};
 const transformed=source.replace(/import \{ DBService[^\n]+\n/,'').replace(/import \{ auth,[^\n]+\n/,`const {DBService,formatTeacherName,auth,authReady,signInWithEmailAndPassword,signOut,sendPasswordResetEmail}=globalThis.__authTest;\n`);
 // Relative Pinia import is resolved by an absolute file URL in the in-memory module.
 const code=transformed.replace("from 'pinia'",`from '${import.meta.resolve('pinia')}'`).replace("from '../utils/classAccounts.js'",`from '${import.meta.resolve('../src/utils/classAccounts.js')}'`);
 const {useAuthStore}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
 setActivePinia(createPinia()); const store=useAuthStore();
 await store.initAuth(); assert.equal(store.user,null); assert.equal(stored.has('bujeon_user_session'),false);
 const user=await store.login('teacher@example.com','proper-password'); assert.equal(user.id,'firebase-uid'); assert.equal(store.isAdmin,false);
 expectedEmail='26114@accounts.bujeon56.invalid';
 await store.login('26114','proper-password');
 assert.equal(store.user.id,'firebase-uid');
 expectedEmail='teacher@example.com';
 await store.logout(); assert.equal(store.user,null);
 denyLogin=true;
 await assert.rejects(store.login('teacher@example.com','admin1234'));
 assert.equal(store.isAuthenticated,false);
 denyLogin=false; profile=null;
 await assert.rejects(store.login('teacher@example.com','proper-password'),/교직원 문서가 없습니다.*test-project.*users\/firebase-uid/);
 profile={role:'Admin'};
 await assert.rejects(store.login('teacher@example.com','proper-password'),/role.*Admin/);
 assert.equal(store.isAuthenticated,false);
 assert.equal(fakeAuth.currentUser,null); assert.ok(signedOut>=3);
 delete globalThis.__authTest;
});

test('cloud failures never fall back to local storage or return success',async()=>{
 let source=await readFile('src/api/storage.js','utf8');
 source=source.replace(/import \{[\s\S]+?\} from '\.\/firebase';/,`const {db,isFirebaseConfigured,collection,doc,setDoc,getDoc,getDocs,updateDoc,deleteDoc,query,where,orderBy,onSnapshot,runTransaction}=globalThis.__dbTest;`);
 const failure=Object.assign(new Error('denied'),{code:'permission-denied'});
 const fail=async()=>{throw failure;};
 globalThis.__dbTest={db:{},isFirebaseConfigured:true,collection:()=>({}),doc:()=>({}),setDoc:fail,getDoc:fail,getDocs:fail,deleteDoc:fail,runTransaction:fail};
 globalThis.localStorage={getItem:()=>{throw new Error('LOCAL FALLBACK USED');},setItem:()=>{throw new Error('LOCAL FALLBACK USED');}};
 const {DBService}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 const operations=[()=>DBService.getAll('students'),()=>DBService.getOne('users','u'),()=>DBService.set('students','s',{}),()=>DBService.delete('students','s'),()=>DBService.getGroupAttendance('2026','2026-10-25','g'),()=>DBService.saveStudentAttendance('2026','2026-10-25','g','s',{}),()=>DBService.getSubmissionStatus('2026','2026-10-25','g'),()=>DBService.submitAttendance('2026','2026-10-25','g',{id:'t',name:'교사'}),()=>DBService.unlockAttendance('2026','2026-10-25','g')];
 for(const operation of operations) await assert.rejects(operation,error=>error===failure);
 delete globalThis.__dbTest;
});
