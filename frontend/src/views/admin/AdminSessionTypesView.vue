<template>
  <div class="page">
    <div class="container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Session Types</h1>
          <p class="page-sub">{{ types.length }} type{{ types.length !== 1 ? 's' : '' }}</p>
        </div>
        <button class="btn-create" @click="openCreate">+ Add type</button>
      </div>

      <div v-if="loading" class="state">Loading...</div>
      <div v-else-if="error" class="state error">{{ error }}</div>
      <div v-else-if="types.length === 0" class="state">No session types yet.</div>

      <div v-else class="list">
        <div v-for="t in types" :key="t.id" class="card">
          <div class="card-body">
            <div class="name">{{ t.name }}</div>
            <div class="desc">{{ t.description ?? '—' }}</div>
          </div>
          <div class="card-actions">
            <button class="btn-edit" @click="openEdit(t)">Edit</button>
            <button class="btn-delete" :disabled="deletingId === t.id" @click="handleDelete(t.id)">
              {{ deletingId === t.id ? '…' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="showForm" class="modal-overlay" @click.self="closeForm">
        <div class="modal">
          <h2 class="modal-title">{{ editing ? 'Edit type' : 'Add type' }}</h2>
          <div v-if="formError" class="error-box">{{ formError }}</div>
          <form @submit.prevent="handleSubmit">
            <div class="field">
              <label>Name</label>
              <input v-model="form.name" type="text" required />
            </div>
            <div class="field">
              <label>Description <span class="optional">(optional)</span></label>
              <textarea v-model="form.description" rows="2"></textarea>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn-cancel" @click="closeForm">Cancel</button>
              <button type="submit" class="btn-submit" :disabled="submitting">
                <span v-if="submitting" class="spinner"></span>
                <span v-else>{{ editing ? 'Save' : 'Create' }}</span>
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
import { apiGetSessionTypes, apiAdminCreateSessionType, apiAdminUpdateSessionType, apiAdminDeleteSessionType, type SessionType } from '@/api/sessionTypes'

const types = ref<SessionType[]>([])
const loading = ref(true)
const error = ref('')
const deletingId = ref<number | null>(null)
const showForm = ref(false)
const submitting = ref(false)
const formError = ref('')
const editing = ref<SessionType | null>(null)
const form = reactive({ name: '', description: '' })

onMounted(async () => {
  try { types.value = await apiGetSessionTypes() }
  catch (err: unknown) { error.value = err instanceof Error ? err.message : 'Failed to load.' }
  finally { loading.value = false }
})

function openCreate() { editing.value = null; form.name = ''; form.description = ''; formError.value = ''; showForm.value = true }
function openEdit(t: SessionType) { editing.value = t; form.name = t.name; form.description = t.description ?? ''; formError.value = ''; showForm.value = true }
function closeForm() { showForm.value = false }

async function handleSubmit() {
  submitting.value = true; formError.value = ''
  try {
    const payload = { name: form.name, description: form.description || undefined }
    if (editing.value) {
      const updated = await apiAdminUpdateSessionType(editing.value.id, payload)
      const idx = types.value.findIndex(t => t.id === editing.value!.id)
      if (idx !== -1) types.value[idx] = updated
    } else {
      const created = await apiAdminCreateSessionType(payload)
      types.value.push(created)
    }
    closeForm()
  } catch (err: unknown) { formError.value = err instanceof Error ? err.message : 'Failed.' }
  finally { submitting.value = false }
}

async function handleDelete(id: number) {
  if (!confirm('Delete this session type?')) return
  deletingId.value = id
  try {
    await apiAdminDeleteSessionType(id)
    types.value = types.value.filter(t => t.id !== id)
  } catch (err: unknown) { alert(err instanceof Error ? err.message : 'Delete failed.') }
  finally { deletingId.value = null }
}
</script>

<style scoped>
.page { min-height: calc(100vh - 60px); background: var(--surface-alt); padding: 32px; }
.container { max-width: 700px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
.page-title { font-family: var(--font-display); font-weight: 700; font-size: 26px; margin-bottom: 4px; }
.page-sub { font-size: 14px; color: var(--text-muted); }
.btn-create { padding: 10px 20px; background: var(--accent); color: #fff; border: none; border-radius: 8px; font-family: var(--font-display); font-weight: 600; font-size: 14px; cursor: pointer; transition: background 0.2s; }
.btn-create:hover { background: var(--accent-hover); }
.list { display: flex; flex-direction: column; gap: 12px; }
.card { background: var(--surface); border: 1.5px solid var(--border); border-radius: 12px; padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.name { font-family: var(--font-display); font-weight: 600; font-size: 15px; }
.desc { font-size: 13px; color: var(--text-muted); margin-top: 2px; }
.card-actions { display: flex; gap: 8px; flex-shrink: 0; }
.btn-edit, .btn-delete { padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1.5px solid; transition: all 0.2s; }
.btn-edit { border-color: var(--border); color: var(--text-muted); background: transparent; }
.btn-edit:hover { border-color: var(--accent); color: var(--accent); }
.btn-delete { border-color: var(--error); color: var(--error); background: transparent; }
.btn-delete:hover:not(:disabled) { background: var(--error); color: #fff; }
.btn-delete:disabled { opacity: 0.4; cursor: not-allowed; }
.state { text-align: center; padding: 80px; color: var(--text-muted); font-size: 15px; }
.state.error { color: var(--error); }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal { background: var(--surface); border-radius: 14px; padding: 28px; width: 100%; max-width: 420px; }
.modal-title { font-family: var(--font-display); font-weight: 700; font-size: 20px; margin-bottom: 20px; }
.field { margin-bottom: 16px; }
.field label { display: block; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 6px; }
.optional { font-weight: 400; text-transform: none; color: var(--text-muted); }
.field input, .field textarea { width: 100%; padding: 10px 12px; border: 1.5px solid var(--border); border-radius: 8px; background: var(--surface-alt); color: var(--text); font-size: 14px; font-family: var(--font-body); outline: none; box-sizing: border-box; }
.field input:focus, .field textarea:focus { border-color: var(--accent); }
.field textarea { resize: vertical; }
.modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 8px; }
.btn-cancel { padding: 10px 18px; background: transparent; border: 1.5px solid var(--border); border-radius: 8px; font-size: 14px; cursor: pointer; }
.btn-submit { padding: 10px 18px; background: var(--accent); color: #fff; border: none; border-radius: 8px; font-family: var(--font-display); font-weight: 600; font-size: 14px; cursor: pointer; min-width: 80px; }
.btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
.error-box { padding: 10px 14px; border-radius: 8px; background: var(--error-bg); color: var(--error); font-size: 13px; margin-bottom: 16px; }
.spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
