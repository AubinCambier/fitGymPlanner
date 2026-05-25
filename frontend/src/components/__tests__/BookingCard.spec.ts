import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import BookingCard from '../BookingCard.vue'
import type { Booking } from '@/api/bookings'

const confirmedBooking: Booking = {
  id: 1,
  session_id: 10,
  session_title: 'Morning Yoga',
  session_start_time: '2026-05-14T09:00:00Z',
  session_end_time: '2026-05-14T10:00:00Z',
  session_type_name: 'Yoga',
  status: 'CONFIRMED',
}

const cancelledBooking: Booking = {
  ...confirmedBooking,
  id: 2,
  status: 'CANCELLED',
}

describe('BookingCard', () => {
  it('displays session title', () => {
    const wrapper = mount(BookingCard, { props: { booking: confirmedBooking } })
    expect(wrapper.text()).toContain('Morning Yoga')
  })

  it('displays session type', () => {
    const wrapper = mount(BookingCard, { props: { booking: confirmedBooking } })
    expect(wrapper.text()).toContain('Yoga')
  })

  it('shows Cancel button when status is CONFIRMED', () => {
    const wrapper = mount(BookingCard, { props: { booking: confirmedBooking } })
    expect(wrapper.find('button').text()).toContain('Cancel')
  })

  it('shows Cancelled badge when status is CANCELLED', () => {
    const wrapper = mount(BookingCard, { props: { booking: cancelledBooking } })
    expect(wrapper.find('button').exists()).toBe(false)
    expect(wrapper.text()).toContain('Cancelled')
  })

  it('emits cancel event with booking id when Cancel is clicked', async () => {
    const wrapper = mount(BookingCard, { props: { booking: confirmedBooking } })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('cancel')).toBeTruthy()
    expect(wrapper.emitted('cancel')![0]).toEqual([confirmedBooking.id])
  })

  it('disables Cancel button when loading prop is true', () => {
    const wrapper = mount(BookingCard, { props: { booking: confirmedBooking, loading: true } })
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
  })

  it('displays formatted date', () => {
    const wrapper = mount(BookingCard, { props: { booking: confirmedBooking } })
    expect(wrapper.text()).toMatch(/Wed|Thu|Fri|Sat|14/)
  })
})
