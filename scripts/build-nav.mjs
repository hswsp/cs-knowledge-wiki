#!/usr/bin/env node
/**
 * 从 VitePress 的 config.js 里把 sidebar 结构完整提取出来。
 *
 * config.js 是 ESM 且依赖 vitepress，不能直接 import；但它导出的 sidebar 值
 * 大部分是字面量，只有几处 `...sidebarFromIndex('x')` 展开和三个手写数组。
 * 所以这里做三件事：
 *   1. 用大括号配对把 `sidebar: { ... }` 的字面量截出来
 *   2. 把那几处 spread 换成可求值的占位符
 *   3. 用 new Function 求值，得到和 VitePress 完全一致的侧边栏数据
 *
 * 产物：src/data/docs-nav.json —— 每个路由前缀下的分组与文章。
 */
import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const ROOT = process.cwd()
const DOCS = join(ROOT, 'docs')
const CONFIG = join(DOCS, '.vitepress', 'config.js')
const OUT = join(ROOT, 'src', 'data', 'docs-nav.json')

const source = readFileSync(CONFIG, 'utf8')

/** 从 `{` 开始找到配对的 `}`，跳过字符串字面量。 */
function matchBrace(text, openIndex) {
  let depth = 0
  for (let i = openIndex; i < text.length; i++) {
    const ch = text[i]
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) return i
    } else if (ch === "'" || ch === '"' || ch === '`') {
      const quote = ch
      i++
      while (i < text.length && text[i] !== quote) {
        if (text[i] === '\\') i++
        i++
      }
    }
  }
  return -1
}

/** 取出所有 `sidebar: { ... }` 字面量（根语言 + en 各一处）。 */
function extractSidebarLiterals() {
  const literals = []
  const needle = 'sidebar: {'
  let from = 0
  for (;;) {
    const at = source.indexOf(needle, from)
    if (at === -1) break
    const open = source.indexOf('{', at)
    const close = matchBrace(source, open)
    if (close === -1) break
    literals.push(source.slice(open, close + 1))
    from = close + 1
  }
  return literals
}

