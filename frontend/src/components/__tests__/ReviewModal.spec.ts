import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ReviewModal from '../ReviewModal.vue'
import * as reviewsApi from '@/api/reviews'

vi.mock('@/api/reviews', () => ({
  apiCreateReview: vi.fn(),
  apiUpdateReview: vi.fn(),
}))

const sampleReview = {
  id: 1, booking_id: 5, member_id: 3, coach_id: 2,
  rating: 4, comment: 'Great session!', is_anonymous: false,
  created_at: '2026-05-18T10:00:00Z', updated_at: '2026-05-18T10:00:00Z',
}

function mountModal(overrides: Partial<InstanceType<typeof ReviewModal>['$props']> = {}) {
  return mount(ReviewModal, {
    props: { bookingId: 5, sessionTitle: 'Morning Yoga', ...overrides },
    global: { stubs: { RouterLink: true } },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ReviewModal', () => {
  it('renders session title', () => {
    const wrapper = mountModal()
    expect(wrapper.text()).toContain('Morning Yoga')
  })

  it('renders 5 star buttons', () => {
    const wrapper = mountModal()
    const stars = wrapper.findAll('.star')
    expect(stars).toHaveLength(5)
  })

  it('emits cancel when Cancel button clicked', async () => {
    const wrapper = mountModal()
    await wrapper.find('.btn-cancel').trigger('click')
    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('Submit button is disabled when no star selected', () => {
    const wrapper = mountModal()
    expect(wrapper.find('.btn-submit').attributes('disabled')).toBeDefined()
  })

  it('selects rating when star is clicked', async () => {
    const wrapper = mountModal()
    const stars = wrapper.findAll('.star')
    await stars[2]!.trigger('click')
    expect(wrapper.find('.btn-submit').attributes('disabled')).toBeUndefined()
  })

  it('emits submitted after successful create', async () => {
    vi.mocked(reviewsApi.apiCreateReview).mockResolvedValue(sampleReview)
    const wrapper = mountModal()
    const stars = wrapper.findAll('.star')
    await stars[3]!.trigger('click')
    await wrapper.find('.btn-submit').trigger('click')
    await vi.waitFor(() => expect(wrapper.emitted('submitted')).toBeTruthy())
    expect(wrapper.emitted('submitted')![0]).toEqual([sampleReview])
  })

  it('calls apiUpdateReview when existingReview is provided', async () => {
    const updated = { ...sampleReview, rating: 5 }
    vi.mocked(reviewsApi.apiUpdateReview).mockResolvedValue(updated)
    const wrapper = mountModal({ existingReview: sampleReview })
    const stars = wrapper.findAll('.star')
    await stars[4]!.trigger('click')
    await wrapper.find('.btn-submit').trigger('click')
    await vi.waitFor(() => expect(reviewsApi.apiUpdateReview).toHaveBeenCalled())
    expect(reviewsApi.apiUpdateReview).toHaveBeenCalledWith(1, expect.objectContaining({ rating: 5 }))
  })

  it('pre-fills stars and comment when existingReview provided', () => {
    const wrapper = mountModal({ existingReview: sampleReview })
    const textarea = wrapper.find('textarea')
    expect((textarea.element as HTMLTextAreaElement).value).toBe('Great session!')
    const filledStars = wrapper.findAll('.star.filled')
    expect(filledStars).toHaveLength(4)
  })

  it('toggles anonymous checkbox', async () => {
    const wrapper = mountModal()
    const checkbox = wrapper.find('input[type="checkbox"]')
    expect((checkbox.element as HTMLInputElement).checked).toBe(false)
    await checkbox.setValue(true)
    expect((checkbox.element as HTMLInputElement).checked).toBe(true)
  })
})
