// Small touches that make Markdown look like a printed book:
//  • a paragraph that only contains photos becomes a polaroid "tucked into the page"
//    (the image title becomes a handwritten caption):  ![alt text](@photos/x.jpg "caption")
//  • two or more photos in one paragraph sit side by side
//  • the first paragraph of a chapter gets the drop cap
const isBlank = (n) => n.type === 'text' && !n.value.trim();
const isImg = (n) => n.type === 'element' && n.tagName === 'img';

function polaroid(img, i) {
  const caption = img.properties?.title;
  if (img.properties) delete img.properties.title;
  const children = [
    {
      type: 'element',
      tagName: 'button',
      properties: { type: 'button', className: ['photo-open'], ariaLabel: `Open photo: ${img.properties?.alt || 'photo'}` },
      children: [img],
    },
  ];
  if (caption) children.push({ type: 'element', tagName: 'figcaption', properties: {}, children: [{ type: 'text', value: caption }] });
  return { type: 'element', tagName: 'figure', properties: { className: ['polaroid', i % 2 ? 'tilt-r' : 'tilt-l'] }, children };
}

export function rehypeBook() {
  return (tree) => {
    let photoCount = 0;
    let firstP = true;
    tree.children = tree.children.map((node) => {
      if (node.type !== 'element' || node.tagName !== 'p') return node;
      const kids = node.children.filter((c) => !isBlank(c) && !(c.type === 'element' && c.tagName === 'br'));
      if (kids.length && kids.every(isImg)) {
        const figs = kids.map((img) => polaroid(img, photoCount++));
        if (figs.length === 1) return { ...figs[0], properties: { ...figs[0].properties, className: [...figs[0].properties.className, 'block'] } };
        return { type: 'element', tagName: 'div', properties: { className: ['photo-row', 'block'] }, children: figs };
      }
      if (firstP) {
        firstP = false;
        node.properties = { ...node.properties, className: ['opening'] };
      }
      return node;
    });
  };
}
