import { getSubQuestionLabel } from '../pdfHelpers.js';

export const createSubQuestionRenderer = (
  doc,
  pageHeight,
  margin,
  renderFormattedText,
  addImage,
  addTable,
  drawPageBorder,
  config
) => {
  return async (subQuestion, subIdx, questionId, hasMainQuestionText, currentY) => {
    const hasSubQuestionText = subQuestion.text && subQuestion.text.trim() !== '';
    const hasImage = subQuestion.image;
    const isImageRight = hasImage && subQuestion.imageAlign === 'right';

    if (hasSubQuestionText) {
      // Estimate text height before rendering
      const estimatedLines = Math.ceil(subQuestion.text.length / config.textEstimation.charactersPerLine);
      const estimatedHeight = estimatedLines * config.textEstimation.estimatedLineHeight;

      // Check if sub-question + estimated text will fit
      if (currentY + estimatedHeight > pageHeight - margin - config.spacing.pageBreakBuffer) {
        doc.addPage();
        drawPageBorder();
        currentY = margin + config.spacing.topPageMargin;
      }
    } else {
      if (currentY > pageHeight - config.spacing.pageBottomThreshold) {
        doc.addPage();
        drawPageBorder();
        currentY = margin + config.spacing.topPageMargin;
      }
    }

    doc.setFontSize(config.font.size.default);
    doc.setFont(config.font.family, "bold");
    
    let subLabel, actualSubMargin;
    const extraIndent = config.spacing.extraIndent;
    
    if (!hasMainQuestionText) {
      if (subIdx === 0) {
        const questionNumber = `${questionId}. `;
        const questionNumberWidth = doc.getTextWidth(questionNumber);
        doc.text(questionNumber, margin, currentY);
        subLabel = `${getSubQuestionLabel(subIdx)}) `;
        actualSubMargin = margin + questionNumberWidth + extraIndent;
      } else {
        const questionNumber = `${questionId}. `;
        const questionNumberWidth = doc.getTextWidth(questionNumber);
        subLabel = `${getSubQuestionLabel(subIdx)}) `;
        actualSubMargin = margin + questionNumberWidth + extraIndent;
      }
    } else {
      subLabel = `${getSubQuestionLabel(subIdx)}) `;
      actualSubMargin = margin + config.questionNumbering.subQuestionLeftIndent;
    }
    
    const subLabelWidth = doc.getTextWidth(subLabel);
    doc.text(subLabel, actualSubMargin, currentY);
    doc.setFont(config.font.family, "normal");
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const fullContentWidth = pageWidth - 2 * margin;


    if (hasSubQuestionText && isImageRight) {
      const textStartY = currentY;
      
      // Place image first at current position
      const imageResult = await addImage(subQuestion.image, config.images.sub, currentY, subQuestion.imageAlign);
      
  
      const textWidth = fullContentWidth * 0.65;
      const textHeight = renderFormattedText(
        subQuestion.text,
        actualSubMargin + subLabelWidth,
        textStartY,
        textWidth
      );
      
      // Use the maximum of text height or image height
      currentY = Math.max(textStartY + textHeight, imageResult.finalY);
      currentY += config.spacing.afterImage;
    } else {
      // Handle text and centered image separately
      if (hasSubQuestionText) {
        const availableWidth = (pageWidth - margin) - (actualSubMargin + subLabelWidth);
        const textHeight = renderFormattedText(
          subQuestion.text,
          actualSubMargin + subLabelWidth,
          currentY,
          availableWidth
        );
        currentY += textHeight;
      } else {
        currentY += config.spacing.emptyQuestionLineHeight;
      }

      currentY += config.spacing.betweenSubQuestions;

      // Render image separately if not right-aligned or no text
      if (hasImage && !isImageRight) {
        const imageResult = await addImage(subQuestion.image, config.images.sub, currentY, subQuestion.imageAlign || 'center');
        currentY = imageResult.finalY;
        currentY += config.spacing.afterImage;
      } else if (hasImage && isImageRight && !hasSubQuestionText) {
        const imageResult = await addImage(subQuestion.image, config.images.sub, currentY, subQuestion.imageAlign);
        currentY = imageResult.finalY;
        currentY += config.spacing.afterImage;
      }
    }

    if (subQuestion.table) {
      currentY = addTable(subQuestion.table.data, subQuestion.table.cols, currentY);
      currentY += config.spacing.afterTable;
    }

    return { currentY, actualSubMargin, subLabelWidth };
  };
};