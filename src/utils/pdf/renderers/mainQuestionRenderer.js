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

    if (hasMainQuestionText) {
      // Estimate text height (rough calculation)
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

    // Always render image and table, even if text is empty
    if (question.image) {
      // Check if image will fit on current page
      if (currentY + config.images.main > pageHeight - margin) {
        doc.addPage();
        drawPageBorder();
        currentY = margin + config.spacing.topPageMargin;
      }
      currentY = await addImage(question.image, config.images.main, currentY);
      currentY += config.spacing.afterImage;
    }

    if (question.table) {
      currentY = addTable(question.table.data, question.table.cols, currentY);
      currentY += config.spacing.afterTable;
    }

    return { currentY, hasMainQuestionText };
  };
};