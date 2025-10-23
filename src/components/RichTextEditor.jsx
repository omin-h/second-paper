import { useRef, useEffect } from "react";

export default function RichTextEditor({ value, onChange, placeholder = "Type here..." }) {
  const editorRef = useRef(null);

  // Apply formatting to selected text
  const applyFormat = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
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
        
        <div style={{ width: "1px", background: "#ccc", margin: "0 5px" }}></div>
        
        <button
          onClick={() => applyFormat('justifyLeft')}
          style={toolbarButtonStyle}
          title="Align Left"
        >
          ⬅
        </button>
        <button
          onClick={() => applyFormat('justifyCenter')}
          style={toolbarButtonStyle}
          title="Align Center"
        >
          ⬌
        </button>
        <button
          onClick={() => applyFormat('justifyRight')}
          style={toolbarButtonStyle}
          title="Align Right"
        >
          ➡
        </button>
      </div>

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
          lineHeight: "1.6"
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