#!/usr/bin/env node
/**
 * VitePress -> Astro Iris content migration.
 *
 * Reads  : docs/**\/*.md            (VitePress source, never modified)
 * Writes : src/content/docs/**\/*.md (Astro content collection)
 *
 * Handles:
 *  - frontmatter synthesis (title / description are required by Iris schema)
 *  - ::: tip|info|warning|danger containers -> blockquote callouts
 *  - ==highlight== -> <mark>
 *  - internal absolute links /foo/bar -> /docs/foo/bar
 *  - skips code fences so nothing above touches code
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, rmSync, existsSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { dirname, join, relative, extname } from 'node:path'

const ROOT = process.cwd()
const SRC = join(ROOT, 'docs')
const OUT = join(ROOT, 'src', 'content', 'docs')
const SKIP_DIRS = new Set(['.vitepress', 'public', 'node_modules'])

const TITLE_MAX = 60
const DESC_MAX = 160

const CALLOUT = {
  tip: ['💡', '提示'],
  info: ['ℹ️', '信息'],
  note: ['📝', '说明'],
  warning: ['⚠️', '警告'],
  danger: ['🚨', '危险'],
  details: ['▸', '详情']
}

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) walk(full, acc)
    else if (extname(name).toLowerCase() === '.md') acc.push(full)
  }
  return acc
}

function splitFrontmatter(text) {
  if (!text.startsWith('---')) return { data: {}, body: text }
  const end = text.indexOf('\n---', 3)
  if (end === -1) return { data: {}, body: text }
  const raw = text.slice(3, end).replace(/^\n/, '')
  const body = text.slice(end + 4).replace(/^\r?\n/, '')
  const data = {}
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/)
    if (!m) continue
    let v = m[2].trim()
    if (!v) continue
    if (/^['"].*['"]$/.test(v)) v = v.slice(1, -1)
    if (v.startsWith('[') && v.endsWith(']')) {
      v = v
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean)
    }
    data[m[1]] = v
  }
  return { data, body }
}

/** Strip markdown/math/html noise so the text can serve as a meta description. */
function plain(text) {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')
    .replace(/\$[^$\n]*\$/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]/g, '$1')
    .replace(/^#{1,6}\s.*$/gm, ' ')
    .replace(/^:::+.*$/gm, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[*_~|>#-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function clip(text, max) {
  text = String(text || '').replace(/\s+/g, ' ').trim()
  if (!text) return ''
  return text.length <= max ? text : text.slice(0, max - 1).trimEnd() + '…'
}

function cleanTitle(value) {
  return String(value)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]/g, '$1') // links -> text
    .replace(/`([^`]*)`/g, '$1') // inline code
    .replace(/[*_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function firstHeading(body) {
  const m = body.match(/^#\s+(.+)$/m)
  return m ? cleanTitle(m[1]) : ''
}


/** 判断一段纯文本是否有实质内容（不能只剩标点或几个虚词） */
function meaningful(text) {
  const t = String(text || '').trim()
  if (!t) return 0
  const cjk = (t.match(/[\u4e00-\u9fa5]/g) || []).length
  const alnum = (t.match(/[a-zA-Z0-9]/g) || []).length
  const punct = (t.match(/[，。；：、！？,.;:!?\-—…（）()【】《》""'']/g) || []).length
  const letters = cjk + alnum
  // 被公式「挖空」后容易出现连续标点或双空格，这样的句子不能当摘要
  // 中文之间冒出的空格通常意味着这里原本是公式，被剥掉后句子就断了
  const holed =
    /[，。、；：]{2,}|\s{2,}|^[，。、；：]|[，。、；：]$/.test(t) ||
    /[\u4e00-\u9fa5]\s+[\u4e00-\u9fa5]/.test(t)
  return letters >= 12 && letters > punct && !holed ? letters : 0
}

/** 标题转纯文本：去掉公式后把中文之间的空格也收掉 */
function plainHeading(text) {
  return plain(text)
    .replace(/(?<=[\u4e00-\u9fa5])\s+(?=[\u4e00-\u9fa5])/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/** 从正文里挑第一段“有实际内容”的文字当摘要 */
function firstMeaningfulParagraph(body) {
  const blocks = body.split(/\n\s*\n/)
  for (const block of blocks) {
    const text = plain(block)
    if (meaningful(text)) return text
  }
  return ''
}

function firstParagraph(body) {
  const lines = body.split(/\r?\n/)
  let inFence = false
  let buf = []
  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence
      continue
    }
    if (inFence) continue
    const t = line.trim()
    if (!t) {
      if (buf.length) break
      continue
    }
    if (/^#{1,6}\s/.test(t)) {
      if (buf.length) break
      continue
    }
    if (/^(:::|!\[|\||<)/.test(t)) continue
    if (/^\$\$/.test(t)) continue
    buf.push(t)
  }
  return buf.join(' ')
}

/**
 * Rewrite VitePress clean URLs to Astro /docs routes.
 *
 * Cloudflare Pages canonicalises directory routes to a trailing slash and
 * answers the bare form with a 308 — one extra round trip per click, which on
 * a slow edge is seconds. Emit the canonical form so links never redirect.
 */
function rewriteLinks(text) {
  return text.replace(/(\]\(\/)([^)\s#?]+)([^)]*\))/g, (full, lead, path, tail) => {
    if (path === 'docs' || path === 'docs/') return `${lead}docs/${tail}`
    if (/^\/docs\//.test(path)) {
      return path.endsWith('/') ? full : `${lead}${path}/${tail}`
    }
    if (/\.(png|jpe?g|gif|svg|webp|pdf|ico|json|xml|mjs|js|css)$/i.test(path)) return full
    return `${lead}docs/${path.replace(/^\//, '')}/${tail}`
  })
}

