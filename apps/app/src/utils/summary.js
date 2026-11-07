import { SLOT_COUNT, addDays, dateKey, slotEndDate, DAY_NAMES } from './time'

const PRODUCTIVE = new Set(['focus', 'goal', 'productive'])

/** Summarise the 7 days starting at `ws` (a Monday). Each slot = 0.5h. Future slots are ignored. */
export function summarize(store, ws, now = new Date()) {
  let productive = 0, passing = 0, unlogged = 0, goal = 0
  const perBlock = {}
  const perDay = []
  for (let d = 0; d < 7; d++) {
    const date = dateKey(addDays(ws, d))
    const day = { label: DAY_NAMES[d], date, productive: 0, passing: 0, unlogged: 0 }
    for (let idx = 0; idx < SLOT_COUNT; idx++) {
      if (slotEndDate(date, idx) > now) continue
      const s = store.slot(date, idx)
      if (!s) { day.unlogged += 0.5; unlogged += 0.5; continue }
      if (s.kind === 'passing') { day.passing += 0.5; passing += 0.5; continue }
      day.productive += 0.5; productive += 0.5
      if (s.kind === 'goal') goal += 0.5
      if (s.kind === 'focus' && s.blockId) {
        const title = store.slotTitle(s)
        const k = `${s.blockId}|${title}`
        perBlock[k] = perBlock[k] || { blockId: s.blockId, title, hours: 0 }
        perBlock[k].hours += 0.5
      }
    }
    perDay.push(day)
  }
  // One row per (block, title): a renamed block shows its old and new titles separately.
  const used = Object.values(perBlock)
  const blocks = []
  store.blocks.forEach((b) => {
    const rows = used.filter((u) => u.blockId === b.id)
    if (!rows.some((r) => r.title === b.name)) rows.push({ blockId: b.id, title: b.name, hours: 0 })
    rows.forEach((r) => blocks.push({ ...b, id: `${b.id}|${r.title}`, name: r.title, hours: r.hours, past: r.title !== b.name }))
  })
  return { productive, passing, unlogged, goal, blocks, perDay }
}

export const fmtH = (h) => (Number.isInteger(h) ? `${h}h` : `${h.toFixed(1)}h`)

export function summaryText(sum, rangeLabel) {
  const lines = [`My week (${rangeLabel})`, `Productive ${fmtH(sum.productive)} · Passing time ${fmtH(sum.passing)} · Unlogged ${fmtH(sum.unlogged)}`]
  sum.blocks.filter((b) => b.hours > 0).forEach((b) => lines.push(`${b.order}. ${b.name}: ${fmtH(b.hours)}`))
  if (sum.goal) lines.push(`Goal-driven: ${fmtH(sum.goal)}`)
  return lines.join('\n')
}
