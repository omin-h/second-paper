import { getRomanNumeral } from '../pdfHelpers.js';

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
    
    const nestedLabel = `${getRomanNumeral(nestedIdx)}) `;
    const nestedLabelWidth = doc.getTextWidth(nestedLabel);
    // Choose a fixed column for the right edge of the label
    const nestedLabelCol = actualSubMargin + config.questionNumbering.nestedLabelColumnOffset; 

    doc.text(nestedLabel, nestedLabelCol - nestedLabelWidth, currentY);
    doc.setFont(config.font.family, "normal");

    if (nestedSub.text && nestedSub.text.trim()) {
      const textStartX = nestedLabelCol;
      const availableWidth = (doc.internal.pageSize.getWidth() - margin) - textStartX;
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

    if (nestedSub.image) {
      currentY = await addImage(nestedSub.image, config.images.nested, currentY);
      currentY += config.spacing.afterImage;
    }

    if (nestedSub.table) {
      currentY = addTable(nestedSub.table.data, nestedSub.table.cols, currentY);
      currentY += config.spacing.afterTable;
    }

    return { currentY, nestedMargin: nestedLabelCol, nestedLabelWidth };
  };
};