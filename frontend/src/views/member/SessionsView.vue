<template>
  <div class="page">
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">Available sessions</h1>
        <p class="page-sub">{{ sessions.length }} session{{ sessions.length !== 1 ? 's' : '' }} found</p>
      </div>

      <div class="filters">
        <select v-model="typeFilter" class="select" @change="applyFilters">
          <option value="">All types</option>
          <option v-for="t in sessionTypes" :key="t.id" :value="t.name">{{ t.name }}</option>
        </select>
        <input v-model="dateFilter" type="date" class="input-date" @change="applyFilters" />
        <button v-if="typeFilter || dateFilter" class="btn-reset" @click="resetFilters">Clear</button>
      </div>

      <PaymentModal
        v-if="showPaymentModal && pendingSessionId !== null"
        :amount="payPerSessionPrice"
        :description="pendingSessionTitle"
        @success="onPaymentSuccess"
        @cancel="showPaymentModal = false; pendingSessionId = null"
      />

      <div v-if="loading" class="state">Loading...</div>
      <div v-else-if="error" class="state error">{{ error }}</div>
      <div v-else-if="sessions.length === 0" class="state">No sessions available.</div>

      <div v-else class="grid">
        <SessionCard
          v-for="session in sessions"
          :key="session.id"
          :session="session"
          :loading="bookingId === session.id"
          @book="handleBook"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import SessionCard from '@/components/SessionCard.vue'
import PaymentModal from '@/components/PaymentModal.vue'
import { apiGetSessions, type Session } from '@/api/sessions'
import { apiGetSessionTypes, type SessionType } from '@/api/sessionTypes'
import { apiCreateBooking } from '@/api/bookings'
import { apiGetMyMembership } from '@/api/membership'
import { apiGetPricing } from '@/api/pricing'
import { apiCreatePayment } from '@/api/payments'

const sessions = ref<Session[]>([])
const sessionTypes = ref<SessionType[]>([])
const loading = ref(true)
const error = ref('')
const bookingId = ref<number | null>(null)
const typeFilter = ref('')
const dateFilter = ref('')

const hasMonthlyMembership = ref(false)
const payPerSessionPrice = ref(8)
const pendingSessionId = ref<number | null>(null)
const showPaymentModal = ref(false)

const pendingSessionTitle = computed(() => {
  const s = sessions.value.find(s => s.id === pendingSessionId.value)
  return s ? `Session booking: ${s.title}` : 'Session booking'
})

onMounted(async () => {
  try {
    const [s, t, membership, pricing] = await Promise.all([
      apiGetSessions(),
      apiGetSessionTypes(),
      apiGetMyMembership(),
      apiGetPricing(),
    ])
    sessions.value = s
    sessionTypes.value = t
    hasMonthlyMembership.value = membership?.status === 'ACTIVE' && membership?.payment_mode === 'MONTHLY'
    const payPerSession = pricing.find(p => p.payment_mode === 'PAY_PER_SESSION' && p.is_active)
    if (payPerSession) payPerSessionPrice.value = parseFloat(payPerSession.price)
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Failed to load sessions.'
  } finally {
    loading.value = false
  }
})

async function applyFilters() {
  loading.value = true
  error.value = ''
  try {
    const params: { type?: string; date?: string } = {}
    if (typeFilter.value) params.type = typeFilter.value
    if (dateFilter.value) params.date = dateFilter.value
    sessions.value = await apiGetSessions(params)
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Failed to load sessions.'
  } finally {
    loading.value = false
  }
}

async function resetFilters() {
  typeFilter.value = ''
  dateFilter.value = ''
  await applyFilters()
}

function handleBook(sessionId: number) {
  if (hasMonthlyMembership.value) {
    doBook(sessionId)
  } else {
    pendingSessionId.value = sessionId
    showPaymentModal.value = true
  }
}

async function onPaymentSuccess() {
  showPaymentModal.value = false
  const sessionId = pendingSessionId.value!
  bookingId.value = sessionId
  try {
    await apiCreateBooking(sessionId)
    await apiCreatePayment({ amount: payPerSessionPrice.value, description: pendingSessionTitle.value })
    const session = sessions.value.find(s => s.id === sessionId)
    if (session) session.registered_count++
  } catch (err: unknown) {
    alert(err instanceof Error ? err.message : 'Booking failed.')
  } finally {
    bookingId.value = null
    pendingSessionId.value = null
  }
}

async function doBook(sessionId: number) {
  bookingId.value = sessionId
  try {
    await apiCreateBooking(sessionId)
    const session = sessions.value.find(s => s.id === sessionId)
    if (session) session.registered_count++
  } catch (err: unknown) {
    alert(err instanceof Error ? err.message : 'Booking failed.')
  } finally {
    bookingId.value = null
  }
}
</script>

<style scoped>
.page { min-height: calc(100vh - 60px); background: var(--surface-alt); padding: 32px; }
.container { max-width: 1100px; margin: 0 auto; }
.page-header { margin-bottom: 20px; }
.page-title { font-family: var(--font-display); font-weight: 700; font-size: 26px; margin-bottom: 4px; }
.page-sub { font-size: 14px; color: var(--text-muted); }
.filters { display: flex; gap: 12px; align-items: center; margin-bottom: 24px; flex-wrap: wrap; }
.select { padding: 8px 12px; border: 1.5px solid var(--border); border-radius: 8px; background: var(--surface); font-size: 14px; color: var(--text); outline: none; cursor: pointer; }
.input-date { padding: 8px 12px; border: 1.5px solid var(--border); border-radius: 8px; background: var(--surface); font-size: 14px; color: var(--text); outline: none; font-family: var(--font-body); }
.btn-reset { padding: 8px 14px; background: transparent; border: 1.5px solid var(--border); border-radius: 8px; font-size: 13px; color: var(--text-muted); cursor: pointer; transition: all 0.2s; }
.btn-reset:hover { border-color: var(--error); color: var(--error); }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
.state { text-align: center; padding: 80px; color: var(--text-muted); font-size: 15px; }
.state.error { color: var(--error); }
</style>
