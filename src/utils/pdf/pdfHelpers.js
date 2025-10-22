export const getSubQuestionLabel = (index) => {
  return String.fromCharCode(97 + index);
};

export const getRomanNumeral = (index) => {
  const romanNumerals = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x'];
  return romanNumerals[index] || `(${index + 1})`;
};

export const drawPageBorder = (doc, pageWidth, pageHeight, borderMargin, cornerRadius) => {
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.1);
  
  const borderWidth = pageWidth - (2 * borderMargin);
  const borderHeight = pageHeight - (2 * borderMargin);
  
  doc.roundedRect(borderMargin, borderMargin, borderWidth, borderHeight, cornerRadius, cornerRadius);
};