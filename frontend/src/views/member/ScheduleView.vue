<template>
  <div class="page">
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">My Schedule</h1>
        <p class="page-sub">{{ upcoming.length }} upcoming · {{ past.length }} past</p>
      </div>

      <div v-if="loading" class="state">Loading...</div>
      <div v-else-if="error" class="state error">{{ error }}</div>

      <template v-else>
        <!-- Upcoming -->
        <section class="section">
          <div class="section-header">
            <h2 class="section-title">Upcoming sessions</h2>
            <button v-if="upcoming.length > 0" class="btn-export" @click="exportAllIcs">
              Export all to calendar (.ics)
            </button>
          </div>

          <div v-if="upcoming.length === 0" class="empty">
            No upcoming sessions. <RouterLink to="/member/sessions">Book one now</RouterLink>
          </div>

          <div v-else class="timeline">
            <div v-for="b in upcoming" :key="b.id" class="timeline-row">
              <div class="timeline-date">
                <span class="day-name">{{ dayName(b.session_start_time) }}</span>
                <span class="day-num">{{ dayNum(b.session_start_time) }}</span>
                <span class="month-name">{{ monthName(b.session_start_time) }}</span>
              </div>
              <div class="timeline-line">
                <div class="dot dot--upcoming"></div>
                <div class="line"></div>
              </div>
              <div class="timeline-card">
                <div class="card-main">
                  <div class="card-info">
                    <p class="card-title">{{ b.session_title }}</p>
                    <p class="card-meta">
                      {{ formatTime(b.session_start_time) }} – {{ formatTime(b.session_end_time) }}
                      <span class="sep">·</span>
                      Coach {{ b.coach_first_name }} {{ b.coach_last_name }}
                    </p>
                  </div>
                  <a
                    :href="googleCalendarUrl(b)"
                    target="_blank"
                    rel="noopener"
                    class="btn-gcal"
                    title="Add to Google Calendar"
                  >
                    + Google Calendar
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Past -->
        <section class="section">
          <h2 class="section-title">Past sessions</h2>

          <div v-if="past.length === 0" class="empty">No past sessions yet.</div>

          <div v-else class="timeline">
            <div v-for="b in past" :key="b.id" class="timeline-row">
              <div class="timeline-date">
                <span class="day-name">{{ dayName(b.session_start_time) }}</span>
                <span class="day-num">{{ dayNum(b.session_start_time) }}</span>
                <span class="month-name">{{ monthName(b.session_start_time) }}</span>
              </div>
              <div class="timeline-line">
                <div class="dot dot--past"></div>
                <div class="line"></div>
              </div>
              <div class="timeline-card timeline-card--past">
                <div class="card-main">
                  <div class="card-info">
                    <p class="card-title">{{ b.session_title }}</p>
                    <p class="card-meta">
                      {{ formatTime(b.session_start_time) }} – {{ formatTime(b.session_end_time) }}
                      <span class="sep">·</span>
                      Coach {{ b.coach_first_name }} {{ b.coach_last_name }}
                    </p>
                  </div>
                  <span class="badge-done">Attended</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { apiGetBookings, type Booking } from '@/api/bookings'

const bookings = ref<Booking[]>([])
const loading = ref(true)
const error = ref('')
const now = new Date()

onMounted(async () => {
  try {
    bookings.value = await apiGetBookings()
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Failed to load schedule.'
  } finally {
    loading.value = false
  }
})

const confirmed = computed(() => bookings.value.filter(b => b.status === 'CONFIRMED'))

const upcoming = computed(() =>
  confirmed.value
    .filter(b => new Date(b.session_start_time) > now)
    .sort((a, b) => new Date(a.session_start_time).getTime() - new Date(b.session_start_time).getTime())
)

const past = computed(() =>
  confirmed.value
    .filter(b => new Date(b.session_end_time) < now)
    .sort((a, b) => new Date(b.session_start_time).getTime() - new Date(a.session_start_time).getTime())
)

