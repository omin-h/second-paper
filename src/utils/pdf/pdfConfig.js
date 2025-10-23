export const PDF_CONFIG = {
  unit: "mm",
  format: "a4",
  orientation: "portrait",
  margin: 10,
  borderMargin: 5,
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
    afterTable: 5,
    betweenQuestions: 3,
    betweenSubQuestions: 2,
    betweenNestedSubQuestions: 1,
    extraIndent: 6,
    deepExtraIndent: 8
  },
  images: {
    main: 60,
    sub: 50,
    nested: 30
  }
};