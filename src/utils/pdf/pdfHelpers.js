export const getSubQuestionLabel = (index) => {
  const romanNumerals = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 
                         'xi', 'xii', 'xiii', 'xiv', 'xv', 'xvi', 'xvii', 'xviii', 'xix', 'xx'];
  return romanNumerals[index] || `(${index + 1})`;
};

export const getNestedSubQuestionLabel = (index) => {
  return String.fromCharCode(97 + index);
};

export const getDeepNestedSubQuestionLabel = (index) => {
  const romanNumerals = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 
                         'xi', 'xii', 'xiii', 'xiv', 'xv', 'xvi', 'xvii', 'xviii', 'xix', 'xx'];
  return romanNumerals[index] || `(${index + 1})`;
};

//page border helper
export const drawPageBorder = (doc, pageWidth, pageHeight, borderMargin, cornerRadius) => {
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.1);
  
  const borderWidth = pageWidth - (2 * borderMargin);
  const borderHeight = pageHeight - (2 * borderMargin);
  
  doc.roundedRect(borderMargin, borderMargin, borderWidth, borderHeight, cornerRadius, cornerRadius);
};