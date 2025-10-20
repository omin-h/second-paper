import { useState, useRef } from "react";
import { jsPDF } from "jspdf";

export default function OverlineInput() {
  const [text, setText] = useState("");
  const inputRef = useRef(null);

  const handleOverline = () => {
    const input = inputRef.current;
    const start = input.selectionStart;
    const end = input.selectionEnd;

    if (start === end) {
      alert("Please select some text first!");
      return;
    }

    const selectedText = text.substring(start, end);
    
    // Add combining macron (̄) for overline
    let overlineText;
    
    if (selectedText.length === 1) {
      // Single character: A → Ā
      overlineText = selectedText + '\u0304';
    } else if (selectedText.startsWith('(') && selectedText.endsWith(')')) {
      // Already has brackets: (A+B) → (A+B)̄ (one macron for whole expression)
      overlineText = selectedText + '\u0304';
    } else {
      // Multiple characters or expression: A+B → (A+B)̄
      overlineText = '(' + selectedText + ')' + '\u0304';
    }

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

      // Function to draw overline (NOT gate bar)
      const drawOverline = (textContent, x, y) => {
        doc.setFont("times");
        const textWidth = doc.getTextWidth(textContent);
        
        // Draw the text
        doc.text(textContent, x, y);
        
        // Draw line above text
        doc.line(x, y - 4.2, x + textWidth, y - 4.2);
        
        return x + textWidth;
      };

      // Function to print text with overlines
      const printTextWithOverlines = (text, x, y) => {
        let currentX = x;
        let i = 0;
        
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
        
        while (i < text.length) {
          const char = text[i];
          
          // Skip macron characters
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
            
            // For bracket sections, we need to process the content recursively
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
                  
                  currentX = drawOverline(innerContent, currentX, y);
                  innerI = innerSection.end + 1; // Skip macron
                  continue;
                }
                
                // Normal character
                doc.setFont("times");
                doc.text(innerChar, currentX, y);
                currentX += doc.getTextWidth(innerChar);
                innerI++;
              }
              
              // Now draw the outer overline over the entire bracket expression
              // If there's a nested overline, draw this one higher
              const totalWidth = currentX - startX;
              doc.setFont("times");
              const outerLineY = hasNestedOverline ? y - 4.8 : y - 4.2;
              doc.line(startX, outerLineY, startX + totalWidth, outerLineY);
              
              // Skip to end of section + macron
              i = section.end + 1;
              continue;
            } else {
              // Single character overline
              currentX = drawOverline(overlineContent, currentX, y);
              i = section.end + 1;
              continue;
            }
          }
          
          // Normal character processing
          doc.setFont("times");
          doc.text(char, currentX, y);
          currentX += doc.getTextWidth(char);
          
          i++;
        }
        
        return currentX;
      };

      // Print the text from input
      printTextWithOverlines(text, 10, 20);
      
      doc.save("overline-output.pdf");
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Error generating PDF. Check console for details.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Overline (NOT Gate) Converter</h2>
      
      <div style={{ marginBottom: "10px" }}>
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type text here (e.g., A, A+B, Ben's)"
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
          A̅ Add Overline (NOT)
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
    </div>
  );
}