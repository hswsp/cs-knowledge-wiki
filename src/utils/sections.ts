/**
 * Section metadata shared by the docs routes and components.
 *
 * Kept in a module (not in a component's frontmatter) because Astro extracts
 * `getStaticPaths` into its own bundle where only imports are visible.
 */
export type SectionMeta = { title: string; icon: string; desc: string; image?: string }

/**
 * Section cover images shown at the top-left of each category card.
 * Cartoons come from Microsoft Fluent Emoji (MIT), stored under public/images/sections.
 */

export const SECTION_META: Record<string, SectionMeta> = {
  math: {
    title: '数学',
    icon: 'sum',
    desc: '高等数学、线性代数、概率论、离散数学 —— 程序员需要的数学基础',
    image: '/images/sections/math.png'
  },
  algorithm: {
    title: '算法',
    icon: 'brain',
    desc: '数据结构、经典算法、LeetCode 题解，构建解题思维',
    image: '/images/sections/algorithm.png'
  },
  ml: {
    title: '机器学习',
    icon: 'robot',
    desc: '经典 ML、深度学习、NLP、CV、大模型，从理论到实战',
    image: '/images/sections/ml.png'
  },
  java: {
    title: 'Java',
    icon: 'cafe',
    desc: '基础 · 并发 · JVM · Spring 全家桶',
    image: '/images/sections/java.png'
  },
  cpp: {
    title: 'C++',
    icon: 'code',
    desc: '现代 C++、STL、模板、内存与多线程',
    image: '/images/sections/cpp.png'
  },
  storage: {
    title: '存储',
    icon: 'database',
    desc: 'MySQL、Redis、LSM-Tree、HDFS、CMU 15-445、分布式存储',
    image: '/images/sections/storage.png'
  },
  'system-design': {
    title: '系统设计',
    icon: 'sitemap',
    desc: '分布式理论、微服务、消息队列、高可用架构',
    image: '/images/sections/system-design.png'
  },
  tools: {
    title: '工具',
    icon: 'tool',
    desc: 'Git、CMake、Lucene、Hexo 等日常开发工具',
    image: '/images/sections/tools.png'
  },
  csapp: {
    title: '计算机系统',
    icon: 'cpu',
    desc: 'Linux、内存、文件系统、进程调度',
    image: '/images/sections/csapp.png'
  },
  security: {
    title: '信息安全',
    icon: 'lock',
    desc: '加密、认证、安全协议、漏洞分析',
    image: '/images/sections/security.png'
  },
  rust: {
    title: 'Rust',
    icon: 'wrench',
    desc: '所有权、并发、异步与工程实践',
    image: '/images/sections/rust.png'
  }
}

/** Section display order, mirroring the old VitePress homepage. */
export const SECTION_ORDER = [
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

export function sectionMeta(section: string): SectionMeta {
  return SECTION_META[section] ?? { title: section, icon: 'document', desc: '' }
}

export function sortSections(list: string[]): string[] {
  return list.slice().sort((a, b) => {
    const ia = SECTION_ORDER.indexOf(a)
    const ib = SECTION_ORDER.indexOf(b)
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib) || a.localeCompare(b)
  })
}

export type TreeDoc = { id: string; title: string; order: number }
export type TreeNode = { name: string; docs: TreeDoc[]; dirs: Map<string, TreeNode> }

/** Build a directory tree for one section, ordered by the curated `order` field. */
export function buildSectionTree(
  entries: { id: string; data: { title: string; order?: number } }[],
  section: string
): TreeNode {
  const root: TreeNode = { name: section, docs: [], dirs: new Map() }
  for (const doc of entries) {
    const segments = doc.id.split('/')
    if (segments[0] !== section) continue
    const rest = segments.slice(1)
    if (!rest.length) continue
    let node = root
    for (const dir of rest.slice(0, -1)) {
      if (!node.dirs.has(dir)) node.dirs.set(dir, { name: dir, docs: [], dirs: new Map() })
      node = node.dirs.get(dir)!
    }
    node.docs.push({ id: doc.id, title: doc.data.title, order: doc.data.order ?? 999 })
  }
  const sortNode = (n: TreeNode) => {
    n.docs.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, 'zh'))
    for (const d of n.dirs.values()) sortNode(d)
  }
  sortNode(root)
  return root
}

export function countDocs(node: TreeNode): number {
  let n = node.docs.length
  for (const dir of node.dirs.values()) n += countDocs(dir)
  return n
}
