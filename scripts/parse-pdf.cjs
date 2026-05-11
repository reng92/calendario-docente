const fs = require('fs')
const { PDFParse } = require('pdf-parse')

const buf = fs.readFileSync('C:/Users/Ren92/Downloads/orario_docenti_completo_dal_07-01-2026 (1).pdf')
const parser = new PDFParse()
parser.parse(buf).then(data => {
  console.log('Pagine:', data.numpages)
  fs.writeFileSync('/tmp/pdf-out.txt', data.text)
  console.log('Scritto in /tmp/pdf-out.txt')
  console.log('Anteprima:\n', data.text.slice(0, 3000))
}).catch(e => {
  console.error('ERRORE:', e.message)
})
