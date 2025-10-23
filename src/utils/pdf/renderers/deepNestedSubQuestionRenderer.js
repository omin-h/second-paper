import { getSubQuestionLabel } from '../pdfHelpers.js';

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
    
    const deepNestedLabel = `${getSubQuestionLabel(deepNestedIdx)}) `;
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
    
    if (deepNestedSub.text && deepNestedSub.text.trim()) {
      const pageWidth = doc.internal.pageSize.getWidth();
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

    if (deepNestedSub.image) {
      currentY = await addImage(deepNestedSub.image, config.images.nested, currentY);
      currentY += config.spacing.afterImage;
    }

    if (deepNestedSub.table) {
      currentY = addTable(deepNestedSub.table.data, deepNestedSub.table.cols, currentY);
      currentY += config.spacing.afterTable;
    }

    currentY += config.spacing.betweenNestedSubQuestions;

    return { currentY, firstDeepPlacedOnSameLine: newFirstDeepPlaced };
  };
};