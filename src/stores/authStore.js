import { defineStore } from 'pinia';
import { DBService, formatTeacherName } from '../api/storage';
import { auth, authReady, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from '../api/firebase';

export function authErrorMessage(error) {
  if (error.code === 'permission-denied') return '데이터 접근 권한이 없습니다. 관리자 계정 등록과 Firestore 규칙을 확인해주세요.';
  const messages = {
    'auth/operation-not-allowed': 'Firebase Authentication에서 이메일/비밀번호 로그인을 활성화해주세요.',
    'auth/invalid-credential': '이메일 또는 비밀번호가 일치하지 않습니다.',
    'auth/invalid-email': '올바른 이메일 주소를 입력해주세요.',
    'auth/email-already-in-use': '이미 등록된 이메일입니다. Firebase 콘솔의 사용자와 앱 등록 상태를 확인해주세요.',
    'auth/weak-password': '초기 비밀번호는 6자 이상으로 입력해주세요.',
    'auth/password-does-not-meet-requirements': 'Firebase 비밀번호 정책에 맞는 비밀번호를 입력해주세요.',
    'auth/network-request-failed': '네트워크 연결을 확인해주세요.',
    'auth/too-many-requests': '요청이 많습니다. 잠시 후 다시 시도해주세요.'
  };
  return messages[error.code] || error.message || '요청을 처리하지 못했습니다.';
}

export const useAuthStore = defineStore('auth', {
  state: () => ({ user: null, loading: true, error: null }),
  getters: {
    isAuthenticated: state => !!state.user,
    isAdmin: state => state.user?.role === 'admin',
    isTeacher: state => state.user?.role === 'teacher',
    userName: state => state.user ? formatTeacherName(state.user.name, state.user.position, state.user.role) : '',
    userGroup: state => state.user?.groupName || '',
    userGroupId: state => state.user?.groupId || '',
    userDepartmentId: state => state.user?.departmentId || ''
  },
  actions: {
    async loadProfile() {
      if (!auth.currentUser) { this.user = null; return null; }
      const profile = await DBService.getOne('users', auth.currentUser.uid);
      if (!profile || !['admin', 'teacher'].includes(profile.role)) {
        throw new Error('등록된 교직원 정보가 없습니다. 관리자에게 계정 등록을 요청해주세요.');
      }
      this.user = { ...profile, id: auth.currentUser.uid };
      return this.user;
    },
    async initAuth() {
      this.loading = true;
      localStorage.removeItem('bujeon_user_session');
      try {
        await authReady;
        await this.loadProfile();
      } catch (error) {
        this.user = null;
        this.error = authErrorMessage(error);
        await signOut(auth).catch(() => {});
      } finally { this.loading = false; }
    },
    async login(identifier, password) {
      this.loading = true;
      this.error = null;
      try {
        await authReady;
        await signInWithEmailAndPassword(auth, identifier.trim(), password);
        return await this.loadProfile();
      } catch (error) {
        this.user = null;
        await signOut(auth).catch(() => {});
        this.error = authErrorMessage(error);
        throw new Error(this.error);
      } finally { this.loading = false; }
    },
    async resetPassword(email) {
      await sendPasswordResetEmail(auth, email.trim());
    },
    async logout() {
      await signOut(auth);
      this.user = null;
      localStorage.removeItem('bujeon_user_session');
    }
  }
});
