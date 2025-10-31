import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const printMixedContentToPDF = async (parsedParts, latexRefs) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  doc.setFont('Times', 'Roman');

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  
  let xPosition = margin;
  let yPosition = 20;
  const fontSize = 12;
  const lineHeight = 7;
  
  doc.setFontSize(fontSize);

  let latexRefIndex = 0;

  for (let i = 0; i < parsedParts.length; i++) {
    const part = parsedParts[i];

    if (part.type === 'text') {
      // Handle normal text with word wrapping
      const words = part.content.split(' ');
      
      for (let word of words) {
        const wordWidth = doc.getTextWidth(word + ' ');
        
        // Check if word fits on current line
        if (xPosition + wordWidth > pageWidth - margin) {
          // Move to next line
          xPosition = margin;
          yPosition += lineHeight;
          
          // Check if new page needed
          if (yPosition > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
          }
        }
        
        doc.text(word + ' ', xPosition, yPosition);
        xPosition += wordWidth;
      }
      
    } else if (part.type === 'latex') {
      // Convert LaTeX equation to image
      const latexElement = latexRefs[latexRefIndex];
      latexRefIndex++;
      
      if (latexElement) {
        try {
          // Render equation to canvas with high quality
          const canvas = await html2canvas(latexElement, {
            backgroundColor: null,
            scale: 3
          });
          
          const imgData = canvas.toDataURL('image/png');
          
          // Calculate image dimensions to match text height
          const imgHeightMM = lineHeight * 0.8; // Slightly smaller than line height
          const imgWidthMM = (canvas.width / canvas.height) * imgHeightMM;
          
          // Check if equation fits on current line
          if (xPosition + imgWidthMM > pageWidth - margin) {
            // Move to next line
            xPosition = margin;
            yPosition += lineHeight;
            
            // Check if new page needed
            if (yPosition > pageHeight - margin) {
              doc.addPage();
              yPosition = margin;
            }
          }
          
          // Add equation image inline (adjust y to align with text baseline)
          doc.addImage(
            imgData, 
            'PNG', 
            xPosition, 
            yPosition - imgHeightMM + 1, // Adjust vertical alignment
            imgWidthMM, 
            imgHeightMM
          );
          
          xPosition += imgWidthMM + 1; // Add small space after equation
          
        } catch (error) {
          console.error('Error rendering LaTeX to PDF:', error);
        }
      }
    }
  }

  doc.save('math-document.pdf');
};

export const printTextToPDF = (text) => {
  const doc = new jsPDF();
  doc.text(text, 20, 20);
  doc.save('output.pdf');
};