import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import DashboardView from '../DashboardView.vue'
import { useAuthStore } from '@/stores/auth'

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
  routes: [{ path: '/', component: DashboardView }],
})

function mockBookingsOk(bookings: unknown[]) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ status: 'success', data: bookings }),
  })
}

function mountDashboard() {
  const pinia = createPinia()
  setActivePinia(pinia)
  localStorageMock.setItem('token', 'test-token')
  localStorageMock.setItem('user', JSON.stringify({
    id: 1, email: 'john@test.com', role: 'MEMBER',
    first_name: 'John', last_name: 'Doe', is_active: true,
  }))
  return mount(DashboardView, { global: { plugins: [pinia, router] } })
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorageMock.clear()
})

describe('DashboardView', () => {
  it('shows welcome message with the user first name', async () => {
    mockBookingsOk([])
    const wrapper = mountDashboard()
    expect(wrapper.text()).toContain('John')
  })

  it('shows loading state while fetching', () => {
    mockFetch.mockReturnValueOnce(new Promise(() => {}))
    const wrapper = mountDashboard()
    expect(wrapper.text()).toContain('Loading')
  })

  it('shows upcoming bookings count after loading', async () => {
    const bookings = [
      { id: 1, session_id: 10, session_title: 'Yoga', session_start_time: '2026-05-20T09:00:00Z', session_end_time: '2026-05-20T10:00:00Z', status: 'CONFIRMED' },
      { id: 2, session_id: 11, session_title: 'Pilates', session_start_time: '2026-05-21T09:00:00Z', session_end_time: '2026-05-21T10:00:00Z', status: 'CANCELLED' },
    ]
    mockBookingsOk(bookings)
    const wrapper = mountDashboard()
    await vi.waitUntil(() => !wrapper.text().includes('Loading'))
    expect(wrapper.text()).toContain('1')
  })

  it('shows next session title when there are upcoming bookings', async () => {
    const bookings = [
      { id: 1, session_id: 10, session_title: 'Morning Yoga', session_start_time: '2026-05-20T09:00:00Z', session_end_time: '2026-05-20T10:00:00Z', status: 'CONFIRMED' },
    ]
    mockBookingsOk(bookings)
    const wrapper = mountDashboard()
    await vi.waitUntil(() => !wrapper.text().includes('Loading'))
    expect(wrapper.text()).toContain('Morning Yoga')
  })

  it('shows empty state message when no upcoming bookings', async () => {
    mockBookingsOk([])
    const wrapper = mountDashboard()
    await vi.waitUntil(() => !wrapper.text().includes('Loading'))
    expect(wrapper.text()).toMatch(/no upcoming|book a session/i)
  })

  it('shows a link to browse sessions', async () => {
    mockBookingsOk([])
    const wrapper = mountDashboard()
    await vi.waitUntil(() => !wrapper.text().includes('Loading'))
    expect(wrapper.find('a[href="/member/sessions"]').exists()).toBe(true)
  })
})
