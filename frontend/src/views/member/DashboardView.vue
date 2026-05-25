<template>
  <div class="page">
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">Welcome back, <span class="accent">{{ auth.user?.first_name }}</span></h1>
        <p class="page-sub">Here's a summary of your activity.</p>
      </div>

      <div v-if="loading" class="state">Loading...</div>

      <div v-else class="content">
        <div class="cards">
          <div class="card">
            <div class="card-label">Upcoming Sessions</div>
            <div class="card-value">{{ upcomingCount }}</div>
            <div class="card-sub">confirmed bookings</div>
          </div>
          <div class="card">
            <div class="card-label">Sessions Attended</div>
            <div class="card-value">{{ attendedCount }}</div>
            <div class="card-sub">past sessions</div>
          </div>
          <div class="card">
            <div class="card-label">Total Spent</div>
            <div class="card-value">€{{ totalSpent }}</div>
            <div class="card-sub">across {{ payments.length }} payment{{ payments.length !== 1 ? 's' : '' }}</div>
          </div>
          <div class="card" :class="membership?.status === 'ACTIVE' ? 'card--active' : ''">
            <div class="card-label">Membership</div>
            <div class="card-value membership-status">
              {{ membership?.status === 'ACTIVE' ? 'Active' : 'Inactive' }}
            </div>
            <div class="card-sub" v-if="membership?.status === 'ACTIVE'">
              {{ membership.payment_mode === 'MONTHLY' ? 'Monthly' : 'Pay per session' }}
              <template v-if="membership.end_date"> · expires {{ formatDateShort(membership.end_date) }}</template>
            </div>
            <div class="card-sub" v-else>
              <RouterLink to="/member/membership" class="link">Subscribe now</RouterLink>
            </div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">Next Session</h2>
          <div v-if="nextBooking" class="next-card">
            <div class="next-title">{{ nextBooking.session_title }}</div>
            <div class="next-meta">
              <span>{{ formattedDate(nextBooking.session_start_time) }}</span>
              <span>{{ formattedTime(nextBooking.session_start_time, nextBooking.session_end_time) }}</span>
              <span v-if="nextBooking.coach_first_name">
                Coach {{ nextBooking.coach_first_name }} {{ nextBooking.coach_last_name }}
              </span>
            </div>
          </div>
          <p v-else class="empty-msg">
            No upcoming sessions. <RouterLink to="/member/sessions">Book one now</RouterLink>
          </p>
        </div>

        <div class="section">
          <h2 class="section-title">Quick Actions</h2>
          <div class="actions-row">
            <RouterLink to="/member/sessions" class="action-btn">Browse Sessions</RouterLink>
            <RouterLink to="/member/bookings" class="action-btn action-btn--secondary">My Bookings</RouterLink>
            <RouterLink to="/member/membership" class="action-btn action-btn--secondary">Membership</RouterLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { apiGetBookings, type Booking } from '@/api/bookings'
import { apiGetMyPayments, type Payment } from '@/api/payments'
import { apiGetMyMembership, type Membership } from '@/api/membership'

const auth = useAuthStore()
const bookings = ref<Booking[]>([])
const payments = ref<Payment[]>([])
const membership = ref<Membership | null>(null)
const loading = ref(true)

const now = new Date()

const upcomingCount = computed(() =>
  bookings.value.filter(b => b.status === 'CONFIRMED' && new Date(b.session_start_time) > now).length
)
const attendedCount = computed(() =>
  bookings.value.filter(b => b.status === 'CONFIRMED' && new Date(b.session_end_time) < now).length
)
const totalSpent = computed(() =>
  payments.value.reduce((sum, p) => sum + parseFloat(p.amount), 0).toFixed(2)
)
const nextBooking = computed(() =>
  bookings.value
    .filter(b => b.status === 'CONFIRMED' && new Date(b.session_start_time) > now)
    .sort((a, b) => new Date(a.session_start_time).getTime() - new Date(b.session_start_time).getTime())[0] ?? null
)

onMounted(async () => {
  try {
    const [b, p, m] = await Promise.all([
      apiGetBookings(),
      apiGetMyPayments(),
      apiGetMyMembership().catch(() => null),
    ])
    bookings.value = b
    payments.value = p
    membership.value = m
  } finally {
    loading.value = false
  }
})

function formattedDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}
function formattedTime(start: string, end: string) {
  const fmt = (d: string) => new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  return `${fmt(start)} – ${fmt(end)}`
}
function formatDateShort(date: string) {
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<style scoped>
.page { min-height: calc(100vh - 60px); background: var(--surface-alt); padding: 32px; }
.container { max-width: 1000px; margin: 0 auto; }
.page-header { margin-bottom: 28px; }
.page-title { font-family: var(--font-display); font-weight: 700; font-size: 28px; margin-bottom: 4px; }
.accent { color: var(--accent); }
.page-sub { font-size: 14px; color: var(--text-muted); }

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}
.card {
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: 12px;
  padding: 20px 22px;
}
.card--active { border-color: var(--accent); }
.card-label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 8px; }
.card-value { font-family: var(--font-display); font-size: 30px; font-weight: 700; color: var(--text); line-height: 1; margin-bottom: 6px; }
.membership-status { font-size: 22px; }
.card-sub { font-size: 12px; color: var(--text-muted); }
.link { color: var(--accent); text-decoration: none; font-weight: 600; }

.section { margin-bottom: 28px; }
.section-title { font-family: var(--font-display); font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); margin-bottom: 12px; }

.next-card { background: var(--surface); border: 1.5px solid var(--border); border-radius: 12px; padding: 20px 24px; }
.next-title { font-family: var(--font-display); font-weight: 600; font-size: 17px; margin-bottom: 10px; }
.next-meta { display: flex; gap: 20px; font-size: 13px; color: var(--text-muted); flex-wrap: wrap; }

.empty-msg { font-size: 14px; color: var(--text-muted); }
.empty-msg a { color: var(--accent); text-decoration: none; font-weight: 600; }

.actions-row { display: flex; gap: 12px; flex-wrap: wrap; }
.action-btn {
  padding: 10px 20px;
  background: var(--accent);
  color: #fff;
  border-radius: 8px;
  text-decoration: none;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 14px;
  transition: background 0.2s;
}
.action-btn:hover { background: var(--accent-hover); }
.action-btn--secondary { background: var(--surface); color: var(--text); border: 1.5px solid var(--border); }
.action-btn--secondary:hover { border-color: var(--accent); color: var(--accent); background: var(--surface); }

.state { text-align: center; padding: 80px; color: var(--text-muted); font-size: 15px; }
</style>
