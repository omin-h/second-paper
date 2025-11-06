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

// Draw a fraction (for jsPDF)
export const drawFraction = (doc, numerator, denominator, x, y) => {
  doc.setFont("times");
  const normalSize = doc.internal.getFontSize();
  const fractionSize = normalSize * 0.7;
  
  doc.setFontSize(fractionSize);
  
  const numWidth = doc.getTextWidth(numerator);
  const denWidth = doc.getTextWidth(denominator);
  const maxWidth = Math.max(numWidth, denWidth);
  
  const numX = x + (maxWidth - numWidth) / 2;
  doc.text(numerator, numX, y - 1);
  
  doc.line(x, y, x + maxWidth, y);
  
  const denX = x + (maxWidth - denWidth) / 2;
  doc.text(denominator, denX, y + 2.5);
  
  doc.setFontSize(normalSize);
  
  return x + maxWidth;
};

// Draw overline (for jsPDF)
export const drawOverline = (doc, textContent, x, y) => {
  doc.setFont("times");
  const textWidth = doc.getTextWidth(textContent);
  
  // Draw the text
  doc.text(textContent, x, y);
  
  // Draw line above text
  doc.line(x, y - 3, x + textWidth, y - 3);
  
  return x + textWidth;
};

// Print mixed text with auto font switching, super/subscripts, and fractions
export const printMixedText = (doc, text, x, y) => {
  let currentX = x;
  const normalSize = doc.internal.getFontSize();
  
  let i = 0;
  while (i < text.length) {
    const char = text[i];
    
    // Overline pattern: text followed by '
    if (i > 0 && char === "'") {
      let j = i - 1;
      let overlineContent = '';
      let startPos = j;
      if (text[j] === ')') {
        let depth = 1;
        j--;
        while (j >= 0 && depth > 0) {
          if (text[j] === ')') depth++;
          if (text[j] === '(') depth--;
          j--;
        }
        startPos = j + 1;
        overlineContent = text.substring(startPos, i);
      } else {
        while (j >= 0 && /[A-Za-z0-9]/.test(text[j])) {
          j--;
        }
        startPos = j + 1;
        overlineContent = text.substring(startPos, i);
      }
      const backWidth = doc.getTextWidth(overlineContent);
      currentX -= backWidth;
      currentX = drawOverline(doc, overlineContent, currentX, y);
      i++;
      continue;
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
    if (char === "'") {
      i++;
      continue;
    }
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