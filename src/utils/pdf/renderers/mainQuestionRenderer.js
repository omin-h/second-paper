export const createMainQuestionRenderer = (
  doc,
  pageHeight,
  margin,
  contentWidth,
  renderFormattedText,
  addImage,
  addTable,
  drawPageBorder,
  config
) => {
  return async (question, currentY) => {
    const hasMainQuestionText = question.text && question.text.trim() !== '';
    const hasImage = question.image;
    const isImageRight = hasImage && question.imageAlign === 'right';

    // If we have both text and right-aligned image, handle them together
    if (hasMainQuestionText && isImageRight) {
      // Estimate text height
      const estimatedLines = Math.ceil(question.text.length / config.textEstimation.charactersPerLine); 
      const estimatedHeight = estimatedLines * config.textEstimation.estimatedLineHeight; 

      // Check if question + estimated text will fit
      if (currentY + estimatedHeight > pageHeight - margin - config.spacing.pageBreakBuffer) {
        doc.addPage();
        drawPageBorder();
        currentY = margin + config.spacing.topPageMargin;
      }

      doc.setFontSize(config.font.size.default);
      doc.setFont(config.font.family, "bold");
      const questionNumber = `${question.id}. `;
      const numberWidth = doc.getTextWidth(questionNumber);
      
      doc.text(questionNumber, margin, currentY);
      doc.setFont(config.font.family, "normal");
      
      const textStartY = currentY;
      
      // Place image first at current position
      const imageResult = await addImage(question.image, config.images.main, currentY, question.imageAlign);
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const fullContentWidth = pageWidth - 2 * margin;
      const textWidth = fullContentWidth * 0.65;
      
      const textHeight = renderFormattedText(
        question.text,
        margin + numberWidth,
        textStartY,
        textWidth
      );
      
      // Use the maximum of text height or image height
      currentY = Math.max(textStartY + textHeight, imageResult.finalY);
      currentY += config.spacing.afterImage;
    } else {
      // Handle text and centered image separately (original behavior)
      if (hasMainQuestionText) {
        // Estimate text height
        const estimatedLines = Math.ceil(question.text.length / config.textEstimation.charactersPerLine); 
        const estimatedHeight = estimatedLines * config.textEstimation.estimatedLineHeight; 

        // Check if question + estimated text will fit
        if (currentY + estimatedHeight > pageHeight - margin - config.spacing.pageBreakBuffer) {
          doc.addPage();
          drawPageBorder();
          currentY = margin + config.spacing.topPageMargin;
        }

        doc.setFontSize(config.font.size.default);
        doc.setFont(config.font.family, "bold");
        const questionNumber = `${question.id}. `;
        const numberWidth = doc.getTextWidth(questionNumber);
        
        doc.text(questionNumber, margin, currentY);
        doc.setFont(config.font.family, "normal");
        
        const textHeight = renderFormattedText(
          question.text,
          margin + numberWidth,
          currentY,
          contentWidth - numberWidth - 5
        );
        currentY += textHeight;
      } else {
        // Even if no text, check if we're near bottom
        if (currentY > pageHeight - config.spacing.pageBottomThreshold) {
          doc.addPage();
          drawPageBorder();
          currentY = margin + config.spacing.topPageMargin;
        }
      }

      // Render image separately if not right-aligned or no text
      if (hasImage && !isImageRight) {
        // Check if image will fit on current page
        if (currentY + config.images.main > pageHeight - margin) {
          doc.addPage();
          drawPageBorder();
          currentY = margin + config.spacing.topPageMargin;
        }
        const imageResult = await addImage(question.image, config.images.main, currentY, question.imageAlign || 'center');
        currentY = imageResult.finalY;
        currentY += config.spacing.afterImage;
      } else if (hasImage && isImageRight && !hasMainQuestionText) {
        // Right-aligned image but no text
        if (currentY + config.images.main > pageHeight - margin) {
          doc.addPage();
          drawPageBorder();
          currentY = margin + config.spacing.topPageMargin;
        }
        const imageResult = await addImage(question.image, config.images.main, currentY, question.imageAlign);
        currentY = imageResult.finalY;
        currentY += config.spacing.afterImage;
      }
    }

    if (question.table) {
      currentY = addTable(question.table.data, question.table.cols, currentY);
      currentY += config.spacing.afterTable;
    }

    return { currentY, hasMainQuestionText };
  };
};