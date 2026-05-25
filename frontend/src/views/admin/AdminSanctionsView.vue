<template>
  <div class="page">
    <div class="container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Sanctions</h1>
          <p class="page-sub">{{ sanctions.length }} record{{ sanctions.length !== 1 ? 's' : '' }}</p>
        </div>
        <button class="btn-create" @click="showForm = true">+ Apply sanction</button>
      </div>

      <div v-if="loading" class="state">Loading...</div>
      <div v-else-if="error" class="state error">{{ error }}</div>
      <div v-else-if="sanctions.length === 0" class="state">No sanctions recorded.</div>

      <div v-else class="list">
        <div v-for="s in sanctions" :key="s.id" class="card">
          <div class="card-header">
            <div>
              <p class="user-id">User #{{ s.user_id }}</p>
              <p class="reason">{{ s.reason }}</p>
              <p class="date">{{ formatDate(s.start_date) }}<span v-if="s.end_date"> → {{ formatDate(s.end_date) }}</span></p>
            </div>
            <div class="badges">
              <span class="badge" :class="typeClass(s.sanction_type)">{{ s.sanction_type }}</span>
              <span class="badge" :class="s.is_active ? 'badge-active' : 'badge-lifted'">
                {{ s.is_active ? 'Active' : 'Lifted' }}
              </span>
            </div>
          </div>
          <div v-if="s.is_active" class="lift-row">
            <button class="btn-lift" :disabled="liftingId === s.id" @click="handleLift(s.id)">
              {{ liftingId === s.id ? '…' : 'Lift sanction' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Apply sanction modal -->
      <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
        <div class="modal">
          <h2 class="modal-title">Apply sanction</h2>
          <div v-if="formError" class="error-box">{{ formError }}</div>
          <form @submit.prevent="handleCreate">
            <div class="field">
              <label>User ID</label>
              <input v-model.number="form.user_id" type="number" min="1" required />
            </div>
            <div class="field">
              <label>Type</label>
              <select v-model="form.sanction_type" class="select-full">
                <option value="WARNING">Warning</option>
                <option value="SUSPENSION">Suspension</option>
                <option value="BAN">Ban</option>
              </select>
            </div>
            <div class="field">
              <label>Reason</label>
              <textarea v-model="form.reason" rows="3" required></textarea>
            </div>
            <div class="field">
              <label>End date <span class="optional">(optional)</span></label>
              <input v-model="form.end_date" type="date" />
            </div>
            <div class="modal-actions">
              <button type="button" class="btn-cancel" @click="showForm = false">Cancel</button>
              <button type="submit" class="btn-submit" :disabled="submitting">
                <span v-if="submitting" class="spinner"></span>
                <span v-else>Apply</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { apiAdminGetSanctions, apiAdminCreateSanction, apiAdminUpdateSanction, type Sanction } from '@/api/adminSanctions'

const sanctions = ref<Sanction[]>([])
const loading = ref(true)
const error = ref('')
const liftingId = ref<number | null>(null)
const showForm = ref(false)
const submitting = ref(false)
const formError = ref('')
const form = reactive<{ user_id: number | ''; sanction_type: 'WARNING' | 'SUSPENSION' | 'BAN'; reason: string; end_date: string }>({
  user_id: '', sanction_type: 'WARNING', reason: '', end_date: '',
})

onMounted(async () => {
  try {
    sanctions.value = await apiAdminGetSanctions()
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Failed to load sanctions.'
  } finally {
    loading.value = false
  }
})

async function handleCreate() {
  submitting.value = true
  formError.value = ''
  try {
    const payload = {
      user_id: Number(form.user_id),
      sanction_type: form.sanction_type,
      reason: form.reason,
      ...(form.end_date ? { end_date: form.end_date } : {}),
    }
    const created = await apiAdminCreateSanction(payload)
    sanctions.value.unshift(created)
    showForm.value = false
    Object.assign(form, { user_id: '', sanction_type: 'WARNING', reason: '', end_date: '' })
  } catch (err: unknown) {
    formError.value = err instanceof Error ? err.message : 'Failed to apply sanction.'
  } finally {
    submitting.value = false
  }
}

async function handleLift(id: number) {
  liftingId.value = id
  try {
    const updated = await apiAdminUpdateSanction(id, { is_active: false })
    const idx = sanctions.value.findIndex(s => s.id === id)
    if (idx !== -1) sanctions.value[idx] = updated
  } catch (err: unknown) {
    alert(err instanceof Error ? err.message : 'Failed to lift sanction.')
  } finally {
    liftingId.value = null
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
function typeClass(t: string) {
  return { 'badge-warning': t === 'WARNING', 'badge-suspension': t === 'SUSPENSION', 'badge-ban': t === 'BAN' }
}
</script>

<style scoped>
.page { min-height: calc(100vh - 60px); background: var(--surface-alt); padding: 32px; }
.container { max-width: 860px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
.page-title { font-family: var(--font-display); font-weight: 700; font-size: 26px; margin-bottom: 4px; }
.page-sub { font-size: 14px; color: var(--text-muted); }
.btn-create { padding: 10px 20px; background: var(--accent); color: #fff; border: none; border-radius: 8px; font-family: var(--font-display); font-weight: 600; font-size: 14px; cursor: pointer; transition: background 0.2s; }
.btn-create:hover { background: var(--accent-hover); }
.list { display: flex; flex-direction: column; gap: 14px; }
.card { background: var(--surface); border: 1.5px solid var(--border); border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 12px; }
.card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.user-id { font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
.reason { font-size: 15px; font-weight: 500; margin-bottom: 4px; }
.date { font-size: 12px; color: var(--text-muted); }
.badges { display: flex; flex-direction: column; gap: 4px; align-items: flex-end; flex-shrink: 0; }
.badge { font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; }
.badge-warning { background: #FEF9C3; color: #854D0E; }
.badge-suspension { background: #FEE2E2; color: #991B1B; }
.badge-ban { background: #1F1135; color: #F8FAFC; }
.badge-active { background: #FEE2E2; color: #991B1B; }
.badge-lifted { background: #F1F5F9; color: #64748B; }
.lift-row { border-top: 1px solid var(--border); padding-top: 10px; }
.btn-lift { padding: 6px 14px; border-radius: 6px; border: 1.5px solid var(--border); background: transparent; font-size: 13px; font-weight: 600; color: var(--text-muted); cursor: pointer; transition: all 0.2s; }
.btn-lift:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
.btn-lift:disabled { opacity: 0.4; cursor: not-allowed; }
.state { text-align: center; padding: 80px; color: var(--text-muted); font-size: 15px; }
.state.error { color: var(--error); }
/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal { background: var(--surface); border-radius: 14px; padding: 28px; width: 100%; max-width: 440px; }
.modal-title { font-family: var(--font-display); font-weight: 700; font-size: 20px; margin-bottom: 20px; }
.field { margin-bottom: 16px; }
.field label { display: block; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 6px; }
.optional { font-weight: 400; text-transform: none; color: var(--text-muted); }
.field input, .field textarea, .select-full { width: 100%; padding: 10px 12px; border: 1.5px solid var(--border); border-radius: 8px; background: var(--surface-alt); color: var(--text); font-size: 14px; font-family: var(--font-body); outline: none; box-sizing: border-box; }
.field input:focus, .field textarea:focus, .select-full:focus { border-color: var(--accent); }
.field textarea { resize: vertical; }
.modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 8px; }
.btn-cancel { padding: 10px 18px; background: transparent; border: 1.5px solid var(--border); border-radius: 8px; font-size: 14px; cursor: pointer; }
.btn-submit { padding: 10px 18px; background: var(--error); color: #fff; border: none; border-radius: 8px; font-family: var(--font-display); font-weight: 600; font-size: 14px; cursor: pointer; min-width: 80px; }
.btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
.error-box { padding: 10px 14px; border-radius: 8px; background: var(--error-bg); color: var(--error); font-size: 13px; margin-bottom: 16px; }
.spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
