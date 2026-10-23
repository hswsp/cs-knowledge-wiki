/**
 * Render remote images as plain <img> tags.
 *
 * Astro optimises images found in content collections: for a remote `src` it
 * downloads the file at build time to infer its size. This site references
 * ~8k remote images on an external CDN, which turned the build into a
 * network-bound crawl and hard-failed on remote `.svg` files ("Failed to parse
 * image reference"), because SVG has no intrinsic pixel size.
 *
 * Rewriting remote image nodes to raw HTML keeps Astro out of the loop: no
 * download, no size inference, no failure. Local images are untouched.
 */
import type { Root } from 'mdast'
import { visit } from 'unist-util-visit'

const isRemote = (url: string) => /^(https?:)?\/\//.test(url)

export default function remarkRemoteImages() {
  return (tree: Root) => {
    visit(tree, 'image', (node, index, parent) => {
      if (!parent || index === undefined) return
      if (!isRemote(node.url)) return

      const alt = (node.alt ?? '').replace(/"/g, '&quot;')
      const src = node.url.replace(/"/g, '&quot;')
      const html =
        `<img src="${src}" alt="${alt}" class="zoomable" loading="lazy" decoding="async" />`

      parent.children[index] = {
        type: 'html',
        value: html
      } as any
    })
  }
}
