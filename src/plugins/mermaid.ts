import type { AstroIntegration } from 'astro'
import type { Root } from 'mdast'
import { visit } from 'unist-util-visit'

/**
 * ```mermaid 代码块 → `<pre class="mermaid">`（内容按 HTML 转义后作为纯文本）。
 *
 * 为什么不直接用 astro-mermaid：
 * 它注入的客户端脚本只在「首次加载的那一页正好有图」时才 import mermaid 并注册
 * astro:after-swap 监听。本项目全局启用 ClientRouter，页面间跳转不会重新执行 head
 * 里的模块脚本，所以从任意一页站内跳转到有图的页面时，那个监听从未注册过，图会永远
 * 停在未渲染状态（必须硬刷新）。渲染侧因此改为自带实现，见
 * src/components/MermaidRuntime.astro —— 它监听 astro:page-load（首次加载与每次
 * 站内跳转后都会触发），并且每次调用都是幂等的。
 */
function remarkMermaid() {
  const ESCAPE: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }

  return (tree: Root) => {
    visit(tree, 'code', (node, index, parent) => {
      if (node.lang?.toLowerCase() !== 'mermaid') return
      if (!parent || index === undefined) return

      // 转义成文本，浏览器再解码回原文，mermaid 里的 <br/> 等标签得以保留
      const escaped = node.value.replace(/[&<>"']/g, (char) => ESCAPE[char])

      parent.children[index] = {
        type: 'html',
        value: `<pre class="mermaid">${escaped}</pre>`
      }
    })
  }
}

export default function mermaidDiagrams(): AstroIntegration {
  return {
    name: 'mermaid-diagrams',
    hooks: {
      'astro:config:setup': ({ config, updateConfig }) => {
        updateConfig({
          markdown: {
            remarkPlugins: [...(config.markdown?.remarkPlugins ?? []), remarkMermaid]
          },
          // 开发期预打包，避免 dev 首次访问时现编译 mermaid 造成的白屏等待
          vite: { optimizeDeps: { include: ['mermaid'] } }
        })
      }
    }
  }
}
