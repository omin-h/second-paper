import { jsPDF } from "jspdf";
import { PDF_CONFIG } from './pdf/pdfConfig.js';
import { drawPageBorder } from './pdf/pdfHelpers.js';
import { renderFormattedText } from './pdf/htmlRenderer.js';
import { createImageRenderer, createTableRenderer } from './pdf/contentRenderers.js';
import { createQuestionRenderer } from './pdf/questionRenderers.js';

export const printPaper = async (questions) => {
  try {
    const doc = new jsPDF({
      unit: PDF_CONFIG.unit,
      format: PDF_CONFIG.format,
      orientation: PDF_CONFIG.orientation
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = PDF_CONFIG.margin;
    const contentWidth = pageWidth - (2 * margin);
    let currentY = margin + 3;

    const drawBorder = () => drawPageBorder(
      doc,
      pageWidth,
      pageHeight,
      PDF_CONFIG.borderMargin,
      PDF_CONFIG.cornerRadius
    );

    drawBorder();

    doc.setFont(PDF_CONFIG.font.family, "normal");
    doc.setFontSize(PDF_CONFIG.font.size.default);

    const addImage = createImageRenderer(doc, pageHeight, margin, drawBorder, PDF_CONFIG);
    const addTable = createTableRenderer(doc, pageHeight, margin, contentWidth, drawBorder);

    const boundRenderFormattedText = (html, x, startY, maxWidth) => 
      renderFormattedText(doc, html, x, startY, maxWidth);

    const questionRenderer = createQuestionRenderer(
      doc,
      pageHeight,
      margin,
      contentWidth,
      boundRenderFormattedText,
      addImage,
      addTable,
      drawBorder,
      PDF_CONFIG
    );

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      
      if (currentY > pageHeight - 40 && i > 0) {
        doc.addPage();
        drawBorder();
        currentY = margin;
      }

      const mainResult = await questionRenderer.renderMainQuestion(question, currentY);
      currentY = mainResult.currentY;
      const hasMainQuestionText = mainResult.hasMainQuestionText;

      if (question.subQuestions && question.subQuestions.length > 0) {
        for (let subIdx = 0; subIdx < question.subQuestions.length; subIdx++) {
          const subQuestion = question.subQuestions[subIdx];
          
          const subResult = await questionRenderer.renderSubQuestion(
            subQuestion,
            subIdx,
            question.id,
            hasMainQuestionText,
            currentY
          );
          currentY = subResult.currentY;

          if (subQuestion.subQuestions && subQuestion.subQuestions.length > 0) {
            for (let nestedIdx = 0; nestedIdx < subQuestion.subQuestions.length; nestedIdx++) {
              const nestedSub = subQuestion.subQuestions[nestedIdx];
              
              const nestedResult = await questionRenderer.renderNestedSubQuestion(
                nestedSub,
                nestedIdx,
                subQuestion,
                subIdx,
                question.id,
                hasMainQuestionText,
                subResult.actualSubMargin,
                subResult.subLabelWidth,
                currentY
              );
              currentY = nestedResult.currentY;

              if (nestedSub.subQuestions && nestedSub.subQuestions.length > 0) {
                let firstDeepPlacedOnSameLine = false;

                for (let deepNestedIdx = 0; deepNestedIdx < nestedSub.subQuestions.length; deepNestedIdx++) {
                  const deepNestedSub = nestedSub.subQuestions[deepNestedIdx];
                  
                  const deepResult = await questionRenderer.renderDeepNestedSubQuestion(
                    deepNestedSub,
                    deepNestedIdx,
                    nestedSub,
                    nestedResult.nestedMargin,
                    nestedResult.nestedLabelWidth,
                    question.id,
                    hasMainQuestionText,
                    firstDeepPlacedOnSameLine,
                    currentY
                  );
                  currentY = deepResult.currentY;
                  firstDeepPlacedOnSameLine = deepResult.firstDeepPlacedOnSameLine;
                }
              }

              currentY += PDF_CONFIG.spacing.betweenNestedSubQuestions;
            }
          }

          currentY += PDF_CONFIG.spacing.betweenNestedSubQuestions;
        }
      }

      currentY += PDF_CONFIG.spacing.betweenQuestions;
    }

    doc.save("question-paper.pdf");
    return { success: true };
  } catch (error) {
    console.error("Error generating PDF:", error);
    return { success: false, error: error.message };
  }
};