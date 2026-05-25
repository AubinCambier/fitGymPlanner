<template>
  <header class="header">
    <div class="inner">
      <span class="logo">Fit<span class="accent">Gym</span> Planner</span>
      <nav class="nav">
        <template v-if="auth.user?.role === 'ADMIN'">
          <RouterLink to="/admin/dashboard" class="nav-link">Dashboard</RouterLink>
          <RouterLink to="/admin/users" class="nav-link">Users</RouterLink>
          <RouterLink to="/admin/requests" class="nav-link">Requests</RouterLink>
          <RouterLink to="/admin/sanctions" class="nav-link">Sanctions</RouterLink>
          <RouterLink to="/admin/session-types" class="nav-link">Session Types</RouterLink>
          <RouterLink to="/admin/pricing" class="nav-link">Pricing</RouterLink>
          <RouterLink to="/member/profile" class="nav-link">Profile</RouterLink>
        </template>
        <template v-else-if="auth.user?.role === 'COACH'">
          <RouterLink to="/coach/sessions" class="nav-link">My Sessions</RouterLink>
          <RouterLink to="/coach/requests" class="nav-link">Requests</RouterLink>
          <RouterLink to="/member/profile" class="nav-link">Profile</RouterLink>
        </template>
        <template v-else>
          <RouterLink to="/member/dashboard" class="nav-link">Dashboard</RouterLink>
          <RouterLink to="/member/sessions" class="nav-link">Sessions</RouterLink>
          <RouterLink to="/member/bookings" class="nav-link">Bookings</RouterLink>
          <RouterLink to="/member/membership" class="nav-link">Membership</RouterLink>
          <RouterLink to="/member/profile" class="nav-link">Profile</RouterLink>
        </template>
      </nav>
      <button class="btn-logout" @click="handleLogout">Sign out</button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.header {
  background: var(--primary);
  padding: 0 32px;
  height: 60px;
  display: flex;
  align-items: center;
}
.inner {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 32px;
}
.logo {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 20px;
  color: #fff;
  white-space: nowrap;
}
.accent { color: var(--accent); }
.nav {
  display: flex;
  gap: 24px;
  flex: 1;
}
.nav-link {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255,255,255,0.6);
  text-decoration: none;
  transition: color 0.2s;
}
.nav-link:hover,
.nav-link.router-link-active {
  color: var(--accent);
}
.btn-logout {
  background: transparent;
  border: 1.5px solid rgba(255,255,255,0.2);
  color: rgba(255,255,255,0.7);
  padding: 6px 16px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.btn-logout:hover {
  border-color: var(--accent);
  color: var(--accent);
}
</style>
