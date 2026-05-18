<template>
  <div class="page">
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">Membership</h1>
        <p class="page-sub">Manage your subscription.</p>
      </div>

      <div v-if="loading" class="state">Loading...</div>

      <div v-else-if="membership" class="section">
        <h2 class="section-title">Current membership</h2>
        <div class="membership-card">
          <div class="membership-header">
            <div>
              <div class="membership-mode">{{ formatMode(membership.payment_mode) }}</div>
              <div class="membership-dates">
                Since {{ formatDate(membership.start_date) }}
                <span v-if="membership.end_date"> · Until {{ formatDate(membership.end_date) }}</span>
              </div>
            </div>
            <span class="badge" :class="badgeClass(membership.status)">{{ membership.status }}</span>
          </div>
          <button
            v-if="membership.status === 'ACTIVE'"
            class="btn-cancel"
            :disabled="cancelling"
            @click="handleCancel"
          >
            <span v-if="cancelling" class="spinner"></span>
            <span v-else>Cancel membership</span>
          </button>
        </div>
      </div>

      <PaymentModal
        v-if="showPaymentModal && pendingPlan !== null"
        :amount="parseFloat(pendingPlan!.price)"
        :description="`Membership: ${pendingPlan!.label}`"
        @success="onPaymentSuccess"
        @cancel="showPaymentModal = false; pendingPlan = null"
      />

      <div v-else class="section">
        <h2 class="section-title">Choose a plan</h2>
        <div v-if="pricingError" class="state error">{{ pricingError }}</div>
        <div v-else class="plans-grid">
          <div v-for="plan in plans" :key="plan.id" class="plan-card">
            <div class="plan-label">{{ plan.label }}</div>
            <div class="plan-price">
              {{ parseFloat(plan.price).toFixed(2) }} {{ plan.currency }}
              <span class="plan-mode">/ {{ formatMode(plan.payment_mode) }}</span>
            </div>
            <button
              class="btn-subscribe"
              :disabled="subscribingId === plan.id"
              @click="handleSubscribe(plan)"
            >
              <span v-if="subscribingId === plan.id" class="spinner"></span>
              <span v-else>Subscribe</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { apiGetMyMembership, apiCreateMembership, apiCancelMembership, type Membership } from '@/api/membership'
import { apiGetPricing, type Pricing } from '@/api/pricing'
import PaymentModal from '@/components/PaymentModal.vue'
import { apiCreatePayment } from '@/api/payments'

const membership = ref<Membership | null>(null)
const plans = ref<Pricing[]>([])
const loading = ref(true)
const cancelling = ref(false)
const subscribingId = ref<number | null>(null)
const pricingError = ref('')
const pendingPlan = ref<Pricing | null>(null)
const showPaymentModal = ref(false)

onMounted(async () => {
  try {
    membership.value = await apiGetMyMembership()
    if (!membership.value) {
      plans.value = await apiGetPricing()
    }
  } catch {
    pricingError.value = 'Failed to load membership data.'
  } finally {
    loading.value = false
  }
})

async function handleCancel() {
  if (!confirm('Are you sure you want to cancel your membership?')) return
  cancelling.value = true
  try {
    membership.value = await apiCancelMembership()
  } catch (err: unknown) {
    alert(err instanceof Error ? err.message : 'Cancellation failed.')
  } finally {
    cancelling.value = false
  }
}

function handleSubscribe(plan: Pricing) {
  pendingPlan.value = plan
  showPaymentModal.value = true
}

async function onPaymentSuccess() {
  showPaymentModal.value = false
  const plan = pendingPlan.value!
  subscribingId.value = plan.id
  try {
    membership.value = await apiCreateMembership(plan.id, plan.payment_mode)
    await apiCreatePayment({ amount: parseFloat(plan.price), description: `Membership: ${plan.label}` })
  } catch (err: unknown) {
    alert(err instanceof Error ? err.message : 'Subscription failed.')
  } finally {
    subscribingId.value = null
    pendingPlan.value = null
  }
}

function formatMode(mode: string) {
  return mode === 'MONTHLY' ? 'Monthly' : 'Pay per session'
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function badgeClass(status: string) {
  return {
    'badge-active': status === 'ACTIVE',
    'badge-expired': status === 'EXPIRED',
    'badge-cancelled': status === 'CANCELLED',
  }
}
</script>

<style scoped>
.page { min-height: calc(100vh - 60px); background: var(--surface-alt); padding: 32px; }
.container { max-width: 700px; margin: 0 auto; }
.page-header { margin-bottom: 28px; }
.page-title { font-family: var(--font-display); font-weight: 700; font-size: 26px; margin-bottom: 4px; }
.page-sub { font-size: 14px; color: var(--text-muted); }
.section { margin-bottom: 32px; }
.section-title { font-family: var(--font-display); font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); margin-bottom: 16px; }

.membership-card { background: var(--surface); border: 1.5px solid var(--border); border-radius: 12px; padding: 24px; display: flex; flex-direction: column; gap: 20px; }
.membership-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.membership-mode { font-family: var(--font-display); font-weight: 700; font-size: 20px; }
.membership-dates { font-size: 13px; color: var(--text-muted); margin-top: 4px; }

.badge { font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; flex-shrink: 0; }
.badge-active { background: #DCFCE7; color: #166534; }
.badge-expired { background: #FEF9C3; color: #854D0E; }
.badge-cancelled { background: #F1F5F9; color: #64748B; }

.btn-cancel { padding: 10px 20px; background: transparent; color: var(--error); border: 1.5px solid var(--error); border-radius: 8px; font-family: var(--font-display); font-weight: 600; font-size: 14px; cursor: pointer; transition: all 0.2s; min-height: 38px; align-self: flex-start; }
.btn-cancel:hover:not(:disabled) { background: var(--error); color: #fff; }
.btn-cancel:disabled { opacity: 0.5; cursor: not-allowed; }

.plans-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
.plan-card { background: var(--surface); border: 1.5px solid var(--border); border-radius: 12px; padding: 24px; display: flex; flex-direction: column; gap: 16px; transition: border-color 0.2s, box-shadow 0.2s; }
.plan-card:hover { border-color: var(--accent); box-shadow: 0 4px 16px rgba(16,185,129,0.08); }
.plan-label { font-family: var(--font-display); font-weight: 700; font-size: 18px; }
.plan-price { font-size: 28px; font-weight: 700; color: var(--accent); font-family: var(--font-display); }
.plan-mode { font-size: 14px; color: var(--text-muted); font-weight: 400; }
.btn-subscribe { padding: 10px; background: var(--accent); color: #fff; border: none; border-radius: 8px; font-family: var(--font-display); font-weight: 600; font-size: 14px; cursor: pointer; transition: all 0.2s; min-height: 38px; }
.btn-subscribe:hover:not(:disabled) { background: var(--accent-hover); }
.btn-subscribe:disabled { opacity: 0.5; cursor: not-allowed; }

.state { text-align: center; padding: 80px; color: var(--text-muted); font-size: 15px; }
.state.error { color: var(--error); }
.spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
