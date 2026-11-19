import type { AstroGlobal } from 'astro'

import { getContentIndex, toContentMeta } from '@/utils/content-index'

/**
 * 轻量内容索引（无正文，约 0.4 MB）。
 *
 * 消费方：知识图谱视图（每篇文章页自动加载）、知识图谱弹窗、分类浏览器。
 * 全文检索与悬浮预览需要正文，改走 /searchIndex.json —— 它们只在主动交互时才请求。
 */
const GET = async (_context: AstroGlobal) => {
  const index = await getContentIndex()

  return new Response(JSON.stringify(toContentMeta(index)), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600'
    }
  })
}

export { GET }
