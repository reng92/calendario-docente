import sharp from 'sharp'

// Blue school icon: blue background #1565C0 + 🏫 emoji rendered as SVG text
function makeSvg(size) {
  const r = Math.round(size * 0.18)  // corner radius
  const fontSize = Math.round(size * 0.52)
  const y = Math.round(size * 0.68)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="#1565C0"/>
  <text x="50%" y="${y}" font-size="${fontSize}" text-anchor="middle"
        font-family="Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji, sans-serif">🏫</text>
</svg>`
}

await sharp(Buffer.from(makeSvg(192))).png().toFile('public/icon-192.png')
await sharp(Buffer.from(makeSvg(512))).png().toFile('public/icon-512.png')
await sharp(Buffer.from(makeSvg(512))).png().toFile('public/icon-512-maskable.png')

console.log('✅ Icone generate: icon-192.png, icon-512.png, icon-512-maskable.png')
