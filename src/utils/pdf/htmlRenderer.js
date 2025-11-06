import { createListMarker, calculateListIndent, processListStart, processListEnd } from './listHelpers.js';
import { printMixedText } from './mathTextRenderer.js';

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
      if (k === 'white-space' && (v === 'pre' || v === 'pre-wrap')) s.preserveWhitespace = true;
    }
    return s;
  };

  const collect = (node, style = { bold: false, italic: false, underline: false, preserveWhitespace: false }, listStack = []) => {
    if (!node) return;

    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      if (!text) return;
      
      // Replace non-breaking spaces with regular spaces for consistent rendering
      const normalizedText = text.replace(/\u00A0/g, ' ');
      
      if (style.preserveWhitespace || style.monospace) {
        // For preformatted text, preserve all whitespace including multiple spaces and newlines
        const lines = normalizedText.split('\n');
        lines.forEach((line, idx) => {
          if (line || idx === 0) {
            // Don't split into tokens - keep the whole line to preserve spaces
            tokens.push({ type: 'text', text: line, style: { ...style } });
          }
          if (idx < lines.length - 1) {
            tokens.push({ type: 'newline' });
          }
        });
      } else {
        // Normal text - split into words and spaces for wrapping
        const toks = normalizedText.match(/\S+|\s+/g) || [];
        toks.forEach(t => tokens.push({ type: 'text', text: t, style: { ...style } }));
      }
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

      if (tag === 'pre' || tag === 'code') {
        // Preserve whitespace exactly for code/pre blocks
        const text = node.textContent;
        if (text) {
          // Split by lines to preserve newlines
          const lines = text.split('\n');
          lines.forEach((line, idx) => {
            if (line) {
              // Preserve all spaces by not splitting into tokens
              tokens.push({ type: 'text', text: line, style: { ...newStyle, monospace: true } });
            }
            if (idx < lines.length - 1) {
              tokens.push({ type: 'newline' });
            }
          });
        }
        return;
      }

      if (tag === 'p') {
        // Add content of paragraph
        node.childNodes.forEach(child => collect(child, newStyle, listStack));
        // Add newline to end the paragraph - browsers add spacing between paragraphs
        // We add just one newline, as the next paragraph will start on a new line
        tokens.push({ type: 'newline' });
        return;
      }

      if (tag === 'div') {
        // Divs are often used by contentEditable for line breaks
        const st = node.getAttribute('style');
        const styleWithWhitespace = parseInlineStyle(st, newStyle);
        node.childNodes.forEach(child => collect(child, styleWithWhitespace, listStack));
        // Add newline after div content
        tokens.push({ type: 'newline' });
        return;
      }

      if (tag === 'ul' || tag === 'ol') {
        const listType = tag === 'ul' ? 'ul' : 'ol';
        const frame = { type: listType, counter: 0 };
        const newStack = [...listStack, frame];
        // Add list start token to trigger new line before first item
        tokens.push({ type: 'listStart', level: listStack.length });
        node.childNodes.forEach(child => collect(child, newStyle, newStack));
        // Add list end token to reduce spacing after list
        tokens.push({ type: 'listEnd', level: listStack.length });
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
    
    // Calculate width considering math symbols, superscripts, subscripts
    let totalWidth = 0;
    const normalSize = doc.internal.getFontSize();
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      // Import helper functions from mathTextRenderer
      const isMathSymbol = (c) => /[π√∫∞≤≥±→←∑∏∂∇∆∈∉∪∩⊂⊃∀∃∧∨¬∝∞≠≈≡≅∼⊕⊗∠∥⊥°′″⁄]/.test(c);
      const isSuperscript = (c) => /[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖʳˢᵗᵘᵛʷˣʸᶻ]/.test(c);
      const isSubscript = (c) => /[₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎ₐₑₕᵢⱼₖₗₘₙₒₚᵣₛₜᵤᵥₓ]/.test(c);
      
      if (isSuperscript(char) || isSubscript(char)) {
        doc.setFontSize(normalSize * 0.6);
        totalWidth += doc.getTextWidth(char);
        doc.setFontSize(normalSize);
      } else if (isMathSymbol(char)) {
        doc.setFont("NotoSansMath");
        totalWidth += doc.getTextWidth(char);
        setFontForStyle(style || {});
      } else {
        totalWidth += doc.getTextWidth(char);
      }
    }
    
    doc.setFont(prev.fontName, prev.fontStyle);
    return totalWidth;
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
    // Don't reset activeIndent and pendingIndent if we're in a list item
    // This keeps the indent for wrapped lines
    if (!isListItem) {
      activeIndent = 0;
      pendingIndent = 0;
    }
    isCurrentListItem = isListItem;
  };

  const appendToken = (tokenText, tokenStyle) => {
    // Don't skip leading whitespace - it might be intentional indentation
    // Only skip if it's trailing whitespace after a line break
    const isOnlyWhitespace = /^\s+$/.test(tokenText);
    
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
    if (tk.type === 'listStart') {
      // Push line only when starting a new list (not for each item)
      if (tk.level === 0) {
        pushLine(isCurrentListItem);
      }
      continue;
    }
    if (tk.type === 'liStart') {
      const listState = processListStart(tk, pushLine, appendToken);
      pendingIndent = listState.pendingIndent;
      isCurrentListItem = listState.isCurrentListItem;
      // Now append the bullet after setting pendingIndent
      appendToken(listState.bullet, { bold: false, italic: false, underline: false });
      continue;
    }
    if (tk.type === 'liEnd') {
      const listState = processListEnd(pushLine, isCurrentListItem);
      isCurrentListItem = listState.isCurrentListItem;
      continue;
    }
    if (tk.type === 'listEnd') {
      // Mark that the next line follows a list end
      if (tk.level === 0) {
        lines.push({ segments: [], indent: 0, isListItem: false, afterList: true });
      }
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
      
      // Use printMixedText for math symbol support
      const newX = printMixedText(doc, seg.text, xPos, y);
      
      if (seg.style && seg.style.underline) {
        const w = doc.getTextWidth(seg.text);
        doc.setLineWidth(0.2);
        doc.line(xPos, y + 1, xPos + w, y + 1);
      }
      xPos = newX;
    }
    // Use smaller line spacing for list items
    const currentLineHeight = line.isListItem ? 5.5 : lineHeight;
    y += currentLineHeight;
    
    // Add negative spacing after list ends to reduce gap
    if (line.afterList) {
      y -= 10;
    }
  }

  doc.setFont("times", "normal");
  return (y - startY);
};