// Helper: Detect math symbols
export const isMathSymbol = (char) => {
  const mathSymbols = /[π√∫∞≤≥±→←∑∏∂∇∆∈∉∪∩⊂⊃∀∃∧∨¬∝∞≠≈≡≅∼⊕⊗∠∥⊥°′″⁄]/;
  return mathSymbols.test(char);
};

// Helper: Detect superscripts
export const isSuperscript = (char) => {
  return /[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖʳˢᵗᵘᵛʷˣʸᶻ]/.test(char);
};

// Helper: Detect subscripts
export const isSubscript = (char) => {
  return /[₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎ₐₑₕᵢⱼₖₗₘₙₒₚᵣₛₜᵤᵥₓ]/.test(char);
};

// Convert Unicode superscript to normal character
export const superscriptToNormal = (char) => {
  const map = { 
    '⁰':'0', '¹':'1', '²':'2', '³':'3', '⁴':'4', '⁵':'5', '⁶':'6', '⁷':'7', '⁸':'8', '⁹':'9', 
    '⁺':'+', '⁻':'-', '⁼':'=', '⁽':'(', '⁾':')', 'ⁿ':'n',
    'ᵃ':'a', 'ᵇ':'b', 'ᶜ':'c', 'ᵈ':'d', 'ᵉ':'e', 'ᶠ':'f', 'ᵍ':'g', 'ʰ':'h', 'ⁱ':'i',
    'ʲ':'j', 'ᵏ':'k', 'ˡ':'l', 'ᵐ':'m', 'ⁿ':'n', 'ᵒ':'o', 'ᵖ':'p', 'ʳ':'r', 'ˢ':'s',
    'ᵗ':'t', 'ᵘ':'u', 'ᵛ':'v', 'ʷ':'w', 'ˣ':'x', 'ʸ':'y', 'ᶻ':'z'
  };
  return map[char] || char;
};

// Convert Unicode subscript to normal character
export const subscriptToNormal = (char) => {
  const map = { 
    '₀':'0', '₁':'1', '₂':'2', '₃':'3', '₄':'4', '₅':'5', '₆':'6', '₇':'7', '₈':'8', '₉':'9', 
    '₊':'+', '₋':'-', '₌':'=', '₍':'(', '₎':')',
    'ₐ':'a', 'ₑ':'e', 'ₕ':'h', 'ᵢ':'i', 'ⱼ':'j', 'ₖ':'k', 'ₗ':'l', 'ₘ':'m', 'ₙ':'n',
    'ₒ':'o', 'ₚ':'p', 'ᵣ':'r', 'ₛ':'s', 'ₜ':'t', 'ᵤ':'u', 'ᵥ':'v', 'ₓ':'x'
  };
  return map[char] || char;
};

// Draw overline (NOT gate bar) above text
export const drawOverline = (doc, textContent, x, y) => {
  doc.setFont("times");
  const textWidth = doc.getTextWidth(textContent);
  
  // Draw the text
  doc.text(textContent, x, y);
  
  // Draw line above text with reduced thickness
  const currentLineWidth = doc.getLineWidth();
  doc.setLineWidth(0.2); // Thinner line for overline
  doc.line(x, y - 3.5, x + textWidth, y - 3.5); // Lower position for single character
  doc.setLineWidth(currentLineWidth); // Restore original line width
  
  return x + textWidth;
};

// Draw fraction with horizontal line
export const drawFraction = (doc, numerator, denominator, x, y) => {
  doc.setFont("times");
  
  const fontSize = doc.internal.getFontSize();
  doc.setFontSize(fontSize * 0.8); // Set smaller size FIRST
  
  // NOW calculate widths with the smaller font
  const numWidth = doc.getTextWidth(numerator);
  const denWidth = doc.getTextWidth(denominator);
  const maxWidth = Math.max(numWidth, denWidth);

  // Draw numerator (centered above line)
  const numX = x + (maxWidth - numWidth) / 2;
  doc.text(numerator, numX, y - 2);

  // Draw horizontal line with reduced thickness
  const prevLineWidth = doc.getLineWidth();
  doc.setLineWidth(0.2); // Thinner line
  doc.line(x, y - 0.5, x + maxWidth, y - 0.5);
  doc.setLineWidth(prevLineWidth); // Restore previous line width

  // Draw denominator (centered below line)
  const denX = x + (maxWidth - denWidth) / 2;
  doc.text(denominator, denX, y + 3);

  doc.setFontSize(fontSize); // Restore original size

  return x + maxWidth + 2;
};


