import { jsPDF } from "jspdf";

export const printPaper = async (questions) => {
  try {
    const doc = new jsPDF({
      unit: "mm",
      format: "a4",
      orientation: "portrait"
    });


    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    const contentWidth = pageWidth - (2 * margin);
    let currentY = margin + 3; 



    // Helper function to draw page border with rounded corners
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


    // Set default font
    doc.setFont("times", "normal");
    doc.setFontSize(12);



    // Helper function to get sub-question label
    const getSubQuestionLabel = (index) => {
      return String.fromCharCode(97 + index); 
    };



    // Helper function to get roman numeral
    const getRomanNumeral = (index) => {
      const romanNumerals = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x'];
      return romanNumerals[index] || `(${index + 1})`;
    };



    // Helper function to convert HTML to plain text
    const htmlToPlainText = (html) => {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      return tempDiv.textContent || tempDiv.innerText || "";
    };



    // NEW: Parse and render HTML with formatting
    // Improved HTML -> formatted wrapped text renderer (with small width slack)
    const renderFormattedText = (html, x, startY, maxWidth) => {
      const parser = new DOMParser();
      const htmlDoc = parser.parseFromString(html, 'text/html');
      const body = htmlDoc.body;

      // collect runs of text with style
      const runs = [];
      const collect = (node, style = { bold: false, italic: false, underline: false }) => {
        if (!node) return;
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent;
          if (!text) return;
          // keep spaces as tokens
          const tokens = text.match(/\S+|\s+/g) || [];
          tokens.forEach(t => runs.push({ text: t, style: { ...style } }));
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const tag = node.tagName.toLowerCase();
          const newStyle = { ...style };
          if (tag === 'b' || tag === 'strong') newStyle.bold = true;
          if (tag === 'i' || tag === 'em') newStyle.italic = true;
          if (tag === 'u') newStyle.underline = true;
          if (tag === 'br') {
            runs.push({ text: '\n', style: { ...style } });
          } else {
            node.childNodes.forEach(child => collect(child, newStyle));
            if (tag === 'p') runs.push({ text: '\n', style: { ...style } });
          }
        }
      };
      body.childNodes.forEach(node => collect(node));

      const SLACK = 0.5; // small tolerance (mm) to avoid wrapping on tiny differences
      const lineHeight = 6;
      const lines = [];
      let currentLine = [];
      let currentLineWidth = 0;

      const pushLine = () => {
        lines.push(currentLine);
        currentLine = [];
        currentLineWidth = 0;
      };

      const setFontForStyle = (s) => {
        if (s.bold && s.italic) doc.setFont("times", "bolditalic");
        else if (s.bold) doc.setFont("times", "bold");
        else if (s.italic) doc.setFont("times", "italic");
        else doc.setFont("times", "normal");
      };

      // helper to get width for text with style
      const getWidth = (text, style) => {
        const prevFont = doc.getFont();
        setFontForStyle(style);
        const w = doc.getTextWidth(text);
        doc.setFont(prevFont.fontName, prevFont.fontStyle);
        return w;
      };

      // iterate tokens and build lines
      for (let i = 0; i < runs.length; i++) {
        const run = runs[i];

        // handle explicit newlines
        if (run.text === '\n') {
          pushLine();
          continue;
        }

        // treat whitespace token: collapse leading spaces at line start
        const isSpace = /^\s+$/.test(run.text);
        if (isSpace) {
          // if line empty, skip leading spaces
          if (currentLine.length === 0) continue;
        }

        let token = run.text;
        let tokenStyle = run.style;

        // measure whole token
        let tokenWidth = getWidth(token, tokenStyle);

        // if token fits, append (allow small slack)
        if (currentLineWidth + tokenWidth <= maxWidth + SLACK) {
          currentLine.push({ text: token, style: tokenStyle });
          currentLineWidth += tokenWidth;
          continue;
        }

        // token doesn't fit
        // if token is just whitespace -> push line and skip
        if (isSpace) {
          pushLine();
          continue;
        }

        // if current line has content, flush it first
        if (currentLine.length > 0) {
          pushLine();
        }

        // If token itself is longer than maxWidth (account slack), break it into chunks
        if (tokenWidth > maxWidth + SLACK) {
          let ptr = 0;
          while (ptr < token.length) {
            // build chunk that fits
            let chunk = '';
            // accumulate characters until exceed
            while (ptr < token.length) {
              const ch = token[ptr];
              const w = getWidth(chunk + ch, tokenStyle);
              if (chunk === '' && w > maxWidth + SLACK) {
                // single char is wider than line (rare) -> still place it
                chunk = ch;
                ptr++;
                break;
              }
              if (w <= maxWidth + SLACK) {
                chunk += ch;
                ptr++;
              } else break;
            }
            // push chunk as a line
            currentLine.push({ text: chunk, style: tokenStyle });
            currentLineWidth = getWidth(chunk, tokenStyle);
            pushLine();
          }
          continue;
        }

        // token shorter than maxWidth but didn't fit due to rounding — place it on new line
        currentLine.push({ text: token, style: tokenStyle });
        currentLineWidth += tokenWidth;
      }

      if (currentLine.length > 0) pushLine();

      // render lines
      let y = startY;
      for (let li = 0; li < lines.length; li++) {
        let xPos = x;
        const line = lines[li];
        for (let ri = 0; ri < line.length; ri++) {
          const seg = line[ri];
          setFontForStyle(seg.style);
          // draw text segment
          doc.text(seg.text, xPos, y);
          // underline if needed
          if (seg.style.underline) {
            const w = doc.getTextWidth(seg.text);
            doc.setLineWidth(0.2);
            doc.line(xPos, y + 1, xPos + w, y + 1);
          }
          xPos += doc.getTextWidth(seg.text);
        }
        y += lineHeight;
      }

      // restore normal font
      doc.setFont("times", "normal");

      return (y - startY);
    };



    // Helper function to add image with variable height
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



    // Helper function to add table
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
              
              if (isSubQuestionEmpty && nestedIdx === 0) {
                // First nested sub-question when parent sub-question is empty
                // Place it on the same line as the sub-question label
                if (!hasMainQuestionText) {
                  const questionNumber = `${question.id}. `;
                  const questionNumberWidth = doc.getTextWidth(questionNumber);
                  const subLabelText = `${getSubQuestionLabel(subIdx)}) `;
                  const subLabelTextWidth = doc.getTextWidth(subLabelText);
                  
                  // Move back up to the sub-question line
                  currentY -= 8; // Move back up (6 from empty line + 2 from spacing)
                  
                  nestedMargin = margin + questionNumberWidth + extraIndent + subLabelTextWidth + 3;
                } else {
                  const subLabelText = `${getSubQuestionLabel(subIdx)}) `;
                  const subLabelTextWidth = doc.getTextWidth(subLabelText);
                  
                  // Move back up to the sub-question line
                  currentY -= 8; // Move back up
                  
                  nestedMargin = actualSubMargin + subLabelTextWidth + 3;
                }
              } else if (isSubQuestionEmpty && nestedIdx > 0) {
                // Subsequent nested sub-questions align with the first one
                if (!hasMainQuestionText) {
                  const questionNumber = `${question.id}. `;
                  const questionNumberWidth = doc.getTextWidth(questionNumber);
                  const subLabelText = `${getSubQuestionLabel(subIdx)}) `;
                  const subLabelTextWidth = doc.getTextWidth(subLabelText);
                  nestedMargin = margin + questionNumberWidth + extraIndent + subLabelTextWidth + 3;
                } else {
                  const subLabelText = `${getSubQuestionLabel(subIdx)}) `;
                  const subLabelTextWidth = doc.getTextWidth(subLabelText);
                  nestedMargin = actualSubMargin + subLabelTextWidth + 3;
                }
              } else {
                // Normal nested sub-question indentation
                if (!hasMainQuestionText) {
                  const questionNumber = `${question.id}. `;
                  const questionNumberWidth = doc.getTextWidth(questionNumber);
                  nestedMargin = margin + questionNumberWidth + extraIndent + 10;
                } else {
                  nestedMargin = margin + 20;
                }
              }
              
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