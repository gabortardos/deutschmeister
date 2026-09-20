const fs = require('fs')
const s = ['a1', 'a2', 'b1']
  .map((l) => fs.readFileSync(`src/content/vocab/${l}.ts`, 'utf8'))
  .join('\n')
const themes = new Set()
const row = /^\s*\[(null|'(?:der|die|das)'),\s*'([^']*)',\s*(null|'[^']*'),\s*'([^']*)',\s*'([^']+)'/
for (const line of s.split('\n')) {
  const m = line.match(row)
  if (m) themes.add(m[5])
}
console.log([...themes].sort().join(' | '))

