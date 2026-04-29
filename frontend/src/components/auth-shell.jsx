import { CalendarRange } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const SAMPLE_TAGS = [
  { id: '1', name: 'Work', color: '#6366f1' },
  { id: '2', name: 'Study', color: '#8b5cf6' },
  { id: '3', name: 'Exercise', color: '#10b981' },
  { id: '4', name: 'Meetings', color: '#f43f5e' },
  { id: '5', name: 'Personal', color: '#0ea5e9' },
]

export function AuthShell({ children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between border-r bg-muted/30 p-10 lg:flex">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <CalendarRange className="h-4 w-4" />
          </div>
          Tagtrack
        </div>

        <div className="max-w-md space-y-3">
          <h1 className="text-3xl font-semibold leading-tight">
            Track your time, by the things you care about.
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Add events to a calendar, tag each one, and see exactly where your
            hours go — by week, by month, or any custom range.
          </p>
          <div className="flex flex-wrap gap-2 pt-4">
            {SAMPLE_TAGS.map((t) => (
              <Badge
                key={t.id}
                variant="outline"
                className="font-medium"
                style={{
                  borderColor: t.color + '55',
                  backgroundColor: t.color + '15',
                  color: t.color,
                }}
              >
                <span
                  className="mr-1 inline-block h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: t.color }}
                />
                {t.name}
              </Badge>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Time logger · Tag your hours · See the breakdown
        </p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  )
}
