import { useEffect, useMemo, useRef, useState } from 'react'
import { ScheduleXCalendar, useNextCalendarApp } from '@schedule-x/react'
import {
  createViewDay,
  createViewWeek,
  createViewMonthGrid,
  createViewMonthAgenda,
} from '@schedule-x/calendar'
import { createEventsServicePlugin } from '@schedule-x/events-service'
import { createCalendarControlsPlugin } from '@schedule-x/calendar-controls'
import { fromSxDateTime, toSxDate, toSxDateTime } from '@/lib/date-utils'

function hexToRgba(hex, alpha) {
  const m = hex.replace('#', '')
  const bigint = parseInt(
    m.length === 3 ? m.split('').map((c) => c + c).join('') : m,
    16
  )
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function CalendarView({ events, tags, onEventClick, onEmptySlotClick }) {
  const eventsServiceRef = useRef(createEventsServicePlugin())
  const controlsRef = useRef(createCalendarControlsPlugin())

  const onEventClickRef = useRef(onEventClick)
  const onEmptyRef = useRef(onEmptySlotClick)
  const eventsRef = useRef(events)
  useEffect(() => {
    onEventClickRef.current = onEventClick
    onEmptyRef.current = onEmptySlotClick
    eventsRef.current = events
  })

  const calendars = useMemo(() => {
    const out = {}
    for (const tag of tags) {
      out[tag.id] = {
        colorName: tag.id,
        label: tag.name,
        lightColors: {
          main: tag.color,
          container: hexToRgba(tag.color, 0.18),
          onContainer: tag.color,
        },
        darkColors: {
          main: tag.color,
          container: hexToRgba(tag.color, 0.22),
          onContainer: tag.color,
        },
      }
    }
    return out
  }, [tags])

  const sxEvents = useMemo(
    () =>
      events.map((e) => ({
        id: e.id,
        title: e.title,
        start: toSxDateTime(e.start),
        end: toSxDateTime(e.end),
        calendarId: e.tagId,
        description: e.notes || '',
      })),
    [events]
  )

  const [isReady, setIsReady] = useState(false)

  const calendar = useNextCalendarApp({
    views: [
      createViewDay(),
      createViewWeek(),
      createViewMonthGrid(),
      createViewMonthAgenda(),
    ],
    defaultView: 'week',
    selectedDate: toSxDate(new Date()),
    events: sxEvents,
    calendars,
    isDark: true,
    plugins: [eventsServiceRef.current, controlsRef.current],
    callbacks: {
      onEventClick: (calendarEvent) => {
        const ev = eventsRef.current.find((x) => x.id === calendarEvent.id)
        if (ev) onEventClickRef.current(ev)
      },
      onClickDateTime: (dateTimeStr) => {
        onEmptyRef.current(fromSxDateTime(dateTimeStr))
      },
      onClickDate: (dateStr) => {
        onEmptyRef.current(fromSxDateTime(`${dateStr} 09:00`))
      },
    },
  })

  useEffect(() => {
    setIsReady(true)
  }, [])

  useEffect(() => {
    if (!isReady) return
    const svc = eventsServiceRef.current
    if (!svc?.set) return
    svc.set(sxEvents)
  }, [sxEvents, isReady])

  return (
    <div className="sx-react-calendar-wrapper h-full w-full">
      {calendar && <ScheduleXCalendar calendarApp={calendar} />}
    </div>
  )
}
