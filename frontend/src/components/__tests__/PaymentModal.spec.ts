import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import PaymentModal from '../PaymentModal.vue'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

function mountModal(amount = 8, description = 'Session booking: Yoga') {
  return mount(PaymentModal, { props: { amount, description } })
}

async function fillForm(wrapper: ReturnType<typeof mountModal>) {
  const inputs = wrapper.findAll('input')
  await inputs[0].setValue('1234567890123456')
  await inputs[0].trigger('input')
  await inputs[1].setValue('12/27')
  await inputs[2].setValue('123')
  await inputs[3].setValue('John Doe')
}

describe('PaymentModal', () => {
  it('renders amount and description', () => {
    const wrapper = mountModal(12.5, 'Monthly membership')
    expect(wrapper.text()).toContain('€12.50')
    expect(wrapper.text()).toContain('Monthly membership')
  })

  it('emits cancel when Cancel button is clicked', async () => {
    const wrapper = mountModal()
    await wrapper.find('.btn-cancel').trigger('click')
    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('Pay button is disabled when form is empty', () => {
    const wrapper = mountModal()
    expect(wrapper.find('.btn-pay').attributes('disabled')).toBeDefined()
  })

  it('shows processing state after clicking Pay, then emits success', async () => {
    const wrapper = mountModal()
    await fillForm(wrapper)
    await wrapper.find('.btn-pay').trigger('click')

    expect(wrapper.text()).toContain('Processing')

    vi.advanceTimersByTime(2000)
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Payment confirmed')

    vi.advanceTimersByTime(800)
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('success')).toBeTruthy()
  })

  it('does not emit cancel after processing starts', async () => {
    const wrapper = mountModal()
    await fillForm(wrapper)
    await wrapper.find('.btn-pay').trigger('click')
    await wrapper.find('.overlay').trigger('click')
    expect(wrapper.emitted('cancel')).toBeFalsy()
  })
})
