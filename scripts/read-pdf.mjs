import fs from 'fs'
const buf = fs.readFileSync('C:/Users/Ren92/Downloads/orario_docenti_completo_dal_07-01-2026 (1).pdf')
const str = buf.toString('latin1')
const tokens = []
for (let i = 0; i < str.length; i++) {
  if (str[i] !== '(') continue
  let j = i + 1, depth = 1, text = ''
  while (j < str.length && depth > 0) {
    const ch = str[j]
    if (ch === String.fromCharCode(92)) { j += 2; continue }
    if (ch === '(') depth++
    else if (ch === ')') { depth--; if (!depth) break }
    text += ch
    j++
  }
  const clean = text.replace(/[^\x20-\x7Ea-zA-Z\xC0-\xFF]/g, '').trim()
  if (clean.length > 1 && clean.length < 100) tokens.push(clean)
  i = j
}
console.log(tokens.slice(0, 400).join('\n'))
