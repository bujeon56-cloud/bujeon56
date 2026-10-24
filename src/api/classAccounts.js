import { auth, db, doc, writeBatch, createStaffAccount } from './firebase';

export function classProvisioner(groups, users) {
  return {
    async provision(row) {
      const group = groups.find(g => g.id === row.id && String(g.year) === row.year);
      if (!group) throw new Error('목장 정보가 변경되었습니다. 창을 닫고 다시 준비해주세요.');
      if (group?.teacherId) {
        const existing = users.find(user => user.id === group.teacherId);
        if (!existing) throw new Error(`${row.departmentName} ${row.name}: 배정된 교사 정보를 확인해주세요.`);
        return 'existing';
      }
      const existingAccount = users.find(user => user.email?.toLowerCase() === row.email);
      if (existingAccount) {
        if (existingAccount.role !== 'teacher') throw new Error('같은 아이디의 관리자 계정이 있어 생성하지 않았습니다.');
        if (!group) throw new Error('기존 계정의 반 정보가 없습니다. 관리자 화면에서 확인해주세요.');
        const removedYears=(existingAccount.removedYears || []).filter(year=>String(year)!==row.year);
        const batch=writeBatch(db);
        batch.set(doc(db,'users',existingAccount.id),{removedYears},{merge:true});
        batch.set(doc(db,'groups',group.id),{teacherId:existingAccount.id,teacherName:existingAccount.name},{merge:true});
        await batch.commit();
        Object.assign(group,{teacherId:existingAccount.id,teacherName:existingAccount.name});
        existingAccount.removedYears=removedYears;
        return 'existing';
      }
      const groupId = group?.id || row.id;
      const groupData = group || { id: groupId, year: row.year, departmentId: row.departmentId, departmentName: row.departmentName, name: row.name, order: row.order };
      if (!auth.currentUser) throw new Error('관리자로 다시 로그인해주세요.');
      await createStaffAccount(row.email, row.password, async uid => {
        const teacher = {id:uid, role:'teacher', year:row.year, username:row.code, loginCode:row.code, accountType:'class', email:row.email, name:row.teacherName === '미정' ? '미정' : row.teacherName.replace(/\s*선생님$/, '') + ' 선생님', groupId, groupName:`${row.departmentName} ${row.name}`, departmentId:row.departmentId, createdAt:new Date().toISOString()};
        const batch = writeBatch(db);
        batch.set(doc(db,'users',uid), teacher);
        batch.set(doc(db,'groups',groupId), {...groupData, teacherId:uid, teacherName:teacher.name}, {merge:true});
        await batch.commit();
        users.push(teacher);
        if (group) Object.assign(group, {teacherId:uid, teacherName:teacher.name});
        else groups.push({...groupData, teacherId:uid, teacherName:teacher.name});
      });
      return 'created';
    }
  };
}
