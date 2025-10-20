import { jsPDF } from "jspdf";

export default function PdfTest() {
  const generatePdf = async () => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });

    try {
      doc.setFontSize(14);
      doc.setFont("times");

      // Function to draw a fraction
      const drawFraction = (numerator, denominator, x, y) => {
        doc.setFont("times");
        const normalSize = doc.internal.getFontSize();
        const fractionSize = normalSize * 0.7; // Smaller size for fraction
        
        doc.setFontSize(fractionSize);
        
        // Calculate widths
        const numWidth = doc.getTextWidth(numerator);
        const denWidth = doc.getTextWidth(denominator);
        const maxWidth = Math.max(numWidth, denWidth);
        
        // Draw numerator (above line)
        const numX = x + (maxWidth - numWidth) / 2; // Center it
        doc.text(numerator, numX, y - 1);
        
        // Draw fraction line
        doc.line(x, y, x + maxWidth, y);
        
        // Draw denominator (below line)
        const denX = x + (maxWidth - denWidth) / 2; // Center it
        doc.text(denominator, denX, y + 2.5);
        
        doc.setFontSize(normalSize); // Reset font size
        
        return x + maxWidth; // Return end position
      };

      // Test fractions
      doc.text("Hello math!", 10, 20);
      
      let xPos = 10;
      doc.text("Fraction: ", xPos, 50);
      xPos += doc.getTextWidth("Fraction: ");
      xPos = drawFraction("1", "100000", xPos + 2, 50);
      doc.text(" = 0.01", xPos + 2, 50);
      
      
    } catch (err) {
      console.error("PDF generation failed:", err);
      doc.text("ERROR: PDF failed. Check console.", 10, 20);
    }

    doc.save("math.pdf");
  };

  return <button onClick={generatePdf}>Export PDF (π test)</button>;
}