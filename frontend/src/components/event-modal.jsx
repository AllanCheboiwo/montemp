import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useStore } from '@/lib/store'
import { isoDateInput, isoTimeInput, parseDateTime } from '@/lib/date-utils'

export function EventModal({ open, onOpenChange, seed }) {
  const tags = useStore((s) => s.tags)
  const addEvent = useStore((s) => s.addEvent)
  const updateEvent = useStore((s) => s.updateEvent)
  const deleteEvent = useStore((s) => s.deleteEvent)

  const isEdit = seed?.mode === 'edit'
  const [title, setTitle] = useState('')
  const [tagId, setTagId] = useState('')
  const [dateStr, setDateStr] = useState('')
  const [startStr, setStartStr] = useState('')
  const [endStr, setEndStr] = useState('')
  const [notes, setNotes] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !seed) return
    const seedStart = seed.mode === 'edit' ? seed.event.start : seed.start || new Date()
    const seedEnd =
      seed.mode === 'edit' ? seed.event.end : seed.end || new Date(seedStart.getTime() + 3600000)

    setTitle(seed.mode === 'edit' ? seed.event.title : '')
    setTagId(seed.mode === 'edit' ? seed.event.tagId : '')
    setDateStr(isoDateInput(seedStart))
    setStartStr(isoTimeInput(seedStart))
    setEndStr(isoTimeInput(seedEnd))
    setNotes(seed.mode === 'edit' ? seed.event.notes || '' : '')
    setErr('')
  }, [open, seed, tags])

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) { setErr('Give the event a title.'); return }
    if (!tagId) { setErr('Pick a tag.'); return }
    const start = parseDateTime(dateStr, startStr)
    const end = parseDateTime(dateStr, endStr)
    if (end <= start) { setErr('End time must be after start time.'); return }
    setLoading(true)
    try {
      if (isEdit && seed?.mode === 'edit') {
        await updateEvent({ id: seed.event.id, title: title.trim(), tagId, start, end, notes: notes.trim() })
        toast.success('Event updated')
      } else {
        await addEvent({ title: title.trim(), tagId, start, end, notes: notes.trim() })
        toast.success('Event created')
      }
      onOpenChange(false)
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  const onDelete = async () => {
    if (!isEdit || seed?.mode !== 'edit') return
    setLoading(true)
    try {
      await deleteEvent(seed.event.id)
      toast.success('Event deleted')
      onOpenChange(false)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit event' : 'New event'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ev-title">Title</Label>
            <Input
              id="ev-title"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What are you doing?"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ev-tag">Tag</Label>
            <Select value={tagId} onValueChange={setTagId}>
              <SelectTrigger id="ev-tag">
                <SelectValue placeholder="Pick a tag" />
              </SelectTrigger>
              <SelectContent>
                {tags.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ev-date">Date</Label>
            <Input id="ev-date" type="date" value={dateStr} onChange={(e) => setDateStr(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ev-start">Start</Label>
              <Input id="ev-start" type="time" value={startStr} onChange={(e) => setStartStr(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ev-end">End</Label>
              <Input id="ev-end" type="time" value={endStr} onChange={(e) => setEndStr(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ev-notes">Notes</Label>
            <Textarea
              id="ev-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes"
            />
          </div>

          {err && <p className="text-xs text-destructive">{err}</p>}

          <DialogFooter className="gap-2 sm:gap-2">
            {isEdit && (
              <Button
                type="button"
                variant="ghost"
                className="mr-auto text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={onDelete}
                disabled={loading}
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                Delete
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving…' : isEdit ? 'Save' : 'Create event'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
