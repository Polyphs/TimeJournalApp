import { DAY_NAMES, fmtMin, parseKey, slotStartMin } from './time'

export const cellKey = (date, idx) => `${date}|${idx}`
export function parseCell(k) {
  const i = k.lastIndexOf('|')
  return { date: k.slice(0, i), idx: Number(k.slice(i + 1)) }
}

/** Keys of every cell in the rectangle between two cells. `dates` lists the visible dates in column order. */
export function rectKeys(a, b, dates) {
  const i0 = dates.indexOf(a.date), i1 = dates.indexOf(b.date)
  if (i0 < 0 || i1 < 0) return [cellKey(b.date, b.idx)]
  const d0 = Math.min(i0, i1), d1 = Math.max(i0, i1)
  const s0 = Math.min(a.idx, b.idx), s1 = Math.max(a.idx, b.idx)
  const out = []
  for (let d = d0; d <= d1; d++) for (let s = s0; s <= s1; s++) out.push(cellKey(dates[d], s))
  return out
}

/** Selected keys as slots, sorted by date then time. */
export function toSlots(keys) {
  return Array.from(keys).map(parseCell).sort((x, y) => (x.date < y.date ? -1 : x.date > y.date ? 1 : x.idx - y.idx))
}

/** Human lines for a set of slots, e.g. ["Mon, 9 Nov · 09:00–12:00"]. Consecutive slots on a day merge into one range. */
export function describeSlots(slots) {
  const byDate = new Map()
  slots.forEach((s) => { if (!byDate.has(s.date)) byDate.set(s.date, []); byDate.get(s.date).push(s.idx) })
  const lines = []
  for (const [date, list] of byDate) {
    const idxs = Array.from(new Set(list)).sort((a, b) => a - b)
    const d = parseKey(date)
    const day = `${DAY_NAMES[(d.getDay() + 6) % 7]}, ${d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`
    const ranges = []
    let start = idxs[0], prev = idxs[0]
    for (let i = 1; i <= idxs.length; i++) {
      if (idxs[i] === prev + 1) { prev = idxs[i]; continue }
      ranges.push(`${fmtMin(slotStartMin(start))}–${fmtMin(slotStartMin(prev) + 30)}`)
      start = prev = idxs[i]
    }
    lines.push(`${day} · ${ranges.join(', ')}`)
  }
  return lines
}
