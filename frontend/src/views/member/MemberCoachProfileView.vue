<template>
  <div class="page">
    <div class="container">
      <div v-if="loading" class="state">Loading...</div>
      <div v-else-if="error" class="state error">{{ error }}</div>
      <template v-else-if="data">
        <div class="coach-header">
          <div class="avatar">{{ initials }}</div>
          <div>
            <h1 class="coach-name">{{ data.coach.first_name }} {{ data.coach.last_name }}</h1>
            <p class="coach-role">Coach</p>
          </div>
        </div>

        <div class="stats-card">
          <div class="avg-row">
            <span class="avg-score">{{ data.stats.average }}</span>
            <div class="avg-stars">
              <span v-for="s in 5" :key="s" class="star" :class="{ filled: s <= Math.round(data.stats.average) }">★</span>
            </div>
            <span class="review-count">{{ data.stats.total }} review{{ data.stats.total !== 1 ? 's' : '' }}</span>
          </div>

          <div class="breakdown">
            <div v-for="n in [5,4,3,2,1]" :key="n" class="bar-row">
              <span class="bar-label">{{ n }}★</span>
              <div class="bar-track">
                <div
                  class="bar-fill"
                  :style="{ width: data.stats.total ? (data.stats.breakdown[String(n)] ?? 0) / data.stats.total * 100 + '%' : '0%' }"
                ></div>
              </div>
              <span class="bar-count">{{ data.stats.breakdown[String(n)] ?? 0 }}</span>
            </div>
          </div>
        </div>

        <div v-if="data.reviews.length === 0" class="state">No reviews yet.</div>
        <div v-else class="reviews-list">
          <div v-for="review in data.reviews" :key="review.id" class="review-card">
            <div class="review-header">
              <span class="reviewer">{{ review.display_name }}</span>
              <div class="review-stars">
                <span v-for="s in 5" :key="s" class="star sm" :class="{ filled: s <= review.rating }">★</span>
              </div>
              <span class="review-date">{{ formatDate(review.created_at) }}</span>
            </div>
            <p v-if="review.comment" class="review-comment">{{ review.comment }}</p>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { apiGetCoachReviews, type CoachReviewsData } from '@/api/reviews'

const route = useRoute()
const data = ref<CoachReviewsData | null>(null)
const loading = ref(true)
const error = ref('')

const initials = computed(() => {
  if (!data.value) return ''
  return (data.value.coach.first_name[0] ?? '') + (data.value.coach.last_name[0] ?? '')
})

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

onMounted(async () => {
  try {
    const id = parseInt(route.params['id'] as string, 10)
    data.value = await apiGetCoachReviews(id)
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Failed to load profile.'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.page { min-height: calc(100vh - 60px); background: var(--surface-alt); padding: 32px; }
.container { max-width: 720px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px; }
.state { text-align: center; padding: 80px; color: var(--text-muted); font-size: 15px; }
.state.error { color: var(--error); }

.coach-header { display: flex; align-items: center; gap: 20px; }
.avatar {
  width: 64px; height: 64px; border-radius: 50%; background: var(--accent);
  color: #fff; font-family: var(--font-display); font-weight: 700; font-size: 22px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.coach-name { font-family: var(--font-display); font-weight: 700; font-size: 24px; }
.coach-role { font-size: 13px; color: var(--text-muted); margin-top: 2px; }

.stats-card {
  background: var(--surface); border: 1.5px solid var(--border);
  border-radius: 16px; padding: 24px; display: flex; flex-direction: column; gap: 20px;
}
.avg-row { display: flex; align-items: center; gap: 16px; }
.avg-score { font-family: var(--font-display); font-weight: 700; font-size: 40px; line-height: 1; }
.avg-stars { display: flex; gap: 4px; }
.review-count { font-size: 14px; color: var(--text-muted); }

.breakdown { display: flex; flex-direction: column; gap: 8px; }
.bar-row { display: flex; align-items: center; gap: 10px; }
.bar-label { font-size: 13px; color: var(--text-muted); width: 24px; text-align: right; flex-shrink: 0; }
.bar-track { flex: 1; height: 8px; background: var(--border); border-radius: 4px; overflow: hidden; }
.bar-fill { height: 100%; background: #F59E0B; border-radius: 4px; transition: width 0.3s; }
.bar-count { font-size: 13px; color: var(--text-muted); width: 20px; text-align: left; flex-shrink: 0; }

.reviews-list { display: flex; flex-direction: column; gap: 16px; }
.review-card {
  background: var(--surface); border: 1.5px solid var(--border);
  border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 10px;
}
.review-header { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.reviewer { font-weight: 600; font-size: 14px; }
.review-stars { display: flex; gap: 2px; }
.review-date { font-size: 12px; color: var(--text-muted); margin-left: auto; }
.review-comment { font-size: 14px; color: var(--text-muted); line-height: 1.6; }

.star { font-size: 20px; color: var(--border); }
.star.sm { font-size: 14px; }
.star.filled { color: #F59E0B; }
</style>
