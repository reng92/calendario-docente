import fs from 'fs'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const pdfParse = require('pdf-parse')

const buf = fs.readFileSync('C:/Users/Ren92/Downloads/orario_docenti_completo_dal_07-01-2026 (1).pdf')
const data = await pdfParse(buf)
console.log('Pagine:', data.numpages)
console.log('--- TESTO ---')
console.log(data.text)
