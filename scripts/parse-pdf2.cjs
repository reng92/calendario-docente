const fs = require('fs')

async function main() {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const pdfPath = 'C:/Users/Ren92/Downloads/orario_docenti_completo_dal_07-01-2026 (1).pdf'
  const data = new Uint8Array(fs.readFileSync(pdfPath))
  const loadingTask = pdfjsLib.getDocument({ data })
  const pdf = await loadingTask.promise
  console.log('Pagine:', pdf.numPages)
  let allText = ''
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p)
    const content = await page.getTextContent()
    const pageText = content.items.map(i => i.str).join(' ')
    allText += `\n--- Pagina ${p} ---\n` + pageText
  }
  fs.writeFileSync('C:/Users/Ren92/calendario-docente/scripts/pdf-output.txt', allText)
  console.log('Salvato in scripts/pdf-output.txt')
  console.log(allText.slice(0, 3000))
}
main().catch(console.error)
