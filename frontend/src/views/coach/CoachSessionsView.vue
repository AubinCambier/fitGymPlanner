<template>
  <div class="page">
    <div class="container">
      <div class="page-header">
        <div>
          <h1 class="page-title">My Sessions</h1>
          <p class="page-sub">{{ sessions.length }} session{{ sessions.length !== 1 ? 's' : '' }}</p>
        </div>
        <button class="btn-create" @click="openCreate">+ Create session</button>
      </div>

      <div v-if="loading" class="state">Loading...</div>
      <div v-else-if="error" class="state error">{{ error }}</div>
      <div v-else-if="sessions.length === 0" class="state">No sessions yet.</div>

      <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
        <div class="modal">
          <h2 class="modal-title">Create session</h2>
          <div v-if="formError" class="error-box">{{ formError }}</div>
          <form @submit.prevent="handleCreate">
            <div class="field">
              <label>Title</label>
              <input v-model="form.title" type="text" required />
            </div>
            <div class="field">
              <label>Session type</label>
              <select v-model="form.session_type_id" required>
                <option value="" disabled>Select a type</option>
                <option v-for="t in sessionTypes" :key="t.id" :value="t.id">{{ t.name }}</option>
              </select>
            </div>
            <div class="field">
              <label>Description <span class="optional">(optional)</span></label>
              <textarea v-model="form.description" rows="2"></textarea>
            </div>
            <div class="row">
              <div class="field">
                <label>Start</label>
                <input v-model="form.start_time" type="datetime-local" required />
              </div>
              <div class="field">
                <label>Duration (hours)</label>
                <input v-model="form.duration" type="number" min="0.5" max="8" step="0.5" required />
              </div>
            </div>
            <div class="row">
              <div class="field">
                <label>Capacity</label>
                <input v-model="form.capacity" type="number" min="1" required />
              </div>
              <div class="field">
                <label>Intensity</label>
                <select v-model="form.intensity" required>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn-cancel" @click="showForm = false">Cancel</button>
              <button type="submit" class="btn-submit" :disabled="submitting">
                <span v-if="submitting" class="spinner"></span>
                <span v-else>Create</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <div v-else class="grid">
        <RouterLink
          v-for="session in sessions"
          :key="session.id"
          :to="`/coach/sessions/${session.id}`"
          class="card"
        >
          <div class="card-header">
            <div>
              <h3 class="title">{{ session.title }}</h3>
              <p class="type">{{ session.session_type_name ?? '' }}</p>
            </div>
            <div class="badges">
              <span class="badge" :class="intensityClass(session.intensity)">{{ session.intensity }}</span>
              <span class="badge" :class="statusClass(session.status)">{{ session.status }}</span>
            </div>
          </div>
          <div class="meta">
            <span>📅 {{ formattedDate(session.start_time) }}</span>
            <span>🕐 {{ formattedTime(session.start_time, session.end_time) }}</span>
            <span>👥 {{ session.registered_count }} / {{ session.capacity }}</span>
          </div>
          <div class="capacity-bar">
            <div class="capacity-fill" :style="{ width: capacityPct(session) + '%' }"></div>
          </div>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { apiGetMySessions } from '@/api/coach'
import { apiCreateSession, type Session } from '@/api/sessions'
import { apiGetSessionTypes, type SessionType } from '@/api/sessionTypes'

