/**
 * 知识库分类：目录结构 + VitePress 侧边栏分组，两个来源合并。
 *
 * 侧边栏分组（`src/data/docs-nav.json`，由 scripts/build-nav.mjs 生成）表达了
 * 「哪些文章属于同一个专题」；目录结构补上侧边栏没覆盖到的部分。
 *
 * 放置规则（每篇文章都会落到某个子分类下）：
 *   1. 侧边栏的子路由前缀（如 cpp/computer-graphics）→ 二级分类，其分组为三级
 *   2. 学科根侧边栏里的分组（如 Fundamentals、C++ 八股文）→ 二级分类
 *   3. 两者都没覆盖 → 按目录层级；正好在学科根下的归入「其他」
 */
import type { CollectionEntry } from 'astro:content'

import navData from '../data/docs-nav.json'
import { SECTION_META } from '@/utils/sections'

export type DocEntry = CollectionEntry<'docs'>

type NavDoc = { title: string; file: string }
export type NavLink = { title: string; href: string }
type NavGroup = { title: string; docs: NavDoc[]; links?: NavLink[]; children?: NavGroup[] }
type NavMap = Record<string, NavGroup[]>

const NAV = navData as unknown as NavMap

/** 导航用的占位条目（概览、返回、专题入口），不算文章。 */
const NAV_ONLY = /^(概览|←.*|进入.*|.*→)$/

function cleanTitle(title: string): string {
  return title.replace(/[→←]/g, '').trim()
}

/** URL 段落里不能出现斜杠。 */
function seg(value: string): string {
  return cleanTitle(value).replace(/[/\\]/g, '-').trim() || '其他'
}

const DIR_TITLES: Record<string, string> = {
  architecture: '架构',
  'ji-chu-jia-gou': '基础架构',
  'gao-ke-yong-jia-gou-mo-xing': '高可用架构模型',
  'gao-xing-neng-jia-gou-mo-shi': '高性能架构模式',
  'ke-kuo-zhan-jia-gou': '可扩展架构',
  'jia-gou-shi-zhan': '架构实战',
  'te-bie-fang-song': '特别放送',
  'design-pattern': '设计模式',
  'design-principles': '设计原则',
  'object-oriented': '面向对象',
  'behavioral-design-patterns': '行为型模式',
  'creational-design-patterns': '创建型模式',
  'structural-design-patterns': '结构型模式',
  'standardization-and-reconstruction': '规范与重构',
  'distributed-consensus': '分布式共识',
  'distributed-storage': '分布式存储',
  messaging: '消息队列',
  'computer-graphics': '计算机图形学',
  'abstract-algebra': '抽象代数',
  'field-galois-theory': '域与伽罗瓦理论',
  'galois-theory': '伽罗瓦理论',
  'ai-infra': 'AI 基础设施',
  foundations: '基础',
  transformer: 'Transformer',
  'cmu15-445': 'CMU 15-445',
  'cmu-db': 'CMU DB',
  'cmu15445-bi-ji': 'CMU15-445 笔记',
  'lsm-tree': 'LSM-Tree',
  'storage-engine': '存储引擎',
  'vector-database': '向量数据库',
  hardware: '硬件',
  protocols: '协议',
  'rust-programming-practice': 'Rust 编程实战',
  'practical-cryptography-for-developers': '实用密码学',
  'stanford-cs149': 'Stanford CS149',
  'cs144': 'CS 144',
  'security-attack-defense': '安全攻防',
  basics: '基础',
  concurrent: '并发',
  jvm: 'JVM',
  spring: 'Spring',
  build: '构建',
  linux: 'Linux',
  network: '网络',
  git: 'Git',
  blog: '博客工具',
  search: '搜索',
  extra: '补充',
  preface: '前言',
  summary: '总结',
  practice: '实践'
}

export function prettify(segment: string): string {
  if (/[\u4e00-\u9fa5]/.test(segment)) return segment
  return segment
    .split(/[-_]+/)
    .filter(Boolean)
    .map((w) =>
      w.length <= 3 && /^[a-z]+$/.test(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)
    )
    .join(' ')
}

