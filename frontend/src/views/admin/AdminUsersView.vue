<template>
  <div class="page">
    <div class="container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Users</h1>
          <p class="page-sub">{{ filtered.length }} user{{ filtered.length !== 1 ? 's' : '' }}</p>
        </div>
        <button class="btn-create" @click="showCreate = true">+ Add user</button>
      </div>

      <div class="filters">
        <select v-model="roleFilter" class="select">
          <option value="">All roles</option>
          <option value="ADMIN">Admin</option>
          <option value="COACH">Coach</option>
          <option value="MEMBER">Member</option>
        </select>
        <select v-model="activeFilter" class="select">
          <option value="">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      <div v-if="loading" class="state">Loading...</div>
      <div v-else-if="error" class="state error">{{ error }}</div>
      <div v-else-if="filtered.length === 0" class="state">No users found.</div>

      <table v-else class="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in filtered" :key="user.id">
            <td>{{ user.first_name }} {{ user.last_name }}</td>
            <td class="muted">{{ user.email }}</td>
            <td><span class="badge" :class="roleClass(user.role)">{{ user.role }}</span></td>
            <td>
              <span class="badge" :class="user.is_active ? 'badge-active' : 'badge-inactive'">
                {{ user.is_active ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td>
              <button
                class="btn-toggle"
                :class="user.is_active ? 'btn-deactivate' : 'btn-activate'"
                :disabled="togglingId === user.id"
                @click="handleToggle(user)"
              >
                {{ user.is_active ? 'Deactivate' : 'Activate' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Create user modal -->
      <div v-if="showCreate" class="modal-overlay" @click.self="showCreate = false">
        <div class="modal">
          <h2 class="modal-title">Add user</h2>
          <div v-if="createError" class="error-box">{{ createError }}</div>
          <form @submit.prevent="handleCreate">
            <div class="row">
              <div class="field">
                <label>First name</label>
                <input v-model="newUser.first_name" type="text" required />
              </div>
              <div class="field">
                <label>Last name</label>
                <input v-model="newUser.last_name" type="text" required />
              </div>
            </div>
            <div class="field">
              <label>Email</label>
              <input v-model="newUser.email" type="email" required />
            </div>
            <div class="field">
              <label>Password</label>
              <input v-model="newUser.password" type="password" required minlength="6" />
            </div>
            <div class="field">
              <label>Role</label>
              <select v-model="newUser.role" class="select-full">
                <option value="MEMBER">Member</option>
                <option value="COACH">Coach</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn-cancel" @click="showCreate = false">Cancel</button>
              <button type="submit" class="btn-submit" :disabled="creating">
                <span v-if="creating" class="spinner"></span>
                <span v-else>Create</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { apiAdminGetUsers, apiAdminCreateUser, apiAdminToggleStatus, type AdminUser } from '@/api/adminUsers'

const users = ref<AdminUser[]>([])
const loading = ref(true)
const error = ref('')
const togglingId = ref<number | null>(null)
const roleFilter = ref('')
const activeFilter = ref('')
const showCreate = ref(false)
const creating = ref(false)
const createError = ref('')
const newUser = reactive({ first_name: '', last_name: '', email: '', password: '', role: 'MEMBER' })

const filtered = computed(() =>
  users.value.filter(u => {
    if (roleFilter.value && u.role !== roleFilter.value) return false
    if (activeFilter.value !== '' && String(u.is_active) !== activeFilter.value) return false
    return true
  })
)

onMounted(async () => {
  try {
    users.value = await apiAdminGetUsers()
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Failed to load users.'
  } finally {
    loading.value = false
  }
})

async function handleToggle(user: AdminUser) {
  togglingId.value = user.id
  try {
    const updated = await apiAdminToggleStatus(user.id, !user.is_active)
    const idx = users.value.findIndex(u => u.id === user.id)
    if (idx !== -1) users.value[idx] = updated
  } catch (err: unknown) {
    alert(err instanceof Error ? err.message : 'Failed to update status.')
  } finally {
    togglingId.value = null
  }
}

async function handleCreate() {
  creating.value = true
  createError.value = ''
  try {
    const created = await apiAdminCreateUser(newUser)
    users.value.unshift(created)
    showCreate.value = false
    Object.assign(newUser, { first_name: '', last_name: '', email: '', password: '', role: 'MEMBER' })
  } catch (err: unknown) {
    createError.value = err instanceof Error ? err.message : 'Failed to create user.'
  } finally {
    creating.value = false
  }
}

function roleClass(role: string) {
  return { 'badge-admin': role === 'ADMIN', 'badge-coach': role === 'COACH', 'badge-member': role === 'MEMBER' }
}
</script>

<style scoped>
.page { min-height: calc(100vh - 60px); background: var(--surface-alt); padding: 32px; }
.container { max-width: 1100px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.page-title { font-family: var(--font-display); font-weight: 700; font-size: 26px; margin-bottom: 4px; }
.page-sub { font-size: 14px; color: var(--text-muted); }
.filters { display: flex; gap: 12px; margin-bottom: 20px; }
.select { padding: 8px 12px; border: 1.5px solid var(--border); border-radius: 8px; background: var(--surface); font-size: 14px; color: var(--text); outline: none; cursor: pointer; }
.btn-create { padding: 10px 20px; background: var(--accent); color: #fff; border: none; border-radius: 8px; font-family: var(--font-display); font-weight: 600; font-size: 14px; cursor: pointer; transition: background 0.2s; }
.btn-create:hover { background: var(--accent-hover); }
.table { width: 100%; border-collapse: collapse; background: var(--surface); border-radius: 12px; overflow: hidden; border: 1.5px solid var(--border); }
.table th { padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); background: var(--surface-alt); border-bottom: 1px solid var(--border); }
.table td { padding: 12px 16px; font-size: 14px; border-bottom: 1px solid var(--border); }
.table tr:last-child td { border-bottom: none; }
.muted { color: var(--text-muted); }
.badge { font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; }
.badge-admin { background: #EDE9FE; color: #6D28D9; }
.badge-coach { background: #DBEAFE; color: #1D4ED8; }
.badge-member { background: #F1F5F9; color: #475569; }
.badge-active { background: #DCFCE7; color: #166534; }
.badge-inactive { background: #FEE2E2; color: #991B1B; }
.btn-toggle { padding: 5px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1.5px solid; transition: all 0.2s; }
.btn-deactivate { border-color: var(--error); color: var(--error); background: transparent; }
.btn-deactivate:hover:not(:disabled) { background: var(--error); color: #fff; }
.btn-activate { border-color: var(--accent); color: var(--accent); background: transparent; }
.btn-activate:hover:not(:disabled) { background: var(--accent); color: #fff; }
.btn-toggle:disabled { opacity: 0.4; cursor: not-allowed; }
.state { text-align: center; padding: 80px; color: var(--text-muted); font-size: 15px; }
.state.error { color: var(--error); }
/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal { background: var(--surface); border-radius: 14px; padding: 28px; width: 100%; max-width: 460px; }
.modal-title { font-family: var(--font-display); font-weight: 700; font-size: 20px; margin-bottom: 20px; }
.row { display: flex; gap: 12px; }
.row .field { flex: 1; }
.field { margin-bottom: 16px; }
.field label { display: block; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 6px; }
.field input, .select-full { width: 100%; padding: 10px 12px; border: 1.5px solid var(--border); border-radius: 8px; background: var(--surface-alt); color: var(--text); font-size: 14px; outline: none; box-sizing: border-box; }
.field input:focus, .select-full:focus { border-color: var(--accent); }
.modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 8px; }
.btn-cancel { padding: 10px 18px; background: transparent; border: 1.5px solid var(--border); border-radius: 8px; font-size: 14px; cursor: pointer; }
.btn-submit { padding: 10px 18px; background: var(--accent); color: #fff; border: none; border-radius: 8px; font-family: var(--font-display); font-weight: 600; font-size: 14px; cursor: pointer; min-width: 80px; }
.btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
.error-box { padding: 10px 14px; border-radius: 8px; background: var(--error-bg); color: var(--error); font-size: 13px; margin-bottom: 16px; }
.spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
