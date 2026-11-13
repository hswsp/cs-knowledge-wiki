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
 *  - internal absolute links /foo/bar -> /docs/foo/bar/
 *  - relative .md links and images resolved from the file's own directory
 *  - skips code fences so nothing above touches code
 *
 * 目录结构是唯一的事实来源：目录 = 分类，目录里的 index.md = 该分类页
 * （frontmatter 的 title / description / order 直接决定分类名、简介与排序）。
 * 每篇文章的 title / order 也写在它自己的 frontmatter 里。
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, rmSync, existsSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { slug as ghSlug } from 'github-slugger'
import { dirname, join, relative, extname, posix } from 'node:path'

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
/** 站内静态资源前缀，链接重写时放行 */
const STATIC_PREFIX = /^\/(docassets|images|diagrams|pdfjs|favicon|logo|api|blog|about|tags|archives|links|projects|search|terms)\//
const ASSET_EXT = /\.(png|jpe?g|gif|svg|webp|pdf|ico|json|xml|mjs|js|css|zip|html?)$/i

/**
 * 站内绝对链接 `/a/b`、`/a/b/` 统一成 Astro 正式路由 `/docs/a/b/`。
 *
 * trailingSlash 为 always，Astro 的规范 URL 一定带尾斜杠，不带会多吃一次 308。
 */
function toDocsRoute(path) {
  if (STATIC_PREFIX.test(path)) return null
  if (ASSET_EXT.test(path)) return null
  const p = path.replace(/^\/+/, '').replace(/^docs\//, '').replace(/\/+$/, '')
  return p ? `/docs/${p}/` : null
}

function rewriteLinks(text) {
  const out = text.replace(
    /(\]\()(?![a-z]+:|\/\/|#)(\/[^)\s#?]*)([^)]*\))/gi,
    (full, lead, path, tail) => {
      const route = toDocsRoute(path)
      return route ? `${lead}${route}${tail}` : full
    }
  )
  // 正文里手写的 HTML 链接（<a href="/storage/">）走同一条规则
  return out.replace(
    /(<a\b[^>]*?\bhref=")(\/[^"]*)(")/gi,
    (full, pre, path, post) => {
      const route = toDocsRoute(path)
      return route ? `${pre}${route}${post}` : full
    }
  )
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


/**
 * 相对 .md 链接改写为 Astro 路由。
 *
 * 内容里写的是 `../sorting/快速排序.md` 这类相对路径（VitePress 和 Astro 都认），
 * 这里按源文件所在目录解析成真正的目标，再换算成内容 id 的 slug 形式
 * `/docs/<目录>/<slug>/`。指向 `index.md` 的链接落到分类页本身。
 */
function rewriteRelativeDocs(line, srcDir) {
  return line.replace(
    /(\]\()(?![a-z]+:|\/|#)([^)\s]+\.md)(#[^)]*)?(\))/gi,
    (_full, lead, target, anchor = '', close) => {
      let decoded = target
      try {
        decoded = decodeURIComponent(target)
      } catch {
        // 编码非法就按原样处理
      }
      const resolved = posix.normalize(posix.join(srcDir || '.', decoded)).replace(/^\.\//, '')
      const noExt = resolved.replace(/\.md$/i, '')
      const dir = posix.dirname(noExt) === '.' ? '' : posix.dirname(noExt)
      if (posix.basename(noExt) === 'index') {
        return `${lead}/docs/${dir ? dir + '/' : ''}${anchor}${close}`
      }
      const id = ghSlug(posix.basename(noExt))
      return `${lead}/docs/${dir ? dir + '/' : ''}${id}/${anchor}${close}`
    }
  )
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
    l = rewriteRelativeDocs(l, srcDir)
    // VitePress 的 CSS 变量在 Astro 里不存在，iframe 边框会失效
    l = l.replaceAll('var(--vp-c-divider)', 'hsl(var(--border))')
    // Relative images live next to the source file; they are copied into
    // public/docassets at build time so the repo does not duplicate ~800MB.
    l = l.replace(/!\[([^\]]*)\]\((?!https?:|\/|data:)([^)]+)\)/g, (_m, alt, target) => {
      const clean = target.split('#')[0].split('?')[0]
      const resolved = posix
        .normalize([srcDir, clean].filter(Boolean).join('/'))
        .replace(/^\.\//, '')
      // 源里可能是已经编码过的写法（`image%201.png`），先解码再编码，避免二次转义
      let plainPath = resolved
      try {
        plainPath = decodeURIComponent(resolved)
      } catch {
        // 非法编码就按原样处理
      }
      const encoded = encodeURI(plainPath).replace(/#/g, '%23').replace(/\?/g, '%3F')
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
 * 目录的显示名：读该目录 index.md 的 frontmatter title。
 *
 * 目录 = 分类，index.md 是这个分类页的唯一出处（标题、简介、排序）。
 * 标签（/tags）也用这条链：ancestorTitles 会返回从学科到父目录的全部标题。
 */
const dirTitleCache = new Map()
function dirTitle(dir) {
  if (dirTitleCache.has(dir)) return dirTitleCache.get(dir)
  let title = ''
  const file = join(SRC, dir, 'index.md')
  if (existsSync(file)) {
    const { data, body } = splitFrontmatter(readFileSync(file, 'utf8'))
    title = data.title || firstHeading(body) || ''
  }
  dirTitleCache.set(dir, title)
  return title
}

/** 从学科到父目录的分类标题链，用作文章的 tags */
function ancestorTitles(rel) {
  const segments = rel.split('/').slice(0, -1)
  const out = []
  for (let i = 1; i <= segments.length; i++) {
    const title = dirTitle(segments.slice(0, i).join('/'))
    if (title) out.push(title)
    else out.push(segments[i - 1])
  }
  return out.length ? out : ['root']
}

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
  // 文章标题的唯一出处是它自己的 frontmatter（迁移时已从侧边栏固化进来），
  // 其次是正文一级标题。分类页同理，取目录 index.md 的 frontmatter。
  const h1 = firstHeading(body)
  let title = data.title || h1 || base
  if (Array.isArray(title)) title = title.join(' ')
  title = clip(cleanTitle(title), TITLE_MAX) || base

  let description = data.description
  if (Array.isArray(description)) description = description.join(' ')
  if (!description && isIndex) {
    // 分类页（index.md）没有简介时按篇数生成，别从正文捞链接文字当简介
    synthesized++
    const dir = rel.split('/').slice(0, -1).join('/')
    let count = 0
    const countIn = (d) => {
      for (const name of readdirSync(join(SRC, d))) {
        const full = join(SRC, d, name)
        if (statSync(full).isDirectory()) countIn(`${d}/${name}`)
        else if (name.endsWith('.md') && name !== 'index.md') count++
      }
    }
    countIn(dir)
    description = `${title}：${count} 篇笔记`
  }
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

  // 标签 = 学科 + 各层分类名，这样 /tags 是一张扁平索引
  const derivedTags = ancestorTitles(rel)
  let tags = data.tags
  if (!Array.isArray(tags) || !tags.length) tags = derivedTags
  tags = [...new Set(tags.map((t) => String(t).toLowerCase()))]

  const order = Number.isFinite(Number(data.order)) ? Number(data.order) : 999

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
console.log(`empty descriptions: ${missingDesc}`)
console.log('longest titles:', report.map((r) => `${r.title.length}:${r.title}`).sort((a, b) => parseInt(b) - parseInt(a)).slice(0, 3))
console.log('longest descs :', report.map((r) => r.descriptionLen).sort((a, b) => b - a).slice(0, 3))