function dirLabel(segment: string): string {
  return DIR_TITLES[segment] ?? prettify(segment)
}

export function categoryLabel(path: string): string {
  const segments = path.split('/').filter(Boolean)
  const last = segments.at(-1) ?? path
  if (segments.length === 1) return SECTION_META[last]?.title ?? dirLabel(last)
  return dirLabel(last)
}

export function categoryDesc(path: string): string {
  const segments = path.split('/').filter(Boolean)
  if (segments.length === 1) return SECTION_META[segments[0]]?.desc ?? ''
  return ''
}

export function docHref(doc: DocEntry): string {
  return `/docs/${doc.id}/`
}

/** 分类 URL：路径里的空格、& 等必须编码，否则浏览器会截断。 */
export function categoryHref(path: string): string {
  return `/categories/${path.split('/').filter(Boolean).map(encodeURIComponent).join('/')}/`
}

function nodeLabel(segments: string[]): string {
  if (segments.length === 1) return SECTION_META[segments[0]]?.title ?? dirLabel(segments[0])
  if (segments.length === 2) {
    const column = SUBKEY_LABELS.get(segments.slice(0, 2).join('/'))
    if (column) return column
  }
  return dirLabel(segments.at(-1)!)
}

export type CategoryNode = {
  path: string
  label: string
  desc: string
  depth: number
  docs: DocEntry[]
  /** 专栏的概览页（index.md），例如放了 PDF 的那一页 */
  overview?: DocEntry
  /** 分组里指向站外的精选文章链接 */
  links: NavLink[]
  children: string[]
  total: number
}

/** 内容集合的 filePath -> `cpp/xxx.md` 形式 */
function fileKey(doc: DocEntry): string {
  const p = doc.filePath ?? ''
  return p.replace(/^.*?src\/content\/docs\//, '')
}

/** 这些分组名只是容器，不作为分类层级。 */
const GENERIC_GROUP = /^(目录|概览|全部|索引|其他)$/

/** 专栏名覆盖：个别专栏的导航名需要和侧边栏首分组不同。 */
const SUBKEY_LABEL_OVERRIDES: Record<string, string> = {
  'ml/ai-infra': 'AI Infra 入门到前沿'
}

/**
 * 子路由前缀的显示名（等于 VitePress 侧边栏里的专栏名）。
 *
 * 优先级：显式覆盖 → 该前缀自己的首个分组标题 → 父级里指向它的分组 → 目录名美化。
 */
function subKeyLabels(): Map<string, string> {
  const labels = new Map<string, string>()

  const firstTitleFor = (group: NavGroup, key: string): string | undefined => {
    const title = cleanTitle(group.title)
    const hasIt = group.docs.some((doc) => doc.file.startsWith(`${key}/`))
    if (hasIt && title) return title
    for (const child of group.children ?? []) {
      const hit = firstTitleFor(child, key)
      if (hit) return hit
    }
    return undefined
  }

  for (const key of Object.keys(NAV)) {
    if (!key.includes('/')) continue
    const override = SUBKEY_LABEL_OVERRIDES[key]
    if (override) {
      labels.set(key, override)
      continue
    }
    // 专栏自己的首个分组标题 —— 就是 VitePress 侧边栏里显示的那个名字
    const own = NAV[key]?.map((g) => cleanTitle(g.title)).find((t) => t && !GENERIC_GROUP.test(t))
    if (own) {
      labels.set(key, own)
      continue
    }
    // 退回父级分组标题
    const section = key.split('/')[0]
    let fromParent: string | undefined
    for (const group of NAV[section] ?? []) {
      fromParent = firstTitleFor(group, key)
      if (fromParent) break
    }
    labels.set(key, fromParent ?? dirLabel(key.split('/').at(-1)!))
  }
  return labels
}

const SUBKEY_LABELS = subKeyLabels()


/** 分类节点在侧边栏里的出现顺序，用于排序（中文数字标题按字母排会乱）。 */
/** 分类路径 -> 该分类下的外部链接 */
const EXTERNAL_LINKS = new Map<string, NavLink[]>()

const NODE_ORDER = new Map<string, number>()
let orderCursor = 0
function touchNode(path: string) {
  if (!NODE_ORDER.has(path)) NODE_ORDER.set(path, orderCursor++)
}

/**
 * 专栏前缀 -> 它在学科根分组下的父路径。
 *
 * 例：ml 的「AI Infra」分组里链接了 [AI Infra 入门到前沿](./ai-infra/)，
 * 那 ai-infra 这个专栏就应该挂在 ml/AI Infra 之下，和资源页并列。
 */
const COLUMN_PARENT = (() => {
  const map = new Map<string, string[]>()
  for (const [key, groups] of Object.entries(NAV)) {
    if (key.includes('/')) continue
    for (const group of groups) {
      const column = group.docs
        .map((d) => d.file.replace(/\/index\.md$/, ''))
        .find((fp) => NAV[fp] !== undefined)
      // 专栏就是学科本身时跳过（math ←→ /math/ 这种自引用）
      if (column && column.includes('/')) map.set(column, [key, seg(cleanTitle(group.title))])
    }
  }
  return map
})()

/** 归一化用于比较：去掉空格、&、大小写差异 */
function normTitle(v: string): string {
  return v
    .toLowerCase()
    .replace(/\b(and|the)\b/g, '')
    .replace(/[与和的]/g, '')
    .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '')
}

