import { auth, db, doc, runTransaction, createStaffAccount } from './firebase';
import { groupNumber } from '../utils/groupOrder.js';

export function classProvisioner(groups, users) {
  return {
    async provision(row) {
      const group = groups.find(g => g.id === row.id && String(g.year) === row.year)
        || (row.newGroup && groups.find(g => String(g.year) === row.year && g.departmentId === row.departmentId && groupNumber(g) === row.order));
      if (!group && !row.newGroup) throw new Error('목장 정보가 변경되었습니다. 창을 닫고 다시 준비해주세요.');
      if (group?.teacherId) {
        const existing = users.find(user => user.id === group.teacherId);
        if (!existing) throw new Error(`${row.departmentName} ${row.name}: 배정된 교사 정보를 확인해주세요.`);
        return 'existing';
      }
      const groupId = group?.id || row.id;
      const groupRef = doc(db, 'groups', groupId);
      const groupData = { id: groupId, year: row.year, departmentId: row.departmentId, departmentName: row.departmentName, name: row.name, order: row.order };
      async function assign(uid, name, profile, mergeProfile = false) {
        const assignment = { teacherId: uid, teacherName: name };
        await runTransaction(db, async transaction => {
          const snapshot = await transaction.get(groupRef);
          if (snapshot.exists()) {
            const current = snapshot.data();
            if (String(current.year) !== row.year || current.departmentId !== row.departmentId || groupNumber(current) !== row.order || current.teacherId) {
              throw new Error(`${row.departmentName} ${row.name}: 목장 또는 담당 선생님 정보가 변경됐습니다. 다시 시도해주세요.`);
            }
          } else if (group) {
            throw new Error('목장 정보가 변경되었습니다. 다시 시도해주세요.');
          }
          transaction.set(doc(db, 'users', uid), profile, { merge: mergeProfile });
          transaction.set(groupRef, snapshot.exists() ? assignment : { ...groupData, ...assignment }, { merge: true });
        });
        if (group) Object.assign(group, assignment);
        else groups.push({ ...groupData, ...assignment });
      }
      const existingAccount = users.find(user => user.email?.toLowerCase() === row.email);
      if (existingAccount) {
        if (existingAccount.role !== 'teacher') throw new Error('같은 아이디의 관리자 계정이 있어 생성하지 않았습니다.');
        const removedYears=(existingAccount.removedYears || []).filter(year=>String(year)!==row.year);
        await assign(existingAccount.id, existingAccount.name, { removedYears }, true);
        existingAccount.removedYears=removedYears;
        return 'existing';
      }
      if (!auth.currentUser) throw new Error('관리자로 다시 로그인해주세요.');
      await createStaffAccount(row.email, row.password, async uid => {
        const teacher = {id:uid, role:'teacher', year:row.year, username:row.code, loginCode:row.code, accountType:'class', email:row.email, name:row.teacherName === '미정' ? '미정' : row.teacherName.replace(/\s*선생님$/, '') + ' 선생님', groupId, groupName:`${row.departmentName} ${row.name}`, departmentId:row.departmentId, createdAt:new Date().toISOString()};
        await assign(uid, teacher.name, teacher);
        users.push(teacher);
      });
      return 'created';
    }
  };
}
