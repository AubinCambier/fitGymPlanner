import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import ProfileView from '../ProfileView.vue'

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
  routes: [{ path: '/', component: ProfileView }],
})

const userData = {
  id: 1, email: 'john@test.com', role: 'MEMBER',
  first_name: 'John', last_name: 'Doe', is_active: true,
}

function mockOk(data: unknown) {
  mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ status: 'success', data }) })
}

function mountView() {
  const pinia = createPinia()
  setActivePinia(pinia)
  localStorageMock.setItem('token', 'test-token')
  localStorageMock.setItem('user', JSON.stringify(userData))
  return mount(ProfileView, { global: { plugins: [pinia, router] } })
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorageMock.clear()
})

describe('ProfileView', () => {
  it('shows user first name pre-filled in the form', () => {
    const wrapper = mountView()
    const input = wrapper.find('input[name="firstName"]')
    expect((input.element as HTMLInputElement).value).toBe('John')
  })

  it('shows user last name pre-filled', () => {
    const wrapper = mountView()
    const input = wrapper.find('input[name="lastName"]')
    expect((input.element as HTMLInputElement).value).toBe('Doe')
  })

  it('shows user email pre-filled', () => {
    const wrapper = mountView()
    const input = wrapper.find('input[name="email"]')
    expect((input.element as HTMLInputElement).value).toBe('john@test.com')
  })

  it('shows a save button', () => {
    const wrapper = mountView()
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
  })

  it('calls apiUpdateProfile on submit and shows success message', async () => {
    const updated = { ...userData, first_name: 'Jane' }
    mockOk(updated)
    const wrapper = mountView()
    await wrapper.find('form').trigger('submit')
    await vi.waitUntil(() => wrapper.text().includes('saved') || wrapper.text().includes('updated') || wrapper.text().includes('success'), { timeout: 2000 })
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/me'),
      expect.objectContaining({ method: 'PUT' })
    )
  })
})
