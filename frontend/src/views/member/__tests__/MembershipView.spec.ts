import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import MembershipView from '../MembershipView.vue'

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
  routes: [{ path: '/', component: MembershipView }],
})

function mockOk(data: unknown) {
  mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ status: 'success', data }) })
}
function mock404() {
  mockFetch.mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({ status: 'error', message: 'Not found' }) })
}

const pricingPlans = [
  { id: 1, label: 'Monthly Pass', payment_mode: 'MONTHLY', price: '29.99', currency: 'EUR', is_active: true, created_at: '' },
  { id: 2, label: 'Pay Per Session', payment_mode: 'PAY_PER_SESSION', price: '9.99', currency: 'EUR', is_active: true, created_at: '' },
]

const activeMembership = {
  id: 1, member_id: 10, pricing_id: 1, payment_mode: 'MONTHLY',
  status: 'ACTIVE', start_date: '2026-05-01', end_date: null, created_at: '', updated_at: '',
}

function mountView() {
  const pinia = createPinia()
  setActivePinia(pinia)
  localStorageMock.setItem('token', 'test-token')
  localStorageMock.setItem('user', JSON.stringify({
    id: 10, email: 'john@test.com', role: 'MEMBER',
    first_name: 'John', last_name: 'Doe', is_active: true,
  }))
  return mount(MembershipView, { global: { plugins: [pinia, router] } })
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorageMock.clear()
})

describe('MembershipView — no active membership', () => {
  it('shows available plans when no membership', async () => {
    mock404()
    mockOk(pricingPlans)
    const wrapper = mountView()
    await vi.waitUntil(() => !wrapper.text().includes('Loading'))
    expect(wrapper.text()).toContain('Monthly Pass')
    expect(wrapper.text()).toContain('Pay Per Session')
  })

  it('shows subscribe button for each plan', async () => {
    mock404()
    mockOk(pricingPlans)
    const wrapper = mountView()
    await vi.waitUntil(() => !wrapper.text().includes('Loading'))
    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBeGreaterThanOrEqual(pricingPlans.length)
  })
})

describe('MembershipView — active membership', () => {
  it('shows current membership status', async () => {
    mockOk(activeMembership)
    const wrapper = mountView()
    await vi.waitUntil(() => !wrapper.text().includes('Loading'))
    expect(wrapper.text()).toContain('ACTIVE')
  })

  it('shows start date', async () => {
    mockOk(activeMembership)
    const wrapper = mountView()
    await vi.waitUntil(() => !wrapper.text().includes('Loading'))
    expect(wrapper.text()).toContain('2026')
  })

  it('shows a cancel button', async () => {
    mockOk(activeMembership)
    const wrapper = mountView()
    await vi.waitUntil(() => !wrapper.text().includes('Loading'))
    expect(wrapper.find('button').exists()).toBe(true)
    expect(wrapper.text()).toMatch(/cancel/i)
  })
})
