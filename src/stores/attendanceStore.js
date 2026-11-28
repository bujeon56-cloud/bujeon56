import { defineStore } from 'pinia';
import { recentSunday, sundayForYear } from '../utils/sundays.js';
import { checkCount, checkItemMaxDays } from '../utils/attendanceChecks.js';
import { excludeNewcomerAttendance } from '../utils/newcomers.js';
import { DBService } from '../api/storage';
import { useChurchStore } from './churchStore';

const checkQueues = new WeakMap();

// Helper: Get Nearest Sunday date string (YYYY-MM-DD)
export function getRecentSunday(date = new Date()) { return recentSunday(date); }

export const useAttendanceStore = defineStore('attendance', {
  state: () => ({
    selectedDate: getRecentSunday(),
    activeGroupKey: '',
    preloadedGroupKey: '',
    records: {}, // Each check is a boolean or a day count.
    submission: null, // { submitted: true, submittedAt, submittedBy, notes }
    loading: false,
    saveStatus: 'idle', // 'idle' | 'saving' | 'saved' | 'error'
    checkSavesPending: false,
    failedChecksByGroup: {},
    allDateSubmissions: {}, // for admin dashboard: { [groupId]: submission }
    allDateAttendances: {}, // for admin dashboard: { [groupId]: { records } }
    statsRequest: null,
    statsError: false
  }),

  getters: {
    isSubmitted: (state) => !!state.submission?.submitted,
    isReadOnly: (state) => !!state.submission?.submitted,
    isBatchSaving: (state) => state.saveStatus === 'saving' && !state.checkSavesPending,
    failedChecks: (state) => Object.values(state.failedChecksByGroup[state.activeGroupKey] || {}),
    
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
    // Recompute when opening an attendance screen instead of reusing an old selection.
    resetDefaultDate(year, now = new Date()) {
      this.selectedDate = sundayForYear(year, recentSunday(now));
    },
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
      const date = this.selectedDate;
      const context = year + '_' + date + '_' + groupId;
      this.activeGroupKey = context;
      this.saveStatus = 'idle';
      this.checkSavesPending = false;
      this.loading = true;
      try {
        const pending = checkQueues.get(this)?.get(context);
        if (pending) await pending.tail;
        if (this.activeGroupKey !== context) return;
        const [records, submission] = await Promise.all([
          DBService.getGroupAttendance(year, date, groupId),
          DBService.getSubmissionStatus(year, date, groupId)
        ]);

        if (this.activeGroupKey !== context) return;
        this.records = records || {};
        this.submission = submission || null;
      } catch (err) {
        if (this.preloadedGroupKey === context) this.preloadedGroupKey = '';
        console.error('Failed to load group attendance:', err);
      } finally {
        if (this.activeGroupKey === context) this.loading = false;
      }
    },

    async toggleCheck(year, groupId, studentId, checkItemId) {
      return this.setCheck(year, groupId, studentId, checkItemId, !this.records[studentId]?.[checkItemId]);
    },

    async setCheck(year, groupId, studentId, checkItemId, value) {
      if (this.isReadOnly || this.loading || this.isBatchSaving) return;

      const item = useChurchStore().checkItems.find(item => item.id === checkItemId);
      const maxDays = item ? checkItemMaxDays(item) : 0;
      if (maxDays ? !Number.isInteger(value) || value < 0 || value > maxDays : typeof value !== 'boolean') {
        throw new Error('체크 값을 확인해주세요.');
      }

      const date = this.selectedDate;
      const context = year + '_' + date + '_' + groupId;
      const visibleRecords = this.records;
      let queues = checkQueues.get(this);
      if (!queues) checkQueues.set(this, queues = new Map());
      let queue = queues.get(context);
      if (!queue) {
        queue = { tail: Promise.resolve(), confirmed: { ...visibleRecords }, students: new Set(), latest: new Map() };
        queues.set(context, queue);
      }

      queue.students.add(studentId);
      const checkKey = JSON.stringify([studentId, checkItemId]);
      const check = { key: checkKey, studentId, checkItemId, value };
      queue.latest.set(checkKey, check);
      this.dismissFailedCheck(checkKey, context);
      const failureState = this.failedChecksByGroup;
      visibleRecords[studentId] = { ...visibleRecords[studentId], [checkItemId]: value };
      this.checkSavesPending = true;
      this.saveStatus = 'saving';

      // Firestore queues each field write immediately. Apply confirmations in input order.
      const request = DBService.saveStudentCheckPatch(year, date, groupId, studentId, { [checkItemId]: value })
        .then(patch => ({ patch }), error => ({ error }));
      const write = queue.tail.then(async () => {
        const result = await request;
        if ('error' in result) throw result.error;
        queue.confirmed[studentId] = { ...queue.confirmed[studentId], ...result.patch };
      });
      const settled = write.catch(() => {
        if (this.failedChecksByGroup !== failureState || queue.latest.get(checkKey) !== check) return;
        if (!failureState[context]) failureState[context] = {};
        failureState[context][checkKey] = check;
      });
      queue.tail = settled;
      await settled;
      if (queue.tail === settled) {
        queues.delete(context);
        if (this.activeGroupKey === context && this.records === visibleRecords) {
          for (const id of queue.students) {
            if (queue.confirmed[id]) visibleRecords[id] = queue.confirmed[id];
            else delete visibleRecords[id];
          }
          this.checkSavesPending = false;
          this.saveStatus = this.failedChecks.length ? 'error' : 'saved';
          if (this.saveStatus === 'saved') {
            setTimeout(() => {
              if (this.records === visibleRecords && this.saveStatus === 'saved') this.saveStatus = 'idle';
            }, 2000);
          }
        }
      }
      await write;
    },

    dismissFailedCheck(key, context = this.activeGroupKey) {
      const failures = this.failedChecksByGroup[context];
      if (!failures) return;
      delete failures[key];
      if (!Object.keys(failures).length) {
        delete this.failedChecksByGroup[context];
        if (context === this.activeGroupKey && this.saveStatus === 'error') this.saveStatus = 'idle';
      }
    },

    // Set batch attendance for all students (e.g. "전체 출석" 버튼)
    async setAllAttendance(year, groupId, students, attended = true) {
      if (this.isReadOnly || this.loading || this.saveStatus === 'saving') return;
      this.saveStatus = 'saving';
      const date = this.selectedDate;
      const context = year + '_' + date + '_' + groupId;
      try {
        if (!attended) {
          const records = await DBService.resetGroupAttendance(year, date, groupId, students, useChurchStore().checkItems);
          if (this.activeGroupKey === context) {
            this.records = records;
            delete this.failedChecksByGroup[context];
          }
        } else {
          for (const student of students) {
            const records = await DBService.saveStudentAttendance(year, date, groupId, student.id, { attendance: true });
            if (this.activeGroupKey === context) this.records[student.id] = records[student.id];
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
      const date = this.selectedDate;
      const request = Symbol();
      this.statsRequest = request;
      this.statsError = false;
      this.loading = true;
      try {
        if (!DBService.isUsingCloud()) {
          const entries = await Promise.all(groups.map(async group => {
            const [records, submission] = await Promise.all([
              DBService.getGroupAttendance(year, date, group.id),
              DBService.getSubmissionStatus(year, date, group.id)
            ]);
            return { id: group.id, records, submission };
          }));
          if (this.statsRequest !== request) return;
          this.allDateAttendances = Object.fromEntries(entries.map(entry => [entry.id, entry.records || {}]));
          this.allDateSubmissions = Object.fromEntries(entries.map(entry => [entry.id, entry.submission || null]));
          return;
        }
        const filters = [
          { field: 'date', op: '==', value: date },
          { field: 'year', op: '==', value: year }
        ];
        const [attendanceEntries, submissionEntries] = groups.length ? await Promise.all([
          DBService.getAll('attendances', filters),
          DBService.getAll('submissions', filters)
        ]) : [[], []];

        if (this.statsRequest !== request) return;
        const validIds = new Set(groups.map(group => `${year}_${date}_${group.id}`));
        this.allDateAttendances = Object.fromEntries(attendanceEntries
          .filter(entry => validIds.has(entry.id))
          .map(entry => [entry.groupId, entry.records || {}]));
        this.allDateSubmissions = Object.fromEntries(submissionEntries
          .filter(entry => validIds.has(entry.id))
          .map(entry => [entry.groupId, entry]));
      } catch (err) {
        console.error('Failed to load all stats:', err);
        if (this.statsRequest === request) this.statsError = true;
      } finally {
        if (this.statsRequest === request) this.loading = false;
      }
    },

    // 7. Calculate Monthly Talent Points for all students
    async calculateMonthlyTalents(year, monthStr, groupId) {
      // monthStr: "YYYY-MM"
      const churchStore = useChurchStore();
      const filters = groupId ? [{ field: 'groupId', op: '==', value: groupId }] : [];
      const allAttendances = await DBService.getAll('attendances', filters).catch(error => {
        if (!groupId || error.code !== 'permission-denied') throw error;
        // Older deployed rules allow individual reads for the assigned class, but forbid listing attendance.
        const month = Number(monthStr.slice(5));
        const dayCount = new Date(Date.UTC(Number(year), month, 0)).getUTCDate();
        return Promise.all(Array.from({ length: dayCount }, async (_, index) => {
          const date = `${monthStr}-${String(index + 1).padStart(2, '0')}`;
          const records = await DBService.getGroupAttendance(year, date, groupId);
          return { year, date, groupId, records };
        }));
      });
      const students = groupId ? churchStore.students.filter(student => student.groupId === groupId) : churchStore.students;
      const checkItems = churchStore.checkItems;
      const excludedStudentIds = new Set(students.filter(student => student.talentsDeleted === true).map(student => student.id));

      // Filter attendance entries for the target month
      const savedMonthRecords = allAttendances.filter(entry => {
        return entry.year === year && entry.date && entry.date.startsWith(monthStr);
      });
      const monthRecords = excludeNewcomerAttendance(savedMonthRecords, students, year);

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
            const count = checkCount(checks[item.id]);
            if (count) {
              const itemPoints = Number(item.points) || 0;
              studentPoints[studentId].points += itemPoints * count;
              studentPoints[studentId].itemCounts[item.id] = (studentPoints[studentId].itemCounts[item.id] || 0) + count;

              if (item.id === 'attendance') studentPoints[studentId].attendanceCount += 1;
              if (item.id === 'bibleReading') studentPoints[studentId].bibleCount += count;
              if (item.id === 'prayer') studentPoints[studentId].prayerCount += count;
            }
          });
        });
      });

      return studentPoints;
    }
  }
});
