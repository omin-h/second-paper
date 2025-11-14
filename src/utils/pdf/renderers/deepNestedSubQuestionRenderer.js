import { getDeepNestedSubQuestionLabel } from '../pdfHelpers.js';

export const createDeepNestedSubQuestionRenderer = (
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
    deepNestedSub,
    deepNestedIdx,
    nestedSub,
    nestedMargin,
    nestedLabelWidth,
    questionId,
    hasMainQuestionText,
    firstDeepPlacedOnSameLine,
    currentY
  ) => {
    const hasDeepNestedSubQuestionText = deepNestedSub.text && deepNestedSub.text.trim() !== '';
    const hasImages = deepNestedSub.images && deepNestedSub.images.length > 0;
    const isImageRight = hasImages && deepNestedSub.imageAlign === 'right';

    if (hasDeepNestedSubQuestionText) {
      // Estimate text height before rendering
      const estimatedLines = Math.ceil(deepNestedSub.text.length / config.textEstimation.charactersPerLine);
      const estimatedHeight = estimatedLines * config.textEstimation.estimatedLineHeight;

      // Check if deep nested sub-question + estimated text will fit
      if (currentY + estimatedHeight > pageHeight - margin - config.spacing.pageBreakBuffer) {
        doc.addPage();
        drawPageBorder();
        currentY = margin + config.spacing.topPageMarginDeep;
      } else {
        // Only add space if parent sub-question is empty
        const isNestedSubQuestionEmpty = !nestedSub.text || nestedSub.text.trim() === '';
        if (isNestedSubQuestionEmpty) {
          currentY += config.questionNumbering.deepNestedEmptyParentSpacing; 
        }
      }
    } else {
      if (currentY > pageHeight - config.spacing.pageBottomThreshold) {
        doc.addPage();
        drawPageBorder();
        currentY = margin + config.spacing.topPageMarginDeep;
      } else {
        const isNestedSubQuestionEmpty = !nestedSub.text || nestedSub.text.trim() === '';
        if (isNestedSubQuestionEmpty) {
          currentY += config.questionNumbering.deepNestedEmptyParentSpacing; 
        }
      }
    }

    doc.setFontSize(config.font.size.default);
    doc.setFont(config.font.family, "bold");
    
    const deepNestedLabel = `${getDeepNestedSubQuestionLabel(deepNestedIdx)}) `;
    const deepNestedLabelWidth = doc.getTextWidth(deepNestedLabel);
    const isNestedSubQuestionEmpty = !nestedSub.text || nestedSub.text.trim() === '';
    const deepExtraIndent = config.spacing.deepExtraIndent;
    
    let deepNestedMargin;
    let newFirstDeepPlaced = firstDeepPlacedOnSameLine;

    if (isNestedSubQuestionEmpty && deepNestedIdx === 0) {
      currentY += config.questionNumbering.deepNestedEmptyParentVerticalAdjustment;
      deepNestedMargin = nestedMargin + nestedLabelWidth + config.questionNumbering.deepNestedEmptyParentOffset + deepExtraIndent;
      newFirstDeepPlaced = true;

    } else if (isNestedSubQuestionEmpty && deepNestedIdx > 0 && firstDeepPlacedOnSameLine) {
      deepNestedMargin = nestedMargin + nestedLabelWidth + config.questionNumbering.deepNestedEmptyParentOffset + deepExtraIndent;
    } else {

      if (!hasMainQuestionText) {
        const questionNumber = `${questionId}. `;
        const questionNumberWidth = doc.getTextWidth(questionNumber);
        deepNestedMargin = margin + questionNumberWidth + config.spacing.extraIndent + config.questionNumbering.subQuestionLeftIndent + deepExtraIndent;
      } else {
        deepNestedMargin = margin + config.questionNumbering.deepNestedNormalIndent + deepExtraIndent;
      }
    }
    
    doc.text(deepNestedLabel, deepNestedMargin, currentY);
    doc.setFont(config.font.family, "normal");
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const fullContentWidth = pageWidth - 2 * margin;

    if (hasDeepNestedSubQuestionText && isImageRight) {
      const textStartY = currentY;
      
      // Place first image only (right-aligned allows only 1 image)
      const imageResult = await addImage(deepNestedSub.images[0], config.images.nested, currentY, deepNestedSub.imageAlign);
      
     
      const textWidth = fullContentWidth * 0.55;
      const textHeight = renderFormattedText(
        deepNestedSub.text,
        deepNestedMargin + deepNestedLabelWidth,
        textStartY,
        textWidth
      );
      
      // Use the maximum of text height or image height
      currentY = Math.max(textStartY + textHeight, imageResult.finalY);
      currentY += config.spacing.afterImage;
    } else {
      // Handle text and centered image separately
      if (hasDeepNestedSubQuestionText) {
        const availableWidth = (pageWidth - margin) - (deepNestedMargin + deepNestedLabelWidth);
        const textHeight = renderFormattedText(
          deepNestedSub.text,
          deepNestedMargin + deepNestedLabelWidth,
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
        const imageCount = deepNestedSub.images.length;
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
        
        for (let i = 0; i < deepNestedSub.images.length; i++) {
          const imageResult = await addImage(
            deepNestedSub.images[i], 
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
      } else if (hasImages && isImageRight && !hasDeepNestedSubQuestionText) {
        // Right-aligned image but no text (only first image)
        const imageResult = await addImage(deepNestedSub.images[0], config.images.nested, currentY, deepNestedSub.imageAlign);
        currentY = imageResult.finalY;
        currentY += config.spacing.afterImage;
      }
    }

    if (deepNestedSub.table) {
      currentY = addTable(deepNestedSub.table.html, deepNestedSub.table.cols, currentY);
      currentY += config.spacing.afterTable;
    }

    currentY += config.spacing.betweenNestedSubQuestions;

    return { currentY, firstDeepPlacedOnSameLine: newFirstDeepPlaced };
  };
};