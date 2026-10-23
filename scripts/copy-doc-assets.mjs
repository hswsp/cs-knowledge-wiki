#!/usr/bin/env node
/**
 * Stage the images that migrated docs reference.
 *
 * The computer-graphics and cs144 notes keep ~1.6k images (≈790 MB) next to the
 * markdown in `docs/`. Those files are already tracked by git, so copying them
 * into `public/` as tracked files would double the repository. Instead this
 * script runs before `astro build`/`astro dev` and materialises only the files
 * that are actually referenced, into `public/docassets/` (gitignored).
 */
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, readdirSync, statSync, rmSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'

const ROOT = process.cwd()
const CONTENT = join(ROOT, 'src', 'content', 'docs')
const SRC = join(ROOT, 'docs')
const OUT = join(ROOT, 'public', 'docassets')
const PREFIX = '/docassets/'

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) walk(full, acc)
    else if (name.endsWith('.md') || name.endsWith('.mdx')) acc.push(full)
  }
  return acc
}

if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true })

const wanted = new Set()
for (const file of walk(CONTENT)) {
  const text = readFileSync(file, 'utf8')
  for (const m of text.matchAll(/\/docassets\/([^)"'\s>]+)/g)) {
    wanted.add(m[1])
  }
}

let copied = 0
let missing = 0
let bytes = 0
const missingList = []

for (const encoded of wanted) {
  let rel
  try {
    rel = decodeURIComponent(encoded)
  } catch {
    rel = encoded
  }
  const src = join(SRC, rel)
  if (!existsSync(src)) {
    missing++
    if (missingList.length < 5) missingList.push(rel)
    continue
  }
  const dest = join(OUT, rel)
  mkdirSync(dirname(dest), { recursive: true })
  copyFileSync(src, dest)
  bytes += statSync(dest).size
  copied++
}

writeFileSync(join(ROOT, '.docassets-manifest.json'), JSON.stringify({ copied, missing, files: wanted.size }, null, 2))

console.log(`docassets: ${copied} copied, ${missing} missing, ${wanted.size} referenced, ${(bytes / 1024 / 1024).toFixed(1)} MB`)
if (missing) console.log('missing examples:', missingList)
if (missing) process.exitCode = 1
