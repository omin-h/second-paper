import { createMainQuestionRenderer } from './renderers/mainQuestionRenderer.js';
import { createSubQuestionRenderer } from './renderers/subQuestionRenderer.js';
import { createNestedSubQuestionRenderer } from './renderers/nestedSubQuestionRenderer.js';
import { createDeepNestedSubQuestionRenderer } from './renderers/deepNestedSubQuestionRenderer.js';

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
  const renderMainQuestion = createMainQuestionRenderer(
    doc,
    pageHeight,
    margin,
    contentWidth,
    renderFormattedText,
    addImage,
    addTable,
    drawPageBorder,
    config
  );

  const renderSubQuestion = createSubQuestionRenderer(
    doc,
    pageHeight,
    margin,
    renderFormattedText,
    addImage,
    addTable,
    drawPageBorder,
    config
  );

  const renderNestedSubQuestion = createNestedSubQuestionRenderer(
    doc,
    pageHeight,
    margin,
    renderFormattedText,
    addImage,
    addTable,
    drawPageBorder,
    config
  );

  const renderDeepNestedSubQuestion = createDeepNestedSubQuestionRenderer(
    doc,
    pageHeight,
    margin,
    renderFormattedText,
    addImage,
    addTable,
    drawPageBorder,
    config
  );

  return {
    renderMainQuestion,
    renderSubQuestion,
    renderNestedSubQuestion,
    renderDeepNestedSubQuestion
  };
};