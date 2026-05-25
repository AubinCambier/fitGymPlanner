import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import CoachSessionsView from '../CoachSessionsView.vue'

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v },
    removeItem: (k: string) => { delete store[k] },
    clear: () => { store = {} },
  }
})()
vi.stubGlobal('localStorage', localStorageMock)
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: CoachSessionsView },
    { path: '/coach/sessions/:id', component: { template: '<div/>' } },
  ],
})

function mockOk(data: unknown) {
  mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ status: 'success', data }) })
}

const sessions = [
  { id: 1, title: 'Morning Yoga', session_type_name: 'Yoga', coach_id: 5, start_time: '2026-05-20T09:00:00Z', end_time: '2026-05-20T10:00:00Z', capacity: 15, registered_count: 8, intensity: 'LOW', status: 'SCHEDULED', description: null },
  { id: 2, title: 'HIIT Power', session_type_name: 'HIIT', coach_id: 5, start_time: '2026-05-21T07:00:00Z', end_time: '2026-05-21T08:00:00Z', capacity: 10, registered_count: 10, intensity: 'HIGH', status: 'SCHEDULED', description: null },
]

function mountView() {
  const pinia = createPinia()
  setActivePinia(pinia)
  localStorageMock.setItem('token', 'coach-token')
  localStorageMock.setItem('user', JSON.stringify({ id: 5, email: 'coach@test.com', role: 'COACH', first_name: 'Marc', last_name: 'Coach', is_active: true }))
  return mount(CoachSessionsView, { global: { plugins: [pinia, router] } })
}

beforeEach(() => { vi.clearAllMocks(); localStorageMock.clear() })

describe('CoachSessionsView', () => {
  it('shows loading state', () => {
    mockFetch.mockReturnValueOnce(new Promise(() => {}))
    const wrapper = mountView()
    expect(wrapper.text()).toContain('Loading')
  })

  it('shows session titles after loading', async () => {
    mockOk(sessions)
    const wrapper = mountView()
    await vi.waitUntil(() => !wrapper.text().includes('Loading'))
    expect(wrapper.text()).toContain('Morning Yoga')
    expect(wrapper.text()).toContain('HIIT Power')
  })

  it('shows participant count per session', async () => {
    mockOk(sessions)
    const wrapper = mountView()
    await vi.waitUntil(() => !wrapper.text().includes('Loading'))
    expect(wrapper.text()).toContain('8')
    expect(wrapper.text()).toContain('15')
  })

  it('shows empty state when no sessions', async () => {
    mockOk([])
    const wrapper = mountView()
    await vi.waitUntil(() => !wrapper.text().includes('Loading'))
    expect(wrapper.text()).toMatch(/no session/i)
  })
})
