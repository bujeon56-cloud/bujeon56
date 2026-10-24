import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {isProtectedAccount,protectedAdminUid} from '../src/utils/protectedAccounts.js';

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
