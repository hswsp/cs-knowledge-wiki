import { getBlogCollection } from 'astro-pure/server'
import { getPostCategory, getPostPath } from '@/utils/content-paths'

/**
 * 博客文章 -> 分类条目。
 *
 * 博客没有 VitePress 侧边栏，分类就是文章所在的子目录
 * （`src/content/blog/公开课&资源/cs-study.md` → 分类「公开课&资源」）。
 * 放在独立模块里，`getStaticPaths` 被 Astro 抽成单独 bundle 时也能 import 到。
 */
export async function blogCategoryEntries() {
  const posts = await getBlogCollection()
  return posts.map((post) => ({
    title: post.data.title,
    href: getPostPath(post),
    category: getPostCategory(post)
  }))
}
