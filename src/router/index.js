import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/authStore';

const routes = [
  {
    path: '/',
    redirect: () => {
      const auth = useAuthStore();
      if (!auth.isAuthenticated) return '/login';
      return auth.isAdmin ? '/admin/dashboard' : '/teacher/attendance';
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { guestOnly: true }
  },
  // Teacher Routes
  {
    path: '/teacher',
    component: () => import('../views/teacher/TeacherLayout.vue'),
    meta: { requiresAuth: true, role: 'teacher' },
    children: [
      {
        path: '',
        redirect: '/teacher/attendance'
      },
      {
        path: 'attendance',
        name: 'TeacherAttendance',
        component: () => import('../views/teacher/AttendanceView.vue')
      },
      {
        path: 'students',
        name: 'TeacherStudents',
        component: () => import('../views/teacher/StudentsView.vue')
      }
    ]
  },
  // Admin Routes
  {
    path: '/admin',
    component: () => import('../views/admin/AdminLayout.vue'),
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      {
        path: '',
        redirect: '/admin/dashboard'
      },
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('../views/admin/DashboardView.vue')
      },
      {
        path: 'groups',
        name: 'AdminGroups',
        component: () => import('../views/admin/GroupsView.vue')
      },
      {
        path: 'teachers',
        name: 'AdminTeachers',
        component: () => import('../views/admin/TeachersView.vue')
      },
      {
        path: 'settings',
        name: 'AdminSettings',
        component: () => import('../views/admin/SettingsView.vue')
      },
      {
        path: 'talents',
        name: 'AdminTalents',
        component: () => import('../views/admin/TalentStatsView.vue')
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (to.hash) return { el: to.hash, top: 80 };
    return savedPosition || { top: 0 };
  }
});

// Navigation Guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  if (authStore.loading) {
    await authStore.initAuth();
  }

  const isAuth = authStore.isAuthenticated;
  const isAdmin = authStore.isAdmin;

  // Guest Only Routes (Login)
  if (to.meta.guestOnly && isAuth) {
    return next(isAdmin ? '/admin/dashboard' : '/teacher/attendance');
  }

  // Requires Auth
  if (to.meta.requiresAuth && !isAuth) {
    return next({ path: '/login', query: { redirect: to.fullPath } });
  }

  // Admin Only Routes
  if (to.meta.role === 'admin' && !isAdmin) {
    return next('/teacher/attendance');
  }

  next();
});

export default router;
