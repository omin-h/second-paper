import { getNestedSubQuestionLabel } from '../pdfHelpers.js';

export const createNestedSubQuestionRenderer = (
  doc,
  pageHeight,
  margin,
  renderFormattedText,
  addImage,
  addTable,
  drawPageBorder,
  config
) => {
  return async (
    nestedSub,
    nestedIdx,
    subQuestion,
    subIdx,
    questionId,
    hasMainQuestionText,
    actualSubMargin,
    subLabelWidth,
    currentY
  ) => {
    const hasNestedSubQuestionText = nestedSub.text && nestedSub.text.trim() !== '';
    const isSubQuestionEmpty = !subQuestion.text || subQuestion.text.trim() === '';
    const hasImages = nestedSub.images && nestedSub.images.length > 0;
    const isImageRight = hasImages && nestedSub.imageAlign === 'right';

    if (hasNestedSubQuestionText) {
      // Estimate text height before rendering
      const estimatedLines = Math.ceil(nestedSub.text.length / config.textEstimation.charactersPerLine);
      const estimatedHeight = estimatedLines * config.textEstimation.estimatedLineHeight;

      // Check if nested sub-question + estimated text will fit
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
    
    const nestedLabel = `${getNestedSubQuestionLabel(nestedIdx)}) `;
    const nestedLabelWidth = doc.getTextWidth(nestedLabel);
    
    let nestedLabelCol;
    
    // If sub-question is empty and this is the first nested sub-question
    if (isSubQuestionEmpty && nestedIdx === 0) {
      // Place it on the same line, right after the sub-question label
      currentY -= config.spacing.emptyQuestionLineHeight + 2; 
      nestedLabelCol = actualSubMargin + subLabelWidth + 10; 
    } else if (isSubQuestionEmpty && nestedIdx > 0) {
      // Continue on the normal flow for subsequent nested questions
      nestedLabelCol = actualSubMargin + config.questionNumbering.nestedLabelColumnOffset;
    } else {
      // Normal case: sub-question has text
      nestedLabelCol = actualSubMargin + config.questionNumbering.nestedLabelColumnOffset;
    }

    doc.text(nestedLabel, nestedLabelCol - nestedLabelWidth, currentY);
    doc.setFont(config.font.family, "normal");

    const textStartX = nestedLabelCol;
    const pageWidth = doc.internal.pageSize.getWidth();
    const fullContentWidth = pageWidth - 2 * margin;

    // If we have both text and right-aligned image, handle them together
    if (hasNestedSubQuestionText && isImageRight) {
      const textStartY = currentY;
      
      // Place first image only (right-aligned allows only 1 image)
      const imageResult = await addImage(nestedSub.images[0], config.images.nested, currentY, nestedSub.imageAlign);
      
      const textWidth = fullContentWidth * 0.65;
      const textHeight = renderFormattedText(
        nestedSub.text,
        textStartX,
        textStartY,
        textWidth
      );
      
      // Use the maximum of text height or image height
      currentY = Math.max(textStartY + textHeight, imageResult.finalY);
      currentY += config.spacing.afterImage;
    } else {
      // Handle text and centered image separately
      if (hasNestedSubQuestionText) {
        const availableWidth = (pageWidth - margin) - textStartX;
        const textHeight = renderFormattedText(
          nestedSub.text,
          textStartX,
          currentY,
          availableWidth
        );
        currentY += textHeight;
      } else {
        currentY += config.spacing.emptyQuestionLineHeight;
      }

      currentY += config.spacing.betweenNestedSubQuestions;

      // Render images separately if center-aligned or no text
      if (hasImages && !isImageRight) {
        // Use FIXED height for all images (single or multiple)
        const imageCount = nestedSub.images.length;
        const fixedHeight = config.images.fixed;
        
        // Check if images will fit on current page
        if (currentY + fixedHeight > pageHeight - margin) {
          doc.addPage();
          drawPageBorder();
          currentY = margin + config.spacing.topPageMargin;
        }
        
        // Render all images inline (horizontally on one line)
        const startY = currentY;
        let maxImageHeight = 0;
        
        for (let i = 0; i < nestedSub.images.length; i++) {
          const imageResult = await addImage(
            nestedSub.images[i], 
            fixedHeight, 
            startY, 
            imageCount > 1 ? 'inline' : 'center',
            i,
            imageCount
          );
          maxImageHeight = Math.max(maxImageHeight, imageResult.actualImageHeight);
        }
        
        currentY = startY + maxImageHeight;
        currentY += config.spacing.afterImage;
      } else if (hasImages && isImageRight && !hasNestedSubQuestionText) {
        // Right-aligned image but no text (only first image)
        const imageResult = await addImage(nestedSub.images[0], config.images.nested, currentY, nestedSub.imageAlign);
        currentY = imageResult.finalY;
        currentY += config.spacing.afterImage;
      }
    }

    if (nestedSub.table) {
      currentY = addTable(nestedSub.table.html, nestedSub.table.cols, currentY);
      currentY += config.spacing.afterTable;
    }

    return { currentY, nestedMargin: nestedLabelCol, nestedLabelWidth };
  };
};