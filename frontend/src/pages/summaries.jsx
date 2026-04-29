import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useStore } from '@/lib/store'
import {
  addDays, endOfDay, endOfMonth, endOfWeek, fmtDate,
  hoursBetween, isoDateInput, parseDateTime, startOfDay,
  startOfMonth, startOfWeek,
} from '@/lib/date-utils'
import { cn } from '@/lib/utils'

const PRESETS = [
  { id: 'today', label: 'Today', range: () => ({ from: startOfDay(new Date()), to: endOfDay(new Date()) }) },
  { id: 'week', label: 'This week', range: () => ({ from: startOfWeek(new Date()), to: endOfWeek(new Date()) }) },
  { id: 'last7', label: 'Last 7 days', range: () => ({ from: startOfDay(addDays(new Date(), -6)), to: endOfDay(new Date()) }) },
  { id: 'month', label: 'This month', range: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
  { id: 'last30', label: 'Last 30 days', range: () => ({ from: startOfDay(addDays(new Date(), -29)), to: endOfDay(new Date()) }) },
  { id: 'custom', label: 'Custom', range: () => null },
]

export default function SummariesPage() {
  const events = useStore((s) => s.events)
  const fetchSummary = useStore((s) => s.fetchSummary)
  const [preset, setPreset] = useState('last7')
  const initial = PRESETS.find((p) => p.id === 'last7').range()
  const [from, setFrom] = useState(initial.from)
  const [to, setTo] = useState(initial.to)
  const [summaryData, setSummaryData] = useState([])

  useEffect(() => {
    fetchSummary(from, to)
      .then(setSummaryData)
      .catch(() => setSummaryData([]))
  }, [from, to])

  const applyPreset = (id) => {
    setPreset(id)
    const p = PRESETS.find((x) => x.id === id)
    const r = p?.range()
    if (r) { setFrom(r.from); setTo(r.to) }
  }

  const filtered = useMemo(
    () => events.filter((ev) => ev.end >= from && ev.start <= to),
    [events, from, to]
  )

  const tagTotals = useMemo(() =>
    summaryData
      .map((s) => ({
        tag: { id: String(s.tag_id), name: s.tag_name, color: s.tag_color },
        hours: Number(s.total_hours),
      }))
      .sort((a, b) => b.hours - a.hours),
    [summaryData]
  )

  const totalHours = tagTotals.reduce((s, x) => s + x.hours, 0)
  const totalEvents = filtered.length
  const topTag = tagTotals[0]?.hours > 0 ? tagTotals[0].tag : null
  const daysInRange = Math.max(1, Math.ceil(hoursBetween(from, to) / 24))
  const avgPerDay = totalHours / daysInRange

  const pieData = tagTotals
    .filter((x) => x.hours > 0)
    .map((x) => ({ name: x.tag.name, value: Number(x.hours.toFixed(2)), color: x.tag.color, tagId: x.tag.id }))

  const dayBuckets = useMemo(() => {
    const buckets = []
    let cursor = startOfDay(from)
    while (cursor <= to) {
      const ds = startOfDay(cursor)
      const de = endOfDay(cursor)
      const total = filtered.reduce((sum, ev) => {
        const cs = new Date(Math.max(ev.start.getTime(), ds.getTime(), from.getTime()))
        const ce = new Date(Math.min(ev.end.getTime(), de.getTime(), to.getTime()))
        return sum + hoursBetween(cs, ce)
      }, 0)
      buckets.push({ date: cursor.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), hours: Number(total.toFixed(2)) })
      cursor = addDays(cursor, 1)
    }
    return buckets
  }, [filtered, from, to])

  const pieConfig = useMemo(() => {
    const cfg = {}
    tagTotals.forEach(({ tag }) => { cfg[tag.id] = { label: tag.name, color: tag.color } })
    return cfg
  }, [tagTotals])

  const barConfig = { hours: { label: 'Hours', color: 'var(--primary)' } }

  return (
    <div className="h-full overflow-auto">
      <div className="border-b px-6 py-4">
        <div className="mb-4">
          <h1 className="text-base font-semibold">Summaries</h1>
          <p className="text-xs text-muted-foreground">Total hours by tag for the selected date range.</p>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => applyPreset(p.id)}
                className={cn(
                  'rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
                  preset === p.id
                    ? 'border-primary/40 bg-primary/15 text-primary'
                    : 'border-border bg-background text-muted-foreground hover:text-foreground'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex items-end gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="from">From</Label>
              <Input id="from" type="date" value={isoDateInput(from)}
                onChange={(e) => { setFrom(parseDateTime(e.target.value, '00:00')); setPreset('custom') }} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="to">To</Label>
              <Input id="to" type="date" value={isoDateInput(to)}
                onChange={(e) => { setTo(endOfDay(parseDateTime(e.target.value, '00:00'))); setPreset('custom') }} />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Total hours" value={totalHours.toFixed(1)} sub="hrs in range" />
          <StatCard label="Events" value={String(totalEvents)} sub="events tracked" />
          <StatCard label="Top tag" value={topTag ? topTag.name : '—'}
            sub={topTag ? `${tagTotals[0].hours.toFixed(1)} hrs` : 'no events in range'} accent={topTag?.color} />
          <StatCard label="Avg / day" value={avgPerDay.toFixed(1)} sub={`${daysInRange} day${daysInRange === 1 ? '' : 's'}`} />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Hours per tag</CardTitle>
              <CardDescription>Share of total tracked time</CardDescription>
            </CardHeader>
            <CardContent>
              {pieData.length === 0 ? <Empty>No events in this range.</Empty> : (
                <ChartContainer config={pieConfig} className="mx-auto aspect-square max-h-[260px]">
                  <PieChart>
                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel formatter={(v) => `${v} hrs`} />} />
                    <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2} strokeWidth={2}>
                      {pieData.map((d) => <Cell key={d.tagId} fill={d.color} />)}
                    </Pie>
                  </PieChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Hours per day</CardTitle>
              <CardDescription>{fmtDate(from)} – {fmtDate(to)}</CardDescription>
            </CardHeader>
            <CardContent>
              {dayBuckets.length === 0 ? <Empty>No events in this range.</Empty> : (
                <ChartContainer config={barConfig} className="h-[260px] w-full">
                  <BarChart data={dayBuckets}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickLine={false} tickMargin={8} axisLine={false}
                      interval={Math.max(0, Math.floor(dayBuckets.length / 12))} />
                    <YAxis tickLine={false} axisLine={false} width={32} />
                    <ChartTooltip cursor={{ fill: 'var(--muted)' }} content={<ChartTooltipContent formatter={(v) => `${v} hrs`} />} />
                    <Bar dataKey="hours" fill="var(--color-hours)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tag breakdown</CardTitle>
            <CardDescription>Sorted by total hours, highest first</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tag</TableHead>
                  <TableHead className="text-right">Events</TableHead>
                  <TableHead className="text-right">Hours</TableHead>
                  <TableHead>Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tagTotals.map(({ tag, hours }) => {
                  const evCount = filtered.filter((e) => e.tagId === tag.id).length
                  const pct = totalHours > 0 ? (hours / totalHours) * 100 : 0
                  return (
                    <TableRow key={tag.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tag.color }} />
                          <span>{tag.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{evCount}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{hours.toFixed(1)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: tag.color }} />
                          </div>
                          <span className="w-10 text-right text-xs text-muted-foreground tabular-nums">{pct.toFixed(0)}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {tagTotals.every((x) => x.hours === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">No events in this range.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, accent }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        <div className="mt-1 flex items-baseline gap-2">
          {accent && <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: accent }} />}
          <div className="text-2xl font-semibold tabular-nums">{value}</div>
        </div>
        {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  )
}

function Empty({ children }) {
  return (
    <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
      {children}
    </div>
  )
}