function convertContainers(lines) {
  const out = []
  let open = null // { icon, label }
  for (const line of lines) {
    const m = line.match(/^:::+\s*([A-Za-z]+)?\s*(.*)$/)
    if (m) {
      const type = m[1]
      if (!type) {
        if (open) {
          out.push('')
          open = null
        }
        continue
      }
      const [icon, label] = CALLOUT[type.toLowerCase()] || ['ℹ️', '提示']
      const custom = (m[2] || '').trim()
      open = { icon, label: custom || label }
      out.push(`> **${icon} ${open.label}**`)
      out.push('>')
      continue
    }
    if (open) {
      out.push(line.trim() ? `> ${line}` : '>')
    } else {
      out.push(line)
    }
  }
  return out
}


/** 去掉正文开头与页面标题重复的标题行（H1 已在别处删除，这里处理同名 H2/H3）。 */
function stripDuplicateHeadings(body, title) {
  const norm = (v) => v.replace(/\s+/g, ' ').trim()
  const target = norm(title)
  const lines = body.split(/\r?\n/)
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const m = line.match(/^\s{0,3}(#{1,6})\s+(.*)$/)
    if (m && norm(m[2]) === target) {
      i++
      continue
    }
    if (!line.trim() && i < 3) {
      i++
      continue
    }
    break
  }
  return lines.slice(i).join('\n')
}


/**
 * 规范化数学公式分隔符。
 *
 * remark-math 只把「$$ 单独占一行」的开头当成块级公式；源里存在
 * `$$\begin{cases}` / `...\end{cases}$$` 这种内容与 $$ 同行的写法，
 * 会导致配对错乱，后面整段公式退化成纯文本。这里统一改成 $$ 独占一行。
 */
function normalizeMathDelimiters(lines) {
  const out = []
  let inFence = false
  let inMath = false
  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence
      out.push(line)
      continue
    }
    if (inFence || !line.includes('$$')) {
      out.push(line)
      continue
    }
    let rest = line
    while (rest.includes('$$')) {
      const idx = rest.indexOf('$$')
      const before = rest.slice(0, idx)
      const after = rest.slice(idx + 2)
      if (!inMath) {
        if (before.trim()) out.push(before)
        out.push('$$')
        inMath = true
      } else {
        if (before.trim()) out.push(before)
        out.push('$$')
        inMath = false
      }
      rest = after
    }
    if (rest.trim()) out.push(rest)
  }
  return out
}

/**
 * 去掉正文里的 HTML 字体/颜色样式（<font style>、带 style 的 span/div），
 * 只保留内部文字。代码块内不动。
 */
function stripHtmlStyling(text) {
  const parts = text.split(/(^\s*```[\s\S]*?^\s*```)/m)
  return parts
    .map((chunk, index) => {
      // 奇数段是代码块，跳过
      if (index % 2 === 1) return chunk
      return chunk
        .replace(/<font[^>]*>([\s\S]*?)<\/font>/gi, '$1')
        .replace(/<span[^>]*style=[^>]*>([\s\S]*?)<\/span>/gi, '$1')
        .replace(/<div[^>]*style=[^>]*>([\s\S]*?)<\/div>/gi, '$1')
    })
    .join('')
}


