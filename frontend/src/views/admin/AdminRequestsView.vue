<template>
  <div class="page">
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">Coach Requests</h1>
        <p class="page-sub">Session cancellation requests from coaches</p>
      </div>

      <div class="filters">
        <select v-model="statusFilter" class="select" @change="loadRequests">
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      <div v-if="loading" class="state">Loading...</div>
      <div v-else-if="error" class="state error">{{ error }}</div>
      <div v-else-if="requests.length === 0" class="state">No requests found.</div>

      <div v-else class="list">
        <div v-for="req in requests" :key="req.id" class="card">
          <div class="card-header">
            <div>
              <p class="meta-label">Session #{{ req.session_id }} · Coach #{{ req.coach_id }}</p>
              <p class="reason">{{ req.reason }}</p>
              <p class="date">Submitted {{ formatDate(req.created_at) }}</p>
            </div>
            <span class="badge" :class="statusClass(req.status)">{{ req.status }}</span>
          </div>

          <div v-if="req.admin_comment" class="comment">
            <span class="comment-label">Comment:</span> {{ req.admin_comment }}
          </div>

          <div v-if="req.status === 'PENDING'" class="decide-form">
            <textarea
              v-model="comments[req.id]"
              class="comment-input"
              rows="2"
              placeholder="Optional comment…"
            ></textarea>
            <div class="decide-actions">
              <button
                class="btn-approve"
                :disabled="decidingId === req.id"
                @click="decide(req.id, 'APPROVED')"
              >Approve</button>
              <button
                class="btn-reject"
                :disabled="decidingId === req.id"
                @click="decide(req.id, 'REJECTED')"
              >Reject</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { apiAdminGetRequests, apiAdminDecideRequest } from '@/api/adminRequests'
import type { CoachRequest } from '@/api/coachRequests'

const requests = ref<CoachRequest[]>([])
const loading = ref(true)
const error = ref('')
const statusFilter = ref('PENDING')
const decidingId = ref<number | null>(null)
const comments = reactive<Record<number, string>>({})

onMounted(() => loadRequests())

async function loadRequests() {
  loading.value = true
  error.value = ''
  try {
    requests.value = await apiAdminGetRequests(statusFilter.value || undefined)
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Failed to load requests.'
  } finally {
    loading.value = false
  }
}

async function decide(id: number, status: 'APPROVED' | 'REJECTED') {
  decidingId.value = id
  try {
    const updated = await apiAdminDecideRequest(id, status, comments[id] || undefined)
    const idx = requests.value.findIndex(r => r.id === id)
    if (idx !== -1) requests.value[idx] = updated
  } catch (err: unknown) {
    alert(err instanceof Error ? err.message : 'Failed to decide request.')
  } finally {
    decidingId.value = null
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
function statusClass(status: string) {
  return { 'badge-pending': status === 'PENDING', 'badge-approved': status === 'APPROVED', 'badge-rejected': status === 'REJECTED' }
}
</script>

<style scoped>
.page { min-height: calc(100vh - 60px); background: var(--surface-alt); padding: 32px; }
.container { max-width: 800px; margin: 0 auto; }
.page-header { margin-bottom: 20px; }
.page-title { font-family: var(--font-display); font-weight: 700; font-size: 26px; margin-bottom: 4px; }
.page-sub { font-size: 14px; color: var(--text-muted); }
.filters { margin-bottom: 20px; }
.select { padding: 8px 12px; border: 1.5px solid var(--border); border-radius: 8px; background: var(--surface); font-size: 14px; color: var(--text); outline: none; cursor: pointer; }
.list { display: flex; flex-direction: column; gap: 16px; }
.card { background: var(--surface); border: 1.5px solid var(--border); border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 12px; }
.card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.meta-label { font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
.reason { font-size: 15px; font-weight: 500; margin-bottom: 4px; }
.date { font-size: 12px; color: var(--text-muted); }
.badge { font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; flex-shrink: 0; }
.badge-pending { background: #FEF9C3; color: #854D0E; }
.badge-approved { background: #DCFCE7; color: #166534; }
.badge-rejected { background: #FEE2E2; color: #991B1B; }
.comment { font-size: 13px; color: var(--text-muted); background: var(--surface-alt); border-radius: 8px; padding: 10px 14px; }
.comment-label { font-weight: 600; color: var(--text); }
.decide-form { display: flex; flex-direction: column; gap: 10px; border-top: 1px solid var(--border); padding-top: 12px; }
.comment-input { width: 100%; padding: 10px 12px; border: 1.5px solid var(--border); border-radius: 8px; background: var(--surface-alt); color: var(--text); font-size: 14px; font-family: var(--font-body); resize: vertical; outline: none; box-sizing: border-box; }
.comment-input:focus { border-color: var(--accent); }
.decide-actions { display: flex; gap: 10px; }
.btn-approve, .btn-reject { padding: 8px 18px; border-radius: 8px; font-family: var(--font-display); font-weight: 600; font-size: 13px; cursor: pointer; border: none; transition: all 0.2s; }
.btn-approve { background: var(--accent); color: #fff; }
.btn-approve:hover:not(:disabled) { background: var(--accent-hover); }
.btn-reject { background: var(--error); color: #fff; }
.btn-reject:hover:not(:disabled) { opacity: 0.85; }
.btn-approve:disabled, .btn-reject:disabled { opacity: 0.5; cursor: not-allowed; }
.state { text-align: center; padding: 80px; color: var(--text-muted); font-size: 15px; }
.state.error { color: var(--error); }
</style>
