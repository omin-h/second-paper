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



    // Helper function to parse and render rich text
    const renderRichText = (html, startX, startY, maxWidth) => {
      if (!html) return startY;

      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      
      let currentX = startX;
      let currentLineY = startY;
      const lineHeight = 6;
      const spaceWidth = doc.getTextWidth(' ');
      
      const processNode = (node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent;
          if (!text || text.trim() === '') {
            if (text === ' ') currentX += spaceWidth;
            return;
          }
          
          const words = text.split(/(\s+)/);
          
          words.forEach(word => {
            if (word === '') return;
            
            if (/^\s+$/.test(word)) {
              currentX += spaceWidth * word.length;
              return;
            }
            
            const wordWidth = doc.getTextWidth(word);
            
            if (currentX + wordWidth > startX + maxWidth) {
              currentLineY += lineHeight;
              currentX = startX;
              
              if (currentLineY > pageHeight - margin - 20) {
                doc.addPage();
                drawPageBorder();
                currentLineY = margin;
              }
            }
            
            doc.text(word, currentX, currentLineY);
            currentX += wordWidth;
          });
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const tagName = node.tagName.toLowerCase();
          
          // Save current font state
          const currentFont = doc.getFont();
          const currentFontSize = doc.getFontSize();
          
          // Handle different HTML tags
          switch (tagName) {
            case 'strong':
            case 'b':
              doc.setFont("times", "bold");
              break;
            case 'em':
            case 'i':
              doc.setFont("times", "italic");
              break;
            case 'u':
              // Underline is applied after text
              break;
            case 'br':
              currentLineY += lineHeight;
              currentX = startX;
              if (currentLineY > pageHeight - margin - 20) {
                doc.addPage();
                drawPageBorder();
                currentLineY = margin;
              }
              return;
            case 'p':
              if (currentX > startX) {
                currentLineY += lineHeight;
                currentX = startX;
              }
              break;
            case 'ul':
            case 'ol':
              currentLineY += lineHeight * 0.5;
              break;
            case 'li':
              if (currentX > startX) {
                currentLineY += lineHeight;
              }
              currentX = startX + 5;
              const bullet = node.parentElement.tagName === 'UL' ? '• ' : `${Array.from(node.parentElement.children).indexOf(node) + 1}. `;
              doc.text(bullet, startX, currentLineY);
              break;
          }
          
          // Process child nodes
          let underlineStart = currentX;
          Array.from(node.childNodes).forEach(child => processNode(child));
          
          // Apply underline if needed
          if (tagName === 'u' && currentX > underlineStart) {
            const underlineY = currentLineY + 0.5;
            doc.line(underlineStart, underlineY, currentX, underlineY);
          }
          
          // Restore font state
          doc.setFont(currentFont.fontName, currentFont.fontStyle);
          doc.setFontSize(currentFontSize);
          
          // Add spacing after block elements
          if (['p', 'ul', 'ol', 'li'].includes(tagName)) {
            if (tagName === 'p' || tagName === 'ul' || tagName === 'ol') {
              currentLineY += lineHeight * 0.5;
            }
            currentX = startX;
          }
        }
      };
      
      Array.from(tempDiv.childNodes).forEach(node => processNode(node));
      
      return currentLineY + lineHeight;
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
        
        if (question.text) {
          currentY = renderRichText(question.text, margin + numberWidth, currentY, contentWidth - numberWidth - 5);
        }

        currentY += 0; 

        // Add main question image (60mm height)
        if (question.image) {
          await addImage(question.image, 60);
        }

        // Add main question table
        if (question.table) {
          addTable(question.table.data, question.table.cols);
        }

        currentY += 0; 
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
          
          if (subQuestion.text && subQuestion.text.trim() !== '') {
            const availableWidth = (pageWidth - margin) - (actualSubMargin + subLabelWidth);
            currentY = renderRichText(subQuestion.text, actualSubMargin + subLabelWidth, currentY, availableWidth);
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
              
              if (nestedSub.text && nestedSub.text.trim() !== '') {
                const availableWidth = (pageWidth - margin) - (nestedMargin + nestedLabelWidth);
                currentY = renderRichText(nestedSub.text, nestedMargin + nestedLabelWidth, currentY, availableWidth);
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