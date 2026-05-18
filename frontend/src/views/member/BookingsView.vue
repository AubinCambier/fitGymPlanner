<template>
  <div class="page">
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">My Bookings</h1>
        <p class="page-sub">{{ confirmed.length }} upcoming / past, {{ cancelled.length }} cancelled</p>
      </div>

      <div v-if="loading" class="state">Loading...</div>
      <div v-else-if="error" class="state error">{{ error }}</div>
      <div v-else-if="bookings.length === 0" class="state">No bookings yet.</div>

      <div v-else>
        <section v-if="confirmed.length > 0" class="section">
          <h2 class="section-title">Confirmed</h2>
          <div class="grid">
            <BookingCard
              v-for="booking in confirmed"
              :key="booking.id"
              :booking="booking"
              :loading="cancellingId === booking.id"
              :existing-review="reviewMap[booking.id]"
              @cancel="handleCancel"
              @rate="openReviewModal"
            />
          </div>
        </section>

        <section v-if="cancelled.length > 0" class="section">
          <h2 class="section-title">Cancelled</h2>
          <div class="grid">
            <BookingCard
              v-for="booking in cancelled"
              :key="booking.id"
              :booking="booking"
            />
          </div>
        </section>
      </div>
    </div>

    <ReviewModal
      v-if="ratingBooking"
      :booking-id="ratingBooking.id"
      :session-title="ratingBooking.session_title"
      :existing-review="reviewMap[ratingBooking.id]"
      @submitted="onReviewSubmitted"
      @cancel="ratingBooking = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import BookingCard from '@/components/BookingCard.vue'
import ReviewModal from '@/components/ReviewModal.vue'
import { apiGetBookings, apiCancelBooking, type Booking } from '@/api/bookings'
import { apiGetMyReviews, type Review } from '@/api/reviews'

const bookings = ref<Booking[]>([])
const reviews = ref<Review[]>([])
const loading = ref(true)
const error = ref('')
const cancellingId = ref<number | null>(null)
const ratingBooking = ref<Booking | null>(null)

const confirmed = computed(() => bookings.value.filter(b => b.status === 'CONFIRMED'))
const cancelled = computed(() => bookings.value.filter(b => b.status === 'CANCELLED'))

const reviewMap = computed(() => {
  const map: Record<number, Review> = {}
  for (const r of reviews.value) map[r.booking_id] = r
  return map
})

onMounted(async () => {
  try {
    const [b, r] = await Promise.all([apiGetBookings(), apiGetMyReviews()])
    bookings.value = b
    reviews.value = r
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Failed to load bookings.'
  } finally {
    loading.value = false
  }
})

async function handleCancel(id: number) {
  cancellingId.value = id
  try {
    await apiCancelBooking(id)
    const booking = bookings.value.find(b => b.id === id)
    if (booking) booking.status = 'CANCELLED'
  } catch (err: unknown) {
    alert(err instanceof Error ? err.message : 'Cancellation failed.')
  } finally {
    cancellingId.value = null
  }
}

function openReviewModal(booking: Booking) {
  ratingBooking.value = booking
}

function onReviewSubmitted(review: Review) {
  const idx = reviews.value.findIndex(r => r.id === review.id)
  if (idx >= 0) reviews.value[idx] = review
  else reviews.value.push(review)
  ratingBooking.value = null
}
</script>

<style scoped>
.page { min-height: calc(100vh - 60px); background: var(--surface-alt); padding: 32px; }
.container { max-width: 1100px; margin: 0 auto; }
.page-header { margin-bottom: 28px; }
.page-title { font-family: var(--font-display); font-weight: 700; font-size: 26px; margin-bottom: 4px; }
.page-sub { font-size: 14px; color: var(--text-muted); }
.section { margin-bottom: 40px; }
.section-title { font-family: var(--font-display); font-weight: 600; font-size: 13px; margin-bottom: 16px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
.state { text-align: center; padding: 80px; color: var(--text-muted); font-size: 15px; }
.state.error { color: var(--error); }
</style>
