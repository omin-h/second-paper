import jsPDF from 'jspdf';


export const printTextToPDF = (text) => {
  const doc = new jsPDF();
  
  doc.text(text, 20, 20);
  doc.save('output.pdf');
};

export const printTextToPDFWithOptions = (text, options = {}) => {
  const {
    fontSize = 16,
    x = 20,
    y = 20,
    filename = 'output.pdf'
  } = options;
  
  const doc = new jsPDF();
  doc.setFontSize(fontSize);
  doc.text(text, x, y);
  doc.save(filename);
};