const fs = require('fs')

async function main() {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const pdfPath = 'C:/Users/Ren92/Downloads/orario_docenti_completo_dal_07-01-2026 (1).pdf'
  const data = new Uint8Array(fs.readFileSync(pdfPath))
  const loadingTask = pdfjsLib.getDocument({ data })
  const pdf = await loadingTask.promise

  // Process page 1 in detail with positions
  const page = await pdf.getPage(1)
  const content = await page.getTextContent()
  const vp = page.getViewport({ scale: 1 })
  console.log('Viewport:', vp.width, 'x', vp.height)

  // Get all items with position
  const items = content.items.map(i => ({
    str: i.str,
    x: Math.round(i.transform[4]),
    y: Math.round(vp.height - i.transform[5]),  // flip Y
  })).filter(i => i.str.trim())

  // Show first 150 items with positions
  items.slice(0, 150).forEach(i => console.log(`x=${i.x.toString().padStart(4)} y=${i.y.toString().padStart(4)}  "${i.str}"`))

  fs.writeFileSync(
    'C:/Users/Ren92/calendario-docente/scripts/pdf-positions.json',
    JSON.stringify(items, null, 2)
  )
}
main().catch(console.error)
