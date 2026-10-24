function compareGroups(a, b) {
  const department = group => ({part1: 1, part2: 2}[group.departmentId] || 99);
  const order = group => Number(group.order) > 0 ? Number(group.order) : Number(group.name?.match(/\d+/)?.[0]) || Infinity;
  if (department(a) !== department(b)) return department(a) - department(b);
  if (order(a) !== order(b)) return order(a) - order(b);
  return 0;
}

export function teacherGroupForYear(groups, year, teacherId) {
  return groups.filter(group => group.year === year && group.teacherId === teacherId).sort(compareGroups)[0] || null;
}

export function teachersForYear(teachers, groups, year) {
  const assignments = new Map();
  for (const group of groups.filter(group => group.year === year).sort(compareGroups)) {
    if (group.teacherId && !assignments.has(group.teacherId)) assignments.set(group.teacherId, group);
  }
  return teachers.filter(teacher => {
    if (teacher.role === 'admin') return false;
    if (groups.some(group => group.year === year && group.teacherId === teacher.id)) return true;
    if ((teacher.removedYears || []).includes(year)) return false;
    const profileGroup = groups.find(group => group.id === teacher.groupId);
    const codeYear = /^\d{6}$/.test(teacher.loginCode || '') ? '20' + teacher.loginCode.slice(0, 2) : null;
    return teacher.year === year || profileGroup?.year === year || codeYear === year;
  }).sort((a, b) => {
    const left = assignments.get(a.id), right = assignments.get(b.id);
    if (!left) return right ? 1 : 0;
    if (!right) return -1;
    return compareGroups(left, right);
  });
}

export function yearRemovalPlan(teachers, groups, year, ids, currentUserId) {
  const unique = [...new Set(ids)];
  const visible = teachersForYear(teachers, groups, year);
  const selected = unique.map(id => visible.find(teacher => teacher.id === id));
  if (selected.some(teacher => !teacher || teacher.role === 'admin' || teacher.id === currentUserId)) {
    throw new Error('선택한 연도의 반 선생님만 삭제할 수 있습니다. 관리자 계정은 제외해주세요.');
  }
  return selected.map(teacher => ({
    teacher,
    removedYears: [...new Set([...(teacher.removedYears || []), year])],
    groups: groups.filter(group => group.year === year && group.teacherId === teacher.id)
  }));
}
