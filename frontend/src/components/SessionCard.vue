<template>
  <div class="card">
    <div class="card-header">
      <div>
        <h3 class="title">{{ session.title }}</h3>
        <p class="type">{{ session.session_type_name ?? '' }}</p>
        <RouterLink :to="`/member/coach/${session.coach_id}`" class="coach-link">
          {{ session.coach_first_name }} {{ session.coach_last_name }}
        </RouterLink>
      </div>
      <span class="badge" :class="intensityClass">{{ session.intensity }}</span>
    </div>
    <div class="meta">
      <span>📅 {{ formattedDate }}</span>
      <span>🕐 {{ formattedTime }}</span>
      <span>👥 {{ session.registered_count }} / {{ session.capacity }}</span>
    </div>
    <p v-if="session.description" class="desc">{{ session.description }}</p>
    <button class="btn-book" :disabled="isFull || loading" @click="$emit('book', session.id)">
      <span v-if="loading" class="spinner"></span>
      <span v-else>{{ isFull ? 'Full' : 'Book' }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { Session } from '@/api/sessions'

const props = defineProps<{ session: Session; loading?: boolean }>()
defineEmits<{ book: [id: number] }>()

const isFull = computed(() => props.session.registered_count >= props.session.capacity)

const intensityClass = computed(() => ({
  'badge-low': props.session.intensity === 'LOW',
  'badge-medium': props.session.intensity === 'MEDIUM',
  'badge-high': props.session.intensity === 'HIGH',
}))

const formattedDate = computed(() =>
  new Date(props.session.start_time).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
)

const formattedTime = computed(() => {
  const start = new Date(props.session.start_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const end = new Date(props.session.end_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
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
.card:hover { border-color: var(--accent); box-shadow: 0 4px 16px rgba(16,185,129,0.08); }
.card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.title { font-family: var(--font-display); font-weight: 600; font-size: 16px; }
.type { font-size: 13px; color: var(--text-muted); margin-top: 2px; }
.coach-link { font-size: 13px; color: var(--accent); text-decoration: none; margin-top: 4px; display: inline-block; }
.coach-link:hover { text-decoration: underline; }
.badge { flex-shrink: 0; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; }
.badge-low { background: #DCFCE7; color: #166534; }
.badge-medium { background: #FEF9C3; color: #854D0E; }
.badge-high { background: #FEE2E2; color: #991B1B; }
.meta { display: flex; gap: 16px; font-size: 13px; color: var(--text-muted); flex-wrap: wrap; }
.desc { font-size: 14px; color: var(--text-muted); line-height: 1.5; }
.btn-book {
  margin-top: 4px;
  padding: 10px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 38px;
}
.btn-book:hover:not(:disabled) { background: var(--accent-hover); }
.btn-book:disabled { opacity: 0.5; cursor: not-allowed; }
.spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