/**
 * 专栏节点在树里的路径。
 *
 * 例：math 的「抽象代数 →」分组指向 abstract-algebra 专栏，两边都叫「抽象代数」，
 * 那就直接复用分组节点，不要再套一层，否则会出现 抽象代数/抽象代数。
 */
function columnBase(key: string): string[] {
  const parent = COLUMN_PARENT.get(key)
  if (!parent) return key.split('/')
  const label = SUBKEY_LABELS.get(key) ?? dirLabel(key.split('/').at(-1)!)
  const parentLeaf = parent.at(-1) ?? ''
  return normTitle(label) === normTitle(parentLeaf) ? parent : [...parent, label]
}

/** 建立 文件路径 -> 所属分类路径 的映射，优先用侧边栏分组（含嵌套）。 */
function buildPlacement(): Map<string, string[]> {
  const placement = new Map<string, string[]>()

  const setPath = (file: string, segments: string[]) => {
    // 更深的分类优先（子路由前缀比学科根更具体）
    const existing = placement.get(file)
    if (!existing || segments.length > existing.length) placement.set(file, segments)
  }

  const walk = (group: NavGroup, base: string[]) => {
    const title = cleanTitle(group.title)
    // 分组名和专栏名相同（如 security-attack-defense 下的「安全攻防技能30讲」）
    // 时不再多套一层，直接并进专栏本身。
    const sameAsColumn = base.length > 1 && title === SUBKEY_LABELS.get(base.join('/'))
    const isGeneric =
      !title || GENERIC_GROUP.test(title) || NAV_ONLY.test(group.title) || sameAsColumn
    const here = isGeneric ? base : [...base, seg(title)]
    if (!isGeneric) touchNode(here.join('/'))
    if (group.links?.length) {
      // 有文章的组：链接另起一个同级「资源」页；只有链接的组：它自己就是资源页
      const hasDocs = group.docs.length > 0
      const suffix = /[A-Za-z0-9]$/.test(title) ? ' 资源' : '资源'
      // 资源页挂在该分组自己的分类下面，而不是和它并排
      const key = hasDocs ? [...here, `${title}${suffix}`].join('/') : here.join('/')
      const bucket = EXTERNAL_LINKS.get(key) ?? []
      bucket.push(...group.links)
      EXTERNAL_LINKS.set(key, bucket)
      touchNode(key)
    }
    for (const doc of group.docs) {
      if (NAV_ONLY.test(doc.title)) continue
      setPath(doc.file, here)
    }
    for (const child of group.children ?? []) walk(child, here)
  }

  for (const [key, groups] of Object.entries(NAV)) {
    const keySegments = key.split('/')
    const section = keySegments[0]
    // 路径必须用原始 key，显示名只用于 label；混用会让同一批文章被拆成两个分类。
    // 若该专栏被学科根分组引用（如 ml 的 AI Infra），则挂到那个分组下。
    const base = keySegments.length === 1 ? [section] : columnBase(key)
    for (const group of groups) walk(group, base)
  }

  return placement
}

