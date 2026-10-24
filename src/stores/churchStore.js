import { defineStore } from 'pinia';
import { DBService } from '../api/storage';

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
    // Group lookup by ID
    getGroupById: (state) => (groupId) => {
      return state.groups.find(g => g.id === groupId) || null;
    }
  },

  actions: {
    async initChurchData() {
      this.loading = true;
      try {
        const [years, groups, checkItems, students, users] = await Promise.all([
          DBService.getAll('years'),
          DBService.getAll('groups'),
          DBService.getAll('checkItems'),
          DBService.getAll('students'),
          DBService.getAll('users')
        ]);

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
        console.error('Failed to init church data:', err);
      } finally {
        this.loading = false;
      }
    },

    // Set Current Year
    setYear(year) {
      this.currentYear = year;
    },

    // Add New Year
    async addNewYear(newYear, copyPreviousSettings = true) {
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
        const prevYear = String(Number(newYear) - 1);
        const prevGroups = this.groups.filter(g => g.year === prevYear);
        const sourceGroups = prevGroups.length > 0 ? prevGroups : this.groups.filter(g => g.year === '2026');

        for (const g of sourceGroups) {
          const newGroupId = `${g.departmentId}_${yearId}_g${g.order}`;
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
      const id = `t_${Date.now()}`;
      const newTeacher = {
        id,
        ...teacherData,
        role: teacherData.role || 'teacher',
        createdAt: new Date().toISOString()
      };
      await DBService.set('users', id, newTeacher);
      this.teachers.push(newTeacher);

      // If assigned to a group, update group
      if (newTeacher.groupId) {
        await this.updateGroup(newTeacher.groupId, {
          teacherId: id,
          teacherName: newTeacher.name
        });
      }
      return newTeacher;
    },

    async updateTeacher(id, updates) {
      await DBService.set('users', id, updates);
      const idx = this.teachers.findIndex(t => t.id === id);
      if (idx >= 0) {
        const oldGroup = this.teachers[idx].groupId;
        this.teachers[idx] = { ...this.teachers[idx], ...updates };

        // If groupId changed, update group info
        if (updates.groupId && updates.groupId !== oldGroup) {
          await this.updateGroup(updates.groupId, {
            teacherId: id,
            teacherName: this.teachers[idx].name
          });
        }
      }
    },

    async deleteTeacher(id) {
      const teacher = this.teachers.find(t => t.id === id);
      if (teacher && teacher.groupId) {
        await this.updateGroup(teacher.groupId, {
          teacherId: null,
          teacherName: '미배정'
        });
      }
      await DBService.delete('users', id);
      this.teachers = this.teachers.filter(t => t.id !== id);
    },

    // --- Students Management ---
    async addStudent(studentData) {
      const id = `s_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      const newStudent = {
        id,
        year: this.currentYear,
        ...studentData,
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
