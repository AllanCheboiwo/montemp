const pad = (n) => String(n).padStart(2, '0')

export function toSxDateTime(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function toSxDate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function fromSxDateTime(s) {
  const [datePart, timePart] = s.split(' ')
  const [y, m, d] = datePart.split('-').map(Number)
  const [hh, mm] = (timePart || '00:00').split(':').map(Number)
  return new Date(y, m - 1, d, hh, mm, 0, 0)
}

export function fromSxDate(s) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d, 0, 0, 0, 0)
}

export function startOfDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function endOfDay(d) {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

export function addDays(d, n) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

export function startOfWeek(d) {
  const x = startOfDay(d)
  x.setDate(x.getDate() - x.getDay())
  return x
}

export function endOfWeek(d) {
  return endOfDay(addDays(startOfWeek(d), 6))
}

export function startOfMonth(d) {
  const x = startOfDay(d)
  x.setDate(1)
  return x
}

export function endOfMonth(d) {
  const x = startOfDay(d)
  x.setMonth(x.getMonth() + 1, 0)
  return endOfDay(x)
}

export function hoursBetween(start, end) {
  return Math.max(0, (end.getTime() - start.getTime()) / 3600000)
}

export function fmtDate(d) {
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function fmtDateLong(d) {
  return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
}

export function isoDateInput(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function isoTimeInput(d) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function parseDateTime(dateStr, timeStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const [h, min] = timeStr.split(':').map(Number)
  return new Date(y, m - 1, d, h, min, 0, 0)
}
