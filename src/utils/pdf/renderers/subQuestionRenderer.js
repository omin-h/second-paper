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
    
    if (subQuestion.text && subQuestion.text.trim()) {
      const pageWidth = doc.internal.pageSize.getWidth();
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

    if (subQuestion.image) {
      currentY = await addImage(subQuestion.image, config.images.sub, currentY);
      currentY += config.spacing.afterImage;
    }

    if (subQuestion.table) {
      currentY = addTable(subQuestion.table.data, subQuestion.table.cols, currentY);
      currentY += config.spacing.afterTable;
    }

    return { currentY, actualSubMargin, subLabelWidth };
  };
};