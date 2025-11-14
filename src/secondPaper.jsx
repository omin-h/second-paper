import { useState } from "react";
import RichTextEditor from "./components/RichTextEditor";
import { printPaper } from "./utils/printPaper";
import "./styles/secondPaper.css";

export default function SecondPaper() {
  const [questions, setQuestions] = useState([
    { 
      id: 1, 
      text: "", 
      images: [], 
      imageAlign: 'center',
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
      images: [], 
      imageAlign: 'center',
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

  const handleImageUpload = (id, event, subIndex = null, nestedIndex = null, deepNestedIndex = null) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setQuestions(questions.map(q => {
          if (q.id === id) {
            if (subIndex !== null && nestedIndex !== null && deepNestedIndex !== null) {
              // Update deep nested sub-question image (a, b, c under i, ii, iii)
              const newSubQuestions = [...q.subQuestions];
              const newNestedSubQuestions = [...newSubQuestions[subIndex].subQuestions];
              const newDeepNestedSubQuestions = [...newNestedSubQuestions[nestedIndex].subQuestions];
              const currentAlign = newDeepNestedSubQuestions[deepNestedIndex].imageAlign || 'center';
              const currentImages = newDeepNestedSubQuestions[deepNestedIndex].images || [];
              
              // Check if we can add more images
              if (currentAlign === 'center' && currentImages.length >= 5) {
                alert('Maximum 5 images allowed for center-aligned position');
                return q;
              }
              if (currentAlign === 'right' && currentImages.length >= 1) {
                alert('Only 1 image allowed for right-aligned position');
                return q;
              }
              
              newDeepNestedSubQuestions[deepNestedIndex] = { 
                ...newDeepNestedSubQuestions[deepNestedIndex], 
                images: [...currentImages, e.target.result]
              };
              newNestedSubQuestions[nestedIndex] = { ...newNestedSubQuestions[nestedIndex], subQuestions: newDeepNestedSubQuestions };
              newSubQuestions[subIndex] = { ...newSubQuestions[subIndex], subQuestions: newNestedSubQuestions };
              return { ...q, subQuestions: newSubQuestions };
            } else if (subIndex !== null && nestedIndex !== null) {
              // Update nested sub-question image
              const newSubQuestions = [...q.subQuestions];
              const newNestedSubQuestions = [...newSubQuestions[subIndex].subQuestions];
              const currentAlign = newNestedSubQuestions[nestedIndex].imageAlign || 'center';
              const currentImages = newNestedSubQuestions[nestedIndex].images || [];
              
              // Check if we can add more images
              if (currentAlign === 'center' && currentImages.length >= 5) {
                alert('Maximum 5 images allowed for center-aligned position');
                return q;
              }
              if (currentAlign === 'right' && currentImages.length >= 1) {
                alert('Only 1 image allowed for right-aligned position');
                return q;
              }
              
              newNestedSubQuestions[nestedIndex] = { 
                ...newNestedSubQuestions[nestedIndex], 
                images: [...currentImages, e.target.result]
              };
              newSubQuestions[subIndex] = { ...newSubQuestions[subIndex], subQuestions: newNestedSubQuestions };
              return { ...q, subQuestions: newSubQuestions };
            } else if (subIndex !== null) {
              // Update sub-question image
              const newSubQuestions = [...q.subQuestions];
              const currentAlign = newSubQuestions[subIndex].imageAlign || 'center';
              const currentImages = newSubQuestions[subIndex].images || [];
              
              // Check if we can add more images
              if (currentAlign === 'center' && currentImages.length >= 5) {
                alert('Maximum 5 images allowed for center-aligned position');
                return q;
              }
              if (currentAlign === 'right' && currentImages.length >= 1) {
                alert('Only 1 image allowed for right-aligned position');
                return q;
              }
              
              newSubQuestions[subIndex] = { 
                ...newSubQuestions[subIndex], 
                images: [...currentImages, e.target.result]
              };
              return { ...q, subQuestions: newSubQuestions };
            } else {
              // Update main question image
              const currentAlign = q.imageAlign || 'center';
              const currentImages = q.images || [];
              
              // Check if we can add more images
              if (currentAlign === 'center' && currentImages.length >= 5) {
                alert('Maximum 5 images allowed for center-aligned position');
                return q;
              }
              if (currentAlign === 'right' && currentImages.length >= 1) {
                alert('Only 1 image allowed for right-aligned position');
                return q;
              }
              
              return { 
                ...q, 
                images: [...currentImages, e.target.result]
              };
            }
          }
          return q;
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (id, imageIndex = 0, subIndex = null, nestedIndex = null, deepNestedIndex = null) => {
    setQuestions(questions.map(q => {
      if (q.id === id) {
        if (subIndex !== null && nestedIndex !== null && deepNestedIndex !== null) {
          const newSubQuestions = [...q.subQuestions];
          const newNestedSubQuestions = [...newSubQuestions[subIndex].subQuestions];
          const newDeepNestedSubQuestions = [...newNestedSubQuestions[nestedIndex].subQuestions];
          const currentImages = newDeepNestedSubQuestions[deepNestedIndex].images || [];
          newDeepNestedSubQuestions[deepNestedIndex] = { 
            ...newDeepNestedSubQuestions[deepNestedIndex], 
            images: currentImages.filter((_, idx) => idx !== imageIndex)
          };
          newNestedSubQuestions[nestedIndex] = { ...newNestedSubQuestions[nestedIndex], subQuestions: newDeepNestedSubQuestions };
          newSubQuestions[subIndex] = { ...newSubQuestions[subIndex], subQuestions: newNestedSubQuestions };
          return { ...q, subQuestions: newSubQuestions };
        } else if (subIndex !== null && nestedIndex !== null) {
          const newSubQuestions = [...q.subQuestions];
          const newNestedSubQuestions = [...newSubQuestions[subIndex].subQuestions];
          const currentImages = newNestedSubQuestions[nestedIndex].images || [];
          newNestedSubQuestions[nestedIndex] = { 
            ...newNestedSubQuestions[nestedIndex], 
            images: currentImages.filter((_, idx) => idx !== imageIndex)
          };
          newSubQuestions[subIndex] = { ...newSubQuestions[subIndex], subQuestions: newNestedSubQuestions };
          return { ...q, subQuestions: newSubQuestions };
        } else if (subIndex !== null) {
          const newSubQuestions = [...q.subQuestions];
          const currentImages = newSubQuestions[subIndex].images || [];
          newSubQuestions[subIndex] = { 
            ...newSubQuestions[subIndex], 
            images: currentImages.filter((_, idx) => idx !== imageIndex)
          };
          return { ...q, subQuestions: newSubQuestions };
        } else {
          const currentImages = q.images || [];
          return { 
            ...q, 
            images: currentImages.filter((_, idx) => idx !== imageIndex)
          };
        }
      }
      return q;
    }));
  };

  const toggleImageAlign = (id, subIndex = null, nestedIndex = null, deepNestedIndex = null) => {
    setQuestions(questions.map(q => {
      if (q.id === id) {
        if (subIndex !== null && nestedIndex !== null && deepNestedIndex !== null) {
          const newSubQuestions = [...q.subQuestions];
          const newNestedSubQuestions = [...newSubQuestions[subIndex].subQuestions];
          const newDeepNestedSubQuestions = [...newNestedSubQuestions[nestedIndex].subQuestions];
          const currentAlign = newDeepNestedSubQuestions[deepNestedIndex].imageAlign || 'center';
          const newAlign = currentAlign === 'center' ? 'right' : 'center';
          const currentImages = newDeepNestedSubQuestions[deepNestedIndex].images || [];
          
          // If switching to right and more than 1 image, keep only the first one
          const newImages = newAlign === 'right' && currentImages.length > 1 ? [currentImages[0]] : currentImages;
          
          newDeepNestedSubQuestions[deepNestedIndex] = { 
            ...newDeepNestedSubQuestions[deepNestedIndex], 
            imageAlign: newAlign,
            images: newImages
          };
          newNestedSubQuestions[nestedIndex] = { ...newNestedSubQuestions[nestedIndex], subQuestions: newDeepNestedSubQuestions };
          newSubQuestions[subIndex] = { ...newSubQuestions[subIndex], subQuestions: newNestedSubQuestions };
          return { ...q, subQuestions: newSubQuestions };
        } else if (subIndex !== null && nestedIndex !== null) {
          const newSubQuestions = [...q.subQuestions];
          const newNestedSubQuestions = [...newSubQuestions[subIndex].subQuestions];
          const currentAlign = newNestedSubQuestions[nestedIndex].imageAlign || 'center';
          const newAlign = currentAlign === 'center' ? 'right' : 'center';
          const currentImages = newNestedSubQuestions[nestedIndex].images || [];
          
          // If switching to right and more than 1 image, keep only the first one
          const newImages = newAlign === 'right' && currentImages.length > 1 ? [currentImages[0]] : currentImages;
          
          newNestedSubQuestions[nestedIndex] = { 
            ...newNestedSubQuestions[nestedIndex], 
            imageAlign: newAlign,
            images: newImages
          };
          newSubQuestions[subIndex] = { ...newSubQuestions[subIndex], subQuestions: newNestedSubQuestions };
          return { ...q, subQuestions: newSubQuestions };
        } else if (subIndex !== null) {
          const newSubQuestions = [...q.subQuestions];
          const currentAlign = newSubQuestions[subIndex].imageAlign || 'center';
          const newAlign = currentAlign === 'center' ? 'right' : 'center';
          const currentImages = newSubQuestions[subIndex].images || [];
          
          // If switching to right and more than 1 image, keep only the first one
          const newImages = newAlign === 'right' && currentImages.length > 1 ? [currentImages[0]] : currentImages;
          
          newSubQuestions[subIndex] = { 
            ...newSubQuestions[subIndex], 
            imageAlign: newAlign,
            images: newImages
          };
          return { ...q, subQuestions: newSubQuestions };
        } else {
          const currentAlign = q.imageAlign || 'center';
          const newAlign = currentAlign === 'center' ? 'right' : 'center';
          const currentImages = q.images || [];
          
          // If switching to right and more than 1 image, keep only the first one
          const newImages = newAlign === 'right' && currentImages.length > 1 ? [currentImages[0]] : currentImages;
          
          return { 
            ...q, 
            imageAlign: newAlign,
            images: newImages
          };
        }
      }
      return q;
    }));
  };

  const openTableModal = (id, subIndex = null, nestedIndex = null, deepNestedIndex = null) => {
    setShowTableModal({ questionId: id, subIndex, nestedIndex, deepNestedIndex });
    setTableRows(3);
    setTableCols(3);
  };

  const createTable = () => {
    const { questionId, subIndex, nestedIndex, deepNestedIndex } = showTableModal;
    
    // Generate HTML table structure
    let htmlTable = '<table>';
    for (let i = 0; i < tableRows; i++) {
      htmlTable += '<tr>';
      for (let j = 0; j < tableCols; j++) {
        htmlTable += '<td></td>';
      }
      htmlTable += '</tr>';
    }
    htmlTable += '</table>';
    
    const newTable = {
      rows: tableRows,
      cols: tableCols,
      html: htmlTable
    };

    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        if (subIndex !== null && nestedIndex !== null && deepNestedIndex !== null) {
          const newSubQuestions = [...q.subQuestions];
          const newNestedSubQuestions = [...newSubQuestions[subIndex].subQuestions];
          const newDeepNestedSubQuestions = [...newNestedSubQuestions[nestedIndex].subQuestions];
          newDeepNestedSubQuestions[deepNestedIndex] = { ...newDeepNestedSubQuestions[deepNestedIndex], table: newTable };
          newNestedSubQuestions[nestedIndex] = { ...newNestedSubQuestions[nestedIndex], subQuestions: newDeepNestedSubQuestions };
          newSubQuestions[subIndex] = { ...newSubQuestions[subIndex], subQuestions: newNestedSubQuestions };
          return { ...q, subQuestions: newSubQuestions };
        } else if (subIndex !== null && nestedIndex !== null) {
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

  const updateTableCell = (questionId, rowIndex, colIndex, value, subIndex = null, nestedIndex = null, deepNestedIndex = null) => {
    const updateHtmlTable = (htmlTable, rowIdx, colIdx, newValue) => {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlTable;
      const table = tempDiv.querySelector('table');
      const rows = table.querySelectorAll('tr');
      const targetCell = rows[rowIdx]?.querySelectorAll('td, th')[colIdx];
      if (targetCell) {
        targetCell.textContent = newValue;
      }
      return tempDiv.innerHTML;
    };
    
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        if (subIndex !== null && nestedIndex !== null && deepNestedIndex !== null && 
            q.subQuestions[subIndex]?.subQuestions[nestedIndex]?.subQuestions[deepNestedIndex]?.table) {
          const newSubQuestions = [...q.subQuestions];
          const newNestedSubQuestions = [...newSubQuestions[subIndex].subQuestions];
          const newDeepNestedSubQuestions = [...newNestedSubQuestions[nestedIndex].subQuestions];
          const updatedHtml = updateHtmlTable(newDeepNestedSubQuestions[deepNestedIndex].table.html, rowIndex, colIndex, value);
          newDeepNestedSubQuestions[deepNestedIndex] = { 
            ...newDeepNestedSubQuestions[deepNestedIndex], 
            table: { ...newDeepNestedSubQuestions[deepNestedIndex].table, html: updatedHtml } 
          };
          newNestedSubQuestions[nestedIndex] = { ...newNestedSubQuestions[nestedIndex], subQuestions: newDeepNestedSubQuestions };
          newSubQuestions[subIndex] = { ...newSubQuestions[subIndex], subQuestions: newNestedSubQuestions };
          return { ...q, subQuestions: newSubQuestions };
        } else if (subIndex !== null && nestedIndex !== null && q.subQuestions[subIndex]?.subQuestions[nestedIndex]?.table) {
          const newSubQuestions = [...q.subQuestions];
          const newNestedSubQuestions = [...newSubQuestions[subIndex].subQuestions];
          const updatedHtml = updateHtmlTable(newNestedSubQuestions[nestedIndex].table.html, rowIndex, colIndex, value);
          newNestedSubQuestions[nestedIndex] = { 
            ...newNestedSubQuestions[nestedIndex], 
            table: { ...newNestedSubQuestions[nestedIndex].table, html: updatedHtml } 
          };
          newSubQuestions[subIndex] = { ...newSubQuestions[subIndex], subQuestions: newNestedSubQuestions };
          return { ...q, subQuestions: newSubQuestions };
        } else if (subIndex !== null && q.subQuestions[subIndex]?.table) {
          const newSubQuestions = [...q.subQuestions];
          const updatedHtml = updateHtmlTable(newSubQuestions[subIndex].table.html, rowIndex, colIndex, value);
          newSubQuestions[subIndex] = { 
            ...newSubQuestions[subIndex], 
            table: { ...newSubQuestions[subIndex].table, html: updatedHtml } 
          };
          return { ...q, subQuestions: newSubQuestions };
        } else if (q.table) {
          const updatedHtml = updateHtmlTable(q.table.html, rowIndex, colIndex, value);
          return { ...q, table: { ...q.table, html: updatedHtml } };
        }
      }
      return q;
    }));
  };

  const removeTable = (id, subIndex = null, nestedIndex = null, deepNestedIndex = null) => {
    setQuestions(questions.map(q => {
      if (q.id === id) {
        if (subIndex !== null && nestedIndex !== null && deepNestedIndex !== null) {
          const newSubQuestions = [...q.subQuestions];
          const newNestedSubQuestions = [...newSubQuestions[subIndex].subQuestions];
          const newDeepNestedSubQuestions = [...newNestedSubQuestions[nestedIndex].subQuestions];
          newDeepNestedSubQuestions[deepNestedIndex] = { ...newDeepNestedSubQuestions[deepNestedIndex], table: null };
          newNestedSubQuestions[nestedIndex] = { ...newNestedSubQuestions[nestedIndex], subQuestions: newDeepNestedSubQuestions };
          newSubQuestions[subIndex] = { ...newSubQuestions[subIndex], subQuestions: newNestedSubQuestions };
          return { ...q, subQuestions: newSubQuestions };
        } else if (subIndex !== null && nestedIndex !== null) {
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

  const addSubQuestion = (questionId, subIndex = null, nestedIndex = null) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        if (nestedIndex !== null) {
          // Add deep nested sub-question (a, b, c under i, ii, iii)
          const newSubQuestions = [...q.subQuestions];
          const newNestedSubQuestions = [...newSubQuestions[subIndex].subQuestions];
          if (!newNestedSubQuestions[nestedIndex].subQuestions) {
            newNestedSubQuestions[nestedIndex].subQuestions = [];
          }
          newNestedSubQuestions[nestedIndex].subQuestions = [
            ...newNestedSubQuestions[nestedIndex].subQuestions,
            { text: "", images: [], imageAlign: 'center', table: null }
          ];
          newSubQuestions[subIndex] = { ...newSubQuestions[subIndex], subQuestions: newNestedSubQuestions };
          return { ...q, subQuestions: newSubQuestions };
        } else if (subIndex !== null) {
          // Add nested sub-question (i, ii, iii under a, b, c)
          const newSubQuestions = [...q.subQuestions];
          if (!newSubQuestions[subIndex].subQuestions) {
            newSubQuestions[subIndex].subQuestions = [];
          }
          newSubQuestions[subIndex].subQuestions = [
            ...newSubQuestions[subIndex].subQuestions,
            { text: "", images: [], imageAlign: 'center', table: null, subQuestions: [] }
          ];
          return { ...q, subQuestions: newSubQuestions };
        } else {
          // Add main sub-question (a, b, c under main question)
          const newSubQuestions = [...q.subQuestions, { 
            text: "", 
            images: [], 
            imageAlign: 'center',
            table: null,
            subQuestions: []
          }];
          return { ...q, subQuestions: newSubQuestions };
        }
      }
      return q;
    }));
  };

  const updateSubQuestion = (questionId, subIndex, text, nestedIndex = null, deepNestedIndex = null) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        const newSubQuestions = [...q.subQuestions];
        if (deepNestedIndex !== null) {
          const newNestedSubQuestions = [...newSubQuestions[subIndex].subQuestions];
          const newDeepNestedSubQuestions = [...newNestedSubQuestions[nestedIndex].subQuestions];
          newDeepNestedSubQuestions[deepNestedIndex] = { ...newDeepNestedSubQuestions[deepNestedIndex], text };
          newNestedSubQuestions[nestedIndex] = { ...newNestedSubQuestions[nestedIndex], subQuestions: newDeepNestedSubQuestions };
          newSubQuestions[subIndex] = { ...newSubQuestions[subIndex], subQuestions: newNestedSubQuestions };
        } else if (nestedIndex !== null) {
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

  const deleteSubQuestion = (questionId, subIndex, nestedIndex = null, deepNestedIndex = null) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        const newSubQuestions = [...q.subQuestions];
        if (deepNestedIndex !== null) {
          newSubQuestions[subIndex].subQuestions[nestedIndex].subQuestions = 
            newSubQuestions[subIndex].subQuestions[nestedIndex].subQuestions.filter((_, idx) => idx !== deepNestedIndex);
        } else if (nestedIndex !== null) {
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
    // Roman numerals for sub-questions (i, ii, iii)
    const romanNumerals = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 
                           'xi', 'xii', 'xiii', 'xiv', 'xv', 'xvi', 'xvii', 'xviii', 'xix', 'xx'];
    return romanNumerals[index] || `(${index + 1})`;
  };

  const getNestedSubQuestionLabel = (index) => {
    // Letters for nested sub-questions (a, b, c)
    return String.fromCharCode(97 + index);
  };

  const getDeepNestedSubQuestionLabel = (index) => {
    // Roman numerals for deep nested sub-questions (i, ii, iii)
    const romanNumerals = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 
                           'xi', 'xii', 'xiii', 'xiv', 'xv', 'xvi', 'xvii', 'xviii', 'xix', 'xx'];
    return romanNumerals[index] || `(${index + 1})`;
  };

  const handlePrint = async () => {
    setIsPrinting(true);
    
    // Console log all data being passed to print
    console.log("=== PRINTING DATA (HTML FORMAT) ===");
    console.log("Complete questions array:", questions);
    
    // Special logging for table data (now in HTML format)
    questions.forEach((question, qIndex) => {
      if (question.table) {
        console.log(`Question ${question.id} has table:`, question.table);
        console.log(`Table HTML for Question ${question.id}:`, question.table.html);
      }
      
      // Check sub-questions for tables
      if (question.subQuestions && question.subQuestions.length > 0) {
        question.subQuestions.forEach((subQ, subIndex) => {
          if (subQ.table) {
            console.log(`Sub-question ${qIndex + 1}.${getSubQuestionLabel(subIndex)} has table:`, subQ.table);
            console.log(`Table HTML for sub-question ${qIndex + 1}.${getSubQuestionLabel(subIndex)}:`, subQ.table.html);
          }
          
          // Check nested sub-questions for tables
          if (subQ.subQuestions && subQ.subQuestions.length > 0) {
            subQ.subQuestions.forEach((nestedQ, nestedIndex) => {
              if (nestedQ.table) {
                console.log(`Nested sub-question ${qIndex + 1}.${getSubQuestionLabel(subIndex)}.${getNestedSubQuestionLabel(nestedIndex)} has table:`, nestedQ.table);
                console.log(`Table HTML for nested sub-question ${qIndex + 1}.${getSubQuestionLabel(subIndex)}.${getNestedSubQuestionLabel(nestedIndex)}:`, nestedQ.table.html);
              }
              
              // Check deep nested sub-questions for tables
              if (nestedQ.subQuestions && nestedQ.subQuestions.length > 0) {
                nestedQ.subQuestions.forEach((deepQ, deepIndex) => {
                  if (deepQ.table) {
                    console.log(`Deep nested sub-question ${qIndex + 1}.${getSubQuestionLabel(subIndex)}.${getNestedSubQuestionLabel(nestedIndex)}.${getDeepNestedSubQuestionLabel(deepIndex)} has table:`, deepQ.table);
                    console.log(`Table HTML for deep nested sub-question ${qIndex + 1}.${getSubQuestionLabel(subIndex)}.${getNestedSubQuestionLabel(nestedIndex)}.${getDeepNestedSubQuestionLabel(deepIndex)}:`, deepQ.table.html);
                  }
                });
              }
            });
          }
        });
      }
    });
    
    console.log("=== END PRINTING DATA ===");
    
    const result = await printPaper(questions);
    setIsPrinting(false);
    
    if (!result.success) {
      alert("Error generating PDF: " + result.error);
    }
  };

  const renderQuestionBlock = (question, questionId, level = 'main', subIndex = null, nestedIndex = null, deepNestedIndex = null) => {
    let label;
    if (level === 'deepNested') {
      label = getDeepNestedSubQuestionLabel(deepNestedIndex);
    } else if (level === 'nested') {
      label = getNestedSubQuestionLabel(nestedIndex);
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
            if (level === 'deepNested') {
              updateSubQuestion(questionId, subIndex, text, nestedIndex, deepNestedIndex);
            } else if (level === 'nested') {
              updateSubQuestion(questionId, subIndex, text, nestedIndex);
            } else if (level === 'sub') {
              updateSubQuestion(questionId, subIndex, text);
            } else {
              updateQuestion(questionId, text);
            }
          }}
          placeholder={
            level === 'deepNested'
              ? `Type deep nested sub-question ${label} here...`
              : level === 'nested' 
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
              onChange={(e) => handleImageUpload(questionId, e, subIndex, nestedIndex, deepNestedIndex)}
              className="image-upload-input"
            />
            📷 Add Image
          </label>

          <button
            onClick={() => openTableModal(questionId, subIndex, nestedIndex, deepNestedIndex)}
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
              ➕ Add Sub Question
            </button>
          )}

          {level === 'nested' && (
            <button
              onClick={() => addSubQuestion(questionId, subIndex, nestedIndex)}
              className="deep-nested-sub-question-button"
            >
              ➕ Add Sub Question
            </button>
          )}

          {question.images && question.images.length > 0 && (
            <div className="images-container">
              <div className="image-controls-top">
                <button
                  onClick={() => toggleImageAlign(questionId, subIndex, nestedIndex, deepNestedIndex)}
                  className="toggle-align-button"
                >
                  {question.imageAlign === 'right' ? '⬅ Center' : '➡ Move Right'}
                </button>
                <span className="image-count">
                  {question.images.length} / {question.imageAlign === 'right' ? '1' : '5'} images
                </span>
              </div>
              <div className={`image-preview-container ${question.imageAlign === 'right' ? 'image-right' : 'images-inline'}`}>
                {question.images.map((img, imgIndex) => (
                  <div key={imgIndex} className="single-image-wrapper">
                    <img 
                      src={img} 
                      alt={`Question ${label} - Image ${imgIndex + 1}`}
                      className="uploaded-image"
                    />
                    <button
                      onClick={() => removeImage(questionId, imgIndex, subIndex, nestedIndex, deepNestedIndex)}
                      className="remove-single-image-button"
                      title="Remove this image"
                    >
                      ✖
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {question.table && (() => {
            const getTableData = (htmlTable) => {
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = htmlTable;
              const table = tempDiv.querySelector('table');
              if (!table) return [];
              const rows = table.querySelectorAll('tr');
              return Array.from(rows).map(row => {
                const cells = row.querySelectorAll('td, th');
                return Array.from(cells).map(cell => cell.textContent || '');
              });
            };
            
            const tableData = getTableData(question.table.html);
            
            return (
              <div className="table-edit-container">
                <div className="table-header">
                  <h4>Table ({question.table.rows} × {question.table.cols})</h4>
                  <button
                    onClick={() => removeTable(questionId, subIndex, nestedIndex, deepNestedIndex)}
                    className="remove-table-button"
                  >
                    ✖ Remove Table
                  </button>
                </div>
                <table className="editable-table">
                  <tbody>
                    {tableData.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((cell, colIndex) => (
                          <td key={colIndex}>
                            <input
                              type="text"
                              value={cell}
                              onChange={(e) => updateTableCell(questionId, rowIndex, colIndex, e.target.value, subIndex, nestedIndex, deepNestedIndex)}
                              className="table-cell-input"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
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
                          {getNestedSubQuestionLabel(nestedIndex)}.
                        </h4>
                        <button
                          onClick={() => deleteSubQuestion(question.id, subIndex, nestedIndex)}
                          className="delete-nested-button"
                        >
                          Delete
                        </button>
                      </div>
                      {renderQuestionBlock(nestedSub, question.id, 'nested', subIndex, nestedIndex)}

                      {/* Render Deep Nested Sub Questions (a, b, c under i, ii, iii) */}
                      {nestedSub.subQuestions && nestedSub.subQuestions.map((deepNestedSub, deepNestedIndex) => (
                        <div key={deepNestedIndex} className="deep-nested-sub-question-wrapper">
                          <div className="deep-nested-sub-question-header">
                            <h5 className="deep-nested-sub-question-title">
                              {getDeepNestedSubQuestionLabel(deepNestedIndex)}.
                            </h5>
                            <button
                              onClick={() => deleteSubQuestion(question.id, subIndex, nestedIndex, deepNestedIndex)}
                              className="delete-deep-nested-button"
                            >
                              Delete
                            </button>
                          </div>
                          {renderQuestionBlock(deepNestedSub, question.id, 'deepNested', subIndex, nestedIndex, deepNestedIndex)}
                        </div>
                      ))}
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
                        {question.images && question.images.length > 0 && (
                          <div className={`preview-images-container ${question.imageAlign === 'right' ? 'preview-image-right' : 'preview-images-inline'}`}>
                            {question.images.map((img, imgIndex) => (
                              <img 
                                key={imgIndex}
                                src={img} 
                                alt={`Question ${question.id} - Image ${imgIndex + 1}`}
                                className="preview-image"
                              />
                            ))}
                          </div>
                        )}
                        {question.table && (
                          <div className="preview-table-container" dangerouslySetInnerHTML={{ __html: question.table.html }} />
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
                          {subQuestion.images && subQuestion.images.length > 0 && (
                            <div className={`preview-images-container ${subQuestion.imageAlign === 'right' ? 'preview-image-right' : 'preview-images-inline'}`}>
                              {subQuestion.images.map((img, imgIndex) => (
                                <img 
                                  key={imgIndex}
                                  src={img} 
                                  alt={`Sub-question ${getSubQuestionLabel(subIndex)} - Image ${imgIndex + 1}`}
                                  className="preview-image"
                                />
                              ))}
                            </div>
                          )}
                          {subQuestion.table && (
                            <div className="preview-table-container" dangerouslySetInnerHTML={{ __html: subQuestion.table.html }} />
                          )}
                        </div>
                      </div>

                      {/* Render Nested Sub Questions */}
                      {subQuestion.subQuestions && subQuestion.subQuestions.map((nestedSub, nestedIndex) => (
                        <div key={nestedIndex}>
                          <div className="preview-question preview-nested-sub-question">
                            <div className="question-number nested-sub-question-number">
                              {getNestedSubQuestionLabel(nestedIndex)})
                            </div>
                            <div className="question-content">
                              <div dangerouslySetInnerHTML={{ 
                                __html: nestedSub.text || `<em style='color: #999;'>No nested sub-question ${getNestedSubQuestionLabel(nestedIndex)} yet...</em>` 
                              }} />
                              {nestedSub.images && nestedSub.images.length > 0 && (
                                <div className={`preview-images-container ${nestedSub.imageAlign === 'right' ? 'preview-image-right' : 'preview-images-inline'}`}>
                                  {nestedSub.images.map((img, imgIndex) => (
                                    <img 
                                      key={imgIndex}
                                      src={img} 
                                      alt={`Nested sub-question ${getNestedSubQuestionLabel(nestedIndex)} - Image ${imgIndex + 1}`}
                                      className="preview-image"
                                    />
                                  ))}
                                </div>
                              )}
                              {nestedSub.table && (
                                <div className="preview-table-container" dangerouslySetInnerHTML={{ __html: nestedSub.table.html }} />
                              )}
                            </div>
                          </div>

                          {/* Render Deep Nested Sub Questions (a, b, c) */}
                          {nestedSub.subQuestions && nestedSub.subQuestions.map((deepNestedSub, deepNestedIndex) => (
                            <div key={deepNestedIndex} className="preview-question preview-deep-nested-sub-question">
                              <div className="question-number deep-nested-sub-question-number">
                                {getDeepNestedSubQuestionLabel(deepNestedIndex)})
                              </div>
                              <div className="question-content">
                                <div dangerouslySetInnerHTML={{ 
                                  __html: deepNestedSub.text || `<em style='color: #999;'>No sub-question ${getDeepNestedSubQuestionLabel(deepNestedIndex)} yet...</em>` 
                                }} />
                                {deepNestedSub.images && deepNestedSub.images.length > 0 && (
                                  <div className={`preview-images-container ${deepNestedSub.imageAlign === 'right' ? 'preview-image-right' : 'preview-images-inline'}`}>
                                    {deepNestedSub.images.map((img, imgIndex) => (
                                      <img 
                                        key={imgIndex}
                                        src={img} 
                                        alt={`Deep nested sub-question ${getDeepNestedSubQuestionLabel(deepNestedIndex)} - Image ${imgIndex + 1}`}
                                        className="preview-image"
                                      />
                                    ))}
                                  </div>
                                )}
                                {deepNestedSub.table && (
                                  <div className="preview-table-container" dangerouslySetInnerHTML={{ __html: deepNestedSub.table.html }} />
                                )}
                              </div>
                            </div>
                          ))}
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