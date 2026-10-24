export const STUDENT_GRADES = [
  { value: '초5', label: '5학년' },
  { value: '초6', label: '6학년' },
  { value: '기타', label: '기타' }
];
export function studentGrade(value) {
  if (['초5', '5학년', '초등학교 5학년', '5'].includes(String(value))) return '초5';
  if (['초6', '6학년', '초등학교 6학년', '6'].includes(String(value))) return '초6';
  return '기타';
}
export function gradeLabel(value) { return STUDENT_GRADES.find(grade => grade.value === studentGrade(value)).label; }
export function phoneDigits(value) { return String(value ?? '').replace(/\D/g, ''); }
export function formatPhone(value) {
  const digits = phoneDigits(value);
  if (digits.length <= 3) return digits;
  if (digits.length === 8 && /^(15|16|18)/.test(digits)) return digits.slice(0,4)+'-'+digits.slice(4);
  const prefix = digits.startsWith('02') ? 2 : digits.startsWith('0505') ? 4 : 3;
  const middle = digits.length > prefix + 7 ? 4 : 3;
  const parts = [digits.slice(0,prefix),digits.slice(prefix,prefix+middle),digits.slice(prefix+middle)].filter(Boolean);
  return parts.join('-');
}
export function normalizeStudentFields(data) {
  const result = {...data};
  for (const field of ['phone','parentPhone']) if (Object.hasOwn(result,field)) result[field]=phoneDigits(result[field]);
  if (Object.hasOwn(result,'grade')) result.grade=studentGrade(result.grade);
  return result;
}
