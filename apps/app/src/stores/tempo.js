import { defineStore } from 'pinia'
import { supabase } from 'src/services/supabase'

const LS_KEY = 'tempo30:v1'
export const BLOCK_COLORS = ['#2F6FEB', '#E8743B', '#1F9D6E', '#9B51E0', '#D9A400', '#D8343F', '#12A4B6', '#6B7A8C']

export const DEFAULT_SETTINGS = {
  promptMode: 'both', // 'quick' | 'full' | 'both'
  notificationsEnabled: false,
  summaryTime: '18:00', // Friday
  planReminders: true
}

const rid = (kind, key) => `${kind}|${key}`
const nowIso = () => new Date().toISOString()
const EPOCH = '1970-01-01T00:00:00.000Z'

function seedBlocks() {
  const out = {}
  BLOCK_COLORS.forEach((color, i) => {
    out[rid('block', `b${i + 1}`)] = {
      kind: 'block', key: `b${i + 1}`, updatedAt: '1970-01-01T00:00:00.000Z', deleted: false, dirty: false,
      data: { name: `Block ${i + 1}`, color, order: i + 1, history: [{ name: `Block ${i + 1}`, from: EPOCH }] }
    }
  })
  return out
}

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(LS_KEY) || 'null')
    if (raw && raw.records) return raw
  } catch (e) { /* ignore corrupt cache */ }
  return { records: seedBlocks(), lastPull: null }
}

let syncTimer = null

