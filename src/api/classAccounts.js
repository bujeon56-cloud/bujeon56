import { DBService } from './storage';
import { auth, db, doc, writeBatch, createStaffAccount } from './firebase';

export function classProvisioner(groups, users) {
  return {
    async provision(row) {
      const group = groups.find(g => g.year === row.year && g.departmentId === row.departmentId && g.name === row.name)
        || groups.find(g => g.year === row.year && g.departmentId === row.departmentId && g.order === row.order);
      if (group?.teacherId) {
        const existing = users.find(user => user.id === group.teacherId);
        if (!existing) throw new Error(`${row.departmentName} ${row.name}: 배정된 교사 정보를 확인해주세요.`);
        return 'existing';
      }
      const existingAccount = users.find(user => user.email?.toLowerCase() === row.email);
      if (existingAccount) {
        if (existingAccount.role !== 'teacher') throw new Error('같은 아이디의 관리자 계정이 있어 생성하지 않았습니다.');
        if (!group) throw new Error('기존 계정의 반 정보가 없습니다. 관리자 화면에서 확인해주세요.');
        await DBService.set('groups', group.id, {teacherId: existingAccount.id, teacherName: existingAccount.name});
        group.teacherId = existingAccount.id;
        return 'existing';
      }
      const groupId = group?.id || row.id;
      const groupData = group || { id: groupId, year: row.year, departmentId: row.departmentId, departmentName: row.departmentName, name: row.name, order: row.order };
      if (!auth.currentUser) throw new Error('관리자로 다시 로그인해주세요.');
      await createStaffAccount(row.email, row.password, async uid => {
        const teacher = {id:uid, role:'teacher', username:row.code, loginCode:row.code, accountType:'class', email:row.email, name:row.teacherName === '미정' ? '미정' : row.teacherName.replace(/\s*선생님$/, '') + ' 선생님', groupId, groupName:`${row.departmentName} ${row.name}`, departmentId:row.departmentId, createdAt:new Date().toISOString()};
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