const sessions = ref<Session[]>([])
const sessionTypes = ref<SessionType[]>([])
const loading = ref(true)
const error = ref('')
const showForm = ref(false)
const submitting = ref(false)
const formError = ref('')
const form = reactive({ title: '', description: '', session_type_id: '', start_time: '', duration: 1, capacity: 10, intensity: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' })

onMounted(async () => {
  try {
    const [s, t] = await Promise.all([apiGetMySessions(), apiGetSessionTypes()])
    sessions.value = s
    sessionTypes.value = t
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Failed to load sessions.'
  } finally {
    loading.value = false
  }
})

function openCreate() {
  form.title = ''; form.description = ''; form.session_type_id = ''; form.start_time = ''; form.duration = 1; form.capacity = 10; form.intensity = 'MEDIUM'
  formError.value = ''; showForm.value = true
}

async function handleCreate() {
  submitting.value = true; formError.value = ''
  try {
    const created = await apiCreateSession({
      title: form.title,
      description: form.description || undefined,
      session_type_id: Number(form.session_type_id),
      start_time: new Date(form.start_time).toISOString(),
      end_time: new Date(new Date(form.start_time).getTime() + form.duration * 60 * 60 * 1000).toISOString(),
      capacity: Number(form.capacity),
      intensity: form.intensity,
    })
    sessions.value.unshift(created)
    showForm.value = false
  } catch (err: unknown) {
    formError.value = err instanceof Error ? err.message : 'Failed to create session.'
  } finally {
    submitting.value = false
  }
}

function formattedDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}
function formattedTime(start: string, end: string) {
  const fmt = (d: string) => new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  return `${fmt(start)} – ${fmt(end)}`
}
function capacityPct(s: Session) {
  return Math.min(100, Math.round((s.registered_count / s.capacity) * 100))
}
function intensityClass(i: string) {
  return { 'badge-low': i === 'LOW', 'badge-medium': i === 'MEDIUM', 'badge-high': i === 'HIGH' }
}
function statusClass(s: string) {
  return { 'badge-scheduled': s === 'SCHEDULED', 'badge-cancelled': s === 'CANCELLED' }
}
</script>

<style scoped>
.page { min-height: calc(100vh - 60px); background: var(--surface-alt); padding: 32px; }
.container { max-width: 1100px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
.page-title { font-family: var(--font-display); font-weight: 700; font-size: 26px; margin-bottom: 4px; }
.page-sub { font-size: 14px; color: var(--text-muted); }
.btn-create { padding: 10px 20px; background: var(--accent); color: #fff; border: none; border-radius: 8px; font-family: var(--font-display); font-weight: 600; font-size: 14px; cursor: pointer; transition: background 0.2s; white-space: nowrap; }
.btn-create:hover { background: var(--accent-hover); }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal { background: var(--surface); border-radius: 14px; padding: 28px; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; }
.modal-title { font-family: var(--font-display); font-weight: 700; font-size: 20px; margin-bottom: 20px; }
.field { margin-bottom: 16px; }
.row { display: flex; gap: 16px; }
.row .field { flex: 1; }
.field label { display: block; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 6px; }
.optional { font-weight: 400; text-transform: none; color: var(--text-muted); }
.field input, .field select, .field textarea { width: 100%; padding: 10px 12px; border: 1.5px solid var(--border); border-radius: 8px; background: var(--surface-alt); color: var(--text); font-size: 14px; font-family: var(--font-body); outline: none; box-sizing: border-box; }
.field input:focus, .field select:focus, .field textarea:focus { border-color: var(--accent); }
.field textarea { resize: vertical; }
.modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 8px; }
.btn-cancel { padding: 10px 18px; background: transparent; border: 1.5px solid var(--border); border-radius: 8px; font-size: 14px; cursor: pointer; }
.btn-submit { padding: 10px 18px; background: var(--accent); color: #fff; border: none; border-radius: 8px; font-family: var(--font-display); font-weight: 600; font-size: 14px; cursor: pointer; min-width: 80px; }
.btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
.error-box { padding: 10px 14px; border-radius: 8px; background: var(--error-bg); color: var(--error); font-size: 13px; margin-bottom: 16px; }
.spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
.card { background: var(--surface); border: 1.5px solid var(--border); border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 12px; text-decoration: none; color: inherit; transition: border-color 0.2s, box-shadow 0.2s; }
.card:hover { border-color: var(--accent); box-shadow: 0 4px 16px rgba(16,185,129,0.08); }
.card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.title { font-family: var(--font-display); font-weight: 600; font-size: 16px; }
.type { font-size: 13px; color: var(--text-muted); margin-top: 2px; }
.badges { display: flex; flex-direction: column; gap: 4px; align-items: flex-end; flex-shrink: 0; }
.badge { font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; }
.badge-low { background: #DCFCE7; color: #166534; }
.badge-medium { background: #FEF9C3; color: #854D0E; }
.badge-high { background: #FEE2E2; color: #991B1B; }
.badge-scheduled { background: #DBEAFE; color: #1D4ED8; }
.badge-cancelled { background: #F1F5F9; color: #64748B; }
.meta { display: flex; gap: 16px; font-size: 13px; color: var(--text-muted); flex-wrap: wrap; }
.capacity-bar { height: 4px; background: var(--border); border-radius: 2px; overflow: hidden; }
.capacity-fill { height: 100%; background: var(--accent); border-radius: 2px; transition: width 0.3s; }
.state { text-align: center; padding: 80px; color: var(--text-muted); font-size: 15px; }
.state.error { color: var(--error); }
</style>
