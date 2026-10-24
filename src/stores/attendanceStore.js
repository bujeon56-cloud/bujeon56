import { defineStore } from 'pinia';
import { recentSunday } from '../utils/sundays.js';
import { DBService } from '../api/storage';
import { useChurchStore } from './churchStore';

// Helper: Get Nearest Sunday date string (YYYY-MM-DD)
export function getRecentSunday(date = new Date()) { return recentSunday(date); }

export const useAttendanceStore = defineStore('attendance', {
  state: () => ({
    selectedDate: getRecentSunday(),
    activeGroupKey: '',
    records: {}, // { [studentId]: { [checkItemId]: boolean, updatedAt: string } }
    submission: null, // { submitted: true, submittedAt, submittedBy, notes }
    loading: false,
    saveStatus: 'idle', // 'idle' | 'saving' | 'saved' | 'error'
    allDateSubmissions: {}, // for admin dashboard: { [groupId]: submission }
    allDateAttendances: {}, // for admin dashboard: { [groupId]: { records } }
  }),

  getters: {
    isSubmitted: (state) => !!state.submission?.submitted,
    isReadOnly: (state) => !!state.submission?.submitted,
    
    // Check if student attended
    isStudentAttended: (state) => (studentId) => {
      return !!state.records[studentId]?.attendance;
    },

    // Total attended count in current active records
    attendedCount: (state) => {
      return Object.values(state.records).filter(r => r?.attendance).length;
    }
  },

  actions: {
    // 1. Set Selected Date
    setDate(dateStr) {
      this.selectedDate = dateStr;
    },

    // Navigate to previous Sunday (-7 days)
    prevSunday() {
      const d = new Date(this.selectedDate);
      d.setDate(d.getDate() - 7);
      this.selectedDate = d.toISOString().split('T')[0];
    },

    // Navigate to next Sunday (+7 days)
    nextSunday() {
      const d = new Date(this.selectedDate);
      d.setDate(d.getDate() + 7);
      this.selectedDate = d.toISOString().split('T')[0];
    },

    // 2. Load Attendance for a single Group
    async loadGroupAttendance(year, groupId) {
      const context = year + '_' + this.selectedDate + '_' + groupId;
      this.activeGroupKey = context;
      this.saveStatus = 'idle';
      this.loading = true;
      try {
        const [records, submission] = await Promise.all([
          DBService.getGroupAttendance(year, this.selectedDate, groupId),
          DBService.getSubmissionStatus(year, this.selectedDate, groupId)
        ]);

        if (this.activeGroupKey !== context) return;
        this.records = records || {};
        this.submission = submission || null;
      } catch (err) {
        console.error('Failed to load group attendance:', err);
      } finally {
        if (this.activeGroupKey === context) this.loading = false;
      }
    },

    // 3. Realtime Checkbox Toggle & Auto Save
    async toggleCheck(year, groupId, studentId, checkItemId) {
      if (this.isReadOnly || this.loading || this.saveStatus === 'saving') {
        console.warn('Attendance is locked/submitted. Modification disabled.');
        return;
      }

      const currentStudentChecks = this.records[studentId] ? { ...this.records[studentId] } : {};
      const newValue = !currentStudentChecks[checkItemId];
      currentStudentChecks[checkItemId] = newValue;

      // Update local reactive state immediately
      this.records = {
        ...this.records,
        [studentId]: currentStudentChecks
      };

      this.saveStatus = 'saving';

      try {
        await DBService.saveStudentAttendance(year, this.selectedDate, groupId, studentId, currentStudentChecks);
        this.saveStatus = 'saved';
        setTimeout(() => {
          if (this.saveStatus === 'saved') this.saveStatus = 'idle';
        }, 2000);
      } catch (err) {
        console.error('Auto save error:', err);
        this.records = { ...this.records, [studentId]: { ...currentStudentChecks, [checkItemId]: !newValue } };
        this.saveStatus = 'error';
        throw err;
      }
    },

    // Set batch attendance for all students (e.g. "전체 출석" 버튼)
    async setAllAttendance(year, groupId, students, attended = true) {
      if (this.isReadOnly || this.loading || this.saveStatus === 'saving') return;
      this.saveStatus = 'saving';
      const date = this.selectedDate;
      const context = year + '_' + date + '_' + groupId;
      const previous = { ...this.records };
      try {
        if (!attended) {
          const records = await DBService.resetGroupAttendance(year, date, groupId, students, useChurchStore().checkItems);
          if (this.activeGroupKey === context) this.records = records;
        } else {
          for (const student of students) {
            const current = {...(previous[student.id] || {}), attendance:true};
            await DBService.saveStudentAttendance(year, date, groupId, student.id, current);
            if (this.activeGroupKey === context) this.records[student.id] = current;
          }
        }
        if (this.activeGroupKey !== context) return;
        this.saveStatus = 'saved';
        setTimeout(() => { if (this.activeGroupKey === context && this.saveStatus === 'saved') this.saveStatus = 'idle'; }, 2000);
      } catch (error) {
        if (this.activeGroupKey === context) this.saveStatus = 'error';
        throw error;
      }
    },

    // 4. Submit Attendance (Locks into Read-Only Mode)
    async submitCurrentGroup(year, groupId, teacherInfo, notes = '') {
      try {
        const sub = await DBService.submitAttendance(year, this.selectedDate, groupId, teacherInfo, notes);
        this.submission = sub;
        return sub;
      } catch (err) {
        console.error('Submit error:', err);
        throw err;
      }
    },

    // 5. Unlock Attendance (Admin unlock)
    async unlockGroup(year, groupId) {
      try {
        await DBService.unlockAttendance(year, this.selectedDate, groupId);
        this.submission = null;
      } catch (err) {
        console.error('Unlock error:', err);
        throw err;
      }
    },

    // 6. Admin: Load Whole Church Statistics for Current Date
    async loadAllGroupsStatsForDate(year, groups) {
      this.loading = true;
      try {
        const attendances = {};
        const submissions = {};

        await Promise.all(
          groups.map(async (g) => {
            const [att, sub] = await Promise.all([
              DBService.getGroupAttendance(year, this.selectedDate, g.id),
              DBService.getSubmissionStatus(year, this.selectedDate, g.id)
            ]);
            attendances[g.id] = att || {};
            submissions[g.id] = sub || null;
          })
        );

        this.allDateAttendances = attendances;
        this.allDateSubmissions = submissions;
      } catch (err) {
        console.error('Failed to load all stats:', err);
      } finally {
        this.loading = false;
      }
    },

    // 7. Calculate Monthly Talent Points for all students
    async calculateMonthlyTalents(year, monthStr) {
      // monthStr: "YYYY-MM"
      const churchStore = useChurchStore();
      const allAttendances = (await DBService.getAll('attendances')) || [];
      const checkItems = churchStore.checkItems;
      const excludedStudentIds = new Set(churchStore.students.filter(student => student.talentsDeleted === true).map(student => student.id));

      // Filter attendance entries for the target month
      const monthRecords = allAttendances.filter(entry => {
        return entry.year === year && entry.date && entry.date.startsWith(monthStr);
      });

      // Sum points per student
      const studentPoints = {}; // { [studentId]: { points: 0, attendanceCount: 0, bibleCount: 0, prayerCount: 0, customDetails: {} } }

      monthRecords.forEach(dayEntry => {
        const records = dayEntry.records || {};
        Object.entries(records).forEach(([studentId, checks]) => {
          if (excludedStudentIds.has(studentId)) return;
          if (!studentPoints[studentId]) {
            studentPoints[studentId] = {
              points: 0,
              attendanceCount: 0,
              bibleCount: 0,
              prayerCount: 0,
              itemCounts: {}
            };
          }

          checkItems.forEach(item => {
            if (checks[item.id]) {
              const itemPoints = Number(item.points) || 0;
              studentPoints[studentId].points += itemPoints;
              studentPoints[studentId].itemCounts[item.id] = (studentPoints[studentId].itemCounts[item.id] || 0) + 1;

              if (item.id === 'attendance') studentPoints[studentId].attendanceCount += 1;
              if (item.id === 'bibleReading') studentPoints[studentId].bibleCount += 1;
              if (item.id === 'prayer') studentPoints[studentId].prayerCount += 1;
            }
          });
        });
      });

      return studentPoints;
    }
  }
});