const PLACEMENT = buildPlacement()


export function buildCategoryTree(docs: DocEntry[]): Map<string, CategoryNode> {
  const nodes = new Map<string, CategoryNode>()

  const ensure = (path: string): CategoryNode => {
    if (nodes.has(path)) return nodes.get(path)!
    const segments = path.split('/')
    const node: CategoryNode = {
      path,
      label: nodeLabel(segments),
      desc: categoryDesc(path),
      depth: segments.length,
      docs: [],
      links: [],
      children: [],
      total: 0
    }
    nodes.set(path, node)
    if (segments.length > 1) {
      const parent = ensure(segments.slice(0, -1).join('/'))
      if (!parent.children.includes(path)) parent.children.push(path)
    }
    return node
  }

  for (const doc of docs) {
    // 章节概览页（*/index.md）是导航入口，不作为文章列出。
    // 注意：Astro 会把 index.md 的 id 剥成目录名，所以只能看 filePath。
    if (/(^|\/)index\.md$/.test(fileKey(doc))) continue
    const section = doc.id.split('/')[0]
    ensure(section)

    let path = PLACEMENT.get(fileKey(doc))?.join('/')
    if (!path) {
      // 侧边栏没覆盖：按目录层级
      const parts = doc.id.split('/')
      const dirs = parts.slice(1, -1)
      path = dirs.length ? `${section}/${dirs.join('/')}` : `${section}/其他`
    }
    // 兜底：万一某篇落在学科根上（侧边栏没有分组、也不在任何子目录），
    // 归入「未分组」而不是让它在学科页显示成「本层文章」。
    if (path.split('/').length === 1) path = `${path}/未分组`
    ensure(path).docs.push(doc)
  }

  for (const [path, links] of EXTERNAL_LINKS) {
    ensure(path).links = links
  }

  // 专栏的概览页（index.md）不参与分类，但要在该层可达——PDF 就放在这一页里
  const overviewByFile = new Map<string, DocEntry>()
  for (const doc of docs) {
    const file = fileKey(doc)
    if (/(^|\/)index\.md$/.test(file)) overviewByFile.set(file, doc)
  }
  for (const key of COLUMN_PARENT.keys()) {
    const doc = overviewByFile.get(`${key}/index.md`)
    if (!doc) continue
    const node = nodes.get(columnBase(key).join('/'))
    if (node) node.overview = doc
  }

  const computeTotal = (node: CategoryNode): number => {
    node.total =
      node.docs.length + node.children.reduce((sum, c) => sum + computeTotal(nodes.get(c)!), 0)
    return node.total
  }
  for (const node of nodes.values()) if (node.depth === 1) computeTotal(node)

  for (const node of nodes.values()) {
    node.children.sort((a, b) => {
      const oa = NODE_ORDER.get(a) ?? 9999
      const ob = NODE_ORDER.get(b) ?? 9999
      return oa - ob || a.localeCompare(b, 'zh')
    })
    node.docs.sort(
      (a, b) =>
        (a.data.order ?? 999) - (b.data.order ?? 999) ||
        a.data.title.localeCompare(b.data.title, 'zh')
    )
  }

  return nodes
}

const TOP_ORDER = [
  'math',
  'algorithm',
  'ml',
  'java',
  'cpp',
  'storage',
  'system-design',
  'tools',
  'csapp',
  'security',
  'rust'
]

export function topLevelCategories(nodes: Map<string, CategoryNode>): CategoryNode[] {
  return [...nodes.values()]
    .filter((n) => n.depth === 1)
    .sort((a, b) => {
      const ia = TOP_ORDER.indexOf(a.path)
      const ib = TOP_ORDER.indexOf(b.path)
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib) || a.path.localeCompare(b.path)
    })
}