/** 修正常见的公式内转义问题：\text{num_heads} 与裸 # */
function fixMathSpans(line) {
  return line
    .split(/(\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/)
    .map((chunk) => {
      if (!chunk.startsWith('$')) return chunk
      let out = chunk.replace(/\\text\{([^}]*)\}/g, (_m, inner) =>
        `\\text{${inner.replace(/(?<!\\)_/g, '\\_')}}`
      )
      // 数学里的 # 必须转义，否则 KaTeX 直接报错
      out = out.replace(/(?<!\\)#/g, '\\#')
      return out
    })
    .join('')
}

function transformBody(body, srcRel = '') {
  const srcDir = srcRel.includes('/') ? srcRel.slice(0, srcRel.lastIndexOf('/')) : ''
  const lines = normalizeMathDelimiters(body.split(/\r?\n/))
  // 1. containers (function is fence-aware enough for our content: no ::: inside fences)
  const withContainers = convertContainers(lines)

  // 2. fence-aware mark + inline link rewrite
  let inFence = false
  const processed = withContainers.map((line) => {
    if (/^\s*```/.test(line)) {
      inFence = !inFence
      return line
    }
    if (inFence) return line
    // 页面大标题由 frontmatter.title 渲染，正文里出现的 # 一律降为 ##，
    // 保证每页只有一个 h1（锚点 id 由标题文字决定，降级不影响跳转）
    let l = line.replace(/^#\s+/, '## ')
    // LaTeX 规范化：
    //  · C^'_i 这种「^ 后面直接跟撇号」KaTeX 不认，改写为 ^{\prime}
    //  · equation / align* / gather* 只能用于行间公式，内联时报错，改成等价写法
    l = l.replace(/\^'(?!')/g, "^{\\prime}")
    l = l.replace(/\\begin\{equation\*?\}/g, '').replace(/\\end\{equation\*?\}/g, '')
    l = l.replace(/\\begin\{align\*\}/g, '\\begin{aligned}').replace(/\\end\{align\*\}/g, '\\end{aligned}')
    l = l.replace(/\\begin\{gather\*\}/g, '\\begin{gathered}').replace(/\\end\{gather\*\}/g, '\\end{gathered}')
    // split 同样只能用于行间公式
    l = l.replace(/\\begin\{split\}/g, '\\begin{aligned}').replace(/\\end\{split\}/g, '\\end{aligned}')
    // 正文里残留的 HTML 实体会让公式解析失败
    l = l.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    l = fixMathSpans(l)
    l = l.replace(/(?<!`)==([^=\n]+)==(?!`)/g, '<mark>$1</mark>')
    l = rewriteLinks(l)
    // VitePress 的 CSS 变量在 Astro 里不存在，iframe 边框会失效
    l = l.replaceAll('var(--vp-c-divider)', 'hsl(var(--border))')
    // Relative images live next to the source file; they are copied into
    // public/docassets at build time so the repo does not duplicate ~800MB.
    l = l.replace(/!\[([^\]]*)\]\((?!https?:|\/|data:)([^)]+)\)/g, (_m, alt, target) => {
      const clean = target.split('#')[0].split('?')[0]
      const resolved = [srcDir, clean]
        .filter(Boolean)
        .join('/')
        .replace(/\/\.\//g, '/')
        .replace(/^\.\//, '')
      const encoded = encodeURI(resolved).replace(/#/g, '%23').replace(/\?/g, '%3F')
      return `![${alt}](/docassets/${encoded})`
    })
    return l
  })
  return stripHtmlStyling(processed.join('\n')).replace(/^\n+/, '')
}

function yamlQuote(s) {
  return `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

const allFiles = walk(SRC).sort()

/**
 * Section index.md files are curated navigation lists, not prose.
 * Astro would render each as a plain page and we would lose that order, so we
 * read the link order out of them and turn it into the `order` frontmatter.
 */
function buildOrderMap() {
  const order = new Map()
  for (const file of allFiles) {
    const rel = relative(SRC, file).replace(/\.md$/i, '')
    if (rel === 'index') continue // VitePress home page, not content
    const isSectionIndex = rel.endsWith('/index') || rel.includes('/index/')
    if (!isSectionIndex) continue
    const cat = rel.split('/')[0]
    const text = readFileSync(file, 'utf8')
    let seq = 0
    for (const m of text.matchAll(/\[[^\]]*\]\((\.[^)\s]+|\/[^)\s]+)\)/g)) {
      let href = m[1]
      const wasRelative = !href.startsWith('/')
      if (href.startsWith('./')) href = href.slice(2)
      else if (href.startsWith('/')) href = href.slice(1)
      href = href.replace(/^docs\//, '').replace(/[#?].*$/, '').replace(/\/$/, '')
      // Relative links resolve inside the section, absolute ones are already rooted.
      const id = wasRelative ? `${cat}/${href}` : href
      if (!order.has(id)) order.set(id, ++seq)
    }
  }
  return order
}

const orderMap = buildOrderMap()

/**
 * 侧边栏标题映射。
 *
 * VitePress 里每篇文章的显示名是各分区 index.md 里写的链接文字，往往比
 * markdown 的一级标题准确（正文里常写成「Intro」「命题」「引言」这类通用词）。
 * build-nav 已经把这份数据整理到 src/data/docs-nav.json，这里直接复用。
 */
function buildSidebarTitles() {
  const map = new Map()
  const navPath = join(ROOT, 'src', 'data', 'docs-nav.json')
  if (!existsSync(navPath)) return map
  try {
    const nav = JSON.parse(readFileSync(navPath, 'utf8'))
    const walk = (group) => {
      for (const doc of group.docs ?? []) map.set(doc.file, doc.title)
      for (const child of group.children ?? []) walk(child)
    }
    for (const groups of Object.values(nav)) for (const g of groups) walk(g)
  } catch {
    // 读不到就退回原来的规则
  }
  return map
}

const sidebarTitles = buildSidebarTitles()

/** 侧边栏顺序：文件 -> 序号。VitePress 的显示顺序由侧边栏定义，不是字母序。 */
function buildSidebarSeq() {
  const map = new Map()
  const navPath = join(ROOT, 'src', 'data', 'docs-nav.json')
  if (!existsSync(navPath)) return map
  try {
    const nav = JSON.parse(readFileSync(navPath, 'utf8'))
    const walk = (group) => {
      for (const doc of group.docs ?? []) {
        if (typeof doc.seq === 'number' && !map.has(doc.file)) map.set(doc.file, doc.seq)
      }
      for (const child of group.children ?? []) walk(child)
    }
    for (const groups of Object.values(nav)) for (const g of groups) walk(g)
  } catch {
    // 读不到就退回 index.md 的顺序
  }
  return map
}

const sidebarSeq = buildSidebarSeq()

/** 导航专用文字不能当文章标题 */
const NAV_ONLY_TITLE = /^(概览|目录|←.*|进入.*|.*→)$/

/**
 * 每篇笔记的最后提交时间，供 /archives 使用。
 * 一次 git log 取全量，避免逐文件调用。
 */
function buildDateMap() {
  const dates = new Map()
  try {
    const out = execSync("git log --format='@@%ct' --name-only -- docs", {
      cwd: ROOT,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024
    })
    let current = null
    for (const line of out.split('\n')) {
      if (line.startsWith('@@')) {
        current = Number(line.slice(2))
        continue
      }
      const file = line.trim()
      if (!file || !current || !file.endsWith('.md')) continue
      const rel = file.replace(/^docs\//, '')
      // git log 是最新在前，首次出现即最后一次修改
      if (!dates.has(rel)) dates.set(rel, new Date(current * 1000).toISOString().slice(0, 10))
    }
  } catch {
    // 没有 git 历史时静默跳过
  }
  return dates
}

const dateMap = buildDateMap()

// VitePress home page is replaced by the Astro index page.
// `about/` is not a knowledge-base section: it becomes the site's own /about page.
const files = allFiles.filter((f) => {
  const rel = relative(SRC, f).replace(/\.md$/i, '')
  return rel !== 'index' && !rel.startsWith('about/')
})

/** Render docs/about/index.md as the standalone /about page. */
function emitAboutPage() {
  const src = join(SRC, 'about', 'index.md')
  if (!existsSync(src)) return null
  const raw = readFileSync(src, 'utf8')
  const { data, body } = splitFrontmatter(raw)
  // The layout prints frontmatter.title, so drop the duplicated leading H1.
  const bodyWithoutH1 = body.replace(/^\s*#\s+.*(\r?\n)+/, '')
  const title = clip(cleanTitle(data.title || firstHeading(body) || '关于'), TITLE_MAX)
  const description = clip(cleanTitle(data.description || plain(firstParagraph(body))), DESC_MAX)
  const fm = [
    '---',
    "layout: '@/layouts/IndividualPage.astro'",
    '',
    `title: ${yamlQuote(title)}`,
    `description: ${yamlQuote(description)}`,
    "language: '中文'",
    '---',
    ''
  ].join('\n')
  const out = join(ROOT, 'src', 'pages', 'about', 'index.md')
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, fm + transformBody(bodyWithoutH1, 'about/index.md').trimEnd() + '\n', 'utf8')
  return relative(ROOT, out)
}
if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })

let missingDesc = 0
let synthesized = 0
const report = []

for (const file of files) {
  const rel = relative(SRC, file)
  const raw = readFileSync(file, 'utf8')
  const { data, body } = splitFrontmatter(raw)

  const base = rel.replace(/\.md$/i, '').split('/').pop()
  const isIndex = /(^|\/)index\.md$/i.test(rel)
  const fromSidebar = isIndex ? undefined : sidebarTitles.get(rel)
  const sidebarTitle = fromSidebar && !NAV_ONLY_TITLE.test(fromSidebar) ? fromSidebar : undefined
  // 侧边栏标题最权威：源文件里的 frontmatter title 常是早期导入自动生成的
  // 通用词（「引言」「命题」「定律定义」），VitePress 侧边栏用的才是正式名字。
  // 概览页（index.md）没有侧边栏条目，用正文一级标题当名字。
  const h1 = firstHeading(body)
  let title = isIndex
    ? h1 || data.title || base
    : sidebarTitle || data.title || h1 || base
  if (Array.isArray(title)) title = title.join(' ')
  title = clip(cleanTitle(title), TITLE_MAX) || base

  let description = data.description
  if (Array.isArray(description)) description = description.join(' ')
  if (!description) {
    synthesized++
    const headings = [...body.matchAll(/^##\s+(.+)$/gm)]
      .map((m) => plainHeading(m[1]))
      .filter((t) => t.length >= 4)
    const fromHeadings = headings.length ? `${title}：${headings.slice(0, 3).join('、')}` : ''
    // 公式密集的文章，任何文字摘要都会被挖出空洞，直接用章节标题拼一句
    const mathHeavy = (body.match(/\$/g) || []).length > 20
    const candidate =
      (mathHeavy ? fromHeadings || firstMeaningfulParagraph(body) : firstMeaningfulParagraph(body) || fromHeadings) ||
      plain(firstParagraph(body)) ||
      plain(body).slice(0, 300) ||
      title
    description = clip(candidate, DESC_MAX)
    if (!description) {
      description = `${title} - CS Knowledge Wiki`
      missingDesc++
    }
  }
  // 描述是纯文本元信息，不能残留 markdown 链接语法（否则会原样显示）
  description = clip(plain(description) || title, DESC_MAX)

  // 标签 = 学科 + 中间各层目录，这样 /tags 是一张扁平索引
  const segments = rel.split('/').slice(0, -1)
  const derivedTags = segments.length ? segments : ['root']
  let tags = data.tags
  if (!Array.isArray(tags) || !tags.length) tags = derivedTags
  tags = [...new Set(tags.map((t) => String(t).toLowerCase()))]

  const relId = rel.replace(/\.md$/i, '')
  const order =
    sidebarSeq.get(rel) ?? orderMap.get(relId) ?? (Number.isFinite(Number(data.order)) ? Number(data.order) : 999)

  // Normalise index files to a stable id (dir/index) — the nav treats them as section landings.
  const outRel = rel
  const outFile = join(OUT, outRel)
  mkdirSync(dirname(outFile), { recursive: true })

  const updatedDate = dateMap.get(rel)
  const fm = [
    '---',
    `title: ${yamlQuote(title)}`,
    `description: ${yamlQuote(description)}`,
    `tags: [${tags.map(yamlQuote).join(', ')}]`,
    `order: ${order}`,
    ...(updatedDate ? [`updatedDate: ${updatedDate}`] : []),
    'draft: false',
    '---',
    ''
  ].join('\n')

  // 布局会用 frontmatter.title 渲染页面大标题，正文开头的 H1 若保留就会重复
  let bodyWithoutH1 = body.replace(/^\s*#\s+[^\n]*\n?/, '')
  bodyWithoutH1 = stripDuplicateHeadings(bodyWithoutH1, title)
  writeFileSync(outFile, fm + transformBody(bodyWithoutH1, rel).trimEnd() + '\n', 'utf8')
  report.push({ file: rel, title, descriptionLen: description.length })
}

const aboutPage = emitAboutPage()
console.log(`migrated ${files.length} files -> ${relative(ROOT, OUT)}`)
console.log(`about page: ${aboutPage ?? 'skipped (docs/about/index.md not found)'}`)
console.log(`synthesized descriptions: ${synthesized}`)
console.log(`sidebar titles available: ${sidebarTitles.size}`)
console.log(`empty descriptions: ${missingDesc}`)
console.log('longest titles:', report.map((r) => `${r.title.length}:${r.title}`).sort((a, b) => parseInt(b) - parseInt(a)).slice(0, 3))
console.log('longest descs :', report.map((r) => r.descriptionLen).sort((a, b) => b - a).slice(0, 3))
