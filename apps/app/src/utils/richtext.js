// Small allow-list sanitizer for journal notes. Notes are the user's own text, but they sync between devices,
// so anything that is not basic formatting is dropped before it is shown or saved.
const ALLOWED = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'DEL', 'UL', 'OL', 'LI', 'BR', 'DIV', 'P', 'H1', 'H2', 'H3', 'BLOCKQUOTE', 'A', 'SPAN', 'CODE', 'PRE', 'HR'])
const DROP = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'NOSCRIPT', 'TEMPLATE', 'LINK', 'META', 'SVG', 'MATH', 'FORM'])
const SAFE_HREF = /^(https?:|mailto:)/i

function parse(html) {
  return new DOMParser().parseFromString(`<body>${html || ''}</body>`, 'text/html')
}

export function sanitizeHtml(html) {
  const doc = parse(html)
  const walk = (node) => {
    Array.from(node.childNodes).forEach((c) => {
      if (c.nodeType === 3) return
      if (c.nodeType !== 1) { c.remove(); return }
      if (DROP.has(c.tagName.toUpperCase())) { c.remove(); return }
      if (!ALLOWED.has(c.tagName)) { walk(c); c.replaceWith(...Array.from(c.childNodes)); return }
      Array.from(c.attributes).forEach((a) => {
        const keep = c.tagName === 'A' && a.name === 'href' && SAFE_HREF.test(a.value.trim())
        if (!keep) c.removeAttribute(a.name)
      })
      if (c.tagName === 'A') { c.setAttribute('rel', 'noopener noreferrer'); c.setAttribute('target', '_blank') }
      walk(c)
    })
  }
  walk(doc.body)
  return doc.body.innerHTML
}

export function htmlToText(html) {
  const doc = parse(html)
  doc.querySelectorAll('br').forEach((b) => b.replaceWith('\n'))
  doc.querySelectorAll('p,div,li,h1,h2,h3,blockquote,pre').forEach((el) => el.append('\n'))
  return (doc.body.textContent || '').replace(/\n{3,}/g, '\n\n').trim()
}

const escapeHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
export const textToHtml = (text) => escapeHtml(text || '').replace(/\r?\n/g, '<br>')
