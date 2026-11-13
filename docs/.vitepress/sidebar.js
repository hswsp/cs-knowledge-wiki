/**
 * VitePress 侧边栏：**完全由目录树生成**。
 *
 * 与 Astro 主站共用同一套约定：
 *   · 目录 = 分类，`<dir>/index.md` 的 frontmatter（title / order）是这一层
 *     的分组名与排序
 *   · 目录里的其他 `.md` 就是这一层的文章，顺序取各文件 frontmatter 的 order
 *
 * 所以加文章 / 建分类只需要动目录和 frontmatter，不用再改配置。
 */
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const DOCS = join(dirname(fileURLToPath(import.meta.url)), '..')
const SKIP = new Set(['.vitepress', 'public', 'node_modules'])

const metaCache = new Map()

/** 读 index.md / 文章 frontmatter 里的 title 与 order，退回首行 H1 */
function meta(file) {
  if (metaCache.has(file)) return metaCache.get(file)
  const out = {}
  if (existsSync(file)) {
    const text = readFileSync(file, 'utf8')
    if (text.startsWith('---')) {
      const end = text.indexOf('\n---', 3)
      if (end > 0) {
        for (const line of text.slice(3, end).split(/\r?\n/)) {
          const m = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/)
          if (!m) continue
          let value = m[2].trim()
          if (/^['"].*['"]$/.test(value)) value = value.slice(1, -1)
          out[m[1]] = value
        }
      }
    }
    if (!out.title) {
      const h1 = text.match(/^#\s+(.+)$/m)
      if (h1) out.title = h1[1].trim()
    }
  }
  metaCache.set(file, out)
  return out
}

const relOf = (full) => relative(DOCS, full).split('\\').join('/')

/** 目录里的条目：子目录 + 文章，按 order 排 */
function entries(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name) || name.startsWith('.')) continue
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) {
      const items = entries(full)
      if (!items.length) continue
      const data = meta(join(full, 'index.md'))
      out.push({
        type: 'dir',
        order: Number(data.order ?? 999),
        text: data.title || name,
        link: `/${relOf(full)}/`,
        items
      })
      continue
    }
    if (!name.endsWith('.md') || name === 'index.md') continue
    const data = meta(full)
    out.push({
      type: 'file',
      order: Number(data.order ?? 999),
      text: data.title || name.replace(/\.md$/, ''),
      link: `/${relOf(full).replace(/\.md$/, '')}`
    })
  }
  out.sort((a, b) => a.order - b.order || a.text.localeCompare(b.text, 'zh'))
  return out
}

/** 转成 VitePress 的 sidebar item（子目录折叠；顶层展开） */
function toItems(list, depth = 0) {
  return list.map((entry) => {
    if (entry.type === 'file') return { text: entry.text, link: entry.link }
    return {
      text: entry.text,
      link: entry.link,
      collapsed: depth > 0,
      items: toItems(entry.items, depth + 1)
    }
  })
}

/** 每个目录前缀一套侧边栏，VitePress 按最长前缀匹配 */
export function buildSidebar() {
  const sidebar = {}
  const walk = (dir, depth) => {
    const list = entries(dir)
    if (!list.length) return
    const rel = relOf(dir)
    const key = rel ? `/${rel}/` : '/'
    const items = toItems(list, depth)
    if (rel) {
      const parent = dirname(rel)
      const back = depth > 0 ? [{ text: '← 返回上级', link: parent === '.' ? '/' : `/${parent}/` }] : []
      sidebar[key] = [...back, ...items]
    }
    for (const name of readdirSync(dir)) {
      if (SKIP.has(name) || name.startsWith('.')) continue
      const full = join(dir, name)
      if (statSync(full).isDirectory()) walk(full, depth + 1)
    }
  }
  walk(DOCS, 0)
  return sidebar
}
