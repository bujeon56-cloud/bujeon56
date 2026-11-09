export const WEEK_DAYS = 7;

export function checkItemMaxDays(item) {
  const days = item.maxDays;
  return item.id !== 'attendance' && Number.isInteger(days) && days >= 1 && days <= WEEK_DAYS ? days : 0;
}

export function checkCount(value) {
  if (value === true) return 1;
  return Number.isInteger(value) && value >= 0 && value <= WEEK_DAYS ? value : 0;
}

export function clearedAttendance(records, students, checkItems, timestamp) {
  const result = {};
  const ids = new Set([...Object.keys(records || {}), ...students.map(student=>student.id)]);
  for (const id of ids) {
    const previous = records?.[id] || {};
    const checks = {...previous};
    for (const [key, value] of Object.entries(checks)) {
      if (typeof value === 'boolean') checks[key] = false;
      if (Number.isInteger(value) && value >= 0 && value <= WEEK_DAYS) checks[key] = 0;
    }
    for (const item of checkItems) checks[item.id] = checkItemMaxDays(item) ? 0 : false;
    checks.attendance=false;
    checks.updatedAt=timestamp;
    result[id]=checks;
  }
  return result;
}
