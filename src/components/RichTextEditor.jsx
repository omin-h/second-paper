import { useRef, useEffect, useState } from "react";
import katex from 'katex';
import 'katex/dist/katex.min.css';

export default function RichTextEditor({ value, onChange, placeholder = "Type here..." }) {
  const editorRef = useRef(null);
  const [showLatexModal, setShowLatexModal] = useState(false);
  const [latexInput, setLatexInput] = useState('');
  const savedRangeRef = useRef(null); // Store cursor position

  // Apply formatting to selected text
  const applyFormat = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  // Convert selected text to superscript Unicode characters
  const applySuperscript = () => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    
    if (!selectedText) return;
    
    // Map normal characters to superscript Unicode
    const superscriptMap = {
      '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
      '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾', 'n': 'ⁿ',
      'a': 'ᵃ', 'b': 'ᵇ', 'c': 'ᶜ', 'd': 'ᵈ', 'e': 'ᵉ', 'f': 'ᶠ', 'g': 'ᵍ', 'h': 'ʰ', 'i': 'ⁱ',
      'j': 'ʲ', 'k': 'ᵏ', 'l': 'ˡ', 'm': 'ᵐ', 'o': 'ᵒ', 'p': 'ᵖ', 'r': 'ʳ', 's': 'ˢ',
      't': 'ᵗ', 'u': 'ᵘ', 'v': 'ᵛ', 'w': 'ʷ', 'x': 'ˣ', 'y': 'ʸ', 'z': 'ᶻ',
      'A': 'ᴬ', 'B': 'ᴮ', 'D': 'ᴰ', 'E': 'ᴱ', 'G': 'ᴳ', 'H': 'ᴴ', 'I': 'ᴵ', 'J': 'ᴶ', 'K': 'ᴷ', 'L': 'ᴸ',
      'M': 'ᴹ', 'N': 'ᴺ', 'O': 'ᴼ', 'P': 'ᴾ', 'R': 'ᴿ', 'T': 'ᵀ', 'U': 'ᵁ', 'V': 'ⱽ', 'W': 'ᵂ'
    };
    
    const superscriptText = selectedText.split('').map(char => 
      superscriptMap[char.toLowerCase()] || char
    ).join('');
    
    range.deleteContents();
    range.insertNode(document.createTextNode(superscriptText));
    
    // Clear selection and trigger change
    selection.removeAllRanges();
    handleInput();
    editorRef.current?.focus();
  };

  // Convert selected text to subscript Unicode characters
  const applySubscript = () => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    
    if (!selectedText) return;
    
    // Map normal characters to subscript Unicode
    const subscriptMap = {
      '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
      '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
      'a': 'ₐ', 'e': 'ₑ', 'h': 'ₕ', 'i': 'ᵢ', 'j': 'ⱼ', 'k': 'ₖ', 'l': 'ₗ', 'm': 'ₘ', 'n': 'ₙ',
      'o': 'ₒ', 'p': 'ₚ', 'r': 'ᵣ', 's': 'ₛ', 't': 'ₜ', 'u': 'ᵤ', 'v': 'ᵥ', 'x': 'ₓ',
      'A': 'ₐ', 'E': 'ₑ', 'H': 'ₕ', 'I': 'ᵢ', 'J': 'ⱼ', 'K': 'ₖ', 'L': 'ₗ', 'M': 'ₘ', 'N': 'ₙ',
      'O': 'ₒ', 'P': 'ₚ', 'R': 'ᵣ', 'S': 'ₛ', 'T': 'ₜ', 'U': 'ᵤ', 'V': 'ᵥ', 'X': 'ₓ', 'Y': 'ᵧ'
    };
    
    const subscriptText = selectedText.split('').map(char => 
      subscriptMap[char.toLowerCase()] || char
    ).join('');
    
    range.deleteContents();
    range.insertNode(document.createTextNode(subscriptText));
    
    // Clear selection and trigger change
    selection.removeAllRanges();
    handleInput();
    editorRef.current?.focus();
  };

  // Apply overline (using combining macron U+0304)
  const applyOverline = () => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    
    if (!selectedText) {
      alert("Please select some text first!");
      return;
    }
    
    // Add combining macron (̄) for overline
    let overlineText;
    
    if (selectedText.length === 1) {
      // Single character: A → Ā
      overlineText = selectedText + '\u0304';
    } else if (selectedText.startsWith('(') && selectedText.endsWith(')')) {
      // Already has brackets: (A+B) → (A+B)̄
      overlineText = selectedText + '\u0304';
    } else {
      // Multiple characters or expression: A+B → (A+B)̄
      overlineText = '(' + selectedText + ')' + '\u0304';
    }
    
    range.deleteContents();
    range.insertNode(document.createTextNode(overlineText));
    
    // Clear selection and trigger change
    selection.removeAllRanges();
    handleInput();
    editorRef.current?.focus();
  };

  // Convert selected text to fraction Unicode characters
  const applyFraction = () => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString();

    if (!selectedText) {
      alert("Please select text in fraction format (e.g., 20/100 or (x+y)/2)");
      return;
    }

    // Match fraction pattern: a/b, (x+y)/2, etc.
    const fractionMatch = selectedText.match(/^(.+)\/(.+)$/);
    if (!fractionMatch) {
      alert("Please select text in fraction format (e.g., 20/100 or (x+y)/2)");
      return;
    }

    const numerator = fractionMatch[1].trim();
    const denominator = fractionMatch[2].trim();

    // Superscript and subscript maps (reuse from above)
    const superscriptMap = {
      '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
      '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾', 'n': 'ⁿ',
      'a': 'ᵃ', 'b': 'ᵇ', 'c': 'ᶜ', 'd': 'ᵈ', 'e': 'ᵉ', 'f': 'ᶠ', 'g': 'ᵍ', 'h': 'ʰ', 'i': 'ⁱ',
      'j': 'ʲ', 'k': 'ᵏ', 'l': 'ˡ', 'm': 'ᵐ', 'o': 'ᵒ', 'p': 'ᵖ', 'r': 'ʳ', 's': 'ˢ',
      't': 'ᵗ', 'u': 'ᵘ', 'v': 'ᵛ', 'w': 'ʷ', 'x': 'ˣ', 'y': 'ʸ', 'z': 'ᶻ',
      'A': 'ᴬ', 'B': 'ᴮ', 'D': 'ᴰ', 'E': 'ᴱ', 'G': 'ᴳ', 'H': 'ᴴ', 'I': 'ᴵ', 'J': 'ᴶ', 'K': 'ᴷ', 'L': 'ᴸ',
      'M': 'ᴹ', 'N': 'ᴺ', 'O': 'ᴼ', 'P': 'ᴾ', 'R': 'ᴿ', 'T': 'ᵀ', 'U': 'ᵁ', 'V': 'ⱽ', 'W': 'ᵂ'
    };
    const subscriptMap = {
      '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
      '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
      'a': 'ₐ', 'e': 'ₑ', 'h': 'ₕ', 'i': 'ᵢ', 'j': 'ⱼ', 'k': 'ₖ', 'l': 'ₗ', 'm': 'ₘ', 'n': 'ₙ',
      'o': 'ₒ', 'p': 'ₚ', 'r': 'ᵣ', 's': 'ₛ', 't': 'ₜ', 'u': 'ᵤ', 'v': 'ᵥ', 'x': 'ₓ',
      'A': 'ₐ', 'E': 'ₑ', 'H': 'ₕ', 'I': 'ᵢ', 'J': 'ⱼ', 'K': 'ₖ', 'L': 'ₗ', 'M': 'ₘ', 'N': 'ₙ',
      'O': 'ₒ', 'P': 'ₚ', 'R': 'ᵣ', 'S': 'ₛ', 'T': 'ₜ', 'U': 'ᵤ', 'V': 'ᵥ', 'X': 'ₓ', 'Y': 'ᵧ'
    };

    const toSuperscript = (char) => superscriptMap[char] || superscriptMap[char.toLowerCase()] || char;
    const toSubscript = (char) => subscriptMap[char] || subscriptMap[char.toLowerCase()] || char;

    const superNumerator = numerator.split('').map(toSuperscript).join('');
    const subDenominator = denominator.split('').map(toSubscript).join('');
    const fractionText = superNumerator + '⁄' + subDenominator;

    range.deleteContents();
    range.insertNode(document.createTextNode(fractionText));

    // Clear selection and trigger change
    selection.removeAllRanges();
    handleInput();
    editorRef.current?.focus();
  };

  // Open LaTeX modal and save cursor position
  const openLatexModal = () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      savedRangeRef.current = selection.getRangeAt(0).cloneRange();
    }
    setShowLatexModal(true);
  };

  // Insert LaTeX equation
  const insertLatex = () => {
    if (!latexInput.trim()) {
      alert("Please enter a LaTeX expression");
      return;
    }

    try {
      // Create a temporary container to render LaTeX
      const tempContainer = document.createElement('span');
      tempContainer.style.display = 'inline-block';
      tempContainer.style.verticalAlign = 'middle';
      tempContainer.style.margin = '0 4px';
      tempContainer.contentEditable = 'false';
      tempContainer.className = 'latex-equation';
      
      // Render LaTeX using KaTeX
      katex.render(latexInput, tempContainer, {
        throwOnError: false,
        displayMode: false
      });

      // Insert the rendered LaTeX into the editor
      if (editorRef.current) {
        let range = savedRangeRef.current;
        
        // If no saved range, create one at the end
        if (!range) {
          range = document.createRange();
          range.selectNodeContents(editorRef.current);
          range.collapse(false);
        }
        
        // Insert equation at cursor position
        range.insertNode(tempContainer);
        
        // Create a space after the equation
        const spaceNode = document.createTextNode('\u00A0');
        range.setStartAfter(tempContainer);
        range.insertNode(spaceNode);
        
        // Move cursor after the space
        range.setStartAfter(spaceNode);
        range.setEndAfter(spaceNode);
        
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        
        // Focus and trigger change
        editorRef.current.focus();
        handleInput();
      }

      // Clear and close modal
      setLatexInput('');
      setShowLatexModal(false);
      savedRangeRef.current = null;
      
    } catch (error) {
      console.error('LaTeX rendering error:', error);
      alert('Invalid LaTeX expression');
    }
  };

  // Handle content changes
  const handleInput = () => {
    if (editorRef.current && onChange) {
      onChange(editorRef.current.innerHTML);
    }
  };

  // Set initial content
  useEffect(() => {
    if (editorRef.current && value && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  return (
    <div>
      {/* Toolbar */}
      <div style={{
        display: "flex",
        gap: "5px",
        padding: "10px",
        background: "#f8f8f8",
        border: "2px solid #ccc",
        borderBottom: "1px solid #ccc",
        borderRadius: "4px 4px 0 0",
        flexWrap: "wrap"
      }}>
        <button
          onClick={() => applyFormat('bold')}
          style={toolbarButtonStyle}
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          onClick={() => applyFormat('italic')}
          style={toolbarButtonStyle}
          title="Italic"
        >
          <em>I</em>
        </button>
        <button
          onClick={() => applyFormat('underline')}
          style={toolbarButtonStyle}
          title="Underline"
        >
          <u>U</u>
        </button>
        <button
          onClick={() => applyFormat('strikeThrough')}
          style={toolbarButtonStyle}
          title="Strikethrough"
        >
          <s>S</s>
        </button>
        
        <div style={{ width: "1px", background: "#ccc", margin: "0 5px" }}></div>
        
        <button
          onClick={applySuperscript}
          style={toolbarButtonStyle}
          title="Superscript"
        >
          x²
        </button>
        <button
          onClick={applySubscript}
          style={toolbarButtonStyle}
          title="Subscript"
        >
          x₂
        </button>
        <button
          onClick={applyOverline}
          style={toolbarButtonStyle}
          title="Overline (NOT gate)"
        >
          A̅
        </button>
        <button
          onClick={applyFraction}
          style={toolbarButtonStyle}
          title="Fraction (a/b → ᵃ⁄ᵦ)"
        >
          ¹⁄₂
        </button>
        
        <div style={{ width: "1px", background: "#ccc", margin: "0 5px" }}></div>
        
        <button
          onClick={openLatexModal}
          style={{...toolbarButtonStyle, backgroundColor: "#ffffffff", color: "black"}}
          title="Insert LaTeX Equation"
        >
          ∫ LaTeX
        </button>
        
        <div style={{ width: "1px", background: "#ccc", margin: "0 5px" }}></div>
        
        <button
          onClick={() => applyFormat('insertOrderedList')}
          style={toolbarButtonStyle}
          title="Ordered List"
        >
          1.
        </button>
        <button
          onClick={() => applyFormat('insertUnorderedList')}
          style={toolbarButtonStyle}
          title="Bullet List"
        >
          •
        </button>
        
      </div>

      {/* LaTeX Input Modal */}
      {showLatexModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            minWidth: '400px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ marginTop: 0 }}>Insert LaTeX Equation</h3>
            <input
              type="text"
              value={latexInput}
              onChange={(e) => setLatexInput(e.target.value)}
              placeholder="e.g., \frac{x+y}{2} or x^2 + y^2"
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '14px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                marginBottom: '10px',
                boxSizing: 'border-box'
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  insertLatex();
                }
              }}
            />
            <div style={{ 
              padding: '10px', 
              background: '#f5f5f5', 
              borderRadius: '4px',
              minHeight: '40px',
              marginBottom: '15px'
            }}>
              <strong>Preview:</strong>
              <div 
                style={{ marginTop: '5px' }}
                dangerouslySetInnerHTML={{
                  __html: latexInput ? (() => {
                    try {
                      return katex.renderToString(latexInput, { throwOnError: false });
                    } catch {
                      return '<span style="color: red;">Invalid LaTeX</span>';
                    }
                  })() : '<span style="color: #999;">Enter LaTeX above</span>'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setLatexInput('');
                  setShowLatexModal(false);
                }}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #ccc',
                  background: 'white',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={insertLatex}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  background: '#9C27B0',
                  color: 'white',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editable Content Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        style={{
          minHeight: "150px",
          padding: "15px",
          border: "2px solid #ccc",
          borderTop: "none",
          borderRadius: "0 0 4px 4px",
          backgroundColor: "white",
          outline: "none",
          fontSize: "16px",
          lineHeight: "1.6",
          whiteSpace: "pre-wrap",
          wordWrap: "break-word"
        }}
        data-placeholder={placeholder}
      />

      <style>{`
        [contentEditable]:empty:before {
          content: attr(data-placeholder);
          color: #999;
          font-style: italic;
        }
      `}</style>
    </div>
  );
}

// Toolbar button style
const toolbarButtonStyle = {
  padding: "5px 10px",
  border: "1px solid #ccc",
  background: "white",
  cursor: "pointer",
  borderRadius: "3px",
  fontSize: "14px",
  minWidth: "30px",
  height: "30px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
};