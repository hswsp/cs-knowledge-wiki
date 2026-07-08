export function mermaidMarkdown(md) {
  const defaultFence = md.renderer.rules.fence.bind(md.renderer.rules)
  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    if (token.info.trim() !== 'mermaid') return defaultFence(tokens, idx, options, env, self)

    const encoded = encodeURIComponent(token.content)
    return `<Mermaid code="${encoded}"></Mermaid>`
  }
}
