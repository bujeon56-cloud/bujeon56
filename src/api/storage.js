import { normalizeStudentFields } from '../utils/studentFields.js';
import { clearedAttendance } from '../utils/attendanceChecks.js';
import {
  db,
  isFirebaseConfigured,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  runTransaction
} from './firebase';

const LOCAL_STORAGE_PREFIX = 'bujeon_db_';

// Teacher & Pastor Name Formatter (Pastor is '목사님', others are always '... 선생님')
export function formatTeacherName(name, position = '', role = '') {
  if (!name) return '';
  const trimmed = name.trim();
  if (position?.includes('목사') || trimmed.includes('목사')) {
    return trimmed.includes('목사') ? trimmed : `${trimmed} 목사님`;
  }
  if (trimmed.endsWith('선생님')) return trimmed;
  return `${trimmed} 선생님`;
}

// Initial Seed Data Generator
export function getInitialSeedData() {
  const currentYear = new Date().getFullYear().toString();

  // 1부 14목장, 2부 7목장
  const groups = [];
  const users = [];

  // 1. 관리자 계정: 목사님, 서기 선생님
  users.push({
    id: 'user_admin_pastor',
    username: 'pastor',
    email: 'pastor@church.com',
    password: 'admin1234',
    name: '담당 목사님',
    role: 'admin',
    position: '목사님',
    phone: '010-1111-2222'
  });

  users.push({
    id: 'user_admin_clerk',
    username: 'clerk',
    email: 'clerk@church.com',
    password: 'admin1234',
    name: '서기 선생님',
    role: 'admin',
    position: '서기',
    phone: '010-3333-4444'
  });

  // 1부 14개 목장 및 선생님 계정 (아이디: 11, 12, ... 114)
  const part1DefaultTeacherNames = [
    '김은혜', '이요한', '박민수', '최지우', '정다은',
    '강현우', '조예은', '윤성민', '임하늘', '한서준',
    '오수아', '배도현', '신유진', '송시우'
  ];

  for (let i = 1; i <= 14; i++) {
    const rawTeacherName = part1DefaultTeacherNames[i - 1] || `1-${i}`;
    const teacherName = formatTeacherName(rawTeacherName);
    const teacherId = `t_part1_${i}`;
    const username = `1${i}`; // 11, 12, ... 114

    groups.push({
      id: `part1_g${i}`,
      year: currentYear,
      departmentId: 'part1',
      departmentName: '1부',
      name: `${i}목장`,
      teacherId: teacherId,
      teacherName: teacherName,
      order: i
    });

    users.push({
      id: teacherId,
      username: username,
      email: `t1_${i}@church.com`,
      password: '1234',
      name: teacherName,
      role: 'teacher',
      departmentId: 'part1',
      groupId: `part1_g${i}`,
      groupName: `1부 ${i}목장`,
      phone: `010-1000-10${String(i).padStart(2, '0')}`
    });
  }

  // 2부 7개 목장 및 선생님 계정 (아이디: 21, 22, ... 27)
  const part2DefaultTeacherNames = [
    '박다윗', '김사무엘', '이지혜', '최은우', '문보배', '서진우', '남궁찬'
  ];

  for (let i = 1; i <= 7; i++) {
    const rawTeacherName = part2DefaultTeacherNames[i - 1] || `2-${i}`;
    const teacherName = formatTeacherName(rawTeacherName);
    const teacherId = `t_part2_${i}`;
    const username = `2${i}`; // 21, 22, ... 27

    groups.push({
      id: `part2_g${i}`,
      year: currentYear,
      departmentId: 'part2',
      departmentName: '2부',
      name: `${i}목장`,
      teacherId: teacherId,
      teacherName: teacherName,
      order: i
    });

    users.push({
      id: teacherId,
      username: username,
      email: `t2_${i}@church.com`,
      password: '1234',
      name: teacherName,
      role: 'teacher',
      departmentId: 'part2',
      groupId: `part2_g${i}`,
      groupName: `2부 ${i}목장`,
      phone: `010-2000-20${String(i).padStart(2, '0')}`
    });
  }

  // 기본 체크 항목 및 달란트 설정
  const checkItems = [
    { id: 'attendance', label: '출석', points: 2, isDefault: true, enabled: true, color: 'emerald' },
    { id: 'bibleReading', label: '성경읽기', points: 3, isDefault: false, enabled: true, color: 'blue' },
    { id: 'prayer', label: '대표기도', points: 5, isDefault: false, enabled: true, color: 'purple' }
  ];

  // 연도 목록
  const years = [
    { id: currentYear, title: `${currentYear}년도`, isCurrent: true, createdAt: new Date().toISOString() }
  ];

  // 샘플 학생 데이터 (1부 1목장, 2목장, 2부 1목장 등에 등록)
  const students = [
    {
      id: 's_1_1',
      year: currentYear,
      departmentId: 'part1',
      groupId: 'part1_g1',
      name: '김민준',
      gender: '남',
      grade: '초5',
      birthDate: '2015-03-12',
      phone: '010-1234-5678',
      parentPhone: '010-9876-5432',
      notes: '찬양팀 활동 중',
      active: true
    },
    {
      id: 's_1_2',
      year: currentYear,
      departmentId: 'part1',
      groupId: 'part1_g1',
      name: '이서아',
      gender: '여',
      grade: '초5',
      birthDate: '2015-07-25',
      phone: '010-2345-6789',
      parentPhone: '010-8765-4321',
      notes: '',
      active: true
    },
    {
      id: 's_1_3',
      year: currentYear,
      departmentId: 'part1',
      groupId: 'part1_g1',
      name: '박시우',
      gender: '남',
      grade: '초6',
      birthDate: '2014-11-05',
      phone: '010-3456-7890',
      parentPhone: '010-7654-3210',
      notes: '성경 통독 도전 중',
      active: true
    },
    {
      id: 's_1_4',
      year: currentYear,
      departmentId: 'part1',
      groupId: 'part1_g1',
      name: '정지안',
      gender: '여',
      grade: '초6',
      birthDate: '2014-01-19',
      phone: '',
      parentPhone: '010-6543-2109',
      notes: '',
      active: true
    },
    {
      id: 's_2_1',
      year: currentYear,
      departmentId: 'part1',
      groupId: 'part1_g2',
      name: '최도윤',
      gender: '남',
      grade: '초5',
      birthDate: '2015-05-30',
      phone: '',
      parentPhone: '010-5432-1098',
      notes: '',
      active: true
    },
    {
      id: 's_2_2',
      year: currentYear,
      departmentId: 'part1',
      groupId: 'part1_g2',
      name: '한하은',
      gender: '여',
      grade: '초5',
      birthDate: '2015-09-14',
      phone: '',
      parentPhone: '010-4321-0987',
      notes: '',
      active: true
    },
    {
      id: 's_part2_1',
      year: currentYear,
      departmentId: 'part2',
      groupId: 'part2_g1',
      name: '윤예준',
      gender: '남',
      grade: '초6',
      birthDate: '2014-04-20',
      phone: '',
      parentPhone: '010-3210-9876',
      notes: '',
      active: true
    },
    {
      id: 's_part2_2',
      year: currentYear,
      departmentId: 'part2',
      groupId: 'part2_g1',
      name: '강지유',
      gender: '여',
      grade: '초5',
      birthDate: '2015-12-08',
      phone: '',
      parentPhone: '010-1122-3344',
      notes: '',
      active: true
    }
  ];

  return {
    years,
    groups,
    checkItems,
    students,
    users,
    attendances: {},
    submissions: {}
  };
}

