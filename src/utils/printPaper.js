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



    // Helper function to draw page border
    const drawPageBorder = () => {
      doc.setDrawColor(0, 0, 0); // Black color
      doc.setLineWidth(0.1); // Border thickness
      doc.rect(5, 5, pageWidth - 10, pageHeight - 10); // Draw rectangle border
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
        const plainText = htmlToPlainText(question.text);
        
        if (plainText) {
          const textLines = doc.splitTextToSize(plainText, contentWidth - numberWidth - 5);
          doc.text(textLines, margin + numberWidth, currentY);
          currentY += (textLines.length * 6); 
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
          
          // Show "1. a)" for first sub-question if main question is empty
          const subLabel = subIdx === 0 && !hasMainQuestionText 
            ? `${question.id}. ${getSubQuestionLabel(subIdx)}) `
            : `${getSubQuestionLabel(subIdx)}) `;
          
          const subLabelWidth = doc.getTextWidth(subLabel);
          const subMargin = hasMainQuestionText ? margin + 10 : margin;
          
          doc.text(subLabel, subMargin, currentY);
          
          doc.setFont("times", "normal");
          const subPlainText = htmlToPlainText(subQuestion.text);
          
          if (subPlainText) {
            // Calculate available width from the sub-question starting position
            const availableWidth = (pageWidth - margin) - (subMargin + subLabelWidth);
            const subTextLines = doc.splitTextToSize(subPlainText, availableWidth);
            doc.text(subTextLines, subMargin + subLabelWidth, currentY);
            currentY += (subTextLines.length * 6);
          } else {
            currentY += 6;
          }

          currentY += 2;

          // Add sub-question image (40mm height)
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
              const nestedMargin = margin + 20;
              
              doc.text(nestedLabel, nestedMargin, currentY);
              
              doc.setFont("times", "normal");
              const nestedPlainText = htmlToPlainText(nestedSub.text);
              
              if (nestedPlainText) {
                // Calculate available width from the nested sub-question starting position
                const availableWidth = (pageWidth - margin) - (nestedMargin + nestedLabelWidth);
                const nestedTextLines = doc.splitTextToSize(nestedPlainText, availableWidth);
                doc.text(nestedTextLines, nestedMargin + nestedLabelWidth, currentY);
                currentY += (nestedTextLines.length * 6);
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