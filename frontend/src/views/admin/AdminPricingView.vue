<template>
  <div class="page">
    <div class="container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Pricing Plans</h1>
          <p class="page-sub">{{ plans.length }} plan{{ plans.length !== 1 ? 's' : '' }}</p>
        </div>
        <button class="btn-create" @click="openCreate">+ Add plan</button>
      </div>

      <div v-if="loading" class="state">Loading...</div>
      <div v-else-if="error" class="state error">{{ error }}</div>
      <div v-else-if="plans.length === 0" class="state">No pricing plans yet.</div>

      <div v-else class="list">
        <div v-for="p in plans" :key="p.id" class="card" :class="{ inactive: !p.is_active }">
          <div class="card-body">
            <div class="plan-header">
              <span class="name">{{ p.label }}</span>
              <span class="badge" :class="p.is_active ? 'badge-active' : 'badge-inactive'">
                {{ p.is_active ? 'Active' : 'Inactive' }}
              </span>
            </div>
            <div class="meta">
              <span class="price">{{ p.currency }} {{ p.price }}</span>
              <span class="sep">·</span>
              <span class="mode">{{ p.payment_mode === 'MONTHLY' ? 'Monthly' : 'Pay per session' }}</span>
            </div>
          </div>
          <div class="card-actions">
            <button class="btn-edit" @click="openEdit(p)">Edit</button>
            <button
              class="btn-toggle"
              :class="p.is_active ? 'btn-deactivate' : 'btn-activate'"
              :disabled="togglingId === p.id"
              @click="handleToggle(p)"
            >
              {{ togglingId === p.id ? '…' : (p.is_active ? 'Deactivate' : 'Activate') }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="showForm" class="modal-overlay" @click.self="closeForm">
        <div class="modal">
          <h2 class="modal-title">{{ editing ? 'Edit plan' : 'Add plan' }}</h2>
          <div v-if="formError" class="error-box">{{ formError }}</div>
          <form @submit.prevent="handleSubmit">
            <div class="field">
              <label>Label</label>
              <input v-model="form.label" type="text" required />
            </div>
            <div class="field">
              <label>Payment mode</label>
              <select v-model="form.payment_mode" required>
                <option value="MONTHLY">Monthly</option>
                <option value="PAY_PER_SESSION">Pay per session</option>
              </select>
            </div>
            <div class="field">
              <label>Price</label>
              <input v-model="form.price" type="number" step="0.01" min="0" required />
            </div>
            <div class="field">
              <label>Currency <span class="optional">(optional, default EUR)</span></label>
              <input v-model="form.currency" type="text" maxlength="3" placeholder="EUR" />
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
import { apiGetPricing, apiAdminCreatePricing, apiAdminUpdatePricing, apiAdminTogglePricingStatus, type Pricing } from '@/api/pricing'

const plans = ref<Pricing[]>([])
const loading = ref(true)
const error = ref('')
const togglingId = ref<number | null>(null)
const showForm = ref(false)
const submitting = ref(false)
const formError = ref('')
const editing = ref<Pricing | null>(null)
const form = reactive({ label: '', payment_mode: 'MONTHLY', price: '', currency: '' })

onMounted(async () => {
  try { plans.value = await apiGetPricing() }
  catch (err: unknown) { error.value = err instanceof Error ? err.message : 'Failed to load.' }
  finally { loading.value = false }
})

function openCreate() {
  editing.value = null
  form.label = ''; form.payment_mode = 'MONTHLY'; form.price = ''; form.currency = ''
  formError.value = ''; showForm.value = true
}
function openEdit(p: Pricing) {
  editing.value = p
  form.label = p.label; form.payment_mode = p.payment_mode; form.price = p.price; form.currency = p.currency
  formError.value = ''; showForm.value = true
}
function closeForm() { showForm.value = false }

async function handleSubmit() {
  submitting.value = true; formError.value = ''
  try {
    const payload = {
      label: form.label,
      payment_mode: form.payment_mode,
      price: parseFloat(form.price),
      currency: form.currency || undefined,
    }
    if (editing.value) {
      const updated = await apiAdminUpdatePricing(editing.value.id, payload)
      const idx = plans.value.findIndex(p => p.id === editing.value!.id)
      if (idx !== -1) plans.value[idx] = updated
    } else {
      const created = await apiAdminCreatePricing(payload)
      plans.value.push(created)
    }
    closeForm()
  } catch (err: unknown) { formError.value = err instanceof Error ? err.message : 'Failed.' }
  finally { submitting.value = false }
}

async function handleToggle(p: Pricing) {
  togglingId.value = p.id
  try {
    const updated = await apiAdminTogglePricingStatus(p.id, !p.is_active)
    const idx = plans.value.findIndex(x => x.id === p.id)
    if (idx !== -1) plans.value[idx] = updated
  } catch (err: unknown) { alert(err instanceof Error ? err.message : 'Toggle failed.') }
  finally { togglingId.value = null }
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
.card { background: var(--surface); border: 1.5px solid var(--border); border-radius: 12px; padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; gap: 16px; transition: opacity 0.2s; }
.card.inactive { opacity: 0.6; }
.plan-header { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
.name { font-family: var(--font-display); font-weight: 600; font-size: 15px; }
.badge { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 99px; text-transform: uppercase; letter-spacing: 0.4px; }
.badge-active { background: rgba(34,197,94,0.15); color: #16a34a; }
.badge-inactive { background: rgba(156,163,175,0.2); color: var(--text-muted); }
.meta { font-size: 13px; color: var(--text-muted); display: flex; gap: 6px; align-items: center; }
.price { font-weight: 600; color: var(--text); }
.sep { color: var(--border); }
.card-actions { display: flex; gap: 8px; flex-shrink: 0; }
.btn-edit, .btn-toggle { padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1.5px solid; transition: all 0.2s; }
.btn-edit { border-color: var(--border); color: var(--text-muted); background: transparent; }
.btn-edit:hover { border-color: var(--accent); color: var(--accent); }
.btn-deactivate { border-color: var(--error); color: var(--error); background: transparent; }
.btn-deactivate:hover:not(:disabled) { background: var(--error); color: #fff; }
.btn-activate { border-color: #16a34a; color: #16a34a; background: transparent; }
.btn-activate:hover:not(:disabled) { background: #16a34a; color: #fff; }
.btn-toggle:disabled { opacity: 0.4; cursor: not-allowed; }
.state { text-align: center; padding: 80px; color: var(--text-muted); font-size: 15px; }
.state.error { color: var(--error); }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal { background: var(--surface); border-radius: 14px; padding: 28px; width: 100%; max-width: 420px; }
.modal-title { font-family: var(--font-display); font-weight: 700; font-size: 20px; margin-bottom: 20px; }
.field { margin-bottom: 16px; }
.field label { display: block; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 6px; }
.optional { font-weight: 400; text-transform: none; color: var(--text-muted); }
.field input, .field select { width: 100%; padding: 10px 12px; border: 1.5px solid var(--border); border-radius: 8px; background: var(--surface-alt); color: var(--text); font-size: 14px; font-family: var(--font-body); outline: none; box-sizing: border-box; }
.field input:focus, .field select:focus { border-color: var(--accent); }
.modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 8px; }
.btn-cancel { padding: 10px 18px; background: transparent; border: 1.5px solid var(--border); border-radius: 8px; font-size: 14px; cursor: pointer; }
.btn-submit { padding: 10px 18px; background: var(--accent); color: #fff; border: none; border-radius: 8px; font-family: var(--font-display); font-weight: 600; font-size: 14px; cursor: pointer; min-width: 80px; }
.btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
.error-box { padding: 10px 14px; border-radius: 8px; background: var(--error-bg); color: var(--error); font-size: 13px; margin-bottom: 16px; }
.spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
