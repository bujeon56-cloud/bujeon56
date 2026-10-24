export function teachersForYear(teachers, groups, year) {
  return teachers.filter(teacher => {
    if (teacher.role === 'admin') return true;
    if (groups.some(group => group.year === year && group.teacherId === teacher.id)) return true;
    if ((teacher.removedYears || []).includes(year)) return false;
    const profileGroup = groups.find(group => group.id === teacher.groupId);
    const codeYear = /^\d{6}$/.test(teacher.loginCode || '') ? '20' + teacher.loginCode.slice(0, 2) : null;
    return teacher.year === year || profileGroup?.year === year || codeYear === year;
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
