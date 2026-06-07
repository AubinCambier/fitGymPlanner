<template>
  <div class="page">
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">Sanctions</h1>
        <p class="page-sub">Select a user to view or apply sanctions</p>
      </div>

      <div v-if="loading" class="state">Loading...</div>
      <div v-else-if="error" class="state error">{{ error }}</div>

      <template v-else>
        <!-- User list -->
        <div class="search-bar">
          <input v-model="search" type="text" placeholder="Search by name or email..." class="search-input" />
        </div>
        <div class="section-label">Members &amp; Coaches</div>
        <div class="users-grid">
          <button
            v-for="u in filteredUsers"
            :key="u.id"
            class="user-card"
            :class="{ 'user-card--selected': selectedUserId === u.id, 'user-card--banned': hasActiveBan(u.id) }"
            @click="selectUser(u.id)"
          >
            <div class="user-card-top">
              <span class="user-name">{{ u.first_name }} {{ u.last_name }}</span>
              <span class="role-badge" :class="'role-' + u.role.toLowerCase()">{{ u.role }}</span>
            </div>
            <div class="user-card-bottom">
              <span v-if="activeSanctionCount(u.id) > 0" class="sanction-count">
                {{ activeSanctionCount(u.id) }} active sanction{{ activeSanctionCount(u.id) > 1 ? 's' : '' }}
              </span>
              <span v-else class="no-sanction">No active sanction</span>
            </div>
          </button>
        </div>

        <!-- Selected user detail -->
        <div v-if="selectedUser" class="detail">
          <div class="detail-header">
            <div>
              <h2 class="detail-name">{{ selectedUser.first_name }} {{ selectedUser.last_name }}</h2>
              <p class="detail-email">{{ selectedUser.email }}</p>
            </div>
            <button class="btn-close" @click="selectedUserId = null">✕</button>
          </div>

          <div v-if="userSanctions.length === 0" class="detail-empty">No sanctions recorded for this user.</div>

          <div v-else class="sanction-list">
            <div v-for="s in userSanctions" :key="s.id" class="sanction-card">
              <div class="sanction-top">
                <div>
                  <p class="sanction-reason">{{ s.reason }}</p>
                  <p class="sanction-date">{{ formatDate(s.start_date) }}<span v-if="s.end_date"> → {{ formatDate(s.end_date) }}</span></p>
                </div>
                <div class="sanction-badges">
                  <span class="badge" :class="typeClass(s.sanction_type)">{{ s.sanction_type }}</span>
                  <span class="badge" :class="s.is_active ? 'badge-active' : 'badge-lifted'">{{ s.is_active ? 'Active' : 'Lifted' }}</span>
                </div>
              </div>
              <div v-if="s.is_active" class="sanction-actions">
                <button class="btn-lift" :disabled="liftingId === s.id" @click="handleLift(s.id)">
                  {{ liftingId === s.id ? '…' : 'Lift sanction' }}
                </button>
              </div>
            </div>
          </div>

          <div class="detail-footer">
            <button class="btn-create" @click="openForm">+ Add sanction</button>
          </div>
        </div>
      </template>

      <!-- Apply sanction modal -->
      <div v-if="showForm && selectedUser" class="modal-overlay" @click.self="showForm = false">
        <div class="modal">
          <h2 class="modal-title">Apply sanction</h2>
          <p class="modal-target">Target: <strong>{{ selectedUser.first_name }} {{ selectedUser.last_name }}</strong></p>
          <div v-if="formError" class="error-box">{{ formError }}</div>
          <form @submit.prevent="handleCreate">
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
import { ref, reactive, computed, onMounted } from 'vue'
import { apiAdminGetSanctions, apiAdminCreateSanction, apiAdminUpdateSanction, type Sanction } from '@/api/adminSanctions'
import { apiAdminGetUsers, type AdminUser } from '@/api/adminUsers'

const users = ref<AdminUser[]>([])
const sanctions = ref<Sanction[]>([])
const loading = ref(true)
const error = ref('')
const selectedUserId = ref<number | null>(null)
const showForm = ref(false)
const submitting = ref(false)
const formError = ref('')
const liftingId = ref<number | null>(null)

const form = reactive({ sanction_type: 'WARNING' as 'WARNING' | 'SUSPENSION' | 'BAN', reason: '', end_date: '' })

const search = ref('')
const sanctionableUsers = computed(() => users.value.filter(u => u.role !== 'ADMIN'))
const filteredUsers = computed(() => {
  const q = search.value.toLowerCase().trim()
  if (!q) return sanctionableUsers.value
  return sanctionableUsers.value.filter(u =>
    `${u.first_name} ${u.last_name}`.toLowerCase().includes(q) ||
    u.email.toLowerCase().includes(q)
  )
})

const selectedUser = computed(() => users.value.find(u => u.id === selectedUserId.value) ?? null)

const userSanctions = computed(() =>
  sanctions.value.filter(s => s.user_id === selectedUserId.value)
    .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
)

function activeSanctionCount(userId: number) {
  return sanctions.value.filter(s => s.user_id === userId && s.is_active).length
}
function hasActiveBan(userId: number) {
  return sanctions.value.some(s => s.user_id === userId && s.is_active && s.sanction_type === 'BAN')
}

