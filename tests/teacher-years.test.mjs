import {test} from 'node:test';
import assert from 'node:assert/strict';
import {teachersForYear,yearRemovalPlan} from '../src/utils/teacherYears.js';
const teachers=[{id:'admin',role:'admin'},{id:'shared',role:'teacher'},{id:'old',role:'teacher',year:'2025'},{id:'unassigned',role:'teacher',year:'2026'},{id:'class',role:'teacher',loginCode:'260208'}];
const groups=[{id:'a',year:'2025',teacherId:'shared'},{id:'b',year:'2026',teacherId:'shared'}];
test('year list includes assigned, unassigned and legacy class accounts but excludes other years',()=>{
 assert.deepEqual(teachersForYear(teachers,groups,'2026').map(t=>t.id),['admin','shared','unassigned','class']);
 assert.deepEqual(teachersForYear(teachers,groups,'2025').map(t=>t.id),['admin','shared','old']);
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
