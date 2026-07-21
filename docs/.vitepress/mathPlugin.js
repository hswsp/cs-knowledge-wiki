// Lightweight math tokenizer that preserves $...$ and $$...$$ for client-side MathJax.
// Avoids server-side MathJax/SVG rendering (which is heavy and causes OOM during SSG build).

function mathInline(state, silent) {
  const start = state.pos;
  if (state.src[start] !== '$') return false;
  if (silent) return false;
  // Find closing $ (not escaped)
  let end = start + 1;
  while (end < state.src.length) {
    if (state.src[end] === '\\') { end += 2; continue; }
    if (state.src[end] === '$') break;
    end++;
  }
  if (end >= state.src.length) return false;
  const content = state.src.slice(start + 1, end);
  if (!content.trim()) return false;
  // Avoid matching $$ (block math)
  if (content.includes('\n') && !content.startsWith('\n')) return false;
  if (state.src[end + 1] === '$') return false; // next char is $ (start of block marker)
  // Skip if preceded/followed by alnum just before/after (like $100) — but for our content it's fine since we use math
  const token = state.push('math_inline', 'span', 0);
  token.markup = '$';
  token.content = content;
  state.pos = end + 1;
  return true;
}

function mathBlock(state, startLine, endLine, silent) {
  let pos = state.bMarks[startLine] + state.tShift[startLine];
  let max = state.eMarks[startLine];
  if (pos + 2 > max) return false;
  if (state.src.slice(pos, pos + 2) !== '$$') return false;
  let firstLine = state.src.slice(pos + 2, max).trim();
  let nextLine = startLine + 1;

  if (firstLine) {
    // single-line $$...$$
    const closeIdx = firstLine.indexOf('$$');
    if (closeIdx !== -1) {
      const content = firstLine.slice(0, closeIdx).trim();
      if (silent) return true;
      const token = state.push('math_block', 'div', 0);
      token.block = true;
      token.markup = '$$';
      token.content = content;
      token.map = [startLine, startLine + 1];
      state.line = startLine + 1;
      return true;
    }
  }

  // multi-line
  const lines = [firstLine];
  let found = false;
  while (nextLine < endLine) {
    pos = state.bMarks[nextLine] + state.tShift[nextLine];
    max = state.eMarks[nextLine];
    const lineText = state.src.slice(pos, max);
    if (lineText.trim().startsWith('$$')) {
      // closing
      const tail = lineText.trim().slice(2);
      if (tail) lines.push(tail);
      found = true;
      nextLine++;
      break;
    }
    lines.push(lineText);
    nextLine++;
  }
  if (!found) return false;
  if (silent) return true;
  const token = state.push('math_block', 'div', 0);
  token.block = true;
  token.markup = '$$';
  token.content = lines.join('\n').trim();
  token.map = [startLine, nextLine];
  state.line = nextLine;
  return true;
}

function renderInline(tokens, idx) {
  const c = tokens[idx].content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return '<span class="math inline">\\(' + c + '\\)</span>';
}

function renderBlock(tokens, idx) {
  const c = tokens[idx].content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return '<div class="math display">\\[' + c + '\\]</div>\n';
}

export function mathMarkdown(md) {
  md.inline.ruler.before('emphasis', 'math_inline', mathInline);
  md.block.ruler.before('fence', 'math_block', mathBlock, {
    alt: ['paragraph', 'reference', 'blockquote', 'list'],
  });
  md.renderer.rules.math_inline = renderInline;
  md.renderer.rules.math_block = renderBlock;
}