onMounted(async () => {
  try {
    const [u, s] = await Promise.all([apiAdminGetUsers(), apiAdminGetSanctions()])
    users.value = u
    sanctions.value = s
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Failed to load data.'
  } finally {
    loading.value = false
  }
})

function selectUser(id: number) {
  selectedUserId.value = selectedUserId.value === id ? null : id
  showForm.value = false
}

function openForm() {
  Object.assign(form, { sanction_type: 'WARNING', reason: '', end_date: '' })
  formError.value = ''
  showForm.value = true
}

async function handleCreate() {
  if (!selectedUserId.value) return
  submitting.value = true
  formError.value = ''
  try {
    const payload = {
      user_id: selectedUserId.value,
      sanction_type: form.sanction_type,
      reason: form.reason,
      ...(form.end_date ? { end_date: form.end_date } : {}),
    }
    const created = await apiAdminCreateSanction(payload)
    sanctions.value.unshift(created)
    showForm.value = false
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
.container { max-width: 960px; margin: 0 auto; }
.page-header { margin-bottom: 24px; }
.page-title { font-family: var(--font-display); font-weight: 700; font-size: 26px; margin-bottom: 4px; }
.page-sub { font-size: 14px; color: var(--text-muted); }
.search-bar { margin-bottom: 16px; }
.search-input { width: 100%; max-width: 320px; padding: 9px 14px; border: 1.5px solid var(--border); border-radius: 8px; background: var(--surface); color: var(--text); font-size: 14px; outline: none; font-family: var(--font-body); box-sizing: border-box; }
.search-input:focus { border-color: var(--accent); }
.section-label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 12px; }

.users-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; margin-bottom: 28px; }

.user-card {
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: 10px;
  padding: 14px 16px;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s;
  width: 100%;
}
.user-card:hover { border-color: var(--accent); }
.user-card--selected { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 8%, var(--surface)); }
.user-card--banned { border-color: var(--error); }
.user-card-top { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 8px; }
.user-name { font-weight: 600; font-size: 14px; }
.role-badge { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 20px; text-transform: uppercase; flex-shrink: 0; }
.role-member { background: #DBEAFE; color: #1E40AF; }
.role-coach { background: #D1FAE5; color: #065F46; }
.user-card-bottom { font-size: 12px; }
.sanction-count { color: var(--error); font-weight: 600; }
.no-sanction { color: var(--text-muted); }

.detail { background: var(--surface); border: 1.5px solid var(--border); border-radius: 12px; padding: 24px; }
.detail-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.detail-name { font-family: var(--font-display); font-size: 18px; font-weight: 700; margin-bottom: 2px; }
.detail-email { font-size: 13px; color: var(--text-muted); }
.btn-close { background: transparent; border: none; font-size: 18px; color: var(--text-muted); cursor: pointer; padding: 4px; line-height: 1; }
.btn-close:hover { color: var(--text); }
.detail-empty { font-size: 14px; color: var(--text-muted); padding: 16px 0; }

.sanction-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
.sanction-card { border: 1.5px solid var(--border); border-radius: 10px; padding: 16px; }
.sanction-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 10px; }
.sanction-reason { font-size: 14px; font-weight: 500; margin-bottom: 4px; }
.sanction-date { font-size: 12px; color: var(--text-muted); }
.sanction-badges { display: flex; flex-direction: column; gap: 4px; align-items: flex-end; flex-shrink: 0; }
.badge { font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; }
.badge-warning { background: #FEF9C3; color: #854D0E; }
.badge-suspension { background: #FEE2E2; color: #991B1B; }
.badge-ban { background: #1F1135; color: #F8FAFC; }
.badge-active { background: #FEE2E2; color: #991B1B; }
.badge-lifted { background: #F1F5F9; color: #64748B; }
.sanction-actions { border-top: 1px solid var(--border); padding-top: 10px; }
.btn-lift { padding: 6px 14px; border-radius: 6px; border: 1.5px solid var(--border); background: transparent; font-size: 13px; font-weight: 600; color: var(--text-muted); cursor: pointer; transition: all 0.2s; }
.btn-lift:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
.btn-lift:disabled { opacity: 0.4; cursor: not-allowed; }

.detail-footer { border-top: 1px solid var(--border); padding-top: 16px; }
.btn-create { padding: 10px 20px; background: var(--error); color: #fff; border: none; border-radius: 8px; font-family: var(--font-display); font-weight: 600; font-size: 14px; cursor: pointer; transition: opacity 0.2s; }
.btn-create:hover { opacity: 0.85; }

.state { text-align: center; padding: 80px; color: var(--text-muted); font-size: 15px; }
.state.error { color: var(--error); }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal { background: var(--surface); border-radius: 14px; padding: 28px; width: 100%; max-width: 440px; }
.modal-title { font-family: var(--font-display); font-weight: 700; font-size: 20px; margin-bottom: 6px; }
.modal-target { font-size: 14px; color: var(--text-muted); margin-bottom: 20px; }
.modal-target strong { color: var(--text); }
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
