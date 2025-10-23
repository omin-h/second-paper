import { getSubQuestionLabel, getRomanNumeral } from './pdfHelpers.js';

export const createQuestionRenderer = (
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
  const renderMainQuestion = async (question, currentY) => {
    if (currentY > pageHeight - 40) {
      doc.addPage();
      drawPageBorder();
      currentY = margin;
    }

    const hasMainQuestionText = question.text && question.text.trim() !== '';

    if (hasMainQuestionText) {
      doc.setFontSize(12);
      doc.setFont("times", "bold");
      const questionNumber = `${question.id}. `;
      const numberWidth = doc.getTextWidth(questionNumber);
      
      doc.text(questionNumber, margin, currentY);
      doc.setFont("times", "normal");
      
      const textHeight = renderFormattedText(
        question.text,
        margin + numberWidth,
        currentY,
        contentWidth - numberWidth - 5
      );
      currentY += textHeight;

      if (question.image) {
        currentY = await addImage(question.image, config.images.main, currentY);
        currentY += config.spacing.afterImage;
      }

      if (question.table) {
        currentY = addTable(question.table.data, question.table.cols, currentY);
        currentY += config.spacing.afterTable;
      }
    }

    return { currentY, hasMainQuestionText };
  };

  const renderSubQuestion = async (subQuestion, subIdx, questionId, hasMainQuestionText, currentY) => {
    if (currentY > pageHeight - 40) {
      doc.addPage();
      drawPageBorder();
      currentY = margin;
    }

    doc.setFontSize(12);
    doc.setFont("times", "bold");
    
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
      actualSubMargin = margin + 10;
    }
    
    const subLabelWidth = doc.getTextWidth(subLabel);
    doc.text(subLabel, actualSubMargin, currentY);
    doc.setFont("times", "normal");
    
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
      currentY += 6;
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

  const renderNestedSubQuestion = async (
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
    if (currentY > pageHeight - 40) {
      doc.addPage();
      drawPageBorder();
      currentY = margin;
    }

    doc.setFontSize(12);
    doc.setFont("times", "bold");
    
    const nestedLabel = `${getRomanNumeral(nestedIdx)}) `;
    const nestedLabelWidth = doc.getTextWidth(nestedLabel);
    // Choose a fixed column for the right edge of the label
    const nestedLabelCol = actualSubMargin + 15; 

    doc.text(nestedLabel, nestedLabelCol - nestedLabelWidth, currentY);
    doc.setFont("times", "normal");

    if (nestedSub.text && nestedSub.text.trim()) {
      const textStartX = nestedLabelCol; // 1 unit gap after label (sub question)
      const availableWidth = (doc.internal.pageSize.getWidth() - margin) - textStartX;
      const textHeight = renderFormattedText(
        nestedSub.text,
        textStartX,
        currentY,
        availableWidth
      );
      currentY += textHeight;
    } else {
      currentY += 6;
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

  const renderDeepNestedSubQuestion = async (
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
    if (currentY > pageHeight - 40) {
      doc.addPage();
      drawPageBorder();
      currentY = margin + 3;
    } else {
      // Only add space if parent sub-question is empty
      const isNestedSubQuestionEmpty = !nestedSub.text || nestedSub.text.trim() === '';
      if (isNestedSubQuestionEmpty) {
        currentY += 1; 
      }
    }

    doc.setFontSize(12);
    doc.setFont("times", "bold");
    
    const deepNestedLabel = `${getSubQuestionLabel(deepNestedIdx)}) `;
    const deepNestedLabelWidth = doc.getTextWidth(deepNestedLabel);
    const isNestedSubQuestionEmpty = !nestedSub.text || nestedSub.text.trim() === '';
    const deepExtraIndent = config.spacing.deepExtraIndent;
    
    let deepNestedMargin;
    let newFirstDeepPlaced = firstDeepPlacedOnSameLine;

    if (isNestedSubQuestionEmpty && deepNestedIdx === 0) {
      currentY -= 8;
      deepNestedMargin = nestedMargin + nestedLabelWidth - 9.5 + deepExtraIndent;
      newFirstDeepPlaced = true;
    } else if (isNestedSubQuestionEmpty && deepNestedIdx > 0 && firstDeepPlacedOnSameLine) {
      deepNestedMargin = nestedMargin + nestedLabelWidth - 9.5 + deepExtraIndent;
    } else {
      if (!hasMainQuestionText) {
        const questionNumber = `${questionId}. `;
        const questionNumberWidth = doc.getTextWidth(questionNumber);
        deepNestedMargin = margin + questionNumberWidth + config.spacing.extraIndent + 10 + deepExtraIndent;
      } else {
        deepNestedMargin = margin + 20 + deepExtraIndent;
      }
    }
    
    doc.text(deepNestedLabel, deepNestedMargin, currentY);
    doc.setFont("times", "normal");
    
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
      currentY += 6;
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

  return {
    renderMainQuestion,
    renderSubQuestion,
    renderNestedSubQuestion,
    renderDeepNestedSubQuestion
  };
};