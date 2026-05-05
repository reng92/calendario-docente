const fs = require('fs')

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
const COL_TOLERANCE = 15
const DAYS = ['Lun','Mar','Mer','Gio','Ven']

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

  // Check all teachers with > 18 hours in the JSON
  const jsonData = JSON.parse(fs.readFileSync('public/docenti.json'))
  const over18 = jsonData.filter(t => {
    let n = 0
    for (const v of Object.values(t.schedule)) n += Object.keys(v).length
    return n > 18
  }).map(t => t.name)

  console.log('Docenti > 18 ore nel JSON:', over18.join(', '))
  console.log('')

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const content = await page.getTextContent()
    const vp = page.getViewport({ scale: 1 })

    const items = content.items
      .map(i => ({ str: i.str.trim(), x: Math.round(i.transform[4]), y: Math.round(vp.height - i.transform[5]) }))
      .filter(i => i.str)

    // Group by Y
    const rows = new Map()
    for (const item of items) {
      let matched = false
      for (const [ky] of rows) {
        if (Math.abs(ky - item.y) <= 5) { rows.get(ky).push(item); matched = true; break }
      }
      if (!matched) rows.set(item.y, [item])
    }

    for (const [, rowItems] of rows) {
      const nameItem = rowItems.find(i => i.x < 140 && i.str.length > 3)
      if (!nameItem) continue
      if (!over18.includes(nameItem.str)) continue

      console.log(`=== ${nameItem.str} (pagina ${pageNum}) ===`)
      const cells = rowItems.filter(i => i.x >= 140).sort((a, b) => a.x - b.x)
      for (const c of cells) {
        const col = snapToColumn(c.x)
        const tokens = c.str.split(' ').filter(t => /^\d[A-Z]{1,4}$/.test(t))
        const multi = tokens.length > 1 ? ` ← CONCATENATO (${tokens.length} codici)` : ''
        const colLabel = col ? `${DAYS[col.day]} h${col.hour}` : 'FUORI COLONNA'
        console.log(`  x=${String(c.x).padStart(4)} [${colLabel.padEnd(8)}]  "${c.str}"${multi}`)
      }
      console.log('')
    }
  }
}
main().catch(console.error)
