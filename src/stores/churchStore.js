import { defineStore } from 'pinia';
import { DBService } from '../api/storage';
import { teachersForYear, yearRemovalPlan, teacherGroupForYear } from '../utils/teacherYears.js';
import { auth, db, doc, writeBatch, arrayUnion, createStaffAccount } from '../api/firebase';
import { useAuthStore } from './authStore';

export const useChurchStore = defineStore('church', {
  state: () => ({
    currentYear: new Date().getFullYear().toString(),
    years: [],
    groups: [],
    checkItems: [],
    students: [],
    teachers: [],
    loading: false,
    initialized: false
  }),

  getters: {
    currentTeachers: state => teachersForYear(state.teachers, state.groups, state.currentYear),
    // Current year's groups
    currentGroups: (state) => {
      return state.groups.filter(g => g.year === state.currentYear);
    },
    // Part 1 groups (sorted by order)
    part1Groups: (state) => {
      return state.groups
        .filter(g => g.year === state.currentYear && g.departmentId === 'part1')
        .sort((a, b) => (a.order || 0) - (b.order || 0));
    },
    // Part 2 groups (sorted by order)
    part2Groups: (state) => {
      return state.groups
        .filter(g => g.year === state.currentYear && g.departmentId === 'part2')
        .sort((a, b) => (a.order || 0) - (b.order || 0));
    },
    // Active check items
    activeCheckItems: (state) => {
      return state.checkItems.filter(item => item.enabled !== false);
    },
    // Get students for a specific group
    getStudentsByGroup: (state) => (groupId) => {
      return state.students.filter(s => s.groupId === groupId && s.year === state.currentYear && s.active !== false);
    },
    getTeacherGroup: (state) => (teacherId) => {
      return teacherGroupForYear(state.groups, state.currentYear, teacherId);
    },
    // Group lookup by ID
    getGroupById: (state) => (groupId) => {
      return state.groups.find(g => g.id === groupId) || null;
    }
  },

  actions: {
    async initChurchData() {
      this.loading = true;
      try {
        const account = useAuthStore();
        if (!account.user) { this.$reset(); return; }
        const groupFilters = account.isAdmin ? [] : [{ field: 'teacherId', op: '==', value: account.user.id }];
        const groups = await DBService.getAll('groups', groupFilters);
        const studentPromise = account.isAdmin ? DBService.getAll('students') :
          Promise.all(groups.map(g => DBService.getAll('students', [{ field: 'groupId', op: '==', value: g.id }]))).then(lists => lists.flat());
        const [years, checkItems, students, users] = await Promise.all([
          DBService.getAll('years'),
          DBService.getAll('checkItems'),
          studentPromise,
          account.isAdmin ? DBService.getAll('users') : Promise.resolve([account.user])
        ]);

        if (account.isAdmin && !years.length) {
          const year = new Date().getFullYear().toString();
          const firstYear = { id: year, title: year + '년도', isCurrent: true };
          await DBService.set('years', year, firstYear);
          years.push(firstYear);
        }
        if (account.isAdmin && !checkItems.length) {
          const item = { id: 'attendance', label: '출석', points: 2, enabled: true, isDefault: true, color: 'emerald' };
          await DBService.set('checkItems', item.id, item);
          checkItems.push(item);
        }
        this.years = years.length > 0 ? years : [{ id: this.currentYear, title: `${this.currentYear}년도`, isCurrent: true }];
        
        // Find current year
        const currentYearObj = this.years.find(y => y.isCurrent) || this.years[0];
        if (currentYearObj) {
          this.currentYear = currentYearObj.id;
        }

        this.groups = groups;
        this.checkItems = checkItems;
        this.students = students;
        this.teachers = users;
        this.initialized = true;
      } catch (err) {
        this.initialized = false;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    // Set Current Year
    setYear(year) {
      this.currentYear = year;
    },

    // Add New Year
    async addNewYear(newYear, copyPreviousSettings = false) {
      const sourceYear = this.currentYear;
      const yearId = String(newYear);
      const exists = this.years.some(y => y.id === yearId);
      if (exists) {
        throw new Error('이미 존재하는 연도입니다.');
      }

      const yearObj = {
        id: yearId,
        title: `${yearId}년도`,
        isCurrent: true,
        createdAt: new Date().toISOString()
      };

      // Set other years isCurrent to false
      for (const y of this.years) {
        if (y.isCurrent) {
          await DBService.set('years', y.id, { ...y, isCurrent: false });
        }
      }

      await DBService.set('years', yearId, yearObj);
      this.years.forEach(y => y.isCurrent = false);
      this.years.unshift(yearObj);
      this.currentYear = yearId;

      // Copy groups from previous year if requested
      if (copyPreviousSettings) {
        const sourceGroups = this.groups.filter(g => g.year === sourceYear);

        for (const g of sourceGroups) {
          const newGroupId = `${g.id}_${yearId}`;
          const newGroup = {
            ...g,
            id: newGroupId,
            year: yearId,
            teacherId: null, // Teachers reset for new year assignment
            teacherName: '미배정'
          };
          await DBService.set('groups', newGroupId, newGroup);
          this.groups.push(newGroup);
        }
      }

      return yearObj;
    },

    // --- Groups (목장) Management ---
    async addGroup({ departmentId, name, order, teacherId = null, teacherName = '미배정' }) {
      const deptName = departmentId === 'part1' ? '1부' : '2부';
      const count = this.groups.filter(g => g.departmentId === departmentId && g.year === this.currentYear).length;
      const calculatedOrder = order || count + 1;
      const id = `${departmentId}_${this.currentYear}_g${Date.now()}`;

      const groupData = {
        id,
        year: this.currentYear,
        departmentId,
        departmentName: deptName,
        name,
        order: calculatedOrder,
        teacherId,
        teacherName
      };

      await DBService.set('groups', id, groupData);
      this.groups.push(groupData);
      return groupData;
    },

    async updateGroup(id, updates) {
      await DBService.set('groups', id, updates);
      const idx = this.groups.findIndex(g => g.id === id);
      if (idx >= 0) {
        this.groups[idx] = { ...this.groups[idx], ...updates };
      }
    },

    async deleteGroup(id) {
      await DBService.delete('groups', id);
      this.groups = this.groups.filter(g => g.id !== id);
    },

    // --- Check Items & Talent Points Management ---
    async addCheckItem({ label, points = 2, color = 'blue' }) {
      const id = `item_${Date.now()}`;
      const item = {
        id,
        label,
        points: Number(points),
        color,
        enabled: true,
        isDefault: false
      };
      await DBService.set('checkItems', id, item);
      this.checkItems.push(item);
      return item;
    },

    async updateCheckItem(id, updates) {
      if (updates.points) updates.points = Number(updates.points);
      await DBService.set('checkItems', id, updates);
      const idx = this.checkItems.findIndex(c => c.id === id);
      if (idx >= 0) {
        this.checkItems[idx] = { ...this.checkItems[idx], ...updates };
      }
    },

    async deleteCheckItem(id) {
      await DBService.delete('checkItems', id);
      this.checkItems = this.checkItems.filter(c => c.id !== id);
    },

    // --- Teacher Management ---
    async addTeacher(teacherData) {
      const { password, ...profile } = teacherData;
      if (!profile.email || !password || password.length < 6) throw new Error('이메일과 6자 이상의 비밀번호가 필요합니다.');
      let newTeacher;
      await createStaffAccount(profile.email.trim(), password, async id => {
        newTeacher = { ...profile, year: this.currentYear, id, role: profile.role || 'teacher', createdAt: new Date().toISOString() };
        await DBService.set('users', id, newTeacher);
      });
      this.teachers.push(newTeacher);
      if (newTeacher.groupId) await this.updateGroup(newTeacher.groupId, { teacherId: newTeacher.id, teacherName: newTeacher.name });
      return newTeacher;
    },

    async updateTeacher(id, updates) {
      const { password, ...safeUpdates } = updates;
      const previous = this.teachers.find(t => t.id === id);
      if (id === auth.currentUser?.uid && safeUpdates.role && safeUpdates.role !== previous?.role) throw new Error('현재 로그인한 관리자 역할은 변경할 수 없습니다.');
      if (safeUpdates.email && previous?.email !== safeUpdates.email) throw new Error('이메일 변경은 Firebase Authentication 콘솔에서 처리해주세요.');
      updates = safeUpdates;
      await DBService.set('users', id, updates);
      const idx = this.teachers.findIndex(t => t.id === id);
      if (idx >= 0) {
        const oldGroup = this.getTeacherGroup(id)?.id;
        this.teachers[idx] = { ...this.teachers[idx], ...updates };

        // If groupId changed, update group info
        if (Object.hasOwn(updates, 'groupId') && updates.groupId !== oldGroup) {
          if (oldGroup) await this.updateGroup(oldGroup, { teacherId: null, teacherName: '미배정' });
          if (updates.groupId) {
          await this.updateGroup(updates.groupId, {
            teacherId: id,
            teacherName: this.teachers[idx].name
          });
          }
        }
      }
    },

    async deleteTeachersForYear(ids, year = this.currentYear) {
      const plan = yearRemovalPlan(this.teachers, this.groups, year, ids, auth.currentUser?.uid);
      if (!plan.length) return;
      const batch = writeBatch(db);
      for (const entry of plan) {
        batch.update(doc(db, 'users', entry.teacher.id), { removedYears: arrayUnion(year) });
        for (const group of entry.groups) batch.update(doc(db, 'groups', group.id), { teacherId: null, teacherName: '미배정' });
      }
      await batch.commit();
      for (const entry of plan) {
        entry.teacher.removedYears = entry.removedYears;
        for (const group of entry.groups) Object.assign(group, { teacherId: null, teacherName: '미배정' });
      }
    },

    async deleteTeacher(id) {
      return this.deleteTeachersForYear([id]);
    },

    // --- Students Management ---
    async addStudent(studentData) {
      if (!this.currentGroups.some(g => g.id === studentData.groupId)) {
        throw new Error('선택한 연도에 배정된 반이 없습니다.');
      }
      const id = `s_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      const newStudent = {
        id,
        ...studentData,
        year: this.currentYear,
        active: true,
        createdAt: new Date().toISOString()
      };
      await DBService.set('students', id, newStudent);
      this.students.push(newStudent);
      return newStudent;
    },

    async updateStudent(id, updates) {
      await DBService.set('students', id, updates);
      const idx = this.students.findIndex(s => s.id === id);
      if (idx >= 0) {
        this.students[idx] = { ...this.students[idx], ...updates };
      }
    },

    async deleteStudent(id) {
      await DBService.delete('students', id);
      this.students = this.students.filter(s => s.id !== id);
    }
  }
});