export const useTempoStore = defineStore('tempo', {
  state: () => ({
    ...load(),
    user: null,
    syncing: false,
    syncError: ''
  }),

  getters: {
    settings: (s) => ({ ...DEFAULT_SETTINGS, ...(s.records[rid('settings', 'main')]?.data || {}) }),
    blocks: (s) =>
      Object.values(s.records)
        .filter((r) => r.kind === 'block' && !r.deleted)
        .map((r) => ({ id: r.key, ...r.data }))
        .sort((a, b) => a.order - b.order),
    /** Title a block carried at a given moment (ISO string), from its rename history. */
    titleAt() {
      return (blockId, atIso) => {
        const r = this.records[rid('block', blockId)]
        if (!r) return ''
        const hist = r.data.history?.length ? r.data.history : [{ name: r.data.name, from: EPOCH }]
        let title = hist[0].name
        for (const h of hist) if (h.from <= atIso) title = h.name
        return title
      }
    },
    /** Title to show for a logged slot: the snapshot taken when logged, else resolved from history. */
    slotTitle() {
      return (slot) => {
        if (!slot || !slot.blockId) return ''
        if (slot.title) return slot.title
        const at = slot.date ? `${slot.date}T23:59:59.999Z` : nowIso()
        return this.titleAt(slot.blockId, at) || this.blockById(slot.blockId)?.name || ''
      }
    },
    /** Past titles of a block (excluding the current one), oldest first, de-duplicated. */
    pastTitles() {
      return (blockId) => {
        const r = this.records[rid('block', blockId)]
        if (!r) return []
        const cur = r.data.name
        return [...new Set((r.data.history || []).map((h) => h.name))].filter((n) => n !== cur && !/^Block \d+$/.test(n))
      }
    },
    blockById() {
      const m = Object.fromEntries(this.blocks.map((b) => [b.id, b]))
      return (id) => m[id]
    },
    slot: (s) => (date, idx) => {
      const r = s.records[rid('slot', `${date}_${idx}`)]
      return r && !r.deleted ? r.data : null
    },
    planned: (s) => (date, idx) => {
      const r = s.records[rid('plan', `${date}_${idx}`)]
      return r && !r.deleted ? r.data : null
    },
    plannedList: (s) =>
      Object.values(s.records)
        .filter((r) => r.kind === 'plan' && !r.deleted)
        .map((r) => ({ key: r.key, ...r.data })),
    loggedDates: (s) => {
      const set = new Set()
      Object.values(s.records).forEach((r) => {
        if (r.kind === 'slot' && !r.deleted) set.add(r.data.date)
      })
      return [...set].sort()
    }
  },

  actions: {
    persist() {
      try {
        localStorage.setItem(LS_KEY, JSON.stringify({ records: this.records, lastPull: this.lastPull }))
      } catch (e) { /* storage full or unavailable */ }
    },
    put(kind, key, data) {
      this.records[rid(kind, key)] = { kind, key, data, updatedAt: nowIso(), deleted: false, dirty: true }
      this.afterWrite()
    },
    remove(kind, key) {
      const id = rid(kind, key)
      if (!this.records[id]) return
      this.records[id] = { ...this.records[id], deleted: true, updatedAt: nowIso(), dirty: true }
      this.afterWrite()
    },
    afterWrite() {
      this.persist()
      clearTimeout(syncTimer)
      syncTimer = setTimeout(() => this.sync(), 1500)
    },

    setSlot(date, idx, { kind, blockId = null, note = '' }) {
      // Snapshot the block title active now, so later renames never rewrite this log.
      const prev = this.slot(date, idx)
      const title = kind === 'focus' && blockId
        ? (prev && prev.blockId === blockId && prev.title ? prev.title : this.records[rid('block', blockId)]?.data.name || '')
        : ''
      this.put('slot', `${date}_${idx}`, { date, idx, kind, blockId, title, note: note.trim() })
    },
    clearSlot(date, idx) { this.remove('slot', `${date}_${idx}`) },
    setPlanned(date, idx, blockId) { this.put('plan', `${date}_${idx}`, { date, idx, blockId }) },
    clearPlanned(date, idx) { this.remove('plan', `${date}_${idx}`) },

    saveBlock(id, patch) {
      const cur = this.records[rid('block', id)]?.data || {}
      const next = { ...cur, ...patch }
      if (typeof patch.name === 'string') {
        const name = patch.name.trim()
        if (!name || name === cur.name) { next.name = cur.name } // ignore empty / unchanged titles
        else {
          next.name = name
          next.history = [...(cur.history?.length ? cur.history : [{ name: cur.name, from: EPOCH }]), { name, from: nowIso() }]
        }
      }
      this.put('block', id, next)
    },
    moveBlock(id, dir) {
      const list = this.blocks
      const i = list.findIndex((b) => b.id === id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= list.length) return
      const a = list[i], b = list[j]
      this.saveBlock(a.id, { order: b.order })
      this.saveBlock(b.id, { order: a.order })
    },
    saveSettings(patch) {
      this.put('settings', 'main', { ...this.settings, ...patch })
    },

    // ---------- auth + sync ----------
    async initAuth() {
      if (!supabase) return
      const { data } = await supabase.auth.getSession()
      this.user = data.session?.user || null
      supabase.auth.onAuthStateChange((_evt, session) => {
        this.user = session?.user || null
        if (this.user) this.sync()
      })
      if (this.user) this.sync()
    },
    async signIn(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
    },
    async signUp(email, password) {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
      return data
    },
    async signOut() {
      await supabase.auth.signOut()
      this.records = seedBlocks()
      this.lastPull = null
      this.persist()
    },
    async sync() {
      if (!supabase || !this.user || this.syncing) return
      this.syncing = true
      this.syncError = ''
      try {
        // push
        const dirty = Object.entries(this.records).filter(([, r]) => r.dirty)
        if (dirty.length) {
          const rows = dirty.map(([, r]) => ({
            user_id: this.user.id, kind: r.kind, key: r.key, data: r.data, updated_at: r.updatedAt, deleted: r.deleted
          }))
          for (let i = 0; i < rows.length; i += 500) {
            const { error } = await supabase.from('records').upsert(rows.slice(i, i + 500), { onConflict: 'user_id,kind,key' })
            if (error) throw error
          }
          dirty.forEach(([id, r]) => {
            if (this.records[id].updatedAt === r.updatedAt) this.records[id].dirty = false
          })
        }
        // pull
        let q = supabase.from('records').select('kind,key,data,updated_at,deleted,synced_at').order('synced_at', { ascending: true }).limit(2000)
        if (this.lastPull) q = q.gte('synced_at', this.lastPull)
        const { data, error } = await q
        if (error) throw error
        for (const row of data) {
          const id = rid(row.kind, row.key)
          const local = this.records[id]
          if (!local || new Date(row.updated_at) > new Date(local.updatedAt)) {
            this.records[id] = { kind: row.kind, key: row.key, data: row.data, updatedAt: row.updated_at, deleted: row.deleted, dirty: false }
          }
          this.lastPull = row.synced_at
        }
        this.persist()
      } catch (e) {
        this.syncError = e.message || 'Sync failed'
      } finally {
        this.syncing = false
      }
    }
  }
})
