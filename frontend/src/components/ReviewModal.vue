<template>
  <div class="modal-backdrop" @click.self="$emit('cancel')">
    <div class="modal">
      <h2 class="modal-title">Rate this session</h2>
      <p class="session-name">{{ sessionTitle }}</p>

      <div class="stars">
        <button
          v-for="star in 5"
          :key="star"
          class="star"
          :class="{ filled: star <= hovered || (hovered === 0 && star <= rating) }"
          @mouseenter="hovered = star"
          @mouseleave="hovered = 0"
          @click="rating = star"
        >★</button>
      </div>

      <textarea
        v-model="comment"
        class="comment-input"
        placeholder="Comment (optional)"
        rows="3"
      />

      <label class="anon-toggle">
        <input v-model="isAnonymous" type="checkbox" />
        Post anonymously
      </label>

      <div class="actions">
        <button class="btn-cancel" @click="$emit('cancel')">Cancel</button>
        <button class="btn-submit" :disabled="rating === 0 || submitting" @click="submit">
          <span v-if="submitting" class="spinner"></span>
          <span v-else>{{ existingReview ? 'Update' : 'Submit' }} →</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { apiCreateReview, apiUpdateReview, type Review } from '@/api/reviews'

const props = defineProps<{
  bookingId: number
  sessionTitle: string
  existingReview?: Review
}>()

const emit = defineEmits<{
  submitted: [review: Review]
  cancel: []
}>()

const rating = ref(props.existingReview?.rating ?? 0)
const comment = ref(props.existingReview?.comment ?? '')
const isAnonymous = ref(props.existingReview?.is_anonymous ?? false)
const hovered = ref(0)
const submitting = ref(false)

async function submit() {
  if (rating.value === 0) return
  submitting.value = true
  try {
    let review: Review
    if (props.existingReview) {
      review = await apiUpdateReview(props.existingReview.id, {
        rating: rating.value,
        comment: comment.value || null,
        is_anonymous: isAnonymous.value,
      })
    } else {
      review = await apiCreateReview({
        booking_id: props.bookingId,
        rating: rating.value,
        comment: comment.value || undefined,
        is_anonymous: isAnonymous.value,
      })
    }
    emit('submitted', review)
  } catch (err: unknown) {
    alert(err instanceof Error ? err.message : 'Failed to submit review.')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center; z-index: 100;
}
.modal {
  background: var(--surface); border-radius: 16px; padding: 32px;
  width: 100%; max-width: 440px; display: flex; flex-direction: column; gap: 20px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}
.modal-title { font-family: var(--font-display); font-weight: 700; font-size: 20px; }
.session-name { font-size: 14px; color: var(--text-muted); margin-top: -12px; }
.stars { display: flex; gap: 8px; }
.star {
  background: none; border: none; font-size: 36px; cursor: pointer;
  color: var(--border); transition: color 0.15s; line-height: 1;
}
.star.filled { color: #F59E0B; }
.comment-input {
  width: 100%; padding: 12px; background: var(--surface-alt); border: 1.5px solid var(--border);
  border-radius: 8px; color: var(--text); font-size: 14px; resize: vertical; font-family: inherit;
  box-sizing: border-box;
}
.comment-input:focus { outline: none; border-color: var(--accent); }
.anon-toggle { display: flex; align-items: center; gap: 10px; font-size: 14px; cursor: pointer; }
.anon-toggle input { width: 16px; height: 16px; accent-color: var(--accent); cursor: pointer; }
.actions { display: flex; gap: 12px; justify-content: flex-end; }
.btn-cancel {
  padding: 10px 20px; background: transparent; border: 1.5px solid var(--border);
  border-radius: 8px; color: var(--text-muted); font-size: 14px; cursor: pointer;
}
.btn-submit {
  padding: 10px 24px; background: var(--accent); border: none; border-radius: 8px;
  color: #fff; font-family: var(--font-display); font-weight: 600; font-size: 14px;
  cursor: pointer; min-width: 100px; min-height: 40px;
}
.btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
.spinner {
  display: inline-block; width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
  border-radius: 50%; animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
