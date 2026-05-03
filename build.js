const fs = require('fs')
const path = require('path')

const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || ''

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Warning: SUPABASE_URL and SUPABASE_ANON_KEY not set')
}

const SRC = path.join(__dirname, 'public')
const DIST = path.join(__dirname, 'dist')

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name)
    const to = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      copyDir(from, to)
    } else {
      let content = fs.readFileSync(from)
      if (['.html', '.js', '.css'].includes(path.extname(entry.name))) {
        content = content.toString()
          .replace(/%%SUPABASE_URL%%/g, SUPABASE_URL)
          .replace(/%%SUPABASE_ANON_KEY%%/g, SUPABASE_ANON_KEY)
      }
      fs.writeFileSync(to, content)
    }
  }
}

// also copy src/ so relative imports work
function copySrc(src, dest) {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name)
    const to = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      copySrc(from, to)
    } else {
      fs.copyFileSync(from, to)
    }
  }
}

if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true })
copyDir(SRC, DIST)
copySrc(path.join(__dirname, 'src'), path.join(DIST, 'src'))

console.log('build complete → dist/')
