export const PDF_CONFIG = {
  unit: "mm",
  format: "a4",
  orientation: "portrait",
  margin: 10,
  borderMargin: 7,
  cornerRadius: 3,
  lineHeight: 6,
  slack: 0.5,
  font: {
    family: "times",
    size: {
      default: 12,
      table: 10
    }
  },
  spacing: {
    afterImage: 5,
    beforeImage: -5,
    afterTable: 7,
    beforeTable: -3,
    betweenQuestions: 3,
    betweenSubQuestions: 2,
    betweenNestedSubQuestions: 1,
    extraIndent: 2,
    deepExtraIndent: 8,
    emptyQuestionLineHeight: 6,
    pageBreakBuffer: 10,
    pageBottomThreshold: 40,
    topPageMargin: 5,
    topPageMarginDeep: 5
  },
  textEstimation: {
    charactersPerLine: 100,
    estimatedLineHeight: 6
  },
  questionNumbering: {
    mainQuestionLeftMargin: 10,
    subQuestionLeftIndent: 6,
    nestedLabelColumnOffset: 15,
    deepNestedEmptyParentOffset: -9.5,
    deepNestedNormalIndent: 20,
    deepNestedEmptyParentVerticalAdjustment: -8,
    deepNestedEmptyParentSpacing: 1
  },
  images: { // height
    main: 60,
    sub: 50,
    nested: 30
  },
  table: {
    widthPercentage: 0.85,
    rowHeight: 8
  }
};