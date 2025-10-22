export const renderFormattedText = (doc, html, x, startY, maxWidth) => {
  const parser = new DOMParser();
  const htmlDoc = parser.parseFromString(html, 'text/html');
  const body = htmlDoc.body;

  const tokens = [];

  const parseInlineStyle = (styleString, baseStyle) => {
    const s = { ...baseStyle };
    if (!styleString) return s;
    const parts = styleString.split(';').map(p => p.trim()).filter(Boolean);
    for (const p of parts) {
      const [k, v] = p.split(':').map(t => t.trim().toLowerCase());
      if (!k) continue;
      if (k === 'font-weight' && (v === 'bold' || +v >= 700)) s.bold = true;
      if (k === 'font-style' && v === 'italic') s.italic = true;
      if (k === 'text-decoration' && v.includes('underline')) s.underline = true;
    }
    return s;
  };

  const collect = (node, style = { bold: false, italic: false, underline: false }, listStack = []) => {
    if (!node) return;

    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      if (!text) return;
      const toks = text.match(/\S+|\s+/g) || [];
      toks.forEach(t => tokens.push({ type: 'text', text: t, style: { ...style } }));
      return;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = node.tagName.toLowerCase();

      let newStyle = { ...style };
      if (tag === 'b' || tag === 'strong') newStyle.bold = true;
      if (tag === 'i' || tag === 'em') newStyle.italic = true;
      if (tag === 'u') newStyle.underline = true;
      if (tag === 'span') {
        const st = node.getAttribute('style');
        newStyle = parseInlineStyle(st, newStyle);
      }

      if (tag === 'br') {
        tokens.push({ type: 'newline' });
        return;
      }

      if (tag === 'p') {
        node.childNodes.forEach(child => collect(child, newStyle, listStack));
        tokens.push({ type: 'newline' });
        tokens.push({ type: 'newline' });
        return;
      }

      if (tag === 'ul' || tag === 'ol') {
        const listType = tag === 'ul' ? 'ul' : 'ol';
        const frame = { type: listType, counter: 0 };
        const newStack = [...listStack, frame];
        node.childNodes.forEach(child => collect(child, newStyle, newStack));
        return;
      }

      if (tag === 'li') {
        const frame = listStack[listStack.length - 1] || { type: 'ul', counter: 0 };
        if (frame.type === 'ol') frame.counter = (frame.counter || 0) + 1;
        const level = listStack.length - 1 >= 0 ? listStack.length - 1 : 0;
        tokens.push({
          type: 'liStart',
          listType: frame.type,
          level,
          index: frame.type === 'ol' ? frame.counter : undefined
        });
        node.childNodes.forEach(child => collect(child, newStyle, listStack));
        tokens.push({ type: 'liEnd' });
        return;
      }

      node.childNodes.forEach(child => collect(child, newStyle, listStack));
    }
  };

  body.childNodes.forEach(n => collect(n));

  const SLACK = 0.5;
  const lineHeight = 6;

  const setFontForStyle = (s) => {
    if (s.bold && s.italic) doc.setFont("times", "bolditalic");
    else if (s.bold) doc.setFont("times", "bold");
    else if (s.italic) doc.setFont("times", "italic");
    else doc.setFont("times", "normal");
  };

  const getWidth = (text, style) => {
    const prev = doc.getFont();
    setFontForStyle(style || {});
    const w = doc.getTextWidth(text);
    doc.setFont(prev.fontName, prev.fontStyle);
    return w;
  };

  const lines = [];
  let currentLine = [];
  let currentLineWidth = 0;
  let pendingIndent = 0;
  let activeIndent = 0;
  let isCurrentListItem = false; // Add this flag

  const pushLine = (isListItem = false) => {
    lines.push({ segments: currentLine, indent: activeIndent, isListItem });
    currentLine = [];
    currentLineWidth = 0;
    activeIndent = 0;
    pendingIndent = 0;
    isCurrentListItem = false;
  };

  const appendToken = (tokenText, tokenStyle) => {
    if (/^\s+$/.test(tokenText) && currentLine.length === 0) return;

    if (currentLine.length === 0 && pendingIndent) {
      activeIndent = pendingIndent;
      pendingIndent = 0;
    }

    const effectiveMax = maxWidth - (activeIndent || 0);
    const w = getWidth(tokenText, tokenStyle);

    if (currentLineWidth + w <= effectiveMax + SLACK) {
      currentLine.push({ text: tokenText, style: tokenStyle });
      currentLineWidth += w;
      return;
    }

    if (/^\s+$/.test(tokenText)) {
      pushLine(isCurrentListItem);
      return;
    }

    if (currentLine.length > 0) {
      pushLine(isCurrentListItem);
    }

    if (w > effectiveMax + SLACK) {
      let ptr = 0;
      while (ptr < tokenText.length) {
        let chunk = '';
        while (ptr < tokenText.length) {
          const ch = tokenText[ptr];
          const test = chunk + ch;
          const tw = getWidth(test, tokenStyle);
          if (tw <= effectiveMax + SLACK) {
            chunk = test;
            ptr++;
          } else break;
        }
        if (chunk === '') {
          chunk = tokenText[ptr++];
        }
        currentLine.push({ text: chunk, style: tokenStyle });
        currentLineWidth = getWidth(chunk, tokenStyle);
        pushLine(isCurrentListItem);
      }
      return;
    }

    currentLine.push({ text: tokenText, style: tokenStyle });
    currentLineWidth += w;
  };

  for (let i = 0; i < tokens.length; i++) {
    const tk = tokens[i];
    if (tk.type === 'newline') {
      pushLine(isCurrentListItem);
      continue;
    }
    if (tk.type === 'liStart') {
      pushLine();
      pendingIndent = 6 * (tk.level + 1);
      const bullet = tk.listType === 'ul' ? '• ' : `${tk.index}. `;
      isCurrentListItem = true; // Set flag for list item
      appendToken(bullet, { bold: false, italic: false, underline: false });
      continue;
    }
    if (tk.type === 'liEnd') {
      pushLine(isCurrentListItem);
      isCurrentListItem = false;
      continue;
    }
    if (tk.type === 'text') {
      appendToken(tk.text, tk.style);
    }
  }

  if (currentLine.length > 0) pushLine(isCurrentListItem);

  let y = startY;
  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    let xPos = x + (line.indent || 0);
    for (let si = 0; si < line.segments.length; si++) {
      const seg = line.segments[si];
      setFontForStyle(seg.style || {});
      doc.text(seg.text, xPos, y);
      if (seg.style && seg.style.underline) {
        const w = doc.getTextWidth(seg.text);
        doc.setLineWidth(0.2);
        doc.line(xPos, y + 1, xPos + w, y + 1);
      }
      xPos += doc.getTextWidth(seg.text);
    }
    // Use a smaller line height for list items
    y += line.isListItem ? 1 : lineHeight;
  }

  doc.setFont("times", "normal");
  return (y - startY);
};