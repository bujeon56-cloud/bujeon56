import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {isProtectedAccount,protectedAdminUid} from '../src/utils/protectedAccounts.js';

test('admin password updates verify identity, protect the original account and keep the primary session',async()=>{
 const source=await readFile('src/api/firebase.js','utf8');
 const functionSource=source.match(/export async function changeAdminPassword[\s\S]*?(?=export async function createStaffAccount)/)[0].replace('export ','');
 const primary={currentUser:{uid:'actor'}},secondary={},updates=[],cleanup=[];
 let actorRole='admin',target={role:'admin',email:'target@example.com'},signedUid='target',signInFail=false,updateFail=false,created=0;
 const change=new Function('auth','db','doc','getDoc','isProtectedAccount','initializeApp','firebaseConfig','getAuth','setPersistence','inMemoryPersistence','signInWithEmailAndPassword','updatePassword','signOut','deleteApp',functionSource+';return changeAdminPassword;')(
  primary,{},(_db,_collection,id)=>id,async id=>({exists:()=>true,data:()=>id==='actor'?{role:actorRole}:target}),isProtectedAccount,
  ()=>{created++;return {};},{},()=>secondary,async()=>{},'memory',async(instance,email,password)=>{
   assert.equal(instance,secondary);assert.equal(email,target.email);assert.equal(password,'current-secret');
   if(signInFail)throw new Error('invalid credential');return {user:{uid:signedUid}};
  },async(user,password)=>{if(updateFail)throw new Error('weak password');updates.push([user.uid,password]);},async instance=>{assert.equal(instance,secondary);cleanup.push('signout');},async()=>cleanup.push('delete'));
 await assert.rejects(change('target','current-secret','short'));assert.equal(created,0);
 actorRole='teacher';await assert.rejects(change('target','current-secret','new-secret'));assert.equal(created,0);actorRole='admin';
 await assert.rejects(change(protectedAdminUid,'current-secret','new-secret'),/보호된/);assert.equal(created,0);
 target={role:'admin',email:'bujeon56@gmail.com'};await assert.rejects(change('target','current-secret','new-secret'),/보호된/);assert.equal(created,0);
 target={role:'admin',email:'target@example.com'};
 signInFail=true;await assert.rejects(change('target','current-secret','new-secret'));signInFail=false;
 signedUid='wrong';await assert.rejects(change('target','current-secret','new-secret'),/일치하지/);signedUid='target';
 updateFail=true;await assert.rejects(change('target','current-secret','new-secret'));updateFail=false;
 assert.deepEqual(updates,[]);assert.equal(cleanup.length,6);
 await change('target','current-secret','new-secret');assert.deepEqual(updates,[['target','new-secret']]);assert.equal(cleanup.length,8);
 assert.equal(primary.currentUser.uid,'actor');
});

test('admin deletion rejects self, teacher and unknown targets and preserves state on failure',async()=>{
 const source=await readFile('src/stores/churchStore.js','utf8');
 const body=source.match(/async deleteAdminAccount\(id\) \{([\s\S]*?)\n    \},/)[1];
 const identity={uid:'self'},permission={isAdmin:true},deleted=[];
 let fail=false;
 const remove=new Function('useAuthStore','auth','DBService','isProtectedAccount',`return async function(id){${body}}`)(()=>permission,{currentUser:identity},{delete:async(collection,id)=>{if(fail)throw new Error('write failed');deleted.push([collection,id]);}},isProtectedAccount);
 const state={teachers:[{id:'self',role:'admin'},{id:'other',role:'admin'},{id:'teacher',role:'teacher'}]};
 for(const id of ['self','teacher','missing'])await assert.rejects(remove.call(state,id));
 permission.isAdmin=false;await assert.rejects(remove.call(state,'other'));permission.isAdmin=true;
 fail=true;await assert.rejects(remove.call(state,'other'),/write failed/);assert.equal(state.teachers.length,3);
 fail=false;await remove.call(state,'other');assert.deepEqual(deleted,[['users','other']]);assert.deepEqual(state.teachers.map(t=>t.id),['self','teacher']);
});

test('protected original administrator cannot be edited or deleted by another admin',async()=>{
 const source=await readFile('src/stores/churchStore.js','utf8');
 const state={teachers:[{id:protectedAdminUid,role:'admin',email:'changed@example.com'},{id:'email-match',role:'admin',email:'BUJEON56@gmail.com'}]};
 for(const [method,args] of [['updateTeacher','id, updates'],['deleteAdminAccount','id']]){
  const body=source.match(new RegExp('async '+method+'\\([^)]*\\) \\{([\\s\\S]*?)\\n    \\},'))[1];
  const action=new Function('isProtectedAccount',`return async function(${args}){${body}}`)(isProtectedAccount);
  for(const account of state.teachers)await assert.rejects(action.call(state,account.id,{name:'변경',role:'teacher',email:'new@example.com'}),/보호된 관리자/);
 }
 assert.equal(isProtectedAccount({email:' bujeon56@gmail.com '}),true);
 assert.equal(isProtectedAccount({email:'other@example.com'}),false);
});
test('account management route allows admins and redirects guests and teachers',async()=>{
 let options,guard;
 const account={loading:false,isAuthenticated:false,isAdmin:false};
 globalThis.__accountRoutes={createWebHistory:()=>({}),createRouter:config=>{options=config;return {beforeEach:fn=>{guard=fn;}};},useAuthStore:()=>account};
 let source=await readFile('src/router/index.js','utf8');
 source=source.replace(/import \{ createRouter[^\n]+\n/,'const {createRouter,createWebHistory,useAuthStore}=globalThis.__accountRoutes;\n').replace(/import \{ useAuthStore[^\n]+\n/,'').replace('import.meta.env.BASE_URL',"'/'");
 await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 const parent=options.routes.find(route=>route.path==='/admin');
 const route=parent.children.find(route=>route.path==='accounts');assert.ok(route);
 const target={meta:{...parent.meta,...route.meta},fullPath:'/admin/accounts'};
 let result;
 await guard(target,{},value=>{result=value;});assert.equal(result.path,'/login');assert.equal(result.query.redirect,'/admin/accounts');
 account.isAuthenticated=true;await guard(target,{},value=>{result=value;});assert.equal(result,'/teacher/attendance');
 account.isAdmin=true;await guard(target,{},value=>{result=value;});assert.equal(result,undefined);
 await guard({...target,path:'/admin/settings',hash:'#admin-account'},{},value=>{result=value;});assert.equal(result.path,'/admin/accounts');
 delete globalThis.__accountRoutes;
});
