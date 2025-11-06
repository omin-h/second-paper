import React, { useRef, useState } from 'react';
import { LatexPreview, parseLatexFromText } from './latexRenderer';
import { printMixedContentToPDF } from './fractionJs';

const style = {
  container: { padding: '20px', fontFamily: 'sans-serif' },
  input: { padding: '10px', fontSize: '16px', width: '500px', marginRight: '10px' },
  btn: { padding: '10px 20px', fontSize: '16px', cursor: 'pointer', marginRight: '10px' },
  btnConvert: { background: '#2196F3', color: '#fff' },
  btnPrint: { background: '#4CAF50', color: '#fff' },
  displayLine: { background: '#ffffff', color: '#000000', padding: '12px', borderRadius: '6px', fontSize: '20px', marginTop: '20px' }
};

const  FractionCanvas = () => {
  const [inputText, setInputText] = useState('');
  const latexRefs = useRef([]);
  const inputRef = useRef(null);
  const parsedParts = parseLatexFromText(inputText);

  const handleConvert = () => {
    const input = inputRef.current;
    if (!input) return;

    const start = input.selectionStart;
    const end = input.selectionEnd;

    if (start === end) {
      alert('Please select LaTeX text to convert');
      return;
    }

    const selectedText = inputText.slice(start, end);

    if (selectedText.includes('\\')) {
      // Wrap selected text with ** ... **
      const newText =
        inputText.slice(0, start) +
        '**' + selectedText + '**' +
        inputText.slice(end);
      setInputText(newText);
    } else {
      alert('Selected text does not contain LaTeX commands');
    }
  };

  const handlePrint = async () => {
    console.log('=== BEFORE TRANSFER ===');
    console.log('parsedParts:', parsedParts);
    console.log('latexRefs.current:', latexRefs.current);
    
    const validLatexRefs = latexRefs.current.filter(ref => ref !== null);
    
    console.log('validLatexRefs count:', validLatexRefs.length);
    console.log('validLatexRefs:', validLatexRefs);
    
    // Log each element
    validLatexRefs.forEach((ref, index) => {
      console.log(`Ref ${index}:`, ref);
      console.log(`  - tagName: ${ref.tagName}`);
      console.log(`  - innerHTML:`, ref.innerHTML);
      console.log(`  - clientWidth: ${ref.clientWidth}px`);
      console.log(`  - clientHeight: ${ref.clientHeight}px`);
    });
    
    await printMixedContentToPDF(parsedParts, validLatexRefs);
  };

  let latexRefIndex = 0;

  return (
    <div style={style.container}>
      <h2 style={{ marginTop: 0 }}>LaTeX Math Equation Renderer</h2>

      <div style={{ marginBottom: '12px' }}>
        <input
          ref={inputRef}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder=""
          style={style.input}
        />
        <button style={{ ...style.btn, ...style.btnConvert }} onClick={handleConvert}>
          Convert to Equation
        </button>
        <button style={{ ...style.btn, ...style.btnPrint }} onClick={handlePrint}>
          Print to PDF
        </button>
      </div>

      <div style={style.displayLine}>
        {parsedParts.map((part, idx) => {
          if (part.type === 'latex') {
            const currentRef = latexRefIndex++;
            return (
              <LatexPreview
                key={idx}
                latex={part.content}
                ref={el => {
                  latexRefs.current[currentRef] = el;
                  console.log(`Setting latexRefs[${currentRef}]:`, el);
                }}
              />
            );
          }
          return <span key={idx}>{part.content}</span>;
        })}
      </div>
    </div>
  );
};

export default FractionCanvas;