/** 复刻 config.js 里的 sidebarFromIndex：把学科 index.md 的分组解析成侧边栏。 */
function sidebarFromIndex(baseDir) {
  const file = join(DOCS, baseDir, 'index.md')
  if (!existsSync(file)) return []
  const content = readFileSync(file, 'utf-8')
  const groups = []
  const stack = []

  function flushTo(level) {
    while (stack.length > 0 && stack[stack.length - 1]._level > level) {
      const done = stack.pop()
      const parent = stack[stack.length - 1]
      if (parent) parent.items.push(done)
      else groups.push(done)
    }
  }

  for (const line of content.split('\n')) {
    const indent = (line.match(/^(\s*)/) || [''])[0].length
    if (/^---/.test(line)) continue
    if (line.trim() === '') continue

    let m = line.match(/^## (.+)/)
    if (m) {
      flushTo(0)
      stack.push({ text: m[1], collapsed: true, items: [], _level: 1 })
      continue
    }
    if (stack.length === 0) continue

    m = line.match(/^### (.+)/)
    if (m) {
      flushTo(1)
      stack.push({ text: m[1], collapsed: true, items: [], _level: 2 })
      continue
    }

    m = line.match(/^(\s*)-?\s*\*\*(.+?)\*\*\s*$/)
    if (m) {
      flushTo(2)
      stack.push({
        text: m[2],
        collapsed: true,
        items: [],
        _level: 3,
        _baseIndent: indent,
        _hasIndented: false
      })
      continue
    }

    m = line.match(/^\s*- \[(.+?)\]\((.+?)\)/)
    if (m) {
      const top = stack[stack.length - 1]
      if (top._level === 3 && top._hasIndented && indent <= top._baseIndent + 2) {
        flushTo(stack.length - 1)
      } else if (top._level === 3 && indent > top._baseIndent) {
        top._hasIndented = true
      }

      const p = m[2].replace(/[<>]/g, '')
      let vpLink
      if (/^https?:\/\//.test(p)) {
        vpLink = p
      } else {
        vpLink = '/' + join(baseDir, p.replace(/^\.\//, '')).replace(/\\/g, '/')
        vpLink = vpLink.replace(/\.md$/, '')
      }
      stack[stack.length - 1].items.push({ text: m[1], link: vpLink })
    }
  }

  flushTo(0)
  return groups
}

/** 手写的三个侧边栏是纯 ESM 数组，可以直接求值。 */
function loadHandWritten() {
  const result = {}
  for (const name of ['securitySidebar', 'practicalCryptographySidebar', 'aiInfraSidebar']) {
    const file = join(DOCS, '.vitepress', `${name}.js`)
    if (!existsSync(file)) continue
    const text = readFileSync(file, 'utf8').replace(/^export\s+default\s+/m, 'return ')
    result[name] = new Function(text)()
  }
  return result
}

const handWritten = loadHandWritten()

function evaluate(literal) {
  const prepared = literal
    .replace(/\.\.\.sidebarFromIndex\(/g, '...__sidebarFromIndex(')
    .replace(/\.\.\.securitySidebar\b/g, '...__securitySidebar')
    .replace(/\.\.\.practicalCryptographySidebar\b/g, '...__practicalCryptographySidebar')
    .replace(/\.\.\.aiInfraSidebar\b/g, '...__aiInfraSidebar')

  const fn = new Function(
    '__sidebarFromIndex',
    '__securitySidebar',
    '__practicalCryptographySidebar',
    '__aiInfraSidebar',
    `return (${prepared})`
  )
  return fn(
    sidebarFromIndex,
    handWritten.securitySidebar ?? [],
    handWritten.practicalCryptographySidebar ?? [],
    handWritten.aiInfraSidebar ?? []
  )
}

/** 把侧边栏里的 link 解析成内容集合的 doc id。 */
const docIdCache = new Map()
/**
 * 侧边栏 link -> 源文件相对路径（如 `cpp/C++ 语⾔基础篇.md`）。
 *
 * 不能用 Astro 的内容 id 做键：Astro 会把文件名 slug 化（空格、特殊字符都变），
 * 而侧边栏用的是原始文件名。用文件路径匹配才稳定。
 */
function toDocFile(link) {
  if (!link || /^https?:\/\//.test(link)) return null
  if (docIdCache.has(link)) return docIdCache.get(link)

  let p = link.replace(/^\/+/, '').replace(/[?#].*$/, '')
  p = p.replace(/\/+$/, '')
  // 侧边栏里的链接是 URL 编码的（aiInfraSidebar 里全是 %20/%E7...），
  // 不解码就永远匹配不到文件，整组分栏会被当成空的丢掉
  try {
    p = decodeURIComponent(p)
  } catch {
    // 非法编码就按原样处理
  }
  let file = null
  if (!p) {
    file = null
  } else if (/\.md$/i.test(p)) {
    file = p
  } else if (existsSync(join(DOCS, p, 'index.md'))) {
    file = `${p}/index.md`
  } else if (existsSync(join(DOCS, `${p}.md`))) {
    file = `${p}.md`
  }
  docIdCache.set(link, file)
  return file
}

/** 归一化：只保留带 link 的条目，link 换成 doc id。 */
function normalizeItems(items, acc = []) {
  for (const item of items ?? []) {
    if (!item || typeof item !== 'object') continue
    if (Array.isArray(item.items) && item.items.length) {
      normalizeItems(item.items, acc)
    } else if (item.link) {
      const file = toDocFile(item.link)
      if (file) acc.push({ title: item.text ?? file, file })
    }
  }
  return acc
}

/**
 * 保留嵌套分组，并且**保留外部链接**。
 *
 * 学科 index.md 里有一些分组整组都是外链（如 ml 的「AI应用」、system-design
 * 的「系统设计」），它们是精选文章集的入口，不能因为不是本地文件就丢掉。
 */
// 侧边栏出现顺序：同一文件只记第一次出现的位置
const seqOf = new Map()
let seqCursor = 0

function normalizeGroup(group) {
  const docs = []
  const links = []
  const children = []
  for (const item of group.items ?? []) {
    if (!item || typeof item !== 'object') continue
    if (Array.isArray(item.items) && item.items.length) {
      children.push(normalizeGroup({ text: item.text, items: item.items }))
      continue
    }
    if (!item.link) continue
    if (/^https?:\/\//.test(item.link)) {
      links.push({ title: item.text ?? item.link, href: item.link })
      continue
    }
    const file = toDocFile(item.link)
    if (file) {
      if (!seqOf.has(file)) seqOf.set(file, seqCursor++)
      docs.push({ title: item.text ?? file, file, seq: seqOf.get(file) })
    }
  }
  return {
    title: group.text ?? '',
    docs,
    links,
    children: children.filter((c) => c.docs.length || c.links.length || c.children.length)
  }
}

function normalizeGroups(groups) {
  return (groups ?? [])
    .map((group) => normalizeGroup(group))
    .filter((group) => group.docs.length > 0 || group.links.length > 0 || group.children.length > 0)
}

const sidebarMap = {}
for (const literal of extractSidebarLiterals()) {
  const sidebar = evaluate(literal)
  for (const [key, value] of Object.entries(sidebar ?? {})) {
    const path = key.replace(/^\/+|\/+$/g, '')
    if (!path) continue
    sidebarMap[path] = normalizeGroups(value)
  }
}

const docCount = execSync('git ls-files "docs/**/*.md"', { cwd: ROOT, encoding: 'utf8' })
  .split('\n')
  .filter(Boolean).length

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, JSON.stringify(sidebarMap, null, 2) + '\n', 'utf8')

const covered = new Set()
const collect = (group) => {
  for (const doc of group.docs) covered.add(doc.file)
  for (const child of group.children) collect(child)
}

for (const groups of Object.values(sidebarMap)) for (const group of groups) collect(group)

console.log(`sidebar 路由前缀: ${Object.keys(sidebarMap).length}`)
console.log(`侧边栏覆盖文章: ${covered.size} / 仓库内 ${docCount} 篇 md（含 index）`)
console.log(`输出: ${OUT}`)
