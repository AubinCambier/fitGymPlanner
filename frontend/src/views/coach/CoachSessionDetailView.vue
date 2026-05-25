<template>
  <div class="page">
    <div class="container">
      <RouterLink to="/coach/sessions" class="back-link">← Back to sessions</RouterLink>

      <div v-if="loading" class="state">Loading...</div>
      <div v-else-if="error" class="state error">{{ error }}</div>

      <div v-else-if="session">
        <div class="page-header">
          <div>
            <h1 class="page-title">{{ session.title }}</h1>
            <p class="page-sub">{{ session.session_type_name ?? '' }}</p>
          </div>
          <div class="badges">
            <span class="badge" :class="intensityClass(session.intensity)">{{ session.intensity }}</span>
            <span class="badge badge-scheduled">{{ session.status }}</span>
          </div>
        </div>

        <div class="info-row">
          <span>📅 {{ formattedDate }}</span>
          <span>🕐 {{ formattedTime }}</span>
          <span>👥 {{ session.registered_count }} / {{ session.capacity }} registered</span>
        </div>

        <div class="section">
          <h2 class="section-title">Participants ({{ participants.length }})</h2>
          <div v-if="participants.length === 0" class="empty">No participants registered.</div>
          <table v-else class="table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Booked at</th></tr>
            </thead>
            <tbody>
              <tr v-for="p in participants" :key="p.id">
                <td>{{ p.first_name }} {{ p.last_name }}</td>
                <td class="muted">{{ p.email }}</td>
                <td class="muted">{{ formatBookedAt(p.booked_at) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="session.status === 'SCHEDULED'" class="section">
          <h2 class="section-title">Request cancellation</h2>
          <div v-if="requestSent" class="success-box">Request submitted successfully.</div>
          <div v-else-if="requestError" class="error-box">{{ requestError }}</div>
          <form v-if="!requestSent" @submit.prevent="handleRequest">
            <div class="field">
              <label for="reason">Reason</label>
              <textarea id="reason" v-model="reason" rows="3" placeholder="Explain why this session should be cancelled…" required></textarea>
            </div>
            <button type="submit" class="btn-request" :disabled="requesting">
              <span v-if="requesting" class="spinner"></span>
              <span v-else>Submit request</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { apiGetSession } from '@/api/sessions'
import { apiGetSessionParticipants, type Participant } from '@/api/coach'
import { apiCreateRequest } from '@/api/coachRequests'
import type { Session } from '@/api/sessions'

const route = useRoute()
const sessionId = Number(route.params['id'])

const session = ref<Session | null>(null)
const participants = ref<Participant[]>([])
const loading = ref(true)
const error = ref('')
const reason = ref('')
const requesting = ref(false)
const requestSent = ref(false)
const requestError = ref('')

onMounted(async () => {
  try {
    const [s, p] = await Promise.all([
      apiGetSession(sessionId),
      apiGetSessionParticipants(sessionId),
    ])
    session.value = s
    participants.value = p
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Failed to load session.'
  } finally {
    loading.value = false
  }
})

async function handleRequest() {
  requesting.value = true
  requestError.value = ''
  try {
    await apiCreateRequest(sessionId, reason.value)
    requestSent.value = true
  } catch (err: unknown) {
    requestError.value = err instanceof Error ? err.message : 'Request failed.'
  } finally {
    requesting.value = false
  }
}

const formattedDate = computed(() =>
  session.value ? new Date(session.value.start_time).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''
)
const formattedTime = computed(() => {
  if (!session.value) return ''
  const fmt = (d: string) => new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  return `${fmt(session.value.start_time)} – ${fmt(session.value.end_time)}`
})
function formatBookedAt(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
function intensityClass(i: string) {
  return { 'badge-low': i === 'LOW', 'badge-medium': i === 'MEDIUM', 'badge-high': i === 'HIGH' }
}
</script>

<style scoped>
.page { min-height: calc(100vh - 60px); background: var(--surface-alt); padding: 32px; }
.container { max-width: 860px; margin: 0 auto; }
.back-link { display: inline-block; font-size: 14px; color: var(--text-muted); text-decoration: none; margin-bottom: 24px; transition: color 0.2s; }
.back-link:hover { color: var(--accent); }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 16px; }
.page-title { font-family: var(--font-display); font-weight: 700; font-size: 26px; margin-bottom: 4px; }
.page-sub { font-size: 14px; color: var(--text-muted); }
.badges { display: flex; gap: 8px; flex-shrink: 0; margin-top: 4px; }
.badge { font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; }
.badge-low { background: #DCFCE7; color: #166534; }
.badge-medium { background: #FEF9C3; color: #854D0E; }
.badge-high { background: #FEE2E2; color: #991B1B; }
.badge-scheduled { background: #DBEAFE; color: #1D4ED8; }
.info-row { display: flex; gap: 24px; font-size: 14px; color: var(--text-muted); flex-wrap: wrap; margin-bottom: 36px; }
.section { margin-bottom: 32px; }
.section-title { font-family: var(--font-display); font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); margin-bottom: 12px; }
.empty { font-size: 14px; color: var(--text-muted); }
.table { width: 100%; border-collapse: collapse; background: var(--surface); border-radius: 10px; overflow: hidden; border: 1.5px solid var(--border); }
.table th { padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); background: var(--surface-alt); border-bottom: 1px solid var(--border); }
.table td { padding: 12px 16px; font-size: 14px; border-bottom: 1px solid var(--border); }
.table tr:last-child td { border-bottom: none; }
.muted { color: var(--text-muted); }
.field { margin-bottom: 16px; }
.field label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.3px; }
.field textarea { width: 100%; padding: 12px 14px; font-family: var(--font-body); font-size: 14px; border: 1.5px solid var(--border); border-radius: 10px; background: var(--surface-alt); color: var(--text); outline: none; resize: vertical; transition: all 0.2s; box-sizing: border-box; }
.field textarea:focus { border-color: var(--accent); background: var(--surface); box-shadow: 0 0 0 3px var(--accent-glow); }
.btn-request { padding: 10px 24px; background: var(--error); color: #fff; border: none; border-radius: 8px; font-family: var(--font-display); font-weight: 600; font-size: 14px; cursor: pointer; transition: all 0.2s; min-height: 40px; }
.btn-request:hover:not(:disabled) { opacity: 0.85; }
.btn-request:disabled { opacity: 0.5; cursor: not-allowed; }
.success-box { padding: 12px 16px; border-radius: 10px; background: #DCFCE7; border: 1px solid rgba(22,163,74,0.2); margin-bottom: 16px; color: #166534; font-size: 14px; font-weight: 500; }
.error-box { padding: 12px 16px; border-radius: 10px; background: var(--error-bg); border: 1px solid rgba(239,68,68,0.15); margin-bottom: 16px; color: var(--error); font-size: 14px; font-weight: 500; }
.spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.state { text-align: center; padding: 80px; color: var(--text-muted); font-size: 15px; }
.state.error { color: var(--error); }
</style>
