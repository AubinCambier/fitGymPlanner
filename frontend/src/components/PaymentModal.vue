<template>
  <div class="overlay" @click.self="handleCancel">
    <div class="modal">
      <template v-if="state === 'form'">
        <h2 class="modal-title">Payment</h2>
        <p class="modal-desc">{{ description }} · <strong>€{{ amount.toFixed(2) }}</strong></p>
        <div class="field">
          <label>Card number</label>
          <input v-model="cardNumber" type="text" maxlength="19" placeholder="1234 5678 9012 3456" @input="formatCardNumber" />
        </div>
        <div class="row">
          <div class="field">
            <label>Expiry</label>
            <input v-model="expiry" type="text" maxlength="5" placeholder="MM/YY" />
          </div>
          <div class="field">
            <label>CVV</label>
            <input v-model="cvv" type="text" maxlength="3" placeholder="123" />
          </div>
        </div>
        <div class="field">
          <label>Cardholder name</label>
          <input v-model="cardName" type="text" placeholder="John Doe" />
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="handleCancel">Cancel</button>
          <button class="btn-pay" :disabled="!isValid" @click="pay">Pay €{{ amount.toFixed(2) }} →</button>
        </div>
      </template>

      <template v-else-if="state === 'processing'">
        <div class="processing">
          <div class="spinner"></div>
          <p>Processing payment…</p>
        </div>
      </template>

      <template v-else>
        <div class="success">
          <div class="checkmark">✓</div>
          <h2>Payment confirmed</h2>
          <p>€{{ amount.toFixed(2) }} — {{ description }}</p>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{ amount: number; description: string }>()
const emit = defineEmits<{ success: []; cancel: [] }>()

const state = ref<'form' | 'processing' | 'success'>('form')
const cardNumber = ref('')
const expiry = ref('')
const cvv = ref('')
const cardName = ref('')

const isValid = computed(
  () =>
    cardNumber.value.replace(/\s/g, '').length === 16 &&
    expiry.value.length === 5 &&
    cvv.value.length === 3 &&
    cardName.value.trim().length > 0
)

function formatCardNumber() {
  cardNumber.value = cardNumber.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
}

function handleCancel() {
  if (state.value === 'form') emit('cancel')
}

function pay() {
  state.value = 'processing'
  setTimeout(() => {
    state.value = 'success'
    setTimeout(() => emit('success'), 800)
  }, 2000)
}
</script>

<style scoped>
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 200; }
.modal { background: var(--surface); border-radius: 14px; padding: 28px; width: 100%; max-width: 420px; display: flex; flex-direction: column; gap: 16px; }
.modal-title { font-family: var(--font-display); font-weight: 700; font-size: 20px; }
.modal-desc { font-size: 14px; color: var(--text-muted); }
.field { display: flex; flex-direction: column; gap: 6px; }
.field label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; }
.field input { padding: 10px 12px; border: 1.5px solid var(--border); border-radius: 8px; background: var(--surface-alt); color: var(--text); font-size: 14px; font-family: var(--font-body); outline: none; }
.field input:focus { border-color: var(--accent); }
.row { display: flex; gap: 12px; }
.row .field { flex: 1; }
.modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 4px; }
.btn-cancel { padding: 10px 18px; background: transparent; border: 1.5px solid var(--border); border-radius: 8px; font-size: 14px; cursor: pointer; color: var(--text); }
.btn-pay { padding: 10px 18px; background: var(--accent); color: #fff; border: none; border-radius: 8px; font-family: var(--font-display); font-weight: 600; font-size: 14px; cursor: pointer; transition: background 0.2s; }
.btn-pay:hover:not(:disabled) { background: var(--accent-hover); }
.btn-pay:disabled { opacity: 0.4; cursor: not-allowed; }
.processing { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 24px 0; }
.processing p { color: var(--text-muted); font-size: 15px; }
.spinner { width: 40px; height: 40px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.success { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 24px 0; text-align: center; }
.checkmark { width: 56px; height: 56px; background: #DCFCE7; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 28px; color: #166534; }
.success h2 { font-family: var(--font-display); font-weight: 700; font-size: 20px; }
.success p { font-size: 14px; color: var(--text-muted); }
</style>
