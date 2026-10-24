export function clearedAttendance(records, students, checkItems, timestamp) {
  const result = {};
  const ids = new Set([...Object.keys(records || {}), ...students.map(student=>student.id)]);
  for (const id of ids) {
    const previous = records?.[id] || {};
    const checks = {...previous};
    for (const [key,value] of Object.entries(checks)) if (typeof value === 'boolean') checks[key]=false;
    for (const item of checkItems) checks[item.id]=false;
    checks.attendance=false;
    checks.updatedAt=timestamp;
    result[id]=checks;
  }
  return result;
}