// Local Storage Helper Functions
function getLocalCollection(collectionName) {
  const data = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${collectionName}`);
  if (!data) {
    const seed = getInitialSeedData();
    if (seed[collectionName]) {
      setLocalCollection(collectionName, seed[collectionName]);
      return seed[collectionName];
    }
    return Array.isArray(seed[collectionName]) ? [] : {};
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

function setLocalCollection(collectionName, data) {
  localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${collectionName}`, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent(`storage_${collectionName}`, { detail: data }));
}

// Universal Database Service
export const DBService = {
  isUsingCloud() {
    return isFirebaseConfigured && db !== null;
  },

  async getAll(colName, filters = []) {
    if (this.isUsingCloud()) {
      try {
        let q = collection(db, colName);
        if (filters && filters.length > 0) {
          const constraints = filters.map(f => where(f.field, f.op, f.value));
          q = query(q, ...constraints);
        }
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      } catch (err) {
        console.warn(`Firestore getAll ${colName} error:`, err);
        throw err;
      }
    }

    const items = getLocalCollection(colName);
    if (!Array.isArray(items)) return [];
    
    if (filters && filters.length > 0) {
      return items.filter(item => {
        return filters.every(f => {
          if (f.op === '==') return item[f.field] === f.value;
          if (f.op === '!=') return item[f.field] !== f.value;
          if (f.op === '>') return item[f.field] > f.value;
          if (f.op === '<') return item[f.field] < f.value;
          return true;
        });
      });
    }
    return items;
  },

  async getOne(colName, id) {
    if (this.isUsingCloud()) {
      try {
        const docRef = doc(db, colName, id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          return { ...snap.data(), id: snap.id };
        }
        return null;
      } catch (err) {
        console.warn(`Firestore getOne ${colName}/${id} error:`, err);
        throw err;
      }
    }

    const items = getLocalCollection(colName);
    if (Array.isArray(items)) {
      return items.find(i => i.id === id) || null;
    } else if (typeof items === 'object') {
      return items[id] || null;
    }
    return null;
  },

  async set(colName, id, data) {
    const payload = { ...(colName === 'students' ? normalizeStudentFields(data) : data), updatedAt: new Date().toISOString() };
    if (!payload.createdAt) {
      payload.createdAt = new Date().toISOString();
    }

    if (this.isUsingCloud()) {
      try {
        const docRef = doc(db, colName, id);
        await setDoc(docRef, payload, { merge: true });
        return { id, ...payload };
      } catch (err) {
        console.warn(`Firestore set ${colName}/${id} error:`, err);
        throw err;
      }
    }

    const items = getLocalCollection(colName);
    if (Array.isArray(items)) {
      const idx = items.findIndex(i => i.id === id);
      if (idx >= 0) {
        items[idx] = { ...items[idx], ...payload, id };
      } else {
        items.push({ id, ...payload });
      }
      setLocalCollection(colName, items);
    } else if (typeof items === 'object') {
      items[id] = { ...items[id], ...payload, id };
      setLocalCollection(colName, items);
    }
    return { id, ...payload };
  },

  async delete(colName, id) {
    if (this.isUsingCloud()) {
      try {
        const docRef = doc(db, colName, id);
        await deleteDoc(docRef);
        return true;
      } catch (err) {
        console.warn(`Firestore delete ${colName}/${id} error:`, err);
        throw err;
      }
    }

    const items = getLocalCollection(colName);
    if (Array.isArray(items)) {
      const filtered = items.filter(i => i.id !== id);
      setLocalCollection(colName, filtered);
    } else if (typeof items === 'object') {
      delete items[id];
      setLocalCollection(colName, items);
    }
    return true;
  },

  async getGroupAttendance(year, date, groupId) {
    const key = `${year}_${date}_${groupId}`;
    if (this.isUsingCloud()) {
      try {
        const snap = await getDoc(doc(db, 'attendances', key));
        if (snap.exists()) {
          return snap.data().records || {};
        }
        return {};
      } catch (err) {
        console.warn('Firestore getGroupAttendance error:', err);
        throw err;
      }
    }

    const attendances = getLocalCollection('attendances');
    return attendances[key]?.records || {};
  },

  async saveStudentAttendance(year, date, groupId, studentId, checkValues) {
    const key = `${year}_${date}_${groupId}`;
    const timestamp = new Date().toISOString();

    if (this.isUsingCloud()) {
      try {
        const docRef = doc(db, 'attendances', key);
        return await runTransaction(db, async transaction => {
          const snap = await transaction.get(docRef);
          const records = snap.exists() ? snap.data().records || {} : {};
          records[studentId] = { ...checkValues, updatedAt: timestamp };
          transaction.set(docRef, { year, date, groupId, records, updatedAt: timestamp }, { merge: true });
          return records;
        });
      } catch (err) {
        console.warn('Firestore saveStudentAttendance error:', err);
        throw err;
      }
    }

    const attendances = getLocalCollection('attendances');
    if (!attendances[key]) {
      attendances[key] = {
        year,
        date,
        groupId,
        records: {},
        updatedAt: timestamp
      };
    }
    attendances[key].records[studentId] = {
      ...checkValues,
      updatedAt: timestamp
    };
    attendances[key].updatedAt = timestamp;
    setLocalCollection('attendances', attendances);
    return attendances[key].records;
  },

  async resetGroupAttendance(year, date, groupId, students, checkItems) {
    const key = year + '_' + date + '_' + groupId;
    const timestamp = new Date().toISOString();
    if (this.isUsingCloud()) {
      return runTransaction(db, async transaction => {
        const ref = doc(db, 'attendances', key);
        const snap = await transaction.get(ref);
        const previous = snap.exists() ? snap.data() : {};
        const records = clearedAttendance(previous.records, students, checkItems, timestamp);
        transaction.set(ref, {...previous, year, date, groupId, records, updatedAt:timestamp});
        return records;
      });
    }
    const attendances = getLocalCollection('attendances');
    const records = clearedAttendance(attendances[key]?.records, students, checkItems, timestamp);
    attendances[key] = {...attendances[key],year,date,groupId,records,updatedAt:timestamp};
    setLocalCollection('attendances', attendances);
    return records;
  },

  async getSubmissionStatus(year, date, groupId) {
    const key = `${year}_${date}_${groupId}`;
    if (this.isUsingCloud()) {
      try {
        const snap = await getDoc(doc(db, 'submissions', key));
        if (snap.exists()) {
          return snap.data();
        }
        return null;
      } catch (err) {
        console.warn('Firestore getSubmissionStatus error:', err);
        throw err;
      }
    }

    const subs = getLocalCollection('submissions');
    return subs[key] || null;
  },

  async submitAttendance(year, date, groupId, teacherInfo, notes = '') {
    const key = `${year}_${date}_${groupId}`;
    const teacherName = formatTeacherName(teacherInfo.name, teacherInfo.position, teacherInfo.role);
    const submissionData = {
      id: key,
      year,
      date,
      groupId,
      submitted: true,
      submittedAt: new Date().toISOString(),
      submittedBy: teacherName,
      teacherId: teacherInfo.id || teacherInfo.uid,
      notes: notes || ''
    };

    if (this.isUsingCloud()) {
      try {
        await setDoc(doc(db, 'submissions', key), submissionData);
        return submissionData;
      } catch (err) {
        console.warn('Firestore submitAttendance error:', err);
        throw err;
      }
    }

    const subs = getLocalCollection('submissions');
    subs[key] = submissionData;
    setLocalCollection('submissions', subs);
    return submissionData;
  },

  async unlockAttendance(year, date, groupId) {
    const key = `${year}_${date}_${groupId}`;
    if (this.isUsingCloud()) {
      try {
        await deleteDoc(doc(db, 'submissions', key));
        return true;
      } catch (err) {
        console.warn('Firestore unlockAttendance error:', err);
        throw err;
      }
    }

    const subs = getLocalCollection('submissions');
    delete subs[key];
    setLocalCollection('submissions', subs);
    return true;
  },

  resetAllData() {
    const seed = getInitialSeedData();
    Object.keys(seed).forEach(col => {
      setLocalCollection(col, seed[col]);
    });
    return seed;
  }
};
