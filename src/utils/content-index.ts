import type { CollectionEntry } from 'astro:content'
import { getCollection } from 'astro:content'
import type { Root } from 'mdast'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
import { visit } from 'unist-util-visit'

import { resolveContentId } from '@/utils/backlinks'
import { getPostCategorySegments, getPostPath, getPostSlug } from '@/utils/content-paths'

export interface ContentDetails {
  slug: string
  aliases: string[]
  title: string
  description?: string
  content: string
  tags: string[]
  categories: string[]
  links: string[]
  collection: 'blog' | 'docs'
  publishDate?: string
}

export interface ContentIndex {
  [slug: string]: ContentDetails
}

/** JSON 里不需要 content 的部分：图谱、分类浏览只用这些字段 */
export interface ContentMeta extends Omit<ContentDetails, 'content'> {}

// Extract text content from markdown AST, removing markdown syntax
function extractText(node: Root): string {
  const textParts: string[] = []

  visit(node, (node) => {
    if (node.type === 'text') {
      textParts.push(node.value)
    } else if (node.type === 'code' && 'value' in node) {
      textParts.push(node.value)
    }
  })

  return textParts.join(' ').replace(/\s+/g, ' ').trim()
}

// Get slug from collection entry
function getSlug(entry: CollectionEntry<'blog' | 'docs'>): string {
  if (entry.collection === 'blog') {
    return `blog/${getPostSlug(entry)}`
  }
  return `docs/${entry.id}`
}

// Regex to match wikilinks [[link]] or [[link|display text]]
const WIKILINK_REGEX = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g

// Normalize a slug for comparison
function normalizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .trim()
    .replace(/\.(md|mdx)$/, '')
    .replace(/[^\w\-/]/g, '')
}

// Get links from markdown content (including wikilinks)
function extractLinks(
  node: Root,
  rawContent: string,
  currentCollection: 'blog' | 'docs'
): string[] {
  const links: string[] = []

  // Extract wikilinks from raw content
  const wikiMatches = rawContent.matchAll(WIKILINK_REGEX)
  for (const match of wikiMatches) {
    let slug = match[1].trim()

    // Remove ./ prefix if present
    if (slug.startsWith('./')) {
      slug = slug.slice(2)
    }

    // Remove .md or .mdx extension if present
    slug = slug.replace(/\.(md|mdx)$/, '')

    // Normalize slug
    const normalizedSlug = normalizeSlug(slug)

    if (normalizedSlug && !normalizedSlug.startsWith('http')) {
      // Convert to absolute path
      // If slug doesn't specify collection, use current collection
      if (!normalizedSlug.startsWith('blog/') && !normalizedSlug.startsWith('docs/')) {
        links.push(`/${currentCollection}/${normalizedSlug}`)
      } else {
        links.push(`/${normalizedSlug}`)
      }
    }
  }

  // Extract standard markdown links
  visit(node, (node) => {
    if (node.type === 'link' && 'url' in node) {
      const url = node.url as string
      // Only include internal links
      if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
        // Normalize relative paths
        let normalizedUrl = url
        if (url.startsWith('./')) {
          normalizedUrl = `/${currentCollection}/${url.slice(2)}`
        } else if (url.startsWith('../')) {
          // Keep relative paths as is for now
          normalizedUrl = url
        }
        links.push(normalizedUrl)
      }
    }
  })

  // Remove duplicates and normalize
  return [
    ...new Set(
      links.map((link) => {
        // Normalize links
        if (link.startsWith('./')) {
          link = link.slice(2)
        }
        if (link.startsWith('../')) {
          // Keep relative paths as is for now
          return link
        }
        // Ensure absolute paths start with /
        if (!link.startsWith('/')) {
          link = `/${link}`
        }
        return link
      })
    )
  ]
}

async function buildContentIndex(): Promise<ContentIndex> {
  const blogPosts = await getCollection('blog', ({ data }) => {
    return import.meta.env.PROD ? !data.draft : true
  })

  // 目录里的 index.md 是分类页，不进搜索索引
  const docs = await getCollection('docs', ({ data, filePath }) => {
    if (/(^|\/)index\.md$/i.test(filePath ?? '')) return false
    return import.meta.env.PROD ? !data.draft : true
  })

  const allEntries: CollectionEntry<'blog' | 'docs'>[] = [...blogPosts, ...docs]
  const blogEntryById = new Map(blogPosts.map((entry) => [entry.id, entry]))
  const blogIds = [...blogEntryById.keys()]

  const contentIndex: ContentIndex = {}

  for (const entry of allEntries) {
    const slug = getSlug(entry)

    // Parse markdown to extract text and links
    if (!entry.body) continue
    const ast = unified().use(remarkParse).parse(entry.body)
    const textContent = extractText(ast as Root)
    // Pass raw content and collection to extract wikilinks
    const links = extractLinks(ast as Root, entry.body, entry.collection).map((link) => {
      if (entry.collection !== 'blog' || !link.startsWith('/blog/')) return link

      const resolvedId = resolveContentId(link.slice('/blog/'.length), entry.id, blogIds)
      const target = resolvedId ? blogEntryById.get(resolvedId) : undefined
      return target ? getPostPath(target) : link
    })

    const idWithoutExt = entry.id.replace(/\.(md|mdx)$/, '')
    const bareFilename = idWithoutExt.split('/').pop()
    const aliases = []
    if (entry.collection === 'blog') {
      if (slug !== `blog/${entry.id}`) aliases.push(`blog/${entry.id}`)
      if (slug !== `blog/${idWithoutExt}`) aliases.push(`blog/${idWithoutExt}`)
      if (bareFilename && slug !== `blog/${bareFilename}`) aliases.push(`blog/${bareFilename}`)
    }

    contentIndex[slug] = {
      slug,
      aliases,
      title: entry.data.title || '',
      description: entry.data.description,
      content: textContent,
      tags: entry.data.tags || [],
      categories:
        entry.collection === 'blog'
          ? getPostCategorySegments(entry).map((category) => category.path)
          : [],
      links,
      collection: entry.collection,
      publishDate: entry.data.publishDate ? entry.data.publishDate.toISOString() : undefined
    }
  }

  return contentIndex
}

let contentIndexPromise: Promise<ContentIndex> | null = null

/**
 * 全站内容索引（含正文纯文本，约 10 MB）。两个 JSON 端点共用这一份构建结果，
 * 同一次构建里只解析一遍全部 markdown。
 */
export function getContentIndex(): Promise<ContentIndex> {
  contentIndexPromise ??= buildContentIndex()
  return contentIndexPromise
}

/**
 * 去掉 content 字段的轻量版（约 0.4 MB）。
 *
 * 图谱视图（packages/pure/components/pages/scripts/graph-view.ts）会在每篇文章
 * 页加载时请求这份索引，只需要标题/标签/分类/引用关系 —— 把 5.5 MB 正文塞进去
 * 会让每个文章页白下载约 3.4 MB 的 gzip 数据，并把 mermaid 等资源挤在带宽后面。
 */
export function toContentMeta(index: ContentIndex): Record<string, ContentMeta> {
  const meta: Record<string, ContentMeta> = {}
  for (const [slug, details] of Object.entries(index)) {
    const { content: _content, ...rest } = details
    meta[slug] = rest
  }
  return meta
}
