import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { SLOT_COUNT, START_HOUR, slotLabel, slotStartDate, parseKey, dateKey, addDays } from 'src/utils/time'

export const isNative = Capacitor.isNativePlatform()

const ID_PROMPT = 1000 // 36 daily repeating prompts
const ID_SUMMARY = 2000 // weekly Friday summary
const ID_PLAN = 3000 // up to 20 one-off reminders for pre-blocked slots (iOS caps pending at 64)

export async function requestPermission() {
  if (isNative) return (await LocalNotifications.requestPermissions()).display === 'granted'
  if (!('Notification' in window)) return false
  return (await Notification.requestPermission()) === 'granted'
}

export function webNotify(title, body) {
  if (!isNative && 'Notification' in window && Notification.permission === 'granted' && document.hidden) {
    new Notification(title, { body })
  }
}

export function initNative(onPerform) {
  if (!isNative) return
  LocalNotifications.addListener('localNotificationActionPerformed', (ev) => {
    onPerform(ev.actionId, ev.notification.extra || {})
  })
}

/** Rebuild every scheduled notification from current settings + plans. Native only. */
export async function reschedule(store) {
  if (!isNative) return
  const s = store.settings
  const pending = await LocalNotifications.getPending()
  if (pending.notifications.length) {
    await LocalNotifications.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) })
  }
  if (!s.notificationsEnabled) return

  const quick = s.promptMode !== 'full'
  await LocalNotifications.registerActionTypes({
    types: [{
      id: 'LOG_QUICK',
      actions: [
        { id: 'productive', title: 'Productive', foreground: true },
        { id: 'passing', title: 'Passing time', foreground: true }
      ]
    }]
  })

  const list = []
  for (let idx = 0; idx < SLOT_COUNT; idx++) {
    const endMin = START_HOUR * 60 + (idx + 1) * 30
    const n = {
      id: ID_PROMPT + idx,
      title: 'How were the last 30 minutes?',
      body: slotLabel(idx),
      schedule: { on: { hour: Math.floor(endMin / 60) % 24, minute: endMin % 60 }, allowWhileIdle: true },
      extra: { type: 'prompt', idx }
    }
    if (quick) n.actionTypeId = 'LOG_QUICK'
    list.push(n)
  }

  const [hh, mm] = s.summaryTime.split(':').map(Number)
  list.push({
    id: ID_SUMMARY,
    title: 'Your week in time',
    body: 'See where your hours went this week.',
    schedule: { on: { weekday: 6, hour: hh, minute: mm }, allowWhileIdle: true }, // 6 = Friday
    extra: { type: 'summary' }
  })

  if (s.planReminders) {
    const now = new Date()
    const horizon = addDays(now, 7)
    store.plannedList
      .map((p) => ({ ...p, at: slotStartDate(p.date, p.idx) }))
      .filter((p) => p.at > now && p.at < horizon)
      .sort((a, b) => a.at - b.at)
      .slice(0, 20)
      .forEach((p, i) => {
        const b = store.blockById(p.blockId)
        list.push({
          id: ID_PLAN + i,
          title: b ? `Focus block ${b.order}: ${b.name}` : 'Planned focus block',
          body: `Starting now (${slotLabel(p.idx)})`,
          schedule: { at: p.at, allowWhileIdle: true },
          extra: { type: 'plan', date: p.date, idx: p.idx }
        })
      })
  }
  await LocalNotifications.schedule({ notifications: list })
}

/** Web / foreground ticker: fires at :00 and :30. */
export function startTicker(onTick) {
  let last = ''
  const t = setInterval(() => {
    const n = new Date()
    const k = `${n.getDate()}-${n.getHours()}:${n.getMinutes()}`
    if (k !== last && n.getMinutes() % 30 === 0) {
      last = k
      onTick(n)
    }
  }, 15000)
  return () => clearInterval(t)
}

export { parseKey, dateKey }
