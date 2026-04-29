import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useStore } from '@/lib/store'
import { TAG_PALETTE } from '@/lib/types'
import { cn } from '@/lib/utils'

export function TagModal({ open, onOpenChange }) {
  const addTag = useStore((s) => s.addTag)
  const [name, setName] = useState('')
  const [color, setColor] = useState(TAG_PALETTE[0])
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setName('')
    setColor(TAG_PALETTE[Math.floor(Math.random() * TAG_PALETTE.length)])
    setErr('')
  }, [open])

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) { setErr('Give the tag a name.'); return }
    setLoading(true)
    try {
      await addTag({ name: name.trim(), color })
      toast.success(`Tag "${name.trim()}" created`)
      onOpenChange(false)
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New tag</DialogTitle>
          <DialogDescription>
            Tags categorize events so summaries can group hours by activity.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="tag-name">Name</Label>
            <Input
              id="tag-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Side project"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="grid grid-cols-6 gap-2">
              {TAG_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    'h-9 w-full rounded-md border-2 transition',
                    color === c ? 'border-foreground' : 'border-transparent hover:border-border'
                  )}
                  style={{ backgroundColor: c }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>

          <div className="rounded-md border bg-muted/30 p-3">
            <div className="mb-2 text-xs text-muted-foreground">Preview</div>
            <Badge
              variant="outline"
              style={{
                borderColor: color + '55',
                backgroundColor: color + '15',
                color,
              }}
            >
              <span className="mr-1 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
              {name || 'Tag name'}
            </Badge>
          </div>

          {err && <p className="text-xs text-destructive">{err}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating…' : 'Create tag'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
