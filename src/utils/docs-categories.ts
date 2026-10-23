/**
 * Knowledge-base categories, derived from content paths the same way the theme
 * derives blog categories (see `content-paths.ts`).
 *
 * `/categories`            -> 学科（大分类）
 * `/categories/<section>`  -> 二级分类 + 直接挂在该层的文章
 * `/categories/a/b`        -> 更深层
 */
import type { CollectionEntry } from 'astro:content'

import { SECTION_META } from '@/utils/sections'

export type DocEntry = CollectionEntry<'docs'>

/** 中文目录名。没列出的走 prettify（英文转词首大写，中文原样）。 */
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
  'security-attack-defense': '安全攻防',
  java: 'Java',
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
    .map((w) => (w.length <= 3 && /^[a-z]+$/.test(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ')
}

export function categoryLabel(path: string): string {
  const segments = path.split('/').filter(Boolean)
  const last = segments.at(-1) ?? path
  if (segments.length === 1) return SECTION_META[last]?.title ?? DIR_TITLES[last] ?? prettify(last)
  return DIR_TITLES[last] ?? prettify(last)
}

export function categoryDesc(path: string): string {
  const segments = path.split('/').filter(Boolean)
  if (segments.length === 1) return SECTION_META[segments[0]]?.desc ?? ''
  return ''
}

export function docHref(doc: DocEntry): string {
  return `/docs/${doc.id}`
}

export function docCategory(doc: DocEntry): string | undefined {
  const parts = doc.id.split('/')
  if (parts.length < 2) return undefined
  return parts.slice(0, -1).join('/')
}

export type CategoryNode = {
  path: string
  name: string
  label: string
  desc: string
  depth: number
  /** 直接挂在这一层的文章 */
  docs: DocEntry[]
  /** 子分类路径 */
  children: string[]
  /** 含所有后代文章的计数 */
  total: number
}

export function buildCategoryTree(docs: DocEntry[]): Map<string, CategoryNode> {
  const nodes = new Map<string, CategoryNode>()

  const ensure = (path: string): CategoryNode => {
    if (nodes.has(path)) return nodes.get(path)!
    const segments = path.split('/')
    const node: CategoryNode = {
      path,
      name: segments.at(-1)!,
      label: categoryLabel(path),
      desc: categoryDesc(path),
      depth: segments.length,
      docs: [],
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
    const category = docCategory(doc)
    if (!category) continue
    ensure(category).docs.push(doc)
  }

  // total = 自身文章 + 所有后代
  const computeTotal = (node: CategoryNode): number => {
    node.total = node.docs.length + node.children.reduce((sum, c) => sum + computeTotal(nodes.get(c)!), 0)
    return node.total
  }
  for (const node of nodes.values()) if (node.depth === 1) computeTotal(node)

  // 子分类按路径排序，文章按 order 排序
  for (const node of nodes.values()) {
    node.children.sort((a, b) => a.localeCompare(b, 'zh'))
    node.docs.sort(
      (a, b) =>
        (a.data.order ?? 999) - (b.data.order ?? 999) || a.data.title.localeCompare(b.data.title, 'zh')
    )
  }

  return nodes
}

/** 顶层学科，按 sections.ts 里的顺序排。 */
export function topLevelCategories(nodes: Map<string, CategoryNode>): CategoryNode[] {
  const order = ['math', 'algorithm', 'ml', 'java', 'cpp', 'storage', 'system-design', 'tools', 'csapp', 'security', 'rust', 'en']
  return [...nodes.values()]
    .filter((n) => n.depth === 1)
    .sort((a, b) => {
      const ia = order.indexOf(a.path)
      const ib = order.indexOf(b.path)
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib) || a.path.localeCompare(b.path)
    })
}
