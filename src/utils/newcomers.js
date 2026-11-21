import { isSunday } from './sundays.js';

export const NEWCOMER_REQUIRED_WEEKS = 8;

export function newcomerWeeks(student) {
  const weeks = Array.isArray(student.newcomerWeeks) ? student.newcomerWeeks : [];
  return [...new Set(weeks.filter(date => isSunday(date) && date.slice(0, 4) === student.year && date >= student.newcomerSince))].sort();
}

export function newcomerGraduationDate(student) {
  return newcomerWeeks(student)[NEWCOMER_REQUIRED_WEEKS - 1];
}

export function isOnAttendanceRoster(student, date) {
  if (!student.newcomerSince) return true;
  const graduation = newcomerGraduationDate(student);
  return Boolean(graduation && (!date || graduation < date));
}

export function isInAttendanceStats(student, date) {
  return isOnAttendanceRoster(student, date) || Boolean(date && newcomerWeeks(student).includes(date));
}

export function newcomerAttendanceUpdate(student, date, attended) {
  if (!student.newcomerSince || student.active === false || !isSunday(date) || date.slice(0, 4) !== student.year || date < student.newcomerSince) {
    throw new Error('새친구 등록일 이후의 해당 연도 주일만 기록할 수 있습니다.');
  }
  const weeks = newcomerWeeks(student);
  if (weeks[NEWCOMER_REQUIRED_WEEKS - 1] && date > weeks[NEWCOMER_REQUIRED_WEEKS - 1]) {
    throw new Error('8주 등반 이후에는 정식 출석부에 기록해주세요.');
  }
  return attended ? [...new Set([...weeks, date])].sort() : weeks.filter(week => week !== date);
}

export function studentAttended(student, date, records) {
  if (date && !isOnAttendanceRoster(student, date)) return newcomerWeeks(student).includes(date);
  return records[student.id]?.attendance ?? false;
}

export function excludeNewcomerAttendance(entries, students, year) {
  const newcomers = new Map(students.filter(student => student.year === year && student.newcomerSince).map(student => [student.id, student]));
  if (!newcomers.size) return entries;

  return entries.map(entry => ({
    ...entry,
    records: Object.fromEntries(Object.entries(entry.records || {}).filter(([id]) =>
      !newcomers.has(id) || isOnAttendanceRoster(newcomers.get(id), entry.date)
    ))
  }));
}
