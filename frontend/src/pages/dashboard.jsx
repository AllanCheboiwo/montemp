import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CalendarView } from '@/components/schedule-x-calendar'
import { EventModal } from '@/components/event-modal'
import { useStore } from '@/lib/store'

export default function DashboardPage() {
  const events = useStore((s) => s.events)
  const tags = useStore((s) => s.tags)
  const [seed, setSeed] = useState(null)
  const [open, setOpen] = useState(false)

  const onNew = (start) => {
    const s = start || new Date()
    const e = new Date(s.getTime() + 60 * 60 * 1000)
    setSeed({ mode: 'create', start: s, end: e })
    setOpen(true)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-6 py-3">
        <div>
          <h1 className="text-base font-semibold">Calendar</h1>
          <p className="text-xs text-muted-foreground">
            Click any empty slot to add an event. Click an event to edit.
          </p>
        </div>
        <Button onClick={() => onNew()}>
          <Plus className="mr-1 h-4 w-4" />
          New event
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden p-2">
        <CalendarView
          events={events}
          tags={tags}
          onEventClick={(ev) => { setSeed({ mode: 'edit', event: ev }); setOpen(true) }}
          onEmptySlotClick={(d) => onNew(d)}
        />
      </div>
      <EventModal open={open} onOpenChange={setOpen} seed={seed} />
    </div>
  )
}
