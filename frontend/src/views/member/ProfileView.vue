<template>
  <div class="page">
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">My Profile</h1>
        <p class="page-sub">Update your personal information.</p>
      </div>

      <div class="card">
        <div v-if="successMsg" class="success-box">Profile saved successfully.</div>
        <div v-if="errorMsg" class="error-box">{{ errorMsg }}</div>

        <form @submit.prevent="handleSubmit">
          <div class="row">
            <div class="field">
              <label for="firstName">First name</label>
              <input id="firstName" name="firstName" v-model="firstName" type="text" required @input="successMsg = false; errorMsg = ''" />
            </div>
            <div class="field">
              <label for="lastName">Last name</label>
              <input id="lastName" name="lastName" v-model="lastName" type="text" required @input="successMsg = false; errorMsg = ''" />
            </div>
          </div>

          <div class="field">
            <label for="email">Email address</label>
            <input id="email" name="email" v-model="email" type="email" required @input="successMsg = false; errorMsg = ''" />
          </div>

          <div class="field">
            <label for="password">New password <span class="optional">(leave blank to keep current)</span></label>
            <input id="password" name="password" v-model="password" type="password" placeholder="At least 6 characters" @input="successMsg = false; errorMsg = ''" />
          </div>

          <button type="submit" class="btn-save" :disabled="loading">
            <span v-if="loading" class="spinner"></span>
            <span v-else>Save changes</span>
          </button>
        </form>
      </div>
    </div>

    <div class="card payments-section">
      <h2 class="section-title">Payment history</h2>
      <div v-if="paymentsLoading" class="state">Loading…</div>
      <div v-else-if="payments.length === 0" class="state">No payments yet.</div>
      <div v-else class="payments-list">
        <div v-for="p in payments" :key="p.id" class="payment-row">
          <div class="payment-info">
            <span class="payment-desc">{{ p.description }}</span>
            <span class="payment-date">{{ new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }}</span>
          </div>
          <span class="payment-amount">€{{ parseFloat(p.amount).toFixed(2) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { apiUpdateProfile } from '@/api/auth'
import { apiGetMyPayments, type Payment } from '@/api/payments'

const auth = useAuthStore()

const payments = ref<Payment[]>([])
const paymentsLoading = ref(true)

onMounted(async () => {
  try {
    payments.value = await apiGetMyPayments()
  } catch {
    // non-critical
  } finally {
    paymentsLoading.value = false
  }
})

const firstName = ref(auth.user?.first_name ?? '')
const lastName = ref(auth.user?.last_name ?? '')
const email = ref(auth.user?.email ?? '')
const password = ref('')
const loading = ref(false)
const successMsg = ref(false)
const errorMsg = ref('')

async function handleSubmit() {
  if (password.value && password.value.length < 6) {
    errorMsg.value = 'Password must be at least 6 characters.'
    return
  }
  loading.value = true
  errorMsg.value = ''
  try {
    const data: Record<string, string> = {
      first_name: firstName.value,
      last_name: lastName.value,
      email: email.value,
    }
    if (password.value) data.password = password.value
    const updated = await apiUpdateProfile(data)
    if (auth.user) {
      auth.user.first_name = updated.first_name
      auth.user.last_name = updated.last_name
      auth.user.email = updated.email
    }
    password.value = ''
    successMsg.value = true
  } catch (err: unknown) {
    errorMsg.value = err instanceof Error ? err.message : 'Update failed.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.page { min-height: calc(100vh - 60px); background: var(--surface-alt); padding: 32px; }
.container { max-width: 560px; margin: 0 auto; }
.page-header { margin-bottom: 28px; }
.page-title { font-family: var(--font-display); font-weight: 700; font-size: 26px; margin-bottom: 4px; }
.page-sub { font-size: 14px; color: var(--text-muted); }

.card { background: var(--surface); border: 1.5px solid var(--border); border-radius: 12px; padding: 28px; }

.success-box { padding: 12px 16px; border-radius: 10px; background: #DCFCE7; border: 1px solid rgba(22,163,74,0.2); margin-bottom: 20px; color: #166534; font-size: 14px; font-weight: 500; }
.error-box { padding: 12px 16px; border-radius: 10px; background: var(--error-bg); border: 1px solid rgba(239,68,68,0.15); margin-bottom: 20px; color: var(--error); font-size: 14px; font-weight: 500; }

.row { display: flex; gap: 16px; }
.row .field { flex: 1; }
.field { margin-bottom: 20px; }
.field label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 8px; letter-spacing: 0.3px; text-transform: uppercase; }
.optional { font-weight: 400; text-transform: none; color: var(--text-muted); }
.field input { width: 100%; padding: 12px 14px; font-family: var(--font-body); font-size: 15px; border: 1.5px solid var(--border); border-radius: 10px; background: var(--surface-alt); color: var(--text); outline: none; transition: all 0.2s; box-sizing: border-box; }
.field input:focus { border-color: var(--accent); background: var(--surface); box-shadow: 0 0 0 3px var(--accent-glow); }

.btn-save { width: 100%; padding: 13px; font-family: var(--font-display); font-size: 15px; font-weight: 600; color: #fff; background: var(--accent); border: none; border-radius: 10px; cursor: pointer; transition: all 0.2s; margin-top: 4px; min-height: 44px; }
.btn-save:hover:not(:disabled) { background: var(--accent-hover); }
.btn-save:disabled { opacity: 0.65; cursor: not-allowed; }
.spinner { display: inline-block; width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.payments-section { margin-top: 20px; display: flex; flex-direction: column; gap: 12px; }
.section-title { font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); }
.payments-list { display: flex; flex-direction: column; gap: 0; }
.payment-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border); }
.payment-row:last-child { border-bottom: none; }
.payment-info { display: flex; flex-direction: column; gap: 2px; }
.payment-desc { font-size: 14px; font-weight: 500; }
.payment-date { font-size: 12px; color: var(--text-muted); }
.payment-amount { font-family: var(--font-display); font-weight: 700; font-size: 15px; color: var(--accent); flex-shrink: 0; }
.state { text-align: center; padding: 24px; color: var(--text-muted); font-size: 14px; }
</style>
