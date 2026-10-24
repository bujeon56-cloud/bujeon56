import {compareGroups} from '../src/utils/groupOrder.js';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {teachersForYear,yearRemovalPlan} from '../src/utils/teacherYears.js';
const teachers=[{id:'admin',role:'admin'},{id:'shared',role:'teacher'},{id:'old',role:'teacher',year:'2025'},{id:'unassigned',role:'teacher',year:'2026'},{id:'class',role:'teacher',loginCode:'260208'}];
const groups=[{id:'a',year:'2025',teacherId:'shared'},{id:'b',year:'2026',teacherId:'shared'}];

test('year creation rejects local and database duplicates before writing or changing selected year',async()=>{
 const source=await readFile('src/stores/churchStore.js','utf8');
 const body=source.match(/async addNewYear\(newYear, copyPreviousSettings = false\) \{([\s\S]*?)\n    \},/)[1];
 const remote=new Set(['2027']),writes=[];
 const transaction={get:async id=>({exists:()=>remote.has(id)}),set:(...args)=>writes.push(args)};
 const add=new Function('db','doc','runTransaction',`return async function(newYear,copyPreviousSettings=false){${body}}`)({},(_db,_collection,id)=>id,async(_db,fn)=>fn(transaction));
 const state={years:[{id:2026,isCurrent:true}],currentYear:'2026',groups:[]};
 await assert.rejects(add.call(state,'2026'),/이미 존재/);
 await assert.rejects(add.call(state,'2027'),/이미 존재/);
 for(const input of ['',2027.5,'twenty','20270'])await assert.rejects(add.call(state,input),/숫자 4자리/);
 assert.deepEqual(writes,[]);assert.equal(state.currentYear,'2026');assert.equal(state.years[0].isCurrent,true);
 await add.call(state,'2028');
 assert.equal(state.currentYear,'2028');assert.equal(state.years.length,2);
 assert.deepEqual(writes.map(w=>w[0]),['2026','2028']);
 await assert.rejects(add.call(state,'2028'),/이미 존재/);
 assert.equal(writes.length,2);
});
test('year list includes assigned, unassigned and legacy class accounts but excludes other years',()=>{
 assert.deepEqual(teachersForYear(teachers,groups,'2026').map(t=>t.id),['shared','unassigned','class']);
 assert.deepEqual(teachersForYear(teachers,groups,'2025').map(t=>t.id),['shared','old']);
});
test('bulk removal affects only selected-year assignments and retains other-year membership',()=>{
 const plan=yearRemovalPlan(teachers,groups,'2026',['shared','class','shared'],'admin');
 assert.equal(plan.length,2);assert.deepEqual(plan[0].groups.map(g=>g.id),['b']);
 const updatedTeachers=teachers.map(t=>({...t,removedYears:plan.find(p=>p.teacher.id===t.id)?.removedYears}));
 const updatedGroups=groups.map(g=>g.id==='b'?{...g,teacherId:null}:g);
 assert.equal(teachersForYear(updatedTeachers,updatedGroups,'2026').some(t=>t.id==='class'||t.id==='shared'),false);
 assert.equal(teachersForYear(updatedTeachers,updatedGroups,'2025').some(t=>t.id==='shared'),true);
 assert.equal(groups[0].teacherId,'shared');
});
test('admin, own account and stale selections cannot be bulk removed',()=>{
 for(const ids of [['admin'],['missing'],['old']])assert.throws(()=>yearRemovalPlan(teachers,groups,'2026',ids,'admin'));
 assert.throws(()=>yearRemovalPlan(teachers,groups,'2026',['shared'],'shared'));
});

test('teachers are sorted by department and numeric class order; admins never appear',()=>{
 const staff=[{id:'admin',role:'admin',year:'2026'},...['p2','g14','g2','g1','none'].map(id=>({id,role:'teacher',year:'2026'}))];
 const classes=[{id:'x',teacherId:'g14',year:'2026',departmentId:'part1',order:14},{id:'y',teacherId:'g2',year:'2026',departmentId:'part1',order:'2'},{id:'z',teacherId:'g1',year:'2026',departmentId:'part1',order:1},{id:'w',teacherId:'p2',year:'2026',departmentId:'part2',order:1}];
 assert.deepEqual(teachersForYear(staff,classes,'2026').map(t=>t.id),['g1','g2','g14','p2','none']);
 assert.deepEqual(staff.map(t=>t.id),['admin','p2','g14','g2','g1','none']);
});

test('all group views use department then visible class number, including inconsistent stored order',()=>{
 const groups=[{departmentId:'part2',name:'2목장',order:1},{departmentId:'part1',name:'10목장',order:1},{departmentId:'part2',name:'1목장',order:99},{departmentId:'part1',name:'2목장',order:99},{departmentId:'part1',name:'1목장',order:8}];
 assert.deepEqual([...groups].sort(compareGroups).map(g=>g.departmentId+':'+g.name),['part1:1목장','part1:2목장','part1:10목장','part2:1목장','part2:2목장']);
 const staff=groups.map((g,i)=>({id:String(i),role:'teacher',year:'2026'}));
 const assigned=groups.map((g,i)=>({...g,year:'2026',teacherId:String(i)}));
 assert.deepEqual(teachersForYear(staff,assigned,'2026').map(t=>t.id),['4','3','1','2','0']);
});
