import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', component: () => import('@/views/LoginView.vue') },
    { path: '/register', component: () => import('@/views/RegisterView.vue') },
    { path: '/member/dashboard', component: () => import('@/views/member/DashboardView.vue'), meta: { requiresAuth: true } },
    { path: '/member/sessions', component: () => import('@/views/member/SessionsView.vue'), meta: { requiresAuth: true } },
    { path: '/member/bookings', component: () => import('@/views/member/BookingsView.vue'), meta: { requiresAuth: true } },
    { path: '/member/membership', component: () => import('@/views/member/MembershipView.vue'), meta: { requiresAuth: true } },
    { path: '/member/profile', component: () => import('@/views/member/ProfileView.vue'), meta: { requiresAuth: true } },
    { path: '/member/coach/:id', component: () => import('@/views/member/MemberCoachProfileView.vue'), meta: { requiresAuth: true } },
    { path: '/coach/sessions', component: () => import('@/views/coach/CoachSessionsView.vue'), meta: { requiresAuth: true, role: 'COACH' } },
    { path: '/coach/sessions/:id', component: () => import('@/views/coach/CoachSessionDetailView.vue'), meta: { requiresAuth: true, role: 'COACH' } },
    { path: '/coach/requests', component: () => import('@/views/coach/CoachRequestsView.vue'), meta: { requiresAuth: true, role: 'COACH' } },
    { path: '/admin/users', component: () => import('@/views/admin/AdminUsersView.vue'), meta: { requiresAuth: true, role: 'ADMIN' } },
    { path: '/admin/requests', component: () => import('@/views/admin/AdminRequestsView.vue'), meta: { requiresAuth: true, role: 'ADMIN' } },
    { path: '/admin/sanctions', component: () => import('@/views/admin/AdminSanctionsView.vue'), meta: { requiresAuth: true, role: 'ADMIN' } },
    { path: '/admin/session-types', component: () => import('@/views/admin/AdminSessionTypesView.vue'), meta: { requiresAuth: true, role: 'ADMIN' } },
    { path: '/admin/pricing', component: () => import('@/views/admin/AdminPricingView.vue'), meta: { requiresAuth: true, role: 'ADMIN' } },
    { path: '/:pathMatch(.*)*', component: () => import('@/views/NotFoundView.vue') },
  ],
})

function getRole(): string | null {
  try { return JSON.parse(localStorage.getItem('user') ?? 'null')?.role ?? null }
  catch { return null }
}

function defaultHome(role: string | null): string {
  if (role === 'ADMIN') return '/admin/users'
  if (role === 'COACH') return '/coach/sessions'
  return '/member/dashboard'
}

router.beforeEach((to) => {
  const isAuthenticated = !!localStorage.getItem('token')
  if (to.meta.requiresAuth && !isAuthenticated) return '/login'
  if ((to.path === '/login' || to.path === '/register') && isAuthenticated) return defaultHome(getRole())
  const requiredRole = to.meta.role as string | undefined
  if (requiredRole && isAuthenticated && getRole() !== requiredRole) return defaultHome(getRole())
})

export default router
