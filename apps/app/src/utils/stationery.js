// Journal stationery: a small text format (JSON, or a block of CSS declarations) that styles the writing area.
// No image files are stored. A background image is allowed only as a link inside the text: url(https://...).
const PAPER_KEYS = [
  'background', 'backgroundColor', 'backgroundImage', 'backgroundSize', 'backgroundRepeat', 'backgroundPosition',
  'color', 'fontFamily', 'fontSize', 'lineHeight', 'letterSpacing', 'paddingLeft'
]
const kebab = (k) => k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())
const BY_KEBAB = Object.fromEntries(PAPER_KEYS.map((k) => [kebab(k), k]))
const BAD = /[{}<>;\\]|@import|expression\s*\(|javascript:|behavior\s*:|-moz-binding/i

function checkValue(key, v) {
  if (typeof v !== 'string' || !v.trim()) return `${key}: must be text`
  if (v.length > 600) return `${key}: too long`
  if (BAD.test(v)) return `${key}: contains something that is not allowed`
  const urls = v.match(/url\(/gi) || []
  const good = Array.from(v.matchAll(/url\(\s*(['"]?)https:\/\/[^'")\s]+\1\s*\)/gi))
  if (urls.length !== good.length) return `${key}: images must be a link like url(https://example.com/paper.jpg)`
  if (typeof CSS !== 'undefined' && CSS.supports && !CSS.supports(kebab(key), v)) return `${key}: "${v.slice(0, 40)}" is not a valid value`
  return ''
}

const slug = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40)

export function normalizeStationery(obj) {
  const errors = []
  const warnings = []
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return { ok: false, errors: ['Expected an object with a name and paper styles.'], warnings, value: null }
  const name = String(obj.name || '').trim().slice(0, 60) || 'Untitled paper'
  const src = obj.paper && typeof obj.paper === 'object' ? obj.paper : obj
  const paper = {}
  Object.keys(src).forEach((k) => {
    const key = PAPER_KEYS.includes(k) ? k : BY_KEBAB[k]
    if (!key) { if (!['id', 'name', 'paper', 'version', 'author'].includes(k)) warnings.push(`Ignored "${k}"`); return }
    const e = checkValue(key, src[key] ?? src[k])
    if (e) errors.push(e)
    else paper[key] = String(src[key] ?? src[k]).trim()
  })
  if (!Object.keys(paper).length && !errors.length) errors.push('No paper styles found. Use keys like backgroundColor, backgroundImage and color.')
  const id = slug(obj.id) || slug(name) || 'paper'
  return { ok: errors.length === 0, errors, warnings, value: { id, name, paper } }
}

/** Accepts JSON, or CSS declarations (optionally inside a rule, with an optional `/* name: My paper *\/` comment). */
export function parseStationery(text) {
  const t = String(text || '').trim()
  if (!t) return { ok: false, errors: ['Paste some JSON or CSS first.'], warnings: [], value: null }
  if (t.length > 8000) return { ok: false, errors: ['That is too long for a piece of stationery.'], warnings: [], value: null }
  if (t.startsWith('{')) {
    let obj
    try { obj = JSON.parse(t) } catch (e) { return { ok: false, errors: ['That is not valid JSON: ' + e.message], warnings: [], value: null } }
    return normalizeStationery(obj)
  }
  const nameMatch = /\/\*\s*name\s*:\s*([^*]+?)\s*\*\//i.exec(t)
  let css = t.replace(/\/\*[\s\S]*?\*\//g, '')
  const brace = /\{([\s\S]*)\}/.exec(css)
  if (brace) css = brace[1]
  const obj = { name: nameMatch ? nameMatch[1] : 'Imported paper' }
  css.split(';').forEach((decl) => {
    const i = decl.indexOf(':')
    if (i < 0) return
    const prop = decl.slice(0, i).trim().toLowerCase()
    const val = decl.slice(i + 1).trim()
    if (!prop || !val) return
    obj[BY_KEBAB[prop] || prop] = val
  })
  return normalizeStationery(obj)
}

/** Vue style object for a paper. */
export function toStyle(paper = {}) {
  const out = {}
  if (paper.background) out.background = paper.background
  else out.backgroundColor = '#FFFFFF'
  out.color = '#1B2433'
  PAPER_KEYS.forEach((k) => { if (k !== 'background' && paper[k]) out[k] = paper[k] })
  return out
}

export const stationeryToJson = (st) => JSON.stringify({ id: st.id, name: st.name, paper: st.paper }, null, 2)

export const BUILTIN_STATIONERY = [
  { id: 'plain', name: 'Plain paper', paper: { backgroundColor: '#FFFFFF', color: '#1B2433' } },
  { id: 'ruled', name: 'Ruled cream', paper: { backgroundColor: '#FFF8E7', backgroundImage: 'repeating-linear-gradient(transparent 0 27px, #C9D6EA 27px 28px)', lineHeight: '28px', color: '#2B2A26', fontFamily: 'Georgia, "Times New Roman", serif' } },
  { id: 'grid', name: 'Grid mint', paper: { backgroundColor: '#EFFAF4', backgroundImage: 'linear-gradient(#CFE9DC 1px, transparent 1px), linear-gradient(90deg, #CFE9DC 1px, transparent 1px)', backgroundSize: '22px 22px', lineHeight: '22px', color: '#1F3D31' } },
  { id: 'dotted', name: 'Dotted slate', paper: { backgroundColor: '#F3F5F9', backgroundImage: 'radial-gradient(#9FB0C9 1px, transparent 1.2px)', backgroundSize: '18px 18px', color: '#1B2433' } }
]

// Extra papers the user can browse and add from Settings.
export const GALLERY_STATIONERY = [
  { id: 'legal', name: 'Legal pad', paper: { backgroundColor: '#FFF7B8', backgroundImage: 'linear-gradient(90deg, transparent 38px, #E57373 38px 40px, transparent 40px), repeating-linear-gradient(transparent 0 27px, #9DB8D9 27px 28px)', lineHeight: '28px', paddingLeft: '48px', color: '#2B2A26' } },
  { id: 'night', name: 'Night ink', paper: { backgroundColor: '#141B26', backgroundImage: 'repeating-linear-gradient(transparent 0 27px, #26324A 27px 28px)', lineHeight: '28px', color: '#E6ECF5' } },
  { id: 'sunrise', name: 'Sunrise', paper: { background: 'linear-gradient(160deg, #FFF1E0, #FFE0EA 60%, #E4E9FF)', color: '#3A2B3F' } },
  { id: 'blueprint', name: 'Blueprint', paper: { backgroundColor: '#1F4E8C', backgroundImage: 'linear-gradient(rgba(255,255,255,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.18) 1px, transparent 1px)', backgroundSize: '20px 20px', lineHeight: '20px', color: '#EAF2FF', fontFamily: 'ui-monospace, Menlo, Consolas, monospace' } },
  { id: 'kraft', name: 'Kraft', paper: { backgroundColor: '#D9BF99', backgroundImage: 'repeating-linear-gradient(45deg, rgba(0,0,0,0.04) 0 2px, transparent 2px 4px)', color: '#3B2A17' } },
  { id: 'sakura', name: 'Sakura', paper: { backgroundColor: '#FFF3F6', backgroundImage: 'repeating-linear-gradient(transparent 0 27px, #F6C8D6 27px 28px)', lineHeight: '28px', color: '#4A2A35' } },
  { id: 'terminal', name: 'Terminal', paper: { backgroundColor: '#0C1410', color: '#8CFFB2', fontFamily: 'ui-monospace, Menlo, Consolas, monospace' } }
]

export const SAMPLE_JSON = `{
  "name": "My paper",
  "paper": {
    "backgroundColor": "#FFF8E7",
    "backgroundImage": "repeating-linear-gradient(transparent 0 27px, #C9D6EA 27px 28px)",
    "lineHeight": "28px",
    "color": "#2B2A26",
    "fontFamily": "Georgia, serif"
  }
}`
