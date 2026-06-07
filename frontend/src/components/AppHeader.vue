<template>
  <header class="header">
    <div class="inner">
      <span class="logo">Fit<span class="accent">Gym</span></span>
      <nav class="nav desktop-nav">
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
          <RouterLink to="/member/schedule" class="nav-link">Schedule</RouterLink>
          <RouterLink to="/member/membership" class="nav-link">Membership</RouterLink>
          <RouterLink to="/member/profile" class="nav-link">Profile</RouterLink>
        </template>
      </nav>
      <button class="btn-logout desktop-nav" @click="handleLogout">Sign out</button>
      <button class="btn-burger" @click="menuOpen = !menuOpen" :aria-expanded="menuOpen">
        <span></span><span></span><span></span>
      </button>
    </div>

    <div class="mobile-menu" :class="{ open: menuOpen }" @click.self="menuOpen = false">
      <nav class="mobile-nav" @click="menuOpen = false">
        <template v-if="auth.user?.role === 'ADMIN'">
          <RouterLink to="/admin/dashboard" class="mobile-link">Dashboard</RouterLink>
          <RouterLink to="/admin/users" class="mobile-link">Users</RouterLink>
          <RouterLink to="/admin/requests" class="mobile-link">Requests</RouterLink>
          <RouterLink to="/admin/sanctions" class="mobile-link">Sanctions</RouterLink>
          <RouterLink to="/admin/session-types" class="mobile-link">Session Types</RouterLink>
          <RouterLink to="/admin/pricing" class="mobile-link">Pricing</RouterLink>
          <RouterLink to="/member/profile" class="mobile-link">Profile</RouterLink>
        </template>
        <template v-else-if="auth.user?.role === 'COACH'">
          <RouterLink to="/coach/sessions" class="mobile-link">My Sessions</RouterLink>
          <RouterLink to="/coach/requests" class="mobile-link">Requests</RouterLink>
          <RouterLink to="/member/profile" class="mobile-link">Profile</RouterLink>
        </template>
        <template v-else>
          <RouterLink to="/member/dashboard" class="mobile-link">Dashboard</RouterLink>
          <RouterLink to="/member/sessions" class="mobile-link">Sessions</RouterLink>
          <RouterLink to="/member/bookings" class="mobile-link">Bookings</RouterLink>
          <RouterLink to="/member/schedule" class="mobile-link">Schedule</RouterLink>
          <RouterLink to="/member/membership" class="mobile-link">Membership</RouterLink>
          <RouterLink to="/member/profile" class="mobile-link">Profile</RouterLink>
        </template>
        <button class="mobile-logout" @click="handleLogout">Sign out</button>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const menuOpen = ref(false)

function handleLogout() {
  menuOpen.value = false
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
  position: relative;
  z-index: 100;
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

/* Desktop nav */
.desktop-nav {
  display: flex;
}
.nav {
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

/* Hamburger button */
.btn-burger {
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  margin-left: auto;
}
.btn-burger span {
  display: block;
  width: 24px;
  height: 2px;
  background: #fff;
  border-radius: 2px;
  transition: all 0.2s;
}

/* Mobile menu overlay */
.mobile-menu {
  display: none;
  position: fixed;
  top: 60px;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 99;
}
.mobile-menu.open {
  display: block;
}
.mobile-nav {
  background: var(--primary);
  display: flex;
  flex-direction: column;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}
.mobile-link {
  font-size: 15px;
  font-weight: 500;
  color: rgba(255,255,255,0.7);
  text-decoration: none;
  padding: 14px 24px;
  transition: background 0.15s, color 0.15s;
}
.mobile-link:active,
.mobile-link.router-link-active {
  color: var(--accent);
  background: rgba(255,255,255,0.05);
}
.mobile-logout {
  margin: 8px 24px 8px;
  background: transparent;
  border: 1.5px solid rgba(255,255,255,0.2);
  color: rgba(255,255,255,0.7);
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;
}
.mobile-logout:hover {
  border-color: var(--accent);
  color: var(--accent);
}

/* Mobile breakpoint — width OR touch device */
@media (max-width: 1024px), (hover: none) {
  .header {
    padding: 0 16px;
  }
  .inner {
    gap: 0;
  }
  .desktop-nav {
    display: none;
  }
  .btn-burger {
    display: flex;
  }
}
</style>
