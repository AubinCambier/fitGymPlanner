<template>
  <div class="card" :class="{ cancelled: booking.status === 'CANCELLED' }">
    <div class="card-header">
      <div>
        <h3 class="title">{{ booking.session_title }}</h3>
        <p class="type">{{ booking.session_type_name ?? '' }}</p>
        <RouterLink
          v-if="booking.coach_id"
          :to="`/member/coach/${booking.coach_id}`"
          class="coach-link"
        >{{ booking.coach_first_name }} {{ booking.coach_last_name }}</RouterLink>
      </div>
      <span v-if="booking.status === 'CANCELLED'" class="badge badge-cancelled">Cancelled</span>
    </div>
    <div class="meta">
      <span>📅 {{ formattedDate }}</span>
      <span>🕐 {{ formattedTime }}</span>
    </div>
    <div class="card-actions">
      <button
        v-if="booking.status === 'CONFIRMED' && !isPast"
        class="btn-cancel"
        :disabled="loading"
        @click="$emit('cancel', booking.id)"
      >
        <span v-if="loading" class="spinner"></span>
        <span v-else>Cancel</span>
      </button>
      <button
        v-if="booking.status === 'CONFIRMED' && isPast && existingReview"
        class="btn-rate edited"
        @click="$emit('rate', booking)"
      >★ Edit review</button>
      <button
        v-else-if="booking.status === 'CONFIRMED' && isPast"
        class="btn-rate"
        @click="$emit('rate', booking)"
      >Rate</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { Booking } from '@/api/bookings'
import type { Review } from '@/api/reviews'

const props = defineProps<{
  booking: Booking
  loading?: boolean
  existingReview?: Review
}>()

defineEmits<{
  cancel: [id: number]
  rate: [booking: Booking]
}>()

const isPast = computed(() => new Date(props.booking.session_end_time) < new Date())

const formattedDate = computed(() =>
  new Date(props.booking.session_start_time).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
)

const formattedTime = computed(() => {
  const start = new Date(props.booking.session_start_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const end = new Date(props.booking.session_end_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  return `${start} – ${end}`
})
</script>

<style scoped>
.card {
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.card:hover:not(.cancelled) { border-color: var(--accent); box-shadow: 0 4px 16px rgba(16,185,129,0.08); }
.cancelled { opacity: 0.6; }
.card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.title { font-family: var(--font-display); font-weight: 600; font-size: 16px; }
.type { font-size: 13px; color: var(--text-muted); margin-top: 2px; }
.coach-link { font-size: 13px; color: var(--accent); text-decoration: none; margin-top: 4px; display: inline-block; }
.coach-link:hover { text-decoration: underline; }
.badge { flex-shrink: 0; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; }
.badge-cancelled { background: #F1F5F9; color: #64748B; }
.meta { display: flex; gap: 16px; font-size: 13px; color: var(--text-muted); flex-wrap: wrap; }
.card-actions { display: flex; gap: 10px; flex-wrap: wrap; }
.btn-cancel {
  padding: 10px;
  background: transparent;
  color: var(--error);
  border: 1.5px solid var(--error);
  border-radius: 8px;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 38px;
}
.btn-cancel:hover:not(:disabled) { background: var(--error); color: #fff; }
.btn-cancel:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-rate {
  padding: 10px 16px;
  background: transparent;
  color: var(--accent);
  border: 1.5px solid var(--accent);
  border-radius: 8px;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-rate:hover { background: var(--accent); color: #fff; }
.btn-rate.edited { color: #F59E0B; border-color: #F59E0B; }
.btn-rate.edited:hover { background: #F59E0B; color: #fff; }
.spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(239,68,68,0.3); border-top-color: var(--error); border-radius: 50%; animation: spin 0.6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
