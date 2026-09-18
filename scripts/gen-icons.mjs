import sharp from 'sharp'
import { writeFileSync } from 'node:fs'

/**
 * Icone app: glifo "classroom" (docente alla lavagna) in bianco su sfondo blu.
 * Sorgente: assets/classroom.png (nero su trasparente, 512×512).
 *
 *   pnpm icons   → public/icon-*.png, public/apple-touch-icon.png,
 *                  app/icon.png, app/favicon.ico
 */

const SRC = 'assets/classroom.png'
const BLUE = '#1565C0'

/** Sfondo blu; rounded=false per la maskable (l'OS ritaglia lui) */
function background(size, rounded) {
  const r = rounded ? Math.round(size * 0.2) : 0
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="${BLUE}"/>
    </svg>`,
  )
}

/** Glifo bianco (inverte i canali RGB, tiene l'alpha) ridimensionato a `glyph` px */
async function whiteGlyph(glyph) {
  return sharp(SRC).negate({ alpha: false }).resize(glyph, glyph, { fit: 'inside' }).png().toBuffer()
}

/**
 * @param size   lato dell'icona
 * @param scale  quota del lato occupata dal glifo (0.5 per la maskable: safe zone 80%)
 */
async function icon(size, scale, rounded) {
  const glyph = Math.round(size * scale)
  const offset = Math.round((size - glyph) / 2)
  return sharp(background(size, rounded))
    .composite([{ input: await whiteGlyph(glyph), left: offset, top: offset }])
    .png()
    .toBuffer()
}

/** ICO con una singola voce PNG (supportato da tutti i browser moderni) */
function pngToIco(png, size) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)   // riservato
  header.writeUInt16LE(1, 2)   // tipo: icona
  header.writeUInt16LE(1, 4)   // numero immagini
  const entry = Buffer.alloc(16)
  entry.writeUInt8(size === 256 ? 0 : size, 0)
  entry.writeUInt8(size === 256 ? 0 : size, 1)
  entry.writeUInt8(0, 2)       // palette
  entry.writeUInt8(0, 3)       // riservato
  entry.writeUInt16LE(1, 4)    // piani colore
  entry.writeUInt16LE(32, 6)   // bit per pixel
  entry.writeUInt32LE(png.length, 8)
  entry.writeUInt32LE(6 + 16, 12)
  return Buffer.concat([header, entry, png])
}

const any = (size) => icon(size, 0.66, true)

writeFileSync('public/icon-192.png', await any(192))
writeFileSync('public/icon-512.png', await any(512))
writeFileSync('public/icon-512-maskable.png', await icon(512, 0.5, false))
writeFileSync('public/apple-touch-icon.png', await icon(180, 0.66, false))
writeFileSync('app/icon.png', await any(192))
writeFileSync('app/favicon.ico', pngToIco(await any(48), 48))

console.log('✅ Icone generate: icon-192/512, maskable, apple-touch-icon, app/icon.png, app/favicon.ico')
