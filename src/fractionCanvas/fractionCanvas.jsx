import React, { useState } from 'react';
import { printTextToPDF } from './fractionJs';

const FractionCanvas = () => {
  const [inputText, setInputText] = useState('');

  const handlePrint = () => {
    if (inputText.trim()) {
      printTextToPDF(inputText);
    } else {
      alert('Please enter some text before printing');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Text to PDF</h2>
      <div style={{ marginBottom: '10px' }}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Enter text to print"
          style={{
            padding: '10px',
            fontSize: '16px',
            width: '300px',
            marginRight: '10px'
          }}
        />
        <button
          onClick={handlePrint}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            cursor: 'pointer',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          Print to PDF
        </button>
      </div>
    </div>
  );
};

export default FractionCanvas;