export const START_HOUR = 5
export const SLOT_COUNT = 36 // 05:00 – 23:00 in 30-minute slots

const pad = (n) => String(n).padStart(2, '0')

export function dateKey(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
export function parseKey(k) {
  const [y, m, d] = k.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export function addDays(d, n) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}
export function weekStart(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7)) // Monday
  return x
}
export const slotStartMin = (idx) => START_HOUR * 60 + idx * 30
export const fmtMin = (m) => `${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`
export const slotLabel = (idx) => `${fmtMin(slotStartMin(idx))}–${fmtMin(slotStartMin(idx) + 25)}`

export function slotStartDate(date, idx) {
  const d = parseKey(date)
  d.setMinutes(slotStartMin(idx))
  return d
}
export function slotEndDate(date, idx) {
  const d = slotStartDate(date, idx)
  d.setMinutes(d.getMinutes() + 30)
  return d
}
export function slotAt(d) {
  const i = Math.floor((d.getHours() * 60 + d.getMinutes() - START_HOUR * 60) / 30)
  return i >= 0 && i < SLOT_COUNT ? i : null
}
/** The slot that most recently ended (prompts fire right after a slot ends). */
export function lastEndedSlot(now = new Date()) {
  const t = new Date(now.getTime() - 5 * 60000)
  const idx = slotAt(t)
  return idx == null ? null : { date: dateKey(t), idx }
}
/** Latest calendar date on which slot `idx` has already ended. */
export function resolveEndedSlot(idx, now = new Date()) {
  let d = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (slotEndDate(dateKey(d), idx) > now) d = addDays(d, -1)
  return dateKey(d)
}
export const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
