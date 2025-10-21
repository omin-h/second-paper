import { useState } from "react";
import RichTextEditor from "./components/RichTextEditor";
import { printPaper } from "./utils/printPaper";
import "./styles/secondPaper.css";

export default function SecondPaper() {
  const [questions, setQuestions] = useState([
    { 
      id: 1, 
      text: "", 
      image: null, 
      table: null,
      subQuestions: []
    }
  ]);
  const [showTableModal, setShowTableModal] = useState(null);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [isPrinting, setIsPrinting] = useState(false);

  const addQuestion = () => {
    setQuestions([...questions, { 
      id: questions.length + 1, 
      text: "", 
      image: null, 
      table: null,
      subQuestions: []
    }]);
  };


  
  const updateQuestion = (id, text) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, text } : q));
  };




  const deleteQuestion = (id) => {
    setQuestions(questions.filter(q => q.id !== id).map((q, index) => ({ 
      ...q, 
      id: index + 1 
    })));
  };




  const handleImageUpload = (id, event, subIndex = null, nestedIndex = null) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setQuestions(questions.map(q => {
          if (q.id === id) {
            if (subIndex !== null && nestedIndex !== null) {
              // Update nested sub-question image
              const newSubQuestions = [...q.subQuestions];
              const newNestedSubQuestions = [...newSubQuestions[subIndex].subQuestions];
              newNestedSubQuestions[nestedIndex] = { ...newNestedSubQuestions[nestedIndex], image: e.target.result };
              newSubQuestions[subIndex] = { ...newSubQuestions[subIndex], subQuestions: newNestedSubQuestions };
              return { ...q, subQuestions: newSubQuestions };
            } else if (subIndex !== null) {
              // Update sub-question image
              const newSubQuestions = [...q.subQuestions];
              newSubQuestions[subIndex] = { ...newSubQuestions[subIndex], image: e.target.result };
              return { ...q, subQuestions: newSubQuestions };
            } else {
              // Update main question image
              return { ...q, image: e.target.result };
            }
          }
          return q;
        }));
      };
      reader.readAsDataURL(file);
    }
  };




  const removeImage = (id, subIndex = null, nestedIndex = null) => {
    setQuestions(questions.map(q => {
      if (q.id === id) {
        if (subIndex !== null && nestedIndex !== null) {
          const newSubQuestions = [...q.subQuestions];
          const newNestedSubQuestions = [...newSubQuestions[subIndex].subQuestions];
          newNestedSubQuestions[nestedIndex] = { ...newNestedSubQuestions[nestedIndex], image: null };
          newSubQuestions[subIndex] = { ...newSubQuestions[subIndex], subQuestions: newNestedSubQuestions };
          return { ...q, subQuestions: newSubQuestions };
        } else if (subIndex !== null) {
          const newSubQuestions = [...q.subQuestions];
          newSubQuestions[subIndex] = { ...newSubQuestions[subIndex], image: null };
          return { ...q, subQuestions: newSubQuestions };
        } else {
          return { ...q, image: null };
        }
      }
      return q;
    }));
  };




  const openTableModal = (id, subIndex = null, nestedIndex = null) => {
    setShowTableModal({ questionId: id, subIndex, nestedIndex });
    setTableRows(3);
    setTableCols(3);
  };




  const createTable = () => {
    const { questionId, subIndex, nestedIndex } = showTableModal;
    const newTable = {
      rows: tableRows,
      cols: tableCols,
      data: Array(tableRows).fill(null).map(() => Array(tableCols).fill(''))
    };
    



    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        if (subIndex !== null && nestedIndex !== null) {
          const newSubQuestions = [...q.subQuestions];
          const newNestedSubQuestions = [...newSubQuestions[subIndex].subQuestions];
          newNestedSubQuestions[nestedIndex] = { ...newNestedSubQuestions[nestedIndex], table: newTable };
          newSubQuestions[subIndex] = { ...newSubQuestions[subIndex], subQuestions: newNestedSubQuestions };
          return { ...q, subQuestions: newSubQuestions };
        } else if (subIndex !== null) {
          const newSubQuestions = [...q.subQuestions];
          newSubQuestions[subIndex] = { ...newSubQuestions[subIndex], table: newTable };
          return { ...q, subQuestions: newSubQuestions };
        } else {
          return { ...q, table: newTable };
        }
      }
      return q;
    }));
    setShowTableModal(null);
  };




  const updateTableCell = (questionId, rowIndex, colIndex, value, subIndex = null, nestedIndex = null) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        if (subIndex !== null && nestedIndex !== null && q.subQuestions[subIndex]?.subQuestions[nestedIndex]?.table) {
          const newSubQuestions = [...q.subQuestions];
          const newNestedSubQuestions = [...newSubQuestions[subIndex].subQuestions];
          const newData = newNestedSubQuestions[nestedIndex].table.data.map((row, rIdx) => 
            rIdx === rowIndex 
              ? row.map((cell, cIdx) => cIdx === colIndex ? value : cell)
              : row
          );
          newNestedSubQuestions[nestedIndex] = { 
            ...newNestedSubQuestions[nestedIndex], 
            table: { ...newNestedSubQuestions[nestedIndex].table, data: newData } 
          };
          newSubQuestions[subIndex] = { ...newSubQuestions[subIndex], subQuestions: newNestedSubQuestions };
          return { ...q, subQuestions: newSubQuestions };
        } else if (subIndex !== null && q.subQuestions[subIndex]?.table) {
          const newSubQuestions = [...q.subQuestions];
          const newData = newSubQuestions[subIndex].table.data.map((row, rIdx) => 
            rIdx === rowIndex 
              ? row.map((cell, cIdx) => cIdx === colIndex ? value : cell)
              : row
          );
          newSubQuestions[subIndex] = { 
            ...newSubQuestions[subIndex], 
            table: { ...newSubQuestions[subIndex].table, data: newData } 
          };
          return { ...q, subQuestions: newSubQuestions };
        } else if (q.table) {
          const newData = q.table.data.map((row, rIdx) => 
            rIdx === rowIndex 
              ? row.map((cell, cIdx) => cIdx === colIndex ? value : cell)
              : row
          );
          return { ...q, table: { ...q.table, data: newData } };
        }
      }
      return q;
    }));
  };




  const removeTable = (id, subIndex = null, nestedIndex = null) => {
    setQuestions(questions.map(q => {
      if (q.id === id) {
        if (subIndex !== null && nestedIndex !== null) {
          const newSubQuestions = [...q.subQuestions];
          const newNestedSubQuestions = [...newSubQuestions[subIndex].subQuestions];
          newNestedSubQuestions[nestedIndex] = { ...newNestedSubQuestions[nestedIndex], table: null };
          newSubQuestions[subIndex] = { ...newSubQuestions[subIndex], subQuestions: newNestedSubQuestions };
          return { ...q, subQuestions: newSubQuestions };
        } else if (subIndex !== null) {
          const newSubQuestions = [...q.subQuestions];
          newSubQuestions[subIndex] = { ...newSubQuestions[subIndex], table: null };
          return { ...q, subQuestions: newSubQuestions };
        } else {
          return { ...q, table: null };
        }
      }
      return q;
    }));
  };




  const addSubQuestion = (questionId, subIndex = null) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        if (subIndex !== null) {
          // Add nested sub-question
          const newSubQuestions = [...q.subQuestions];
          if (!newSubQuestions[subIndex].subQuestions) {
            newSubQuestions[subIndex].subQuestions = [];
          }
          newSubQuestions[subIndex].subQuestions = [
            ...newSubQuestions[subIndex].subQuestions,
            { text: "", image: null, table: null }
          ];
          return { ...q, subQuestions: newSubQuestions };
        } else {
          // Add main sub-question
          const newSubQuestions = [...q.subQuestions, { 
            text: "", 
            image: null, 
            table: null,
            subQuestions: []
          }];
          return { ...q, subQuestions: newSubQuestions };
        }
      }
      return q;
    }));
  };




  const updateSubQuestion = (questionId, subIndex, text, nestedIndex = null) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        const newSubQuestions = [...q.subQuestions];
        if (nestedIndex !== null) {
          const newNestedSubQuestions = [...newSubQuestions[subIndex].subQuestions];
          newNestedSubQuestions[nestedIndex] = { ...newNestedSubQuestions[nestedIndex], text };
          newSubQuestions[subIndex] = { ...newSubQuestions[subIndex], subQuestions: newNestedSubQuestions };
        } else {
          newSubQuestions[subIndex] = { ...newSubQuestions[subIndex], text };
        }
        return { ...q, subQuestions: newSubQuestions };
      }
      return q;
    }));
  };




  const deleteSubQuestion = (questionId, subIndex, nestedIndex = null) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        const newSubQuestions = [...q.subQuestions];
        if (nestedIndex !== null) {
          newSubQuestions[subIndex].subQuestions = newSubQuestions[subIndex].subQuestions.filter((_, idx) => idx !== nestedIndex);
        } else {
          return { ...q, subQuestions: q.subQuestions.filter((_, idx) => idx !== subIndex) };
        }
        return { ...q, subQuestions: newSubQuestions };
      }
      return q;
    }));
  };




  const getSubQuestionLabel = (index) => {
    return String.fromCharCode(97 + index); // a, b, c, d...
  };




  const getRomanNumeral = (index) => {
    const romanNumerals = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x'];
    return romanNumerals[index] || `(${index + 1})`;
  };




  const handlePrint = async () => {
    setIsPrinting(true);
    const result = await printPaper(questions);
    setIsPrinting(false);
    
    if (!result.success) {
      alert("Error generating PDF: " + result.error);
    }
  };




  const renderQuestionBlock = (question, questionId, level = 'main', subIndex = null, nestedIndex = null) => {
    let label;
    if (level === 'nested') {
      label = getRomanNumeral(nestedIndex);
    } else if (level === 'sub') {
      label = getSubQuestionLabel(subIndex);
    } else {
      label = question.id;
    }
    





    return (
      <div className={level !== 'main' ? "sub-question-container" : ""}>
        <RichTextEditor
          value={question.text}
          onChange={(text) => {
            if (level === 'nested') {
              updateSubQuestion(questionId, subIndex, text, nestedIndex);
            } else if (level === 'sub') {
              updateSubQuestion(questionId, subIndex, text);
            } else {
              updateQuestion(questionId, text);
            }
          }}
          placeholder={
            level === 'nested' 
              ? `Type nested sub-question ${label} here...`
              : level === 'sub'
              ? `Type sub-question ${label} here...`
              : `Type question ${questionId} here...`
          }
        />

        <div className="image-upload-section">
          <label className="image-upload-label">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(questionId, e, subIndex, nestedIndex)}
              className="image-upload-input"
            />
            📷 Add Image
          </label>

          <button
            onClick={() => openTableModal(questionId, subIndex, nestedIndex)}
            className="table-add-button"
          >
            📊 Add Table
          </button>

          {level === 'main' && (
            <button
              onClick={() => addSubQuestion(questionId)}
              className="sub-question-button"
            >
              ➕ Add Sub Question
            </button>
          )}

          {level === 'sub' && (
            <button
              onClick={() => addSubQuestion(questionId, subIndex)}
              className="nested-sub-question-button"
            >
              ➕ Add Nested Sub Question
            </button>
          )}

          {question.image && (
            <div className="image-preview-container">
              <img 
                src={question.image} 
                alt={`Question ${label}`}
                className="uploaded-image"
              />
              <button
                onClick={() => removeImage(questionId, subIndex, nestedIndex)}
                className="remove-image-button"
              >
                ✖ Remove Image
              </button>
            </div>
          )}

          {question.table && (
            <div className="table-edit-container">
              <div className="table-header">
                <h4>Table ({question.table.rows} × {question.table.cols})</h4>
                <button
                  onClick={() => removeTable(questionId, subIndex, nestedIndex)}
                  className="remove-table-button"
                >
                  ✖ Remove Table
                </button>
              </div>
              <table className="editable-table">
                <tbody>
                  {question.table.data.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, colIndex) => (
                        <td key={colIndex}>
                          <input
                            type="text"
                            value={cell}
                            onChange={(e) => updateTableCell(questionId, rowIndex, colIndex, e.target.value, subIndex, nestedIndex)}
                            className="table-cell-input"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="second-paper-container">
      <div className="second-paper-layout">
        {/* Left Side - Input Boxes */}
        <div className="left-side">
          {questions.map((question) => (
            <div key={question.id} className="question-container">
              <div className="question-header">
                <h2 className="question-title">
                  Question {question.id}:
                </h2>
                {questions.length > 1 && (
                  <button
                    onClick={() => deleteQuestion(question.id)}
                    className="delete-button"
                  >
                    Delete
                  </button>
                )}
              </div>
              
              {renderQuestionBlock(question, question.id, 'main')}

              {/* Render Sub Questions */}
              {question.subQuestions.map((subQuestion, subIndex) => (
                <div key={subIndex} className="sub-question-wrapper">
                  <div className="sub-question-header">
                    <h3 className="sub-question-title">
                      {getSubQuestionLabel(subIndex)}.
                    </h3>
                    <button
                      onClick={() => deleteSubQuestion(question.id, subIndex)}
                      className="delete-sub-button"
                    >
                      Delete
                    </button>
                  </div>
                  {renderQuestionBlock(subQuestion, question.id, 'sub', subIndex)}

                  {/* Render Nested Sub Questions */}
                  {subQuestion.subQuestions && subQuestion.subQuestions.map((nestedSub, nestedIndex) => (
                    <div key={nestedIndex} className="nested-sub-question-wrapper">
                      <div className="nested-sub-question-header">
                        <h4 className="nested-sub-question-title">
                          {getRomanNumeral(nestedIndex)}.
                        </h4>
                        <button
                          onClick={() => deleteSubQuestion(question.id, subIndex, nestedIndex)}
                          className="delete-nested-button"
                        >
                          Delete
                        </button>
                      </div>
                      {renderQuestionBlock(nestedSub, question.id, 'nested', subIndex, nestedIndex)}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}

          <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            <button
              onClick={addQuestion}
              className="add-question-button"
            >
              + Add New Question
            </button>
            
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="print-button"
            >
              {isPrinting ? "⏳ Generating..." : "📄 Print to PDF"}
            </button>
          </div>
        </div>

        {/* Right Side - Preview */}
        <div className="right-side">
          <div className="preview-container">
            <h3 className="preview-title">Preview:</h3>
            
            {questions.map((question) => {
              const hasMainQuestionText = question.text && question.text.trim() !== '';
              
              return (
                <div key={question.id}>
                  {/* Main Question */}
                  {hasMainQuestionText ? (
                    <div className="preview-question">
                      <div className="question-number">
                        {question.id}.
                      </div>
                      <div className="question-content">
                        <div dangerouslySetInnerHTML={{ __html: question.text }} />
                        {question.image && (
                          <div className="preview-image-container">
                            <img 
                              src={question.image} 
                              alt={`Question ${question.id}`}
                              className="preview-image"
                            />
                          </div>
                        )}
                        {question.table && (
                          <div className="preview-table-container">
                            <table className="preview-table">
                              <tbody>
                                {question.table.data.map((row, rowIndex) => (
                                  <tr key={rowIndex}>
                                    {row.map((cell, colIndex) => (
                                      <td key={colIndex}>{cell || '\u00A0'}</td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : question.subQuestions.length === 0 ? (
                    <div className="preview-question">
                      <div className="question-number">{question.id}.</div>
                      <div className="question-content">
                        <em style={{ color: '#999' }}>No question {question.id} yet...</em>
                      </div>
                    </div>
                  ) : null}

                  {/* Render Sub Questions */}
                  {question.subQuestions.map((subQuestion, subIndex) => (
                    <div key={subIndex}>
                      <div className="preview-question preview-sub-question-inline">
                        <div className="question-number sub-question-number">
                          {subIndex === 0 && !hasMainQuestionText && `${question.id}. `}
                          {getSubQuestionLabel(subIndex)})
                        </div>
                        <div className="question-content">
                          <div dangerouslySetInnerHTML={{ 
                            __html: subQuestion.text || `<em style='color: #999;'>No sub-question ${getSubQuestionLabel(subIndex)} yet...</em>` 
                          }} />
                          {subQuestion.image && (
                            <div className="preview-image-container">
                              <img 
                                src={subQuestion.image} 
                                alt={`Sub-question ${getSubQuestionLabel(subIndex)}`}
                                className="preview-image"
                              />
                            </div>
                          )}
                          {subQuestion.table && (
                            <div className="preview-table-container">
                              <table className="preview-table">
                                <tbody>
                                  {subQuestion.table.data.map((row, rowIndex) => (
                                    <tr key={rowIndex}>
                                      {row.map((cell, colIndex) => (
                                        <td key={colIndex}>{cell || '\u00A0'}</td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Render Nested Sub Questions */}
                      {subQuestion.subQuestions && subQuestion.subQuestions.map((nestedSub, nestedIndex) => (
                        <div key={nestedIndex} className="preview-question preview-nested-sub-question">
                          <div className="question-number nested-sub-question-number">
                            {getRomanNumeral(nestedIndex)})
                          </div>
                          <div className="question-content">
                            <div dangerouslySetInnerHTML={{ 
                              __html: nestedSub.text || `<em style='color: #999;'>No nested sub-question ${getRomanNumeral(nestedIndex)} yet...</em>` 
                            }} />
                            {nestedSub.image && (
                              <div className="preview-image-container">
                                <img 
                                  src={nestedSub.image} 
                                  alt={`Nested sub-question ${getRomanNumeral(nestedIndex)}`}
                                  className="preview-image"
                                />
                              </div>
                            )}
                            {nestedSub.table && (
                              <div className="preview-table-container">
                                <table className="preview-table">
                                  <tbody>
                                    {nestedSub.table.data.map((row, rowIndex) => (
                                      <tr key={rowIndex}>
                                        {row.map((cell, colIndex) => (
                                          <td key={colIndex}>{cell || '\u00A0'}</td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Table Creation Modal */}
      {showTableModal !== null && (
        <div className="modal-overlay" onClick={() => setShowTableModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Create Table</h3>
            <div className="modal-input-group">
              <label>
                Rows:
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={tableRows}
                  onChange={(e) => setTableRows(parseInt(e.target.value) || 1)}
                  className="modal-input"
                />
              </label>
              <label>
                Columns:
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={tableCols}
                  onChange={(e) => setTableCols(parseInt(e.target.value) || 1)}
                  className="modal-input"
                />
              </label>
            </div>
            <div className="modal-buttons">
              <button
                onClick={createTable}
                className="modal-create-button"
              >
                Create
              </button>
              <button
                onClick={() => setShowTableModal(null)}
                className="modal-cancel-button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}