// Print mixed text with auto font switching, super/subscripts, fractions, and overlines
export const printMixedText = (doc, text, x, y) => {
  let currentX = x;
  const normalSize = doc.internal.getFontSize();
  
  // First pass: identify all overlined sections
  const overlineSections = [];
  for (let j = 0; j < text.length; j++) {
    if (text[j + 1] === '\u0304') {
      if (text[j] === ')') {
        // Find matching (
        let depth = 1;
        let k = j - 1;
        while (k >= 0 && depth > 0) {
          if (text[k] === ')') depth++;
          if (text[k] === '(') depth--;
          k--;
        }
        overlineSections.push({ start: k + 1, end: j + 1, type: 'bracket' });
      } else {
        // Single character
        overlineSections.push({ start: j, end: j + 1, type: 'single' });
      }
    }
  }
  
  let i = 0;
  while (i < text.length) {
    const char = text[i];
    
    // Skip combining macron characters
    if (char === '\u0304') {
      i++;
      continue;
    }
    
    // Check if current position is start of an overlined section
    const section = overlineSections.find(s => s.start === i);
    
    if (section) {
      // Extract the content to overline (without macron)
      let overlineContent = '';
      for (let j = section.start; j < section.end; j++) {
        if (text[j] !== '\u0304') {
          overlineContent += text[j];
        }
      }
      
      // For bracket sections, handle nested overlines
      if (section.type === 'bracket') {
        const startX = currentX;
        let hasNestedOverline = false;
        
        // Process inner content (which may have its own overlines)
        let innerI = section.start;
        while (innerI < section.end) {
          const innerChar = text[innerI];
          
          // Skip macron
          if (innerChar === '\u0304') {
            innerI++;
            continue;
          }
          
          // Check if this position has an overline (nested)
          const innerSection = overlineSections.find(s => s.start === innerI && s.end < section.end);
          
          if (innerSection) {
            hasNestedOverline = true;
            // Draw nested overline
            let innerContent = '';
            for (let k = innerSection.start; k < innerSection.end; k++) {
              if (text[k] !== '\u0304') {
                innerContent += text[k];
              }
            }
            
            // Draw inner overline at normal height
            const currentLineWidth = doc.getLineWidth();
            doc.setLineWidth(0.2);
            doc.setFont("times");
            const innerWidth = doc.getTextWidth(innerContent);
            doc.text(innerContent, currentX, y);
            doc.line(currentX, y - 3.5, currentX + innerWidth, y - 3.5);
            doc.setLineWidth(currentLineWidth);
            
            currentX += innerWidth;
            innerI = innerSection.end + 1; 
            continue;
          }
          
          // Normal character (process fractions, superscripts, subscripts, etc.)
          if (isSuperscript(innerChar)) {
            doc.setFontSize(normalSize * 0.6);
            doc.setFont("times");
            doc.text(superscriptToNormal(innerChar), currentX, y - 2);
            currentX += doc.getTextWidth(superscriptToNormal(innerChar));
            doc.setFontSize(normalSize);
          } else if (isSubscript(innerChar)) {
            doc.setFontSize(normalSize * 0.6);
            doc.setFont("times");
            doc.text(subscriptToNormal(innerChar), currentX, y + 1.5);
            currentX += doc.getTextWidth(subscriptToNormal(innerChar));
            doc.setFontSize(normalSize);
          } else if (isMathSymbol(innerChar)) {
            doc.setFont("NotoSansMath");
            doc.text(innerChar, currentX, y);
            currentX += doc.getTextWidth(innerChar);
          } else {
            doc.setFont("times");
            doc.text(innerChar, currentX, y);
            currentX += doc.getTextWidth(innerChar);
          }
          innerI++;
        }
        
        const totalWidth = currentX - startX;
        const currentLineWidth = doc.getLineWidth();
        doc.setLineWidth(0.2);
        const outerLineY = hasNestedOverline ? y - 4.2 : y - 3.5;
        doc.line(startX, outerLineY, startX + totalWidth, outerLineY);
        doc.setLineWidth(currentLineWidth);
        
        i = section.end + 1;
        continue;
      } else {
        // Single character overline
        currentX = drawOverline(doc, overlineContent, currentX, y);
        i = section.end + 1;
        continue;
      }
    }
    
    // Fraction pattern: superscript chars + ⁄ + subscript chars
    if (isSuperscript(char) || char === '⁽') {
      let numerator = '';
      let j = i;
      while (j < text.length && isSuperscript(text[j])) {
        numerator += superscriptToNormal(text[j]);
        j++;
      }
      if (j < text.length && text[j] === '⁄') {
        j++;
        let denominator = '';
        while (j < text.length && isSubscript(text[j])) {
          denominator += subscriptToNormal(text[j]);
          j++;
        }
        if (numerator && denominator) {
          currentX = drawFraction(doc, numerator.trim(), denominator.trim(), currentX + 1, y);
          i = j;
          continue;
        }
      }
    }
    
    // Superscript rendering
    if (isSuperscript(char)) {
      doc.setFontSize(normalSize * 0.6);
      doc.setFont("times");
      doc.text(superscriptToNormal(char), currentX, y - 2);
      currentX += doc.getTextWidth(superscriptToNormal(char));
      doc.setFontSize(normalSize);

    } else if (isSubscript(char)) {
      doc.setFontSize(normalSize * 0.6);
      doc.setFont("times");
      doc.text(subscriptToNormal(char), currentX, y + 1.5);
      currentX += doc.getTextWidth(subscriptToNormal(char));
      doc.setFontSize(normalSize);

    } else if (isMathSymbol(char)) {
      doc.setFont("NotoSansMath");
      doc.text(char, currentX, y);
      currentX += doc.getTextWidth(char);
      
    } else {
      doc.setFont("times");
      doc.text(char, currentX, y);
      currentX += doc.getTextWidth(char);
    }
    i++;
  }
  return currentX;
};