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
    const hasImages = subQuestion.images && subQuestion.images.length > 0;
    const isImageRight = hasImages && subQuestion.imageAlign === 'right';

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
      
      // Place first image only (right-aligned allows only 1 image)
      const imageResult = await addImage(subQuestion.images[0], config.images.sub, currentY, subQuestion.imageAlign);
      
  
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

      // Render images separately if center-aligned or no text
      if (hasImages && !isImageRight) {
        // Use FIXED height for all images (single or multiple)
        const imageCount = subQuestion.images.length;
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
        
        for (let i = 0; i < subQuestion.images.length; i++) {
          const imageResult = await addImage(
            subQuestion.images[i], 
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
      } else if (hasImages && isImageRight && !hasSubQuestionText) {
        // Right-aligned image but no text (only first image)
        const imageResult = await addImage(subQuestion.images[0], config.images.sub, currentY, subQuestion.imageAlign);
        currentY = imageResult.finalY;
        currentY += config.spacing.afterImage;
      }
    }

    if (subQuestion.table) {
      currentY = addTable(subQuestion.table.html, subQuestion.table.cols, currentY);
      currentY += config.spacing.afterTable;
    }

    return { currentY, actualSubMargin, subLabelWidth };
  };
};