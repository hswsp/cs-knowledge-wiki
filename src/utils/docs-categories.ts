/**
 * 知识库分类树：**目录结构就是分类树**。
 *
 * 约定（也是 docs/ 的唯一组织规则）：
 *
 *   docs/storage/                 ← 分类「存储」，页面 = storage/index.md
 *     index.md                    ← 这一层的标题 / 简介 / 排序
 *     storage-engine/             ← 子分类，同级页 = storage-engine/index.md
 *       index.md
 *       lustre.md                 ← 子分类自己的文章
 *     io-uring.md                 ← 本层文章：和子分类同级并列
 *
 * 所以这里不再解析任何侧边栏：分类名、简介、顺序全部来自各级 index.md 的
 * frontmatter（title / description / order），文章的标题与顺序来自它自己的
 * frontmatter。目录里没有 index.md 时退回目录名的美化形式。
 */
import type { CollectionEntry } from 'astro:content'

export type DocEntry = CollectionEntry<'docs'>

export type CategoryPost = { title: string; href: string }

export type CategoryNode = {
  /** 分类路径 = 目录路径（`storage/storage-engine`） */
  path: string
  label: string
  desc: string
  depth: number
  order: number
  /** 本层文章（直属该目录的 .md，不含 index.md） */
  docs: DocEntry[]
  /** 按目录归入的博客文章 */
  posts: CategoryPost[]
  /** 子分类路径 */
  children: string[]
  total: number
  /** 该分类页对应的 index.md */
  page?: DocEntry
}

/** 没有 index.md 的目录（历史遗留）的显示名兜底 */
const DIR_TITLES: Record<string, string> = {
  foundations: '基础',
  basics: '基础',
  extra: '补充',
  preface: '前言',
  summary: '总结',
  practice: '实践',
  resources: '学习资源'
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

/** 内容集合的 filePath -> `cpp/xxx.md`（Astro 的 id 会被小写化，不能用） */
export function fileKey(doc: DocEntry): string {
  const path = (doc.filePath ?? '').replace(/\\/g, '/')
  const at = path.indexOf('src/content/docs/')
  return at >= 0 ? path.slice(at + 'src/content/docs/'.length) : path
}

/** 是不是分类页（目录里的 index.md） */
export function isIndexDoc(doc: DocEntry): boolean {
  return /(^|\/)index\.md$/i.test(fileKey(doc))
}

/** 文章 / 分类页所在目录（'' 表示内容根） */
export function docNodePath(doc: DocEntry): string {
  const rel = fileKey(doc)
  const at = rel.lastIndexOf('/')
  return at === -1 ? '' : rel.slice(0, at)
}

/** 分类页 URL（/categories 视图）*/
export function categoryHref(path: string): string {
  // `&` 是路径里的合法字符（sub-delim），必须保持原样：
  // 编码成 %26 后 Astro 的开发服务器匹配不到该路由。
  return `/categories/${path
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment).replace(/%26/gi, '&'))
    .join('/')}/`
}

/** 分类页真正的地址：目录 + index.md 渲染出来的 /docs/<path>/ */
export function nodeHref(path: string): string {
  return `/docs/${path
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment).replace(/%26/gi, '&'))
    .join('/')}/`
}

export function docHref(doc: DocEntry): string {
  return `/docs/${doc.id}/`
}

/** 标签 / 面包屑里的路径片段显示名 */
export function categoryLabel(path: string): string {
  const last = path.split('/').filter(Boolean).at(-1) ?? path
  return dirLabel(last)
}

export function categoryDesc(path: string): string {
  return ''
}

export function buildCategoryTree(docs: DocEntry[]): Map<string, CategoryNode> {
  const nodes = new Map<string, CategoryNode>()

  const ensure = (path: string): CategoryNode => {
    const existing = nodes.get(path)
    if (existing) return existing
    const segments = path.split('/')
    const node: CategoryNode = {
      path,
      label: dirLabel(segments.at(-1)!),
      desc: '',
      depth: segments.length,
      order: 999,
      docs: [],
      posts: [],
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
    const rel = fileKey(doc)
    if (!rel || rel === 'index.md') continue // 站点首页不算分类页
    const dir = docNodePath(doc)
    if (!dir) continue
    const node = ensure(dir)
    if (/(^|\/)index\.md$/i.test(rel)) {
      node.page = doc
      node.label = doc.data.title || node.label
      node.desc = doc.data.description || ''
      node.order = doc.data.order ?? 999
      continue
    }
    node.docs.push(doc)
  }

  for (const node of nodes.values()) {
    node.docs.sort(
      (a, b) =>
        (a.data.order ?? 999) - (b.data.order ?? 999) ||
        a.data.title.localeCompare(b.data.title, 'zh')
    )
    node.children.sort((a, b) => {
      const na = nodes.get(a)!
      const nb = nodes.get(b)!
      return na.order - nb.order || na.label.localeCompare(nb.label, 'zh')
    })
  }

  const computeTotal = (node: CategoryNode): number => {
    node.total =
      node.docs.length +
      node.posts.length +
      node.children.reduce((sum, child) => sum + computeTotal(nodes.get(child)!), 0)
    return node.total
  }
  for (const node of nodes.values()) if (node.depth === 1) computeTotal(node)

  return nodes
}

/**
 * 把博客文章并入分类树。
 *
 * 博客没有目录约定，分类就是文章所在的子目录
 * （`src/content/blog/公开课&资源/cs-study.md` → 分类「公开课&资源」）。
 * 只有博客、没有笔记的分类也会建出节点，这样 /categories 列表和文章面包屑
 * 都能落到真实存在的页面。
 */
export function attachBlogPosts(
  nodes: Map<string, CategoryNode>,
  posts: { title: string; href: string; category?: string }[]
): void {
  if (!posts.length) return

  const ensure = (path: string): CategoryNode => {
    const existing = nodes.get(path)
    if (existing) return existing
    const segments = path.split('/')
    const node: CategoryNode = {
      path,
      label: dirLabel(segments.at(-1)!),
      desc: '',
      depth: segments.length,
      order: 999,
      docs: [],
      posts: [],
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

  for (const post of posts) {
    const path = (post.category ?? '').split('/').filter(Boolean).join('/')
    if (!path) continue
    ensure(path).posts.push({ title: post.title, href: post.href })
  }

  const recompute = (node: CategoryNode): number => {
    node.total =
      node.docs.length +
      node.posts.length +
      node.children.reduce((sum, child) => sum + recompute(nodes.get(child)!), 0)
    return node.total
  }
  for (const node of nodes.values()) if (node.depth === 1) recompute(node)
}

/** 学科列表，按 index.md 里的 order 排序 */
export function topLevelCategories(nodes: Map<string, CategoryNode>): CategoryNode[] {
  return [...nodes.values()]
    .filter((node) => node.depth === 1)
    .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label, 'zh'))
}

/** 文章所属分类的祖先链（从学科到父目录），用于面包屑与标签 */
export function ancestorsOf(nodes: Map<string, CategoryNode>, path: string): CategoryNode[] {
  const segments = path.split('/').filter(Boolean)
  const out: CategoryNode[] = []
  for (let i = 1; i <= segments.length; i++) {
    const node = nodes.get(segments.slice(0, i).join('/'))
    if (node) out.push(node)
  }
  return out
}
