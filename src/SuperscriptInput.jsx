import { useState, useRef } from "react";
import { jsPDF } from "jspdf";

export default function SuperscriptInput() {
  const [text, setText] = useState("");
  const inputRef = useRef(null);

  // Map normal characters to superscript Unicode
  const toSuperscript = (char) => {
    const map = {
      '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
      '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
      '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
      'n': 'ⁿ', 'a': 'ᵃ', 'b': 'ᵇ', 'c': 'ᶜ', 'd': 'ᵈ',
      'e': 'ᵉ', 'f': 'ᶠ', 'g': 'ᵍ', 'h': 'ʰ', 'i': 'ⁱ',
      'j': 'ʲ', 'k': 'ᵏ', 'l': 'ˡ', 'm': 'ᵐ', 'n': 'ⁿ',
      'o': 'ᵒ', 'p': 'ᵖ', 'r': 'ʳ', 's': 'ˢ', 't': 'ᵗ',
      'u': 'ᵘ', 'v': 'ᵛ', 'w': 'ʷ', 'x': 'ˣ', 'y': 'ʸ', 'z': 'ᶻ'
    };
    return map[char] || char;
  };

  // Map normal characters to subscript Unicode
  const toSubscript = (char) => {
    const map = {
      '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
      '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
      '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
      'a': 'ₐ', 'e': 'ₑ', 'h': 'ₕ', 'i': 'ᵢ', 'j': 'ⱼ',
      'k': 'ₖ', 'l': 'ₗ', 'm': 'ₘ', 'n': 'ₙ', 'o': 'ₒ',
      'p': 'ₚ', 'r': 'ᵣ', 's': 'ₛ', 't': 'ₜ', 'u': 'ᵤ',
      'v': 'ᵥ', 'x': 'ₓ'
    };
    return map[char] || char;
  };

  const handleSuperscript = () => {
    const input = inputRef.current;
    const start = input.selectionStart;
    const end = input.selectionEnd;

    if (start === end) {
      alert("Please select some text first!");
      return;
    }

    const selectedText = text.substring(start, end);
    const superscriptText = selectedText.split('').map(toSuperscript).join('');

    const newText = text.substring(0, start) + superscriptText + text.substring(end);
    setText(newText);

    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start + superscriptText.length, start + superscriptText.length);
    }, 0);
  };

  const handleSubscript = () => {
    const input = inputRef.current;
    const start = input.selectionStart;
    const end = input.selectionEnd;

    if (start === end) {
      alert("Please select some text first!");
      return;
    }

    const selectedText = text.substring(start, end);
    const subscriptText = selectedText.split('').map(toSubscript).join('');

    const newText = text.substring(0, start) + subscriptText + text.substring(end);
    setText(newText);

    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start + subscriptText.length, start + subscriptText.length);
    }, 0);
  };

  const handleFraction = () => {
    const input = inputRef.current;
    const start = input.selectionStart;
    const end = input.selectionEnd;

    if (start === end) {
      alert("Please select some text first!");
      return;
    }

    const selectedText = text.substring(start, end);
    
    // Check if selection contains a fraction pattern (more flexible)
    // Matches: 20/100, (x+y)/2, a/b, etc.
    const fractionMatch = selectedText.match(/^(.+)\/(.+)$/);
    
    if (!fractionMatch) {
      alert("Please select text in fraction format (e.g., 20/100 or (x+y)/2)");
      return;
    }

    const numerator = fractionMatch[1].trim();
    const denominator = fractionMatch[2].trim();
    
    // Convert to superscript/subscript with fraction slash
    const superNumerator = numerator.split('').map(toSuperscript).join('');
    const subDenominator = denominator.split('').map(toSubscript).join('');
    const fractionText = superNumerator + '⁄' + subDenominator; // Unicode fraction slash ⁄

    const newText = text.substring(0, start) + fractionText + text.substring(end);
    setText(newText);

    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start + fractionText.length, start + fractionText.length);
    }, 0);
  };

  const handleOverline = () => {
    const input = inputRef.current;
    const start = input.selectionStart;
    const end = input.selectionEnd;

    if (start === end) {
      alert("Please select some text first!");
      return;
    }

    const selectedText = text.substring(start, end);
    
    // Simply add apostrophe (') to show as complement notation
    const overlineText = selectedText + "'";

    const newText = text.substring(0, start) + overlineText + text.substring(end);
    setText(newText);

    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start + overlineText.length, start + overlineText.length);
    }, 0);
  };

  const handlePrintPdf = async () => {
    if (!text) {
      alert("Please enter some text first!");
      return;
    }

    const doc = new jsPDF({ unit: "mm", format: "a4" });

    try {
      // Load TTF font from public folder
      const response = await fetch("/fonts/NotoSansMath-Regular.ttf");
      const fontData = await response.arrayBuffer();
      
      // Convert to base64
      const base64Font = btoa(
        new Uint8Array(fontData).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ""
        )
      );

      // Add math font to jsPDF
      doc.addFileToVFS("NotoSansMath.ttf", base64Font);
      doc.addFont("NotoSansMath.ttf", "NotoSansMath", "normal");
      
      doc.setFontSize(14);

      // Helper function to detect math symbols
      const isMathSymbol = (char) => {
        const mathSymbols = /[π√∫∞≤≥±→←∑∏∂∇∆∈∉∪∩⊂⊃∀∃∧∨¬∝∞≠≈≡≅∼⊕⊗∠∥⊥°′″⁄]/;
        return mathSymbols.test(char);
      };

      // Helper function to detect superscripts
      const isSuperscript = (char) => {
        return /[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖʳˢᵗᵘᵛʷˣʸᶻ]/.test(char);
      };

      // Helper function to detect subscripts
      const isSubscript = (char) => {
        return /[₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎ₐₑₕᵢⱼₖₗₘₙₒₚᵣₛₜᵤᵥₓ]/.test(char);
      };

      // Convert Unicode superscript to normal character
      const superscriptToNormal = (char) => {
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
      const subscriptToNormal = (char) => {
        const map = { 
          '₀':'0', '₁':'1', '₂':'2', '₃':'3', '₄':'4', '₅':'5', '₆':'6', '₇':'7', '₈':'8', '₉':'9', 
          '₊':'+', '₋':'-', '₌':'=', '₍':'(', '₎':')',
          'ₐ':'a', 'ₑ':'e', 'ₕ':'h', 'ᵢ':'i', 'ⱼ':'j', 'ₖ':'k', 'ₗ':'l', 'ₘ':'m', 'ₙ':'n',
          'ₒ':'o', 'ₚ':'p', 'ᵣ':'r', 'ₛ':'s', 'ₜ':'t', 'ᵤ':'u', 'ᵥ':'v', 'ₓ':'x'
        };
        return map[char] || char;
      };

      // Function to draw a fraction
      const drawFraction = (numerator, denominator, x, y) => {
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

      // Function to draw overline (NOT gate bar)
      const drawOverline = (textContent, x, y) => {
        doc.setFont("times");
        const textWidth = doc.getTextWidth(textContent);
        
        // Draw the text
        doc.text(textContent, x, y);
        
        // Draw line above text
        doc.line(x, y - 3, x + textWidth, y - 3);
        
        return x + textWidth;
      };

      // Function to print mixed text with auto font switching, super/subscripts, and fractions
      const printMixedText = (text, x, y) => {
        let currentX = x;
        const normalSize = doc.internal.getFontSize();
        
        // Parse fractions (superscript chars + ⁄ + subscript chars)
        let i = 0;
        while (i < text.length) {
          const char = text[i];
          
          // Check for overline pattern: text followed by '
          // Look for pattern like A' or (A+B)'
          if (i > 0 && char === "'") {
            // Find the start of the expression to overline
            let j = i - 1;
            let overlineContent = '';
            let startPos = j;
            
            // If previous char is ), find matching (
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
              // Single character or simple expression
              // Go back to find start (stop at space, operator, or start)
              while (j >= 0 && /[A-Za-z0-9]/.test(text[j])) {
                j--;
              }
              startPos = j + 1;
              overlineContent = text.substring(startPos, i);
            }
            
            // We need to redraw from startPos with overline
            // Calculate how much to move back
            doc.setFont("times");
            const backWidth = doc.getTextWidth(overlineContent);
            currentX -= backWidth;
            
            // Draw with overline
            currentX = drawOverline(overlineContent, currentX, y);
            
            i++;
            continue;
          }
          
          // Check if this is start of a fraction pattern
          if (isSuperscript(char) || char === '⁽') {
            // Collect all consecutive superscripts (including parentheses and letters)
            let numerator = '';
            let j = i;
            while (j < text.length && isSuperscript(text[j])) {  // REMOVED: || text[j] === ' '
              numerator += superscriptToNormal(text[j]);
              j++;
            }
            
            // Check if followed by fraction slash
            if (j < text.length && text[j] === '⁄') {
              j++; // Skip the slash
              
              // Collect all consecutive subscripts (including parentheses and letters)
              let denominator = '';
              while (j < text.length && isSubscript(text[j])) {  // REMOVED: || text[j] === ' '
                denominator += subscriptToNormal(text[j]);
                j++;
              }
              
              // Draw fraction if we have both parts
              if (numerator && denominator) {
                currentX = drawFraction(numerator.trim(), denominator.trim(), currentX + 1, y);
                i = j;
                continue;
              }
            }
          }
          
          // Skip apostrophe if it's part of overline (already handled above)
          if (char === "'") {
            i++;
            continue;
          }
          
          // Normal character processing
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

      // Print the text from input
      printMixedText(text, 10, 20);
      
      doc.save("math-output.pdf");
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Error generating PDF. Check console for details.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Superscript & Subscript Converter</h2>
      
      <div style={{ marginBottom: "10px" }}>
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type text here (e.g., x2, H2O, (x+y)/2)"
          style={{
            width: "600px",
            padding: "10px",
            fontSize: "16px",
            marginRight: "10px"
          }}
        />
      </div>

      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={handleSuperscript}
          style={{
            padding: "10px 20px",
            fontSize: "14px",
            marginRight: "10px",
            cursor: "pointer"
          }}
        >
          x² Superscript
        </button>
        <button
          onClick={handleSubscript}
          style={{
            padding: "10px 20px",
            fontSize: "14px",
            marginRight: "10px",
            cursor: "pointer"
          }}
        >
          x₂ Subscript
        </button>
        <button
          onClick={handleFraction}
          style={{
            padding: "10px 20px",
            fontSize: "14px",
            marginRight: "10px",
            cursor: "pointer",
            backgroundColor: "#2196F3",
            color: "white",
            border: "none",
            borderRadius: "4px"
          }}
        >
          ¹⁄₂ Fraction
        </button>
        <button
          onClick={handleOverline}
          style={{
            padding: "10px 20px",
            fontSize: "14px",
            marginRight: "10px",
            cursor: "pointer",
            backgroundColor: "#FF9800",
            color: "white",
            border: "none",
            borderRadius: "4px"
          }}
        >
          A' Overline (NOT)
        </button>
        <button
          onClick={handlePrintPdf}
          style={{
            padding: "10px 20px",
            fontSize: "14px",
            cursor: "pointer",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px"
          }}
        >
          📄 Export to PDF
        </button>
      </div>

      <div style={{ marginTop: "20px", padding: "15px", background: "#f0f0f0", borderRadius: "5px" }}>
        <h3>Preview:</h3>
        <p style={{ fontSize: "20px", fontFamily: "Arial" }}>{text || "No text yet..."}</p>
      </div>

      <div style={{ marginTop: "20px", fontSize: "12px", color: "#666" }}>
        <strong>How to use:</strong>
        <ol>
          <li>Type text like "A", "A+B", or expressions</li>
          <li>Select the part you want to convert</li>
          <li>Click appropriate button for conversion</li>
          <li>Click "📄 Export to PDF" to download as PDF</li>
        </ol>
        <strong>Examples:</strong>
        <ul>
          <li>Type "A" → select "A" → click Overline → becomes "A'" (displays with overline in PDF)</li>
          <li>Type "A+B" → select "A+B" → click Overline → becomes "(A+B)'"</li>
          <li>Type "(x+y)/2" → select it → click Fraction → becomes "⁽ˣ⁺ʸ⁾⁄₂"</li>
        </ul>
      </div>
    </div>
  );
}