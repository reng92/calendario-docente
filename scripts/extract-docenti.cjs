const fs = require('fs')

// Column centers from the PDF header row (x positions of hour numbers)
// Mon h1-7, Tue h1-7, Wed h1-6, Thu h1-7, Fri h1-6
const COLUMNS = [
  { x: 151, day: 0, hour: 1 }, { x: 171, day: 0, hour: 2 }, { x: 192, day: 0, hour: 3 },
  { x: 212, day: 0, hour: 4 }, { x: 233, day: 0, hour: 5 }, { x: 253, day: 0, hour: 6 },
  { x: 274, day: 0, hour: 7 },
  { x: 296, day: 1, hour: 1 }, { x: 315, day: 1, hour: 2 }, { x: 336, day: 1, hour: 3 },
  { x: 357, day: 1, hour: 4 }, { x: 377, day: 1, hour: 5 }, { x: 398, day: 1, hour: 6 },
  { x: 418, day: 1, hour: 7 },
  { x: 440, day: 2, hour: 1 }, { x: 460, day: 2, hour: 2 }, { x: 480, day: 2, hour: 3 },
  { x: 501, day: 2, hour: 4 }, { x: 522, day: 2, hour: 5 }, { x: 542, day: 2, hour: 6 },
  { x: 563, day: 3, hour: 1 }, { x: 583, day: 3, hour: 2 }, { x: 604, day: 3, hour: 3 },
  { x: 625, day: 3, hour: 4 }, { x: 645, day: 3, hour: 5 }, { x: 666, day: 3, hour: 6 },
  { x: 687, day: 3, hour: 7 },
  { x: 708, day: 4, hour: 1 }, { x: 728, day: 4, hour: 2 }, { x: 748, day: 4, hour: 3 },
  { x: 769, day: 4, hour: 4 }, { x: 790, day: 4, hour: 5 }, { x: 811, day: 4, hour: 6 },
]
const COL_TOLERANCE = 13  // snap tolerance in px

function snapToColumn(x) {
  let best = null, bestDist = Infinity
  for (const col of COLUMNS) {
    const dist = Math.abs(x - col.x)
    if (dist < bestDist) { bestDist = dist; best = col }
  }
  return bestDist <= COL_TOLERANCE ? best : null
}

async function main() {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const pdfPath = 'C:/Users/Ren92/Downloads/orario_docenti_completo_dal_07-01-2026 (1).pdf'
  const data = new Uint8Array(fs.readFileSync(pdfPath))
  const pdf = await (await pdfjsLib.getDocument({ data })).promise

  const teachers = {}  // name → { 0: { 1: 'class', ... }, 1: {...}, ... }

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const content = await page.getTextContent()
    const vp = page.getViewport({ scale: 1 })

    const items = content.items
      .map(i => ({
        str: i.str.trim(),
        x: Math.round(i.transform[4]),
        y: Math.round(vp.height - i.transform[5]),
      }))
      .filter(i => i.str)

    // Group by Y row (±3px tolerance)
    const rows = new Map()
    for (const item of items) {
      let matched = false
      for (const [ky] of rows) {
        if (Math.abs(ky - item.y) <= 3) { rows.get(ky).push(item); matched = true; break }
      }
      if (!matched) rows.set(item.y, [item])
    }

    // Process each row: find teacher name (x < 140) and class cells
    for (const [, rowItems] of rows) {
      const nameItem = rowItems.find(i => i.x < 140 && i.str.length > 3)
      if (!nameItem) continue

      const name = nameItem.str
      if (!teachers[name]) teachers[name] = { 0: {}, 1: {}, 2: {}, 3: {}, 4: {} }

      for (const item of rowItems) {
        if (item.x < 140) continue  // skip name itself
        const col = snapToColumn(item.x)
        if (!col) continue
        // Only store if looks like a class code (e.g. 4CT, 5BS, 1AT)
        if (/^\d[A-Z]{1,4}$/.test(item.str)) {
          teachers[name][col.day][col.hour] = item.str
        }
      }
    }
  }

  // Convert to sorted array
  const result = Object.entries(teachers)
    .map(([name, schedule]) => ({ name, schedule }))
    .sort((a, b) => a.name.localeCompare(b.name, 'it'))

  fs.writeFileSync(
    'C:/Users/Ren92/calendario-docente/public/docenti.json',
    JSON.stringify(result, null, 2)
  )
  console.log(`✅ Estratti ${result.length} docenti → public/docenti.json`)

  // Preview first 3
  result.slice(0, 3).forEach(t => {
    console.log('\n' + t.name)
    const DAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven']
    for (let d = 0; d < 5; d++) {
      const slots = Object.entries(t.schedule[d]).map(([h, c]) => `${h}ª:${c}`).join(' ')
      if (slots) console.log(`  ${DAYS[d]}: ${slots}`)
    }
  })
}
main().catch(console.error)
