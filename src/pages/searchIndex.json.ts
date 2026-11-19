import type { AstroGlobal } from 'astro'

import { getContentIndex } from '@/utils/content-index'

/**
 * 全文内容索引（含每篇正文的纯文本，约 10 MB）。
 *
 * 只在用户主动交互时才请求：全文搜索（search.ts）、wikilink 悬浮预览、
 * 分类浏览器的正文摘要。文章页自动加载的图谱视图请用 /contentIndex.json。
 */
const GET = async (_context: AstroGlobal) => {
  const index = await getContentIndex()

  return new Response(JSON.stringify(index), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600'
    }
  })
}

export { GET }
