// Turns ==Jind== in Markdown into a soft highlighter mark: <mark>Jind</mark>
const RE = /==([^=\n]+?)==/g;

function visit(node) {
  if (!node.children) return;
  const next = [];
  for (const child of node.children) {
    if (child.type === 'text' && RE.test(child.value)) {
      RE.lastIndex = 0;
      let last = 0;
      for (const m of child.value.matchAll(RE)) {
        if (m.index > last) next.push({ type: 'text', value: child.value.slice(last, m.index) });
        next.push({
          type: 'highlight',
          data: { hName: 'mark', hProperties: { className: ['love'] } },
          children: [{ type: 'text', value: m[1] }],
        });
        last = m.index + m[0].length;
      }
      if (last < child.value.length) next.push({ type: 'text', value: child.value.slice(last) });
    } else {
      visit(child);
      next.push(child);
    }
  }
  node.children = next;
}

export function remarkHighlight() {
  return (tree) => visit(tree);
}
