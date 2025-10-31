import jsPDF from 'jspdf';


export const printTextToPDF = (text) => {
  const doc = new jsPDF();
  
  doc.text(text, 20, 20);
  doc.save('output.pdf');
};