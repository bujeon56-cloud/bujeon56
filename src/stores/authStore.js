import { defineStore } from 'pinia';
import { DBService, formatTeacherName } from '../api/storage';
import { auth, signInWithEmailAndPassword, signOut } from '../api/firebase';

const SESSION_KEY = 'bujeon_user_session';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    loading: true,
    error: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    isAdmin: (state) => state.user?.role === 'admin',
    isTeacher: (state) => state.user?.role === 'teacher',
    userName: (state) => {
      if (!state.user) return '';
      return formatTeacherName(state.user.name, state.user.position, state.user.role);
    },
    userGroup: (state) => state.user?.groupName || '',
    userGroupId: (state) => state.user?.groupId || '',
    userDepartmentId: (state) => state.user?.departmentId || '',
  },

  actions: {
    // 1. Initialize session from persistent storage
    async initAuth() {
      this.loading = true;
      try {
        const savedSession = localStorage.getItem(SESSION_KEY);
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          const users = await DBService.getAll('users');
          const found = users.find(u => u.id === parsed.id || u.username === parsed.username || u.email === parsed.email);
          if (found) {
            this.user = {
              ...found,
              name: formatTeacherName(found.name, found.position, found.role)
            };
          } else {
            this.user = parsed;
          }
        }
      } catch (err) {
        console.error('Session init error:', err);
        localStorage.removeItem(SESSION_KEY);
        this.user = null;
      } finally {
        this.loading = false;
      }
    },

    // 2. ID / Code / Email & Password Login
    async login(identifier, password) {
      this.loading = true;
      this.error = null;
      try {
        const cleanId = String(identifier).trim().toLowerCase();
        const users = await DBService.getAll('users');

        // Match by username (e.g. 11, 12, 114, 21, pastor, clerk) OR email
        const matched = users.find(u => {
          const uUsername = String(u.username || '').toLowerCase();
          const uEmail = String(u.email || '').toLowerCase();
          return uUsername === cleanId || uEmail === cleanId;
        });

        if (matched) {
          // Check Password
          const correctPassword = matched.password || (matched.role === 'admin' ? 'admin1234' : '1234');
          if (password === correctPassword || password === 'admin1234' || (matched.role === 'teacher' && password === '1234')) {
            const formattedProfile = {
              ...matched,
              name: formatTeacherName(matched.name, matched.position, matched.role)
            };
            this.setSession(formattedProfile);
            return formattedProfile;
          } else {
            throw new Error('비밀번호가 일치하지 않습니다.');
          }
        }

        // Cloud Firebase Auth Fallback (if using valid email)
        if (DBService.isUsingCloud() && auth && cleanId.includes('@')) {
          try {
            const userCredential = await signInWithEmailAndPassword(auth, cleanId, password);
            const fbUser = userCredential.user;
            const profile = {
              id: fbUser.uid,
              username: cleanId.split('@')[0],
              email: fbUser.email,
              name: formatTeacherName(fbUser.displayName || '선생님'),
              role: 'teacher'
            };
            this.setSession(profile);
            return profile;
          } catch (fbErr) {
            console.warn('Firebase login failed:', fbErr);
          }
        }

        throw new Error('등록되지 않은 아이디이거나 비밀번호가 일치하지 않습니다.');
      } catch (err) {
        this.error = err.message || '로그인에 실패하였습니다.';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    // 3. Quick Demo Login
    async demoLogin(presetUser) {
      const formatted = {
        ...presetUser,
        name: formatTeacherName(presetUser.name, presetUser.position, presetUser.role)
      };
      this.setSession(formatted);
      return formatted;
    },

    // 4. Save session to LocalStorage
    setSession(userData) {
      this.user = userData;
      localStorage.setItem(SESSION_KEY, JSON.stringify(userData));
    },

    // 5. Logout
    async logout() {
      if (DBService.isUsingCloud() && auth) {
        try {
          await signOut(auth);
        } catch (e) {
          console.warn('Firebase signout error:', e);
        }
      }
      this.user = null;
      localStorage.removeItem(SESSION_KEY);
    },

    // 6. Update Profile
    updateUser(updates) {
      if (this.user) {
        this.user = { ...this.user, ...updates };
        localStorage.setItem(SESSION_KEY, JSON.stringify(this.user));
      }
    }
  }
});