function dayName(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase()
}
function dayNum(iso: string) {
  return new Date(iso).getDate()
}
function monthName(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { month: 'short' }).toUpperCase()
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function toGCalDate(iso: string) {
  return new Date(iso).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

function exportAllIcs() {
  const events = upcoming.value.map(b => {
    const start = toGCalDate(b.session_start_time)
    const end = toGCalDate(b.session_end_time)
    const uid = `fitgym-booking-${b.id}@fitgymplanner`
    return [
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:FitGym: ${b.session_title}`,
      `DESCRIPTION:Coach: ${b.coach_first_name} ${b.coach_last_name}\\nBooked via FitGym Planner`,
      'LOCATION:FitGym',
      'END:VEVENT',
    ].join('\r\n')
  })

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FitGym Planner//EN',
    'CALSCALE:GREGORIAN',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n')

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'fitgym-schedule.ics'
  a.click()
  URL.revokeObjectURL(url)
}

function googleCalendarUrl(b: Booking) {
  const start = toGCalDate(b.session_start_time)
  const end = toGCalDate(b.session_end_time)
  const text = encodeURIComponent(`FitGym: ${b.session_title}`)
  const details = encodeURIComponent(`Coach: ${b.coach_first_name} ${b.coach_last_name}\nBooked via FitGym Planner`)
  const location = encodeURIComponent('FitGym')
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${start}/${end}&details=${details}&location=${location}`
}
</script>

<style scoped>
.page { min-height: calc(100vh - 60px); background: var(--surface-alt); padding: 32px; }
.container { max-width: 860px; margin: 0 auto; }
.page-header { margin-bottom: 32px; }
.page-title { font-family: var(--font-display); font-weight: 700; font-size: 26px; margin-bottom: 4px; }
.page-sub { font-size: 14px; color: var(--text-muted); }

.section { margin-bottom: 40px; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.section-title { font-family: var(--font-display); font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); margin-bottom: 0; }
.btn-export { padding: 7px 14px; border: 1.5px solid var(--border); border-radius: 8px; background: var(--surface); font-size: 12px; font-weight: 600; color: var(--text-muted); cursor: pointer; transition: all 0.15s; }
.btn-export:hover { border-color: #4285F4; color: #4285F4; }

.empty { font-size: 14px; color: var(--text-muted); padding: 16px 0; }
.empty a { color: var(--accent); text-decoration: none; font-weight: 600; }

/* Timeline */
.timeline { display: flex; flex-direction: column; gap: 0; }

.timeline-row {
  display: grid;
  grid-template-columns: 56px 28px 1fr;
  gap: 0 12px;
  align-items: flex-start;
  min-height: 72px;
}

.timeline-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 10px;
  gap: 1px;
}
.day-name { font-size: 10px; font-weight: 700; color: var(--text-muted); letter-spacing: 0.5px; }
.day-num  { font-family: var(--font-display); font-size: 22px; font-weight: 700; line-height: 1; color: var(--text); }
.month-name { font-size: 10px; font-weight: 600; color: var(--text-muted); letter-spacing: 0.5px; }

.timeline-line {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 14px;
}
.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
  z-index: 1;
}
.dot--upcoming { background: var(--accent); }
.dot--past { background: var(--border); }
.line { width: 2px; flex: 1; background: var(--border); margin-top: 4px; min-height: 48px; }

.timeline-card {
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: 10px;
  padding: 12px 16px;
  margin-bottom: 12px;
  margin-top: 6px;
}
.timeline-card--past { opacity: 0.7; }

.card-main { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.card-info { flex: 1; min-width: 0; }
.card-title { font-weight: 600; font-size: 15px; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.card-meta { font-size: 12px; color: var(--text-muted); }
.sep { margin: 0 4px; }

.btn-gcal {
  padding: 6px 12px;
  border: 1.5px solid var(--border);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  text-decoration: none;
  white-space: nowrap;
  transition: all 0.15s;
  flex-shrink: 0;
}
.btn-gcal:hover { border-color: #4285F4; color: #4285F4; }

.badge-done {
  padding: 4px 10px;
  background: var(--surface-alt);
  border: 1px solid var(--border);
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  flex-shrink: 0;
}

.state { text-align: center; padding: 80px; color: var(--text-muted); font-size: 15px; }
.state.error { color: var(--error); }
</style>
