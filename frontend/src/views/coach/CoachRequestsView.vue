<template>
  <div class="page">
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">My Cancellation Requests</h1>
        <p class="page-sub">{{ requests.length }} request{{ requests.length !== 1 ? 's' : '' }} submitted</p>
      </div>

      <div v-if="loading" class="state">Loading...</div>
      <div v-else-if="error" class="state error">{{ error }}</div>
      <div v-else-if="requests.length === 0" class="state">No requests yet. Go to a session to submit one.</div>

      <div v-else class="list">
        <div v-for="req in requests" :key="req.id" class="card">
          <div class="card-header">
            <div>
              <p class="session-id">Session #{{ req.session_id }}</p>
              <p class="reason">{{ req.reason }}</p>
            </div>
            <span class="badge" :class="statusClass(req.status)">{{ req.status }}</span>
          </div>
          <div class="meta">
            <span>Submitted {{ formatDate(req.created_at) }}</span>
            <span v-if="req.decided_at">· Decided {{ formatDate(req.decided_at) }}</span>
          </div>
          <div v-if="req.admin_comment" class="comment">
            <span class="comment-label">Admin comment:</span> {{ req.admin_comment }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { apiGetMyRequests, type CoachRequest } from '@/api/coachRequests'

const requests = ref<CoachRequest[]>([])
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    requests.value = await apiGetMyRequests()
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Failed to load requests.'
  } finally {
    loading.value = false
  }
})

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
function statusClass(status: string) {
  return {
    'badge-pending': status === 'PENDING',
    'badge-approved': status === 'APPROVED',
    'badge-rejected': status === 'REJECTED',
  }
}
</script>

<style scoped>
.page { min-height: calc(100vh - 60px); background: var(--surface-alt); padding: 32px; }
.container { max-width: 760px; margin: 0 auto; }
.page-header { margin-bottom: 28px; }
.page-title { font-family: var(--font-display); font-weight: 700; font-size: 26px; margin-bottom: 4px; }
.page-sub { font-size: 14px; color: var(--text-muted); }
.list { display: flex; flex-direction: column; gap: 16px; }
.card { background: var(--surface); border: 1.5px solid var(--border); border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 10px; }
.card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.session-id { font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
.reason { font-size: 15px; font-weight: 500; }
.meta { font-size: 13px; color: var(--text-muted); }
.comment { font-size: 13px; color: var(--text-muted); background: var(--surface-alt); border-radius: 8px; padding: 10px 14px; }
.comment-label { font-weight: 600; color: var(--text); }
.badge { font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; flex-shrink: 0; }
.badge-pending { background: #FEF9C3; color: #854D0E; }
.badge-approved { background: #DCFCE7; color: #166534; }
.badge-rejected { background: #FEE2E2; color: #991B1B; }
.state { text-align: center; padding: 80px; color: var(--text-muted); font-size: 15px; }
.state.error { color: var(--error); }
</style>
