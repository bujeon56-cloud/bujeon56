import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {isSunday,sundaysInYear,sundayForYear,recentSunday} from '../src/utils/sundays.js';
test('date choices contain only valid Sundays in the selected year, including leap years',()=>{
 for(const year of ['2026','2028','2023']){
  const dates=sundaysInYear(year);assert.ok(dates.length>=52&&dates.length<=53);assert.ok(dates.every(date=>date.startsWith(year)&&isSunday(date)));
  for(let i=1;i<dates.length;i++)assert.equal(Date.parse(dates[i])-Date.parse(dates[i-1]),7*86400000);
 }
 assert.equal(isSunday('2026-10-25'),true);assert.equal(isSunday('2026-10-24'),false);assert.equal(isSunday('2026-02-30'),false);
});
test('weekday and other-year state is replaced with an available Sunday',()=>{
 assert.equal(sundayForYear('2026','2026-10-24'),'2026-10-18');
 assert.equal(sundayForYear('2026','2026-10-25'),'2026-10-25');
 assert.equal(sundayForYear('2026','2026-01-01'),'2026-01-04');
 assert.equal(sundayForYear('2027','2026-12-27'),'2027-01-03');
});
test('Sunday morning and year boundaries use Korean calendar dates rather than UTC dates',()=>{
 assert.equal(recentSunday(new Date('2026-10-25T00:30:00+09:00')),'2026-10-25');
 assert.equal(recentSunday(new Date('2026-10-24T23:59:00+09:00')),'2026-10-18');
 assert.equal(recentSunday(new Date('2027-01-01T00:30:00+09:00')),'2026-12-27');
});

test('each weekday uses the previous Sunday and Sunday itself stays today in Korea',()=>{
 for(let day=19;day<=24;day++)assert.equal(recentSunday(new Date(`2026-10-${day}T12:00:00+09:00`)),'2026-10-18');
 for(const time of ['00:00:00','09:00:00','23:59:59'])assert.equal(recentSunday(new Date(`2026-10-25T${time}+09:00`)),'2026-10-25');
 assert.equal(recentSunday(new Date('2026-10-26T00:00:00+09:00')),'2026-10-25');
});

test('reopening attendance replaces a stale date with the current default',async()=>{
 const source=await readFile('src/stores/attendanceStore.js','utf8');
 const body=source.match(/resetDefaultDate\(year, now = new Date\(\)\) \{([\s\S]*?)\n    \}/)[1];
 const reset=new Function('sundayForYear','recentSunday',`return function(year,now){${body}}`)(sundayForYear,recentSunday);
 const store={selectedDate:'2026-01-04'};
 reset.call(store,'2026',new Date('2026-10-24T12:00:00+09:00'));assert.equal(store.selectedDate,'2026-10-18');
 reset.call(store,'2026',new Date('2026-10-25T00:01:00+09:00'));assert.equal(store.selectedDate,'2026-10-25');
});
