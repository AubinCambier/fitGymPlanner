<template>
  <div class="page">
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">Dashboard</h1>
        <p class="page-sub">Overview of your gym's activity</p>
      </div>

      <div v-if="loading" class="state">Loading...</div>
      <div v-else-if="error" class="state error">{{ error }}</div>

      <template v-else-if="stats">
        <div class="cards">
          <div class="card">
            <div class="card-label">Total Revenue</div>
            <div class="card-value">€{{ stats.total_revenue.toFixed(2) }}</div>
            <div class="card-sub">€{{ stats.revenue_this_month.toFixed(2) }} this month</div>
          </div>
          <div class="card">
            <div class="card-label">Active Members</div>
            <div class="card-value">{{ stats.active_members }}</div>
            <div class="card-sub">{{ stats.active_memberships }} with active membership</div>
          </div>
          <div class="card">
            <div class="card-label">Upcoming Sessions</div>
            <div class="card-value">{{ stats.upcoming_sessions }}</div>
            <div class="card-sub">scheduled sessions</div>
          </div>
          <div class="card">
            <div class="card-label">Bookings This Month</div>
            <div class="card-value">{{ stats.bookings_this_month }}</div>
            <div class="card-sub">confirmed reservations</div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">Top Sessions by Fill Rate</h2>
          <div v-if="stats.top_sessions.length === 0" class="state">No upcoming sessions.</div>
          <div v-else class="sessions-list">
            <div v-for="s in stats.top_sessions" :key="s.id" class="session-row">
              <div class="session-info">
                <span class="session-title">{{ s.title }}</span>
                <span class="session-date">{{ formatDate(s.start_time) }}</span>
              </div>
              <div class="session-fill">
                <div class="fill-bar-wrap">
                  <div
                    class="fill-bar"
                    :style="{ width: s.fill_rate + '%' }"
                    :class="fillClass(s.fill_rate)"
                  />
                </div>
                <span class="fill-label">{{ s.registered_count }}/{{ s.capacity }} ({{ s.fill_rate }}%)</span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { apiGetDashboardStats, type DashboardStats } from '@/api/dashboard'

const stats = ref<DashboardStats | null>(null)
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    stats.value = await apiGetDashboardStats()
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Failed to load dashboard.'
  } finally {
    loading.value = false
  }
})

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function fillClass(rate: number): string {
  if (rate >= 80) return 'fill-high'
  if (rate >= 50) return 'fill-mid'
  return 'fill-low'
}
</script>

<style scoped>
.page { min-height: calc(100vh - 60px); background: var(--surface-alt); padding: 32px; }
.container { max-width: 1100px; margin: 0 auto; }
.page-header { margin-bottom: 28px; }
.page-title { font-family: var(--font-display); font-weight: 700; font-size: 26px; margin-bottom: 4px; }
.page-sub { font-size: 14px; color: var(--text-muted); }

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}
.card {
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: 12px;
  padding: 20px 24px;
}
.card-label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 8px; }
.card-value { font-family: var(--font-display); font-size: 32px; font-weight: 700; color: var(--text); line-height: 1; margin-bottom: 6px; }
.card-sub { font-size: 13px; color: var(--text-muted); }

.section { background: var(--surface); border: 1.5px solid var(--border); border-radius: 12px; padding: 24px; }
.section-title { font-family: var(--font-display); font-size: 17px; font-weight: 700; margin-bottom: 20px; }

.sessions-list { display: flex; flex-direction: column; gap: 16px; }
.session-row { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
.session-info { flex: 1; min-width: 180px; }
.session-title { display: block; font-weight: 600; font-size: 14px; margin-bottom: 2px; }
.session-date { font-size: 12px; color: var(--text-muted); }
.session-fill { display: flex; align-items: center; gap: 12px; flex: 2; min-width: 200px; }
.fill-bar-wrap { flex: 1; height: 8px; background: var(--border); border-radius: 99px; overflow: hidden; }
.fill-bar { height: 100%; border-radius: 99px; transition: width 0.4s ease; }
.fill-low  { background: var(--accent); }
.fill-mid  { background: #f59e0b; }
.fill-high { background: var(--error); }
.fill-label { font-size: 13px; font-weight: 600; color: var(--text-muted); white-space: nowrap; }

.state { text-align: center; padding: 60px; color: var(--text-muted); font-size: 15px; }
.state.error { color: var(--error); }
</style>
