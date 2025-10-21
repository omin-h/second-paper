import { jsPDF } from "jspdf";

export const printPaper = async (questions) => {
  try {
    const doc = new jsPDF({
      unit: "mm",
      format: "a4",
      orientation: "portrait"
    });

   //------------Initializes jsPDF, page metrics----------------//
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    const contentWidth = pageWidth - (2 * margin);
    let currentY = margin + 3; 



    //------------Page Border with Rounded Corners----------------//
    const drawPageBorder = () => {
      doc.setDrawColor(0, 0, 0); // Black color
      doc.setLineWidth(0.1); // Border thickness
      
      const borderMargin = 5;
      const borderWidth = pageWidth - (2 * borderMargin);
      const borderHeight = pageHeight - (2 * borderMargin);
      const cornerRadius = 3; // Adjust this value for more/less curve
      
      // Draw rounded rectangle
      doc.roundedRect(borderMargin, borderMargin, borderWidth, borderHeight, cornerRadius, cornerRadius);
    };
    // Draw border on first page
    drawPageBorder();


    //------------Default Font Settings----------------//
    doc.setFont("times", "normal");
    doc.setFontSize(12);



    //------------Question Numbering Labels----------------//
    // Helper function to get sub-question label
    const getSubQuestionLabel = (index) => {
      return String.fromCharCode(97 + index); 
    };

    // Helper function to get roman numeral
    const getRomanNumeral = (index) => {
      const romanNumerals = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x'];
      return romanNumerals[index] || `(${index + 1})`;
    };




    //------------HTML Text Rendering with Basic Styles and Lists----------------//
    const renderFormattedText = (html, x, startY, maxWidth) => {
      const parser = new DOMParser();
      const htmlDoc = parser.parseFromString(html, 'text/html');
      const body = htmlDoc.body;

      // Tokens: { type: 'text'|'newline'|'liStart'|'liEnd', text?, style?, listType?, level?, index? }
      const tokens = [];

      const parseInlineStyle = (styleString, baseStyle) => {
        const s = { ...baseStyle };
        if (!styleString) return s;
        const parts = styleString.split(';').map(p => p.trim()).filter(Boolean);
        for (const p of parts) {
          const [k, v] = p.split(':').map(t => t.trim().toLowerCase());
          if (!k) continue;
          if (k === 'font-weight' && (v === 'bold' || +v >= 700)) s.bold = true;
          if (k === 'font-style' && v === 'italic') s.italic = true;
          if (k === 'text-decoration' && v.includes('underline')) s.underline = true;
        }
        return s;
      };

      const collect = (node, style = { bold: false, italic: false, underline: false }, listStack = []) => {
        if (!node) return;

        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent;
          if (!text) return;
          // keep words and whitespace tokens
          const toks = text.match(/\S+|\s+/g) || [];
          toks.forEach(t => tokens.push({ type: 'text', text: t, style: { ...style } }));
          return;
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
          const tag = node.tagName.toLowerCase();

          // handle span style parsing
          let newStyle = { ...style };
          if (tag === 'b' || tag === 'strong') newStyle.bold = true;
          if (tag === 'i' || tag === 'em') newStyle.italic = true;
          if (tag === 'u') newStyle.underline = true;
          if (tag === 'span') {
            const st = node.getAttribute('style');
            newStyle = parseInlineStyle(st, newStyle);
          }

          if (tag === 'br') {
            tokens.push({ type: 'newline' });
            return;
          }

          if (tag === 'p') {
            // ensure paragraph separation
            node.childNodes.forEach(child => collect(child, newStyle, listStack));
            tokens.push({ type: 'newline' });
            tokens.push({ type: 'newline' });
            return;
          }

          if (tag === 'ul' || tag === 'ol') {
            // push list context
            const listType = tag === 'ul' ? 'ul' : 'ol';
            // create a fresh counter for this level if ol
            const frame = { type: listType, counter: 0 };
            const newStack = [...listStack, frame];
            node.childNodes.forEach(child => collect(child, newStyle, newStack));
            return;
          }

          if (tag === 'li') {
            // list item: find current list frame
            const frame = listStack[listStack.length - 1] || { type: 'ul', counter: 0 };
            if (frame.type === 'ol') frame.counter = (frame.counter || 0) + 1;
            const level = listStack.length - 1 >= 0 ? listStack.length - 1 : 0;
            tokens.push({
              type: 'liStart',
              listType: frame.type,
              level,
              index: frame.type === 'ol' ? frame.counter : undefined
            });
            node.childNodes.forEach(child => collect(child, newStyle, listStack));
            tokens.push({ type: 'liEnd' });
            return;
          }

          // default: process children (including span with inline styles handled above)
          node.childNodes.forEach(child => collect(child, newStyle, listStack));
        }
      };

      // start collection
      body.childNodes.forEach(n => collect(n));





      // rendering / line-wrapping logic with support for per-line indent (for lists)
      const SLACK = 0.5;
      const lineHeight = 6;

      const setFontForStyle = (s) => {
        if (s.bold && s.italic) doc.setFont("times", "bolditalic");
        else if (s.bold) doc.setFont("times", "bold");
        else if (s.italic) doc.setFont("times", "italic");
        else doc.setFont("times", "normal");
      };

      const getWidth = (text, style) => {
        const prev = doc.getFont();
        setFontForStyle(style || { });
        const w = doc.getTextWidth(text);
        doc.setFont(prev.fontName, prev.fontStyle);
        return w;
      };

      const lines = [];
      let currentLine = [];
      let currentLineWidth = 0;
      // indent applied at line start (mm)
      let pendingIndent = 0; // set when a liStart encountered; applied to first token on new line
      let activeIndent = 0; // current line's indent
      const pushLine = () => {
        lines.push({ segments: currentLine, indent: activeIndent });
        currentLine = [];
        currentLineWidth = 0;
        activeIndent = 0;
        pendingIndent = 0;
      };

      // helper to append a token (word or whitespace) respecting wrap
      const appendToken = (tokenText, tokenStyle) => {
        // collapse leading spaces in a new empty line
        if (/^\s+$/.test(tokenText) && currentLine.length === 0) return;

        // ensure activeIndent applied for empty line if pending
        if (currentLine.length === 0 && pendingIndent) {
          activeIndent = pendingIndent;
          pendingIndent = 0;
        }

        const effectiveMax = maxWidth - (activeIndent || 0);
        const w = getWidth(tokenText, tokenStyle);

        if (currentLineWidth + w <= effectiveMax + SLACK) {
          currentLine.push({ text: tokenText, style: tokenStyle });
          currentLineWidth += w;
          return;
        }

        // token doesn't fit
        if (/^\s+$/.test(tokenText)) {
          // whitespace that doesn't fit -> new line
          pushLine();
          return;
        }

        // if line already has content, flush it first then place token
        if (currentLine.length > 0) {
          pushLine();
        }

        // if token still too long for a single line, break into chars
        if (w > effectiveMax + SLACK) {
          let ptr = 0;
          while (ptr < tokenText.length) {
            let chunk = '';
            while (ptr < tokenText.length) {
              const ch = tokenText[ptr];
              const test = chunk + ch;
              const tw = getWidth(test, tokenStyle);
              if (tw <= effectiveMax + SLACK) {
                chunk = test;
                ptr++;
              } else break;
            }
            if (chunk === '') {
              // place at least one char
              chunk = tokenText[ptr++];
            }
            currentLine.push({ text: chunk, style: tokenStyle });
            currentLineWidth = getWidth(chunk, tokenStyle);
            pushLine();
          }
          return;
        }

        // fits on empty line
        currentLine.push({ text: tokenText, style: tokenStyle });
        currentLineWidth += w;
      };

      // process collected tokens
      for (let i = 0; i < tokens.length; i++) {
        const tk = tokens[i];
        if (tk.type === 'newline') {
          pushLine();
          continue;
        }
        if (tk.type === 'liStart') {
          // start new list line, set pending indent (6mm per level)
          pushLine();
          pendingIndent = 6 * (tk.level + 1);
          // add bullet/number as first token on new line (will use pendingIndent as activeIndent)
          const bullet = tk.listType === 'ul' ? '• ' : `${tk.index}. `;
          // push bullet token (as text) but ensure activeIndent will be set when appended
          appendToken(bullet, { bold: false, italic: false, underline: false });
          continue;
        }
        if (tk.type === 'liEnd') {
          // finish current list item
          pushLine();
          continue;
        }
        if (tk.type === 'text') {
          appendToken(tk.text, tk.style);
        }
      }

      if (currentLine.length > 0) pushLine();

      // render lines to doc
      let y = startY;
      for (let li = 0; li < lines.length; li++) {
        const line = lines[li];
        let xPos = x + (line.indent || 0);
        for (let si = 0; si < line.segments.length; si++) {
          const seg = line.segments[si];
          setFontForStyle(seg.style || {});
          doc.text(seg.text, xPos, y);
          if (seg.style && seg.style.underline) {
            const w = doc.getTextWidth(seg.text);
            doc.setLineWidth(0.2);
            doc.line(xPos, y + 1, xPos + w, y + 1);
          }
          xPos += doc.getTextWidth(seg.text);
        }
        y += lineHeight;
      }

      doc.setFont("times", "normal");
      return (y - startY);
    };




    //------------Main Content Rendering----------------//
    // image
    const addImage = async (imageData, imageHeight = 60) => {
      if (currentY + imageHeight > pageHeight - margin) {
        doc.addPage();
        drawPageBorder(); // Draw border on new page
        currentY = margin;
      }

      const img = new Image();
      img.src = imageData;
      
      await new Promise((resolve) => {
        img.onload = () => {
          const aspectRatio = img.width / img.height;
          const imageWidth = imageHeight * aspectRatio;
          const xPos = (pageWidth - imageWidth) / 2;
          
          doc.addImage(imageData, 'JPEG', xPos, currentY, imageWidth, imageHeight);
          currentY += imageHeight + 5; 
          resolve();
        };
        img.onerror = () => resolve();
      });
    };



    // table
    const addTable = (tableData, tableCols) => {
      const tableWidth = contentWidth * 0.7; 
      const colWidth = tableWidth / tableCols;
      const rowHeight = 8;
      const tableHeight = tableData.length * rowHeight;

      if (currentY + tableHeight > pageHeight - margin) {
        doc.addPage();
        drawPageBorder(); // Draw border on new page
        currentY = margin;
      }

      doc.setFont("times", "normal");
      doc.setFontSize(10);
      
      // Center the table
      const tableStartX = margin + (contentWidth - tableWidth) / 2;
      
      tableData.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          const x = tableStartX + (colIndex * colWidth);
          const y = currentY + (rowIndex * rowHeight);
          
          doc.rect(x, y, colWidth, rowHeight);
          
          const cellText = cell || "";
          const textWidth = doc.getTextWidth(cellText);
          const textX = x + (colWidth - textWidth) / 2;
          const textY = y + (rowHeight / 2) + 2;
          
          doc.text(cellText, textX, textY);
        });
      });

      currentY += tableHeight + 5; 
    };


    

    // Process each main question
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      
      // Check if we need a new page
      if (currentY > pageHeight - 40 && i > 0) {
        doc.addPage();
        drawPageBorder(); // Draw border on new page
        currentY = margin;
      }

      const hasMainQuestionText = question.text && question.text.trim() !== '';

      // Main Question
      if (hasMainQuestionText) {
        doc.setFontSize(12);
        doc.setFont("times", "bold");
        const questionNumber = `${question.id}. `;
        const numberWidth = doc.getTextWidth(questionNumber);
        
        doc.text(questionNumber, margin, currentY);
        
        doc.setFont("times", "normal");
        
        // Use formatted text rendering
        const textHeight = renderFormattedText(
          question.text,
          margin + numberWidth,
          currentY,
          contentWidth - numberWidth - 5
        );
        currentY += textHeight;

        // Add main question image (60mm height)
        if (question.image) {
          await addImage(question.image, 60);
        }

        // Add main question table
        if (question.table) {
          addTable(question.table.data, question.table.cols);
        }
      }



      // Process Sub-Questions
      if (question.subQuestions && question.subQuestions.length > 0) {
        for (let subIdx = 0; subIdx < question.subQuestions.length; subIdx++) {
          const subQuestion = question.subQuestions[subIdx];
          
          // Check if we need a new page
          if (currentY > pageHeight - 40) {
            doc.addPage();
            drawPageBorder(); // Draw border on new page
            currentY = margin;
          }

          doc.setFontSize(12);
          doc.setFont("times", "bold");
          
          
          let subLabel, actualSubMargin;
          const extraIndent = 6; // Additional spacing to move sub-questions right
          
          if (!hasMainQuestionText) {
            // When no main question text
            if (subIdx === 0) {
              // First sub-question shows "2." at margin, then "a)" indented
              const questionNumber = `${question.id}. `;
              const questionNumberWidth = doc.getTextWidth(questionNumber);
              
              // Draw main question number at margin
              doc.text(questionNumber, margin, currentY);
              
              // Draw sub-question label after the question number with extra indent
              subLabel = `${getSubQuestionLabel(subIdx)}) `;
              actualSubMargin = margin + questionNumberWidth + extraIndent;
            } else {
              // Other sub-questions show only "b)", "c)" aligned with first
              const questionNumber = `${question.id}. `;
              const questionNumberWidth = doc.getTextWidth(questionNumber);
              
              subLabel = `${getSubQuestionLabel(subIdx)}) `;
              actualSubMargin = margin + questionNumberWidth + extraIndent;
            }
          } else {
            // When main question text exists, indent all sub-questions
            subLabel = `${getSubQuestionLabel(subIdx)}) `;
            actualSubMargin = margin + 10;
          }
          
          const subLabelWidth = doc.getTextWidth(subLabel);
          
          doc.text(subLabel, actualSubMargin, currentY);
          
          doc.setFont("times", "normal");
          
          if (subQuestion.text && subQuestion.text.trim()) {
            // Calculate available width from the sub-question starting position
            const availableWidth = (pageWidth - margin) - (actualSubMargin + subLabelWidth);
            const textHeight = renderFormattedText(
              subQuestion.text,
              actualSubMargin + subLabelWidth,
              currentY,
              availableWidth
            );
            currentY += textHeight;
          } else {
            currentY += 6;
          }

          currentY += 2;

          // Add sub-question image (50mm height)
          if (subQuestion.image) {
            await addImage(subQuestion.image, 50);
          }

          // Add sub-question table
          if (subQuestion.table) {
            addTable(subQuestion.table.data, subQuestion.table.cols);
          }

          // Process Nested Sub-Questions (i, ii, iii)
          if (subQuestion.subQuestions && subQuestion.subQuestions.length > 0) {
            for (let nestedIdx = 0; nestedIdx < subQuestion.subQuestions.length; nestedIdx++) {
              const nestedSub = subQuestion.subQuestions[nestedIdx];
              
              if (currentY > pageHeight - 40) {
                doc.addPage();
                drawPageBorder();
                currentY = margin;
              }

              doc.setFontSize(12);
              doc.setFont("times", "bold");
              
              const nestedLabel = `${getRomanNumeral(nestedIdx)}) `;
              const nestedLabelWidth = doc.getTextWidth(nestedLabel);
              
              // Check if parent sub-question is empty
              const isSubQuestionEmpty = !subQuestion.text || subQuestion.text.trim() === '';
              
              // Calculate nested margin based on whether main question exists and sub-question is empty
              let nestedMargin;

              // --- unified calculation: compute where the sub-label ends and use that for nested indent ---
              const questionNumber = `${question.id}. `;
              const questionNumberWidth = doc.getTextWidth(questionNumber);
              const subLabelText = `${getSubQuestionLabel(subIdx)}) `;
              const subLabelTextWidth = doc.getTextWidth(subLabelText);

              // where the sub-label was drawn (start X of sub-label)
              const subLabelStart = hasMainQuestionText ? actualSubMargin : (margin + questionNumberWidth + extraIndent);

              // nested labels should start after the sub-label end (+ small gap)
              const nestedBase = subLabelStart + subLabelTextWidth + 3;

              // If parent sub-question is empty and this is first nested, move up to same line (keeps previous behavior)
              if (isSubQuestionEmpty && nestedIdx === 0) {
                currentY -= 8; // keep previous "same-line" behavior
                nestedMargin = nestedBase;
              } else {
                nestedMargin = nestedBase;
              }
              // --- end unified calculation ---
              
              doc.text(nestedLabel, nestedMargin, currentY);
              
              doc.setFont("times", "normal");
              
              if (nestedSub.text && nestedSub.text.trim()) {
                // Calculate available width from the nested sub-question starting position
                const availableWidth = (pageWidth - margin) - (nestedMargin + nestedLabelWidth);
                const textHeight = renderFormattedText(
                  nestedSub.text,
                  nestedMargin + nestedLabelWidth,
                  currentY,
                  availableWidth
                );
                currentY += textHeight;
              } else {
                currentY += 6;
              }

              currentY += 1;

              // Add nested sub-question image (30mm height)
              if (nestedSub.image) {
                await addImage(nestedSub.image, 30);
              }

              // Add nested sub-question table
              if (nestedSub.table) {
                addTable(nestedSub.table.data, nestedSub.table.cols);
              }

              currentY += 1;

              // Process Deep Nested Sub-Questions (a, b, c under i, ii, iii)
              if (nestedSub.subQuestions && nestedSub.subQuestions.length > 0) {
                const deepExtraIndent = 8; // extra indent for deep-level labels
                let firstDeepPlacedOnSameLine = false;

                for (let deepNestedIdx = 0; deepNestedIdx < nestedSub.subQuestions.length; deepNestedIdx++) {
                  const deepNestedSub = nestedSub.subQuestions[deepNestedIdx];
                  
                  if (currentY > pageHeight - 40) {
                    doc.addPage();
                    drawPageBorder();
                    currentY = margin;
                  }

                  doc.setFontSize(12);
                  doc.setFont("times", "bold");
                  
                  const deepNestedLabel = `${getSubQuestionLabel(deepNestedIdx)}) `;
                  const deepNestedLabelWidth = doc.getTextWidth(deepNestedLabel);
                  
                  // Check if parent nested sub-question is empty
                  const isNestedSubQuestionEmpty = !nestedSub.text || nestedSub.text.trim() === '';
                  
                  let deepNestedMargin;

                  // If nested is empty and this is the first deep item, place it on same line as nested label
                  if (isNestedSubQuestionEmpty && deepNestedIdx === 0) {
                    // Move currentY up to nested label line (only once)
                    // nestedMargin and nestedLabelWidth exist in outer scope
                    currentY -= 8; // undo the empty-line advance done earlier
                    deepNestedMargin = nestedMargin + nestedLabelWidth - 3 + deepExtraIndent;
                    firstDeepPlacedOnSameLine = true;
                  } else if (isNestedSubQuestionEmpty && deepNestedIdx > 0 && firstDeepPlacedOnSameLine) {
                    // subsequent deep items align with the first deep item on that same line
                    deepNestedMargin = nestedMargin + nestedLabelWidth - 3 + deepExtraIndent;
                  } else {
                    // Normal deep nested indentation (indent relative to question number / sub-label)
                    if (!hasMainQuestionText) {
                      const questionNumber = `${question.id}. `;
                      const questionNumberWidth = doc.getTextWidth(questionNumber);
                      deepNestedMargin = margin + questionNumberWidth + extraIndent + 10 + deepExtraIndent;
                    } else {
                      deepNestedMargin = margin + 20 + deepExtraIndent;
                    }
                  }
                  
                  doc.text(deepNestedLabel, deepNestedMargin, currentY);
                  
                  doc.setFont("times", "normal");
                  
                  if (deepNestedSub.text && deepNestedSub.text.trim()) {
                    // Calculate available width from the deep nested sub-question starting position
                    const availableWidth = (pageWidth - margin) - (deepNestedMargin + deepNestedLabelWidth);
                    const textHeight = renderFormattedText(
                      deepNestedSub.text,
                      deepNestedMargin + deepNestedLabelWidth,
                      currentY,
                      availableWidth
                    );
                    currentY += textHeight;
                  } else {
                    currentY += 6;
                  }

                  currentY += 1;

                  // Add deep nested sub-question image (30mm height)
                  if (deepNestedSub.image) {
                    await addImage(deepNestedSub.image, 30);
                  }

                  // Add deep nested sub-question table
                  if (deepNestedSub.table) {
                    addTable(deepNestedSub.table.data, deepNestedSub.table.cols);
                  }

                  currentY += 1;
                }
              }

              currentY += 1;
            }
          }

          currentY += 1;
        }
      }

      // Add spacing between main questions
      currentY += 3; 
    }



    // Save the PDF
    doc.save("question-paper.pdf");
    return { success: true };
  } catch (error) {
    console.error("Error generating PDF:", error);
    return { success: false, error: error.message };
  }